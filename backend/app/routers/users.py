from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List

from app.database import db
from app.models import (
    UserRejectRequest,
    UserRoleUpdate,
    UserStatusUpdate,
    BulkApproveRequest,
    ResetPasswordRequest,
    AdminResetPasswordRequest
)
from app.services.auth_service import get_current_user, require_roles

router = APIRouter(prefix="/api/users", tags=["User Management"])

@router.get("")
def list_users(current_user: Dict[str, Any] = Depends(get_current_user)):
    company_id = current_user.get("companyId", "").upper()
    company_users = [u for u in db.users if u.get("companyId", "").upper() == company_id]
    return {
        "success": True,
        "users": company_users
    }

@router.post("/{user_id}/approve")
def approve_user(
    user_id: str,
    current_user: Dict[str, Any] = Depends(require_roles(["ADMIN"]))
):
    target = db.get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if target.get("companyId", "").upper() != current_user.get("companyId", "").upper():
        raise HTTPException(status_code=403, detail="Cannot manage users in another company.")

    target["status"] = "ACTIVE"
    target["lastActive"] = "Recently approved"
    db.log_event(
        company_id=current_user.get("companyId"),
        user_name=current_user.get("name"),
        user_role="ADMIN",
        action="User Approved",
        resource=f"{target.get('name')} ({target.get('email')})",
        details=f"Approved access request with role {target.get('role')}."
    )
    db.save()
    return {"success": True, "user": target}

@router.post("/bulk-approve")
def bulk_approve(
    req: BulkApproveRequest,
    current_user: Dict[str, Any] = Depends(require_roles(["ADMIN"]))
):
    company_id = current_user.get("companyId", "").upper()
    approved_count = 0
    for u in db.users:
        if u["id"] in req.userIds and u.get("companyId", "").upper() == company_id:
            u["status"] = "ACTIVE"
            u["lastActive"] = "Recently approved"
            approved_count += 1

    db.log_event(
        company_id=company_id,
        user_name=current_user.get("name"),
        user_role="ADMIN",
        action="Bulk User Approval",
        resource=f"{approved_count} Users",
        details=f"Bulk approved {approved_count} pending registration accounts."
    )
    db.save()
    return {"success": True, "count": approved_count}

@router.post("/{user_id}/reject")
def reject_user(
    user_id: str,
    req: UserRejectRequest,
    current_user: Dict[str, Any] = Depends(require_roles(["ADMIN"]))
):
    target = db.get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if target.get("companyId", "").upper() != current_user.get("companyId", "").upper():
        raise HTTPException(status_code=403, detail="Cannot manage users in another company.")

    target["status"] = "REJECTED"
    target["rejectionReason"] = req.reason or "Access denied by administrator."
    target["lastActive"] = "Rejected"

    db.log_event(
        company_id=current_user.get("companyId"),
        user_name=current_user.get("name"),
        user_role="ADMIN",
        action="User Rejected",
        resource=f"{target.get('name')} ({target.get('email')})",
        details=f"Rejected registration request: {target['rejectionReason']}",
        status="Denied"
    )
    db.save()
    return {"success": True, "user": target}

@router.put("/{user_id}/role")
def change_role(
    user_id: str,
    req: UserRoleUpdate,
    current_user: Dict[str, Any] = Depends(require_roles(["ADMIN"]))
):
    target = db.get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    old_role = target.get("role")
    target["role"] = req.role
    db.log_event(
        company_id=current_user.get("companyId"),
        user_name=current_user.get("name"),
        user_role="ADMIN",
        action="Role Modified",
        resource=f"{target.get('name')}",
        details=f"Updated role permission from {old_role} to {req.role}."
    )
    db.save()
    return {"success": True, "user": target}

@router.post("/{user_id}/toggle-status")
def toggle_status(
    user_id: str,
    current_user: Dict[str, Any] = Depends(require_roles(["ADMIN"]))
):
    target = db.get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    new_status = "DEACTIVATED" if target.get("status") == "ACTIVE" else "ACTIVE"
    target["status"] = new_status
    db.log_event(
        company_id=current_user.get("companyId"),
        user_name=current_user.get("name"),
        user_role="ADMIN",
        action="User Status Toggled",
        resource=f"{target.get('name')}",
        details=f"Account status set to {new_status}."
    )
    db.save()
    return {"success": True, "user": target}

@router.post("/{user_id}/reset-password")
def reset_user_password(
    user_id: str,
    req: AdminResetPasswordRequest,
    current_user: Dict[str, Any] = Depends(require_roles(["ADMIN"]))
):
    target = db.get_user_by_id(user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if target.get("companyId", "").upper() != current_user.get("companyId", "").upper():
        raise HTTPException(status_code=403, detail="Cannot manage users in another company.")

    target["password"] = req.newPassword
    db.log_event(
        company_id=current_user.get("companyId"),
        user_name=current_user.get("name"),
        user_role="ADMIN",
        action="Password Reset",
        resource=f"{target.get('name')} ({target.get('email')})",
        details=f"Admin reset temporary password for {target.get('name')}."
    )
    db.save()
    return {"success": True, "message": f"Password reset for {target.get('name')}."}

