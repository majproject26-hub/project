import datetime
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

from app.database import db
from app.models import DashboardCreate, DashboardUpdate
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/dashboards", tags=["Dashboards"])

@router.get("")
def list_dashboards(current_user: Dict[str, Any] = Depends(get_current_user)):
    company_id = current_user.get("companyId", "ACME-001").upper()
    role = current_user.get("role", "STAFF")

    all_dbs = [d for d in db.dashboards if d.get("companyId", "").upper() == company_id]
    
    # Filter by visibility if staff
    filtered = []
    for d in all_dbs:
        vis = d.get("visibility", "Company Wide")
        if role == "ADMIN" or vis == "Company Wide" or (role == "HR" and vis != "Restricted"):
            filtered.append(d)

    return {"success": True, "dashboards": filtered}

@router.post("")
def create_dashboard(db_in: DashboardCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    company_id = current_user.get("companyId", "ACME-001").upper()
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

    new_db = {
        **db_in.model_dump(),
        "id": f"dash-{int(datetime.datetime.now().timestamp() * 1000)}",
        "companyId": company_id,
        "createdAt": datetime.datetime.now().strftime("%Y-%m-%d"),
        "updatedAt": now_str,
    }

    db.dashboards.insert(0, new_db)
    db.log_event(
        company_id=company_id,
        user_name=current_user.get("name", "User"),
        user_role=current_user.get("role", "STAFF"),
        action="Dashboard Created",
        resource=new_db["name"],
        details=f"Created new dashboard view with visibility {new_db.get('visibility')}."
    )
    db.save()

    return {"success": True, "dashboard": new_db}

@router.put("/{dashboard_id}")
def update_dashboard(
    dashboard_id: str,
    updates: DashboardUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    company_id = current_user.get("companyId", "ACME-001").upper()
    for d in db.dashboards:
        if d["id"] == dashboard_id and d.get("companyId", "").upper() == company_id:
            for k, v in updates.model_dump(exclude_unset=True).items():
                d[k] = v
            d["updatedAt"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
            db.save()
            return {"success": True, "dashboard": d}

    raise HTTPException(status_code=404, detail="Dashboard not found.")

@router.delete("/{dashboard_id}")
def delete_dashboard(dashboard_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    company_id = current_user.get("companyId", "ACME-001").upper()
    db.dashboards = [
        d for d in db.dashboards 
        if not (d["id"] == dashboard_id and d.get("companyId", "").upper() == company_id)
    ]
    db.save()
    return {"success": True, "message": "Dashboard deleted."}
