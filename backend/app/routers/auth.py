import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any

from app.database import db
from app.models import (
    LoginRequest,
    RegisterRequest,
    RegisterCompanyRequest,
    ResetPasswordRequest,
    RequestOtpRequest,
    VerifyOtpRequest,
    UserProfileUpdate
)
from app.services.auth_service import (
    create_access_token,
    verify_password,
    get_current_user
)
from app.services.email_service import send_otp_email

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login")
def login(req: LoginRequest):
    company = db.get_company(req.companyId)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid Company ID '{req.companyId}'. Please verify your organization code."
        )

    user = db.get_user_by_email(req.companyId, req.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No account found matching this Company ID and Email address."
        )

    if not verify_password(req.password, user.get("password", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password. Please verify your credentials and try again."
        )

    user_status = user.get("status", "ACTIVE")
    if user_status == "PENDING":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your registration is currently pending review by your company lakehouse administrator."
        )
    if user_status == "REJECTED":
        reason = user.get("rejectionReason", "Non-compliance with company lakehouse policy")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your access request was rejected: \"{reason}\". Contact your administrator."
        )
    if user_status == "DEACTIVATED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated by the company administrator."
        )

    # Generate token
    token = create_access_token({"sub": user["id"], "companyId": user["companyId"], "role": user["role"]})
    
    # Update last active in MongoDB
    user["lastActive"] = "Just now"
    db.update_user(user["id"], {"lastActive": "Just now"})

    return {
        "success": True,
        "token": token,
        "user": user,
        "company": company
    }


@router.post("/register")
def register(req: RegisterRequest):
    company = db.get_company(req.companyId)
    if not company:
        raise HTTPException(
            status_code=400,
            detail=f"Company ID '{req.companyId}' does not exist in the lakehouse registry."
        )

    existing = db.get_user_by_email(req.companyId, req.email)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="An account with this email address is already registered in this company."
        )

    new_user = {
        "id": f"u-{int(datetime.datetime.now().timestamp() * 1000)}",
        "companyId": req.companyId.upper(),
        "name": req.name.strip(),
        "email": req.email.strip().lower(),
        "password": req.password,
        "role": req.requestedRole or "STAFF",
        "title": "People Analytics Specialist" if req.requestedRole == "HR" else "Data Specialist",
        "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        "status": "PENDING",
        "joinDate": datetime.datetime.now().strftime("%Y-%m-%d"),
        "lastActive": "Pending Review",
        "voiceLanguage": "en-US",
    }

    db.save_user(new_user)
    db.log_event(
        company_id=req.companyId,
        user_name=req.name,
        user_role=req.requestedRole or "STAFF",
        action="Registration Submitted",
        resource=f"{req.name} ({req.email})",
        details="Submitted access request pending admin approval."
    )

    return {"success": True, "user": new_user}

@router.post("/register-company")
def register_company(req: RegisterCompanyRequest):
    formatted_id = req.companyId.strip().upper()
    if formatted_id in db.companies:
        raise HTTPException(
            status_code=400,
            detail=f"Company ID '{formatted_id}' already exists. Please choose a unique organization ID."
        )

    now_str = datetime.datetime.now().strftime("%Y-%m-%d")
    new_company = {
        "id": formatted_id,
        "name": req.companyName.strip(),
        "tagline": req.tagline or f"{req.industry or 'Enterprise'} Cloud Lakehouse",
        "industry": req.industry or "Technology & Cloud SaaS",
        "timezone": "America/New_York (EST)",
        "logo": "🏢",
        "createdDate": now_str,
        "storageTier": req.storageTier or "Enterprise Lakehouse (50 TB)",
        "defaultAccess": "Public to Company",
        "allowedRegistrationRoles": ["HR", "STAFF"],
        "dataRetentionDays": 365,
        "autoArchiveParquet": True,
    }

    admin_user = {
        "id": f"u-{int(datetime.datetime.now().timestamp() * 1000)}",
        "companyId": formatted_id,
        "name": req.adminName.strip(),
        "email": req.adminEmail.strip().lower(),
        "password": req.adminPassword,
        "role": "ADMIN",
        "title": "Company Administrator",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        "status": "ACTIVE",
        "joinDate": now_str,
        "lastActive": "Just now",
        "voiceLanguage": "en-US",
    }

    db.save_company(new_company)
    db.save_user(admin_user)

    db.log_event(
        company_id=formatted_id,
        user_name=admin_user["name"],
        user_role="ADMIN",
        action="Company Provisioned",
        resource=formatted_id,
        details=f"Organization {new_company['name']} created with storage tier {new_company['storageTier']}."
    )
    db.save()

    token = create_access_token({"sub": admin_user["id"], "companyId": formatted_id, "role": "ADMIN"})

    return {
        "success": True,
        "token": token,
        "company": new_company,
        "user": admin_user
    }

OTP_STORE: Dict[str, Dict[str, Any]] = {}

