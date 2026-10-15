from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, Any, List, Optional

from app.database import db
from app.models import AuditLogCreate
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/audit", tags=["Audit Logs"])

@router.get("")
def list_audit_logs(
    status: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    company_id = current_user.get("companyId", "ACME-001").upper()
    logs = [a for a in db.audit_logs if a.get("companyId", "").upper() == company_id]

    if status and status != "All":
        logs = [l for l in logs if l.get("status", "").lower() == status.lower()]
    if action and action != "All":
        logs = [l for l in logs if l.get("action", "").lower() == action.lower()]
    if search:
        s_lower = search.lower()
        logs = [
            l for l in logs
            if s_lower in l.get("userName", "").lower()
            or s_lower in l.get("resource", "").lower()
            or s_lower in l.get("details", "").lower()
            or s_lower in l.get("action", "").lower()
        ]

    return {"success": True, "logs": logs}

@router.post("")
def create_audit_log(entry: AuditLogCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    company_id = current_user.get("companyId", "ACME-001").upper()
    db.log_event(
        company_id=company_id,
        user_name=current_user.get("name", "User"),
        user_role=current_user.get("role", "STAFF"),
        action=entry.action,
        resource=entry.resource,
        details=entry.details,
        status=entry.status or "Success"
    )
    return {"success": True, "message": "Event logged."}
