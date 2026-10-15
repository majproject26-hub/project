import datetime
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

from app.database import db
from app.models import ChartCreate
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/charts", tags=["Charts"])

@router.get("")
def list_charts(current_user: Dict[str, Any] = Depends(get_current_user)):
    company_id = current_user.get("companyId", "ACME-001").upper()
    charts = [c for c in db.charts if c.get("companyId", "").upper() == company_id]
    return {"success": True, "charts": charts}

@router.post("")
def create_chart(chart_in: ChartCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    company_id = current_user.get("companyId", "ACME-001").upper()
    now_str = datetime.datetime.now().strftime("%Y-%m-%d")

    new_chart = {
        **chart_in.model_dump(),
        "id": f"ch-{int(datetime.datetime.now().timestamp() * 1000)}",
        "companyId": company_id,
        "createdAt": now_str,
    }

    db.charts.insert(0, new_chart)
    db.log_event(
        company_id=company_id,
        user_name=current_user.get("name", "User"),
        user_role=current_user.get("role", "STAFF"),
        action="Chart Created",
        resource=new_chart["title"],
        details=f"Created {new_chart['chartType']} visualization for {new_chart['datasetName']}."
    )
    db.save()

    return {"success": True, "chart": new_chart}

@router.post("/{chart_id}/toggle-pin")
def toggle_pin_chart(chart_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    company_id = current_user.get("companyId", "ACME-001").upper()
    for c in db.charts:
        if c["id"] == chart_id and c.get("companyId", "").upper() == company_id:
            c["isPinned"] = not c.get("isPinned", False)
            db.save()
            return {"success": True, "chart": c}

    raise HTTPException(status_code=404, detail="Chart not found.")

@router.delete("/{chart_id}")
def delete_chart(chart_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    company_id = current_user.get("companyId", "ACME-001").upper()
    db.charts = [
        c for c in db.charts 
        if not (c["id"] == chart_id and c.get("companyId", "").upper() == company_id)
    ]
    db.save()
    return {"success": True, "message": "Chart deleted."}