@router.post("/forgot-password/request-otp")
def request_password_reset_otp(req: RequestOtpRequest):
    import random
    clean_cid = req.companyId.strip().upper()
    clean_email = req.email.strip().lower()

    company = db.get_company(clean_cid)
    if not company:
        raise HTTPException(
            status_code=404,
            detail=f"Company ID '{clean_cid}' does not exist in the lakehouse registry."
        )

    user = db.get_user_by_email(clean_cid, clean_email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"No registered account found matching '{clean_email}' in organization '{clean_cid}'."
        )

    # Generate 6-digit OTP code
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.datetime.now(datetime.timezone.utc).timestamp() + 600  # 10 minutes

    key = f"{clean_cid}:{clean_email}"
    OTP_STORE[key] = {
        "otp": otp_code,
        "expires_at": expires_at,
        "user_id": user["id"]
    }

    email_sent, email_msg = send_otp_email(
        to_email=clean_email,
        otp_code=otp_code,
        user_name=user.get("name", "User"),
        company_id=clean_cid
    )

    db.log_event(
        company_id=clean_cid,
        user_name=user.get("name", "User"),
        user_role=user.get("role", "STAFF"),
        action="Password Reset Requested",
        resource=f"{user.get('name')} ({clean_email})",
        details=f"Generated security OTP for identity verification. Email sent: {email_sent} ({email_msg})"
    )

    try:
        from app.config import DATA_DIR
        with open(DATA_DIR / "otp_debug.log", "w", encoding="utf-8") as f:
            f.write(f"Timestamp: {datetime.datetime.now().isoformat()}\n")
            f.write(f"Organization: {clean_cid}\n")
            f.write(f"Recipient: {clean_email}\n")
            f.write(f"OTP: {otp_code}\n")
            f.write(f"Email Delivered: {email_sent}\n")
    except Exception:
        pass

    return {
        "success": True,
        "message": f"A 6-digit verification code has been dispatched to {clean_email}.",
        "email_sent": email_sent,
        "status_detail": email_msg
    }

@router.post("/forgot-password/verify-otp")
def verify_password_reset_otp(req: VerifyOtpRequest):
    clean_cid = req.companyId.strip().upper()
    clean_email = req.email.strip().lower()
    clean_otp = req.otp.strip()

    key = f"{clean_cid}:{clean_email}"
    entry = OTP_STORE.get(key)
    if not entry:
        raise HTTPException(
            status_code=400,
            detail="No active verification code found for this account. Please request a new code."
        )

    now = datetime.datetime.now(datetime.timezone.utc).timestamp()
    if now > entry["expires_at"]:
        OTP_STORE.pop(key, None)
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired. Please request a new code."
        )

    if entry["otp"] != clean_otp:
        raise HTTPException(
            status_code=400,
            detail="Incorrect verification code. Please check the code or request a new one."
        )

    return {
        "success": True,
        "message": "Identity verified successfully. You may now set your new password."
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    clean_cid = req.companyId.strip().upper()
    clean_email = req.email.strip().lower()

    user = db.get_user_by_email(clean_cid, clean_email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"No registered account found with email '{clean_email}' in organization '{clean_cid}'."
        )

    # If an OTP is provided, verify it
    if req.otp:
        key = f"{clean_cid}:{clean_email}"
        entry = OTP_STORE.get(key)
        if entry:
            if entry["otp"] != req.otp.strip():
                raise HTTPException(
                    status_code=400,
                    detail="Invalid verification code provided."
                )
            OTP_STORE.pop(key, None)

    user["password"] = req.newPassword
    db.update_user(user["id"], {"password": req.newPassword})
    
    db.log_event(
        company_id=clean_cid,
        user_name=user.get("name", "User"),
        user_role=user.get("role", "STAFF"),
        action="Password Reset Completed",
        resource=f"{user.get('name')} ({clean_email})",
        details="User updated account password successfully."
    )

    return {
        "success": True,
        "message": f"Password for {user['name']} ({user['email']}) has been successfully updated."
    }

@router.get("/me")
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    company = db.get_company(current_user["companyId"])
    return {
        "success": True,
        "user": current_user,
        "company": company
    }

@router.put("/profile")
def update_profile(updates: UserProfileUpdate, current_user: Dict[str, Any] = Depends(get_current_user)):
    user_updates = {}
    if updates.name:
        current_user["name"] = updates.name.strip()
        user_updates["name"] = current_user["name"]
    if updates.title:
        current_user["title"] = updates.title.strip()
        user_updates["title"] = current_user["title"]
    if updates.avatar:
        current_user["avatar"] = updates.avatar
        user_updates["avatar"] = current_user["avatar"]
    if updates.voiceLanguage:
        current_user["voiceLanguage"] = updates.voiceLanguage
        user_updates["voiceLanguage"] = current_user["voiceLanguage"]
    if updates.password:
        current_user["password"] = updates.password
        user_updates["password"] = current_user["password"]

    db.update_user(current_user["id"], user_updates)
    return {"success": True, "user": current_user}
