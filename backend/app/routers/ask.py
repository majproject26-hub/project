from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
import re
from pathlib import Path

from app.database import db
from app.models import AskDataRequest, AskDataResponse
from app.services.auth_service import get_current_user
from app.services.duckdb_service import execute_lakehouse_query
from app.config import PARQUET_DIR

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

    # 1. Score datasets based on query relevance & schema richness
    def score_dataset(ds):
        score = 0
        ds_name = ds.get("name", "").lower()
        disp_name = ds.get("displayName", "").lower()
        cols = [c.get("column", "").lower() for c in ds.get("schema", [])]
        
        words = [w for w in re.findall(r"\b[a-zA-Z]{3,}\b", q_lower)]
        for w in words:
            if w in ds_name or w in disp_name:
                score += 8
            if any(w in c for c in cols):
                score += 5

        # Domain concept matching
        if any(k in q_lower for k in ["salary", "compensation", "pay", "wage", "employee", "headcount"]):
            if any(k in ds_name for k in ["salary", "salaries", "employee", "staff"]):
                score += 15
            if any(any(k in c for k in ["salary", "pay", "wage", "compensation"]) for c in cols):
                score += 20

        if any(k in q_lower for k in ["revenue", "deal", "sales", "region"]):
            if any(k in ds_name for k in ["sales", "revenue", "order", "deal"]):
                score += 15
            if any(any(k in c for k in ["revenue", "deal_size", "sales", "amount"]) for c in cols):
                score += 20

        # Favor rich tabular schemas over single-column code/raw text
        if len(cols) > 2:
            score += 4
        return score

    target_ds = None
    if req.datasetId:
        target_ds = next((d for d in permitted_datasets if d["id"] == req.datasetId), None)

    # If the user-selected dataset is irrelevant to the question's domain but another dataset is a strong match, switch
    best_candidate = max(permitted_datasets, key=score_dataset)
    if target_ds:
        curr_score = score_dataset(target_ds)
        best_score = score_dataset(best_candidate)
        if best_score >= curr_score + 10:
            target_ds = best_candidate
    else:
        target_ds = best_candidate

    if not target_ds:
        target_ds = permitted_datasets[0]

    ds_table_name = target_ds["name"].replace(".parquet", "").replace("-", "_")
    schema_cols = target_ds.get("schema", [])
    col_names = [c["column"] for c in schema_cols]

    def find_column(candidate_patterns):
        for pattern in candidate_patterns:
            for col in col_names:
                if pattern.lower() in col.lower():
                    return col
        return None

    # Identify numeric and categorical columns
    num_cols = [
        c["column"] for c in schema_cols
        if any(t in c.get("type", "").upper() for t in ["INT", "FLOAT", "DOUBLE", "NUMERIC", "DECIMAL", "REAL"])
    ]
    cat_cols = [
        c["column"] for c in schema_cols
        if any(t in c.get("type", "").upper() for t in ["VARCHAR", "TEXT", "STRING", "CHAR", "DATE"])
    ]

    # Synthesize intelligent schema-grounded SQL
    sql = ""
    interpreted = ""
    suggested_chart = "bar"
    x_axis = ""
    y_axis = ""
    summary = ""

    # Check for Salary / HR queries
    salary_col = find_column(["base_salary", "salary", "compensation", "pay", "wage", "bonus"])
    dept_col = find_column(["department", "dept", "team", "division", "group", "category"])
    name_col = find_column(["full_name", "employee_name", "name", "employee_id"])

    # Check for Sales / Revenue queries
    revenue_col = find_column(["deal_size", "revenue", "sales", "amount", "total", "mrr"])
    region_col = find_column(["region", "territory", "country", "location", "city", "state"])

    # Check for Inventory / Stock queries
    stock_col = find_column(["stock_qty", "stock", "quantity", "qty", "inventory", "count"])
    category_col = find_column(["category", "part", "component", "type"])

    # Check for Telemetry / Float metrics
    metric_col = find_column(["battery_soc", "battery", "altitude", "temp", "score", "value"])
    entity_col = find_column(["satellite_id", "device_id", "sku", "id"])

    if salary_col and (dept_col or cat_cols) and any(w in q_lower for w in ["salary", "compensation", "pay", "department", "employee", "headcount"]):
        dim = dept_col or cat_cols[0]
        sql = f'SELECT "{dim}", ROUND(AVG("{salary_col}"), 2) as avg_{salary_col}, COUNT(*) as headcount FROM "{ds_table_name}" GROUP BY "{dim}" ORDER BY avg_{salary_col} DESC LIMIT 8;'
        interpreted = f"Group records by {dim}, calculate average {salary_col}, count headcount, and sort descending."
        suggested_chart = "bar"
        x_axis = dim
        y_axis = f"avg_{salary_col}"
        summary = f"Aggregated compensation analysis in {target_ds.get('displayName', target_ds['name'])} grouped by {dim}."

    elif revenue_col and (region_col or cat_cols) and any(w in q_lower for w in ["revenue", "sales", "deal", "region", "market"]):
        dim = region_col or cat_cols[0]
        sql = f'SELECT "{dim}", SUM("{revenue_col}") as total_{revenue_col}, COUNT(*) as deal_count FROM "{ds_table_name}" GROUP BY "{dim}" ORDER BY total_{revenue_col} DESC LIMIT 8;'
        interpreted = f"Group records by {dim}, calculate total {revenue_col}, and sort descending."
        suggested_chart = "pie" if len(schema_cols) <= 4 else "bar"
        x_axis = dim
        y_axis = f"total_{revenue_col}"
        summary = f"Revenue distribution in {target_ds.get('displayName', target_ds['name'])} segmented across {dim}."

    elif stock_col and (category_col or cat_cols) and any(w in q_lower for w in ["stock", "inventory", "item", "part", "lead"]):
        dim = category_col or cat_cols[0]
        sql = f'SELECT "{dim}", SUM("{stock_col}") as total_{stock_col} FROM "{ds_table_name}" GROUP BY "{dim}" ORDER BY total_{stock_col} ASC LIMIT 8;'
        interpreted = f"Aggregate component {stock_col} grouped by {dim}, sorted by lowest stock levels."
        suggested_chart = "bar"
        x_axis = dim
        y_axis = f"total_{stock_col}"
        summary = f"Inventory reserves grouped by {dim}."

    elif metric_col and (entity_col or cat_cols) and any(w in q_lower for w in ["telemetry", "satellite", "battery", "altitude", "metric", "trend"]):
        dim = entity_col or cat_cols[0]
        sql = f'SELECT "{dim}", ROUND(AVG("{metric_col}"), 2) as avg_{metric_col} FROM "{ds_table_name}" GROUP BY "{dim}" ORDER BY avg_{metric_col} DESC LIMIT 8;'
        interpreted = f"Calculate telemetry average {metric_col} grouped by {dim}."
        suggested_chart = "line"
        x_axis = dim
        y_axis = f"avg_{metric_col}"
        summary = f"Telemetry telemetry distribution for {metric_col} across {dim} units."

    elif any(w in q_lower for w in ["top", "highest", "max", "best"]) and num_cols:
        dim = name_col or (cat_cols[0] if cat_cols else col_names[0])
        val = num_cols[0]
        sql = f'SELECT "{dim}", "{val}" FROM "{ds_table_name}" ORDER BY "{val}" DESC LIMIT 5;'
        interpreted = f"Top 5 records ordered by {val} descending."
        suggested_chart = "bar"
        x_axis = dim
        y_axis = val
        summary = f"Top records by {val} in {target_ds.get('displayName', target_ds['name'])}."

    elif any(w in q_lower for w in ["records", "all", "show", "list", "sample", "view", "what are", "table"]):
        sql = f'SELECT * FROM "{ds_table_name}" LIMIT 10;'
        interpreted = f"Retrieve leading records from {target_ds.get('displayName', target_ds['name'])}."
        suggested_chart = "bar"
        summary = f"Direct tabular records from {target_ds.get('displayName', target_ds['name'])}."

    elif num_cols and cat_cols:
        dim = cat_cols[0]
        val = num_cols[0]
        sql = f'SELECT "{dim}", ROUND(AVG("{val}"), 2) as avg_{val}, COUNT(*) as records FROM "{ds_table_name}" GROUP BY "{dim}" ORDER BY avg_{val} DESC LIMIT 8;'
        interpreted = f"Group records by {dim}, calculate average {val}, limit to top 8."
        suggested_chart = "bar"
        x_axis = dim
        y_axis = f"avg_{val}"
        summary = f"Distribution of {val} segmented across {dim} categories."

    elif cat_cols:
        dim = cat_cols[0]
        sql = f'SELECT "{dim}", COUNT(*) as record_count FROM "{ds_table_name}" GROUP BY "{dim}" ORDER BY record_count DESC LIMIT 8;'
        interpreted = f"Count occurrences grouped by {dim}."
        suggested_chart = "bar"
        x_axis = dim
        y_axis = "record_count"
        summary = f"Categorical breakdown of {dim} in {target_ds.get('displayName', target_ds['name'])}."

    else:
        # Fallback for single column / code files
        sql = f'SELECT * FROM "{ds_table_name}" LIMIT 10;'
        interpreted = f"Retrieve records from {target_ds.get('displayName', target_ds['name'])}."
        suggested_chart = "bar"
        summary = f"Data records extracted from {target_ds.get('displayName', target_ds['name'])}."

    # Execute with DuckDB
    query_exec = execute_lakehouse_query(
        sql=sql,
        company_id=company_id,
        user_role=user_role,
        user_name=current_user.get("name", "User"),
        limit=20
    )

    # Self-healing fallback if initial query fails
    if not query_exec.get("success") or not query_exec.get("rows"):
        fallback_sql = f'SELECT * FROM "{ds_table_name}" LIMIT 10;'
        query_exec_fb = execute_lakehouse_query(
            sql=fallback_sql,
            company_id=company_id,
            user_role=user_role,
            user_name=current_user.get("name", "User"),
            limit=20
        )
        if query_exec_fb.get("success") and query_exec_fb.get("rows"):
            query_exec = query_exec_fb
            sql = fallback_sql
            interpreted = f"Extracted records from {target_ds.get('displayName', target_ds['name'])}."

    columns = query_exec.get("columns", [])
    results = query_exec.get("rows", [])
    telemetry = query_exec.get("telemetry", {})
    exec_status = "Success" if query_exec.get("success") else "Failed"

    # Harmonize chart axes with returned columns
    if columns:
        if not x_axis or x_axis not in columns:
            x_axis = columns[0]
        if not y_axis or y_axis not in columns:
            y_axis = columns[1] if len(columns) > 1 else columns[0]

    # Dynamically refine summary with actual output numbers
    if results and len(results) > 0:
        top_row = results[0]
        top_name = top_row.get(x_axis, "Primary record")
        top_val = top_row.get(y_axis, "")
        val_str = f" ({top_val:,})" if isinstance(top_val, (int, float)) else f" ({top_val})" if top_val else ""
        summary = f"Executed analytical query on {target_ds.get('displayName', target_ds['name'])}. Returned {len(results)} rows. Peak aggregation observed for '{top_name}'{val_str}."

    # Persist AI Query & Execution History to MongoDB Atlas
    db.log_query_history(
        company_id=company_id,
        user_id=current_user.get("id"),
        user_name=current_user.get("name", "User"),
        user_role=user_role,
        prompt=question,
        input_type="voice" if req.isVoice else "text",
        generated_sql=sql,
        target_dataset_id=target_ds.get("id"),
        target_dataset_name=target_ds.get("name", ""),
        execution_status=exec_status,
        latency=telemetry.get("latency", "12 ms"),
        row_count=len(results),
        scanned_bytes=telemetry.get("scannedBytes", "0 B"),
        suggested_chart=suggested_chart,
        x_axis=x_axis,
        y_axis=y_axis,
        summary=summary,
        error_message=query_exec.get("error")
    )

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

@router.get("/history")
def get_query_history(limit: int = 50, current_user: Dict[str, Any] = Depends(get_current_user)):
    company_id = current_user.get("companyId", "ACME-001").upper()
    history = db.get_query_history(company_id=company_id, limit=limit)
    return {"success": True, "history": history}
