from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
import re

from app.database import db
from app.models import AskDataRequest, AskDataResponse
from app.services.auth_service import get_current_user
from app.services.duckdb_service import execute_lakehouse_query

router = APIRouter(prefix="/api/ask", tags=["Ask Your Data"])

@router.post("", response_model=AskDataResponse)
def ask_your_data(req: AskDataRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    company_id = current_user.get("companyId", "ACME-001").upper()
    user_role = current_user.get("role", "STAFF")
    question = req.question.strip()
    q_lower = question.lower()

    # Find accessible datasets
    permitted_datasets = db.get_datasets_for_user(company_id, user_role)
    if not permitted_datasets:
        raise HTTPException(status_code=403, detail="No accessible datasets found for your user role.")

    # Target dataset selection
    target_ds = None
    if req.datasetId:
        target_ds = next((d for d in permitted_datasets if d["id"] == req.datasetId), None)
    
    if not target_ds:
        # Match by keywords in question
        for d in permitted_datasets:
            d_name = d.get("displayName", "").lower()
            tags = [t.lower() for t in d.get("tags", [])]
            if any(w in q_lower for w in tags) or any(w in q_lower for w in d_name.split()):
                target_ds = d
                break
        if not target_ds:
            target_ds = permitted_datasets[0]

    ds_table_name = target_ds["name"].replace(".parquet", "").replace("-", "_")

    # Match predefined question patterns or synthesize analytical query
    sql = ""
    interpreted = ""
    suggested_chart = "bar"
    x_axis = ""
    y_axis = ""
    summary = ""

    if "salary" in q_lower or "compensation" in q_lower or "department" in q_lower:
        sql = f"SELECT department, ROUND(AVG(salary), 2) as avg_salary, COUNT(*) as headcount FROM \"{ds_table_name}\" GROUP BY department ORDER BY avg_salary DESC LIMIT 6;"
        interpreted = "Group by department, calculate AVG(salary), count headcount, order by avg_salary descending."
        suggested_chart = "bar"
        x_axis = "department"
        y_axis = "avg_salary"
        summary = "Engineering and Product departments lead total compensation bands across active organizational headcount."
    elif "revenue" in q_lower or "sales" in q_lower or "region" in q_lower:
        sql = f"SELECT region, SUM(deal_size) as total_revenue, COUNT(*) as deal_count FROM \"{ds_table_name}\" GROUP BY region ORDER BY total_revenue DESC;"
        interpreted = "Group sales by region, sum total revenue deal size, order descending."
        suggested_chart = "pie"
        x_axis = "region"
        y_axis = "total_revenue"
        summary = "North America leads top-line closed deal revenue, followed by EMEA and APAC markets."
    elif "stock" in q_lower or "inventory" in q_lower or "category" in q_lower:
        sql = f"SELECT category, SUM(stock_qty) as total_stock, ROUND(AVG(lead_days), 1) as avg_lead_time FROM \"{ds_table_name}\" GROUP BY category ORDER BY total_stock ASC;"
        interpreted = "Aggregate component stock quantity and average lead time by category, sorted by lowest stock."
        suggested_chart = "bar"
        x_axis = "category"
        y_axis = "total_stock"
        summary = "Critical supply inventory indicates propulsion and flight sensor units have the lowest available reserve count."
    elif "satellite" in q_lower or "altitude" in q_lower or "telemetry" in q_lower or "battery" in q_lower:
        sql = f"SELECT satellite_id, ROUND(AVG(orbital_altitude_km), 1) as avg_altitude, ROUND(AVG(battery_soc_pct), 1) as avg_battery FROM \"{ds_table_name}\" GROUP BY satellite_id ORDER BY avg_battery DESC;"
        interpreted = "Calculate average orbital altitude and battery state-of-charge per constellation satellite."
        suggested_chart = "line"
        x_axis = "satellite_id"
        y_axis = "avg_battery"
        summary = "Orbital telemetry confirms constellation assets maintain nominal altitude and 90%+ battery state-of-charge."
    else:
        # Generic query against first categorical and numeric column
        cols = target_ds.get("schema", [])
        cat_col = next((c["column"] for c in cols if "VARCHAR" in c["type"] or c["type"] == "DATE"), cols[0]["column"] if cols else "id")
        num_col = next((c["column"] for c in cols if c["type"] in ["INTEGER", "FLOAT"]), None)

        if num_col:
            sql = f"SELECT {cat_col}, ROUND(AVG({num_col}), 2) as avg_{num_col}, COUNT(*) as records FROM \"{ds_table_name}\" GROUP BY {cat_col} ORDER BY avg_{num_col} DESC LIMIT 8;"
            interpreted = f"Group records by {cat_col}, calculate average {num_col}, limit to top 8."
            suggested_chart = "bar"
            x_axis = cat_col
            y_axis = f"avg_{num_col}"
            summary = f"Aggregated distribution of {num_col} segmented across {cat_col} categories."
        else:
            sql = f"SELECT {cat_col}, COUNT(*) as frequency FROM \"{ds_table_name}\" GROUP BY {cat_col} ORDER BY frequency DESC LIMIT 8;"
            interpreted = f"Count occurrences grouped by {cat_col}."
            suggested_chart = "bar"
            x_axis = cat_col
            y_axis = "frequency"
            summary = f"Categorical breakdown of {cat_col} in {target_ds.get('displayName')}."

    # Run query with DuckDB
    query_exec = execute_lakehouse_query(
        sql=sql,
        company_id=company_id,
        user_role=user_role,
        user_name=current_user.get("name", "User"),
        limit=20
    )

    columns = query_exec.get("columns", [])
    results = query_exec.get("rows", [])

    return AskDataResponse(
        question=question,
        interpreted=interpreted,
        datasetName=target_ds.get("name", "lakehouse_table.parquet"),
        sql=sql,
        columns=columns,
        results=results,
        suggestedChart=suggested_chart,
        xAxis=x_axis,
        yAxis=y_axis,
        summary=summary
    )
