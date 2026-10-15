from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

from app.database import db
from app.models import CompanySettingsUpdate
from app.services.auth_service import get_current_user, require_roles

router = APIRouter(prefix="/api/companies", tags=["Companies"])

@router.get("")
def list_companies():
    """List all registered companies in the registry (IDs and names)."""
    return {
        "success": True,
        "companies": db.companies
    }

@router.get("/current")
def get_current_company(current_user: Dict[str, Any] = Depends(get_current_user)):
    company_id = current_user.get("companyId", "")
    comp = db.get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail=f"Company '{company_id}' not found.")
    return {
        "success": True,
        "company": comp
    }

@router.put("/current/settings")
def update_company_settings(
    settings: CompanySettingsUpdate,
    current_user: Dict[str, Any] = Depends(require_roles(["ADMIN"]))
):
    company_id = current_user.get("companyId", "")
    comp = db.get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found.")

    for k, v in settings.model_dump(exclude_unset=True).items():
        comp[k] = v

    db.log_event(
        company_id=company_id,
        user_name=current_user.get("name", "Admin"),
        user_role="ADMIN",
        action="Company Settings Updated",
        resource=company_id,
        details="Administrator updated organizational settings and governance preferences."
    )
    db.save()

    return {
        "success": True,
        "company": comp
    }
