import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any

from app.database import db
from app.models import (
    LoginRequest,
    RegisterRequest,
    RegisterCompanyRequest,
    ResetPasswordRequest,
    QuickLoginRequest,
    UserProfileUpdate
)
from app.services.auth_service import (
    create_access_token,
    verify_password,
    get_current_user
)

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
    
    # Update last active
    user["lastActive"] = "Just now"
    db.save()

    return {
        "success": True,
        "token": token,
        "user": user,
        "company": company
    }

@router.post("/quick-login")
def quick_login(req: QuickLoginRequest):
    user = db.get_user_by_id(req.userId)
    if not user:
        raise HTTPException(status_code=404, detail="Demo user not found.")
    
    company = db.get_company(user["companyId"])
    token = create_access_token({"sub": user["id"], "companyId": user["companyId"], "role": user["role"]})
    user["lastActive"] = "Just now"
    db.save()

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

    db.users.insert(0, new_user)
    db.log_event(
        company_id=req.companyId,
        user_name=req.name,
        user_role=req.requestedRole or "STAFF",
        action="Registration Submitted",
        resource=f"{req.name} ({req.email})",
        details="Submitted access request pending admin approval."
    )
    db.save()

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

    db.companies[formatted_id] = new_company
    db.users.insert(0, admin_user)

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

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    user = db.get_user_by_email(req.companyId, req.email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"No registered account found with email '{req.email}' in organization '{req.companyId}'."
        )

    user["password"] = req.newPassword
    db.save()
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
    if updates.name:
        current_user["name"] = updates.name.strip()
    if updates.title:
        current_user["title"] = updates.title.strip()
    if updates.avatar:
        current_user["avatar"] = updates.avatar
    if updates.voiceLanguage:
        current_user["voiceLanguage"] = updates.voiceLanguage
    if updates.password:
        current_user["password"] = updates.password

    db.save()
    return {"success": True, "user": current_user}
