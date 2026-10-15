from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List

from app.database import db
from app.models import SqlQueryRequest, SqlQueryResponse
from app.services.auth_service import get_current_user
from app.services.duckdb_service import execute_lakehouse_query

router = APIRouter(prefix="/api/sql", tags=["SQL Studio"])

@router.post("/run", response_model=SqlQueryResponse)
def run_sql(req: SqlQueryRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    company_id = current_user.get("companyId", "ACME-001").upper()
    user_role = current_user.get("role", "STAFF")
    user_name = current_user.get("name", "User")

    result = execute_lakehouse_query(
        sql=req.sql,
        company_id=company_id,
        user_role=user_role,
        user_name=user_name,
        limit=req.limit or 500
    )

    if result.get("success"):
        db.log_event(
            company_id=company_id,
            user_name=user_name,
            user_role=user_role,
            action="Query Executed",
            resource="SQL Studio",
            details=f"Returned {len(result.get('rows', []))} rows in {result.get('telemetry', {}).get('latency')}."
        )
    else:
        db.log_event(
            company_id=company_id,
            user_name=user_name,
            user_role=user_role,
            action="Query Error",
            resource="SQL Studio",
            details=f"Query failed: {result.get('error')}",
            status="Failed"
        )

    return result

@router.get("/saved")
def get_saved_queries(current_user: Dict[str, Any] = Depends(get_current_user)):
    company_id = current_user.get("companyId", "ACME-001").upper()
    queries = [q for q in db.saved_queries if q.get("companyId", "").upper() == company_id]
    return {"success": True, "queries": queries}

@router.post("/saved")
def save_query(query_data: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    import datetime
    company_id = current_user.get("companyId", "ACME-001").upper()
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

    item = {
        **query_data,
        "id": query_data.get("id") or f"q-{int(datetime.datetime.now().timestamp() * 1000)}",
        "companyId": company_id,
        "date": "Just now",
        "savedAt": now_str
    }

    # Deduplicate by ID
    db.saved_queries = [q for q in db.saved_queries if q.get("id") != item["id"]]
    db.saved_queries.insert(0, item)

    db.log_event(
        company_id=company_id,
        user_name=current_user.get("name", "User"),
        user_role=current_user.get("role", "STAFF"),
        action="Query Saved",
        resource=item.get("question") or "Custom SQL Query",
        details="Saved analytical query to organization library."
    )
    db.save()

    return {"success": True, "query": item}

@router.delete("/saved/{query_id}")
def delete_saved_query(query_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    company_id = current_user.get("companyId", "ACME-001").upper()
    db.saved_queries = [
        q for q in db.saved_queries 
        if not (q.get("id") == query_id and q.get("companyId", "").upper() == company_id)
    ]
    db.save()
    return {"success": True, "message": "Query removed."}
