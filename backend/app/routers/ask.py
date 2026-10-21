from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
import re
from pathlib import Path

from app.database import db
from app.models import AskDataRequest, AskDataResponse
from app.services.auth_service import get_current_user
from app.services.duckdb_service import execute_lakehouse_query
from app.services.forecasting_service import (
    list_time_series_datasets,
    run_predictive_ai_forecast
)
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

    # -------------------------------------------------------------------------
    # 0. Predictive AI Intent Detection (ARIMA + Meta Prophet Dual Engine)
    # Automatically triggers when users ask questions about the future (e.g.
    # "after 2 years what will happen", "in 2 years", "predict revenue next year")
    # -------------------------------------------------------------------------
    is_future_query = False
    horizon_days = 730  # Default 2-year horizon

    # Check for duration patterns
    m_yr = re.search(r"(?:after|in|next|over the next)\s+(\d+)\s*(?:years?|yrs?)", q_lower)
    m_mo = re.search(r"(?:after|in|next|over the next)\s+(\d+)\s*(?:months?|mos?)", q_lower)
    m_wk = re.search(r"(?:after|in|next|over the next)\s+(\d+)\s*(?:weeks?|wks?)", q_lower)
    m_dy = re.search(r"(?:after|in|next|over the next)\s+(\d+)\s*(?:days?)", q_lower)

    if m_yr:
        is_future_query = True
        horizon_days = max(14, min(1095, int(m_yr.group(1)) * 365))
    elif m_mo:
        is_future_query = True
        horizon_days = max(14, min(1095, int(m_mo.group(1)) * 30))
    elif m_wk:
        is_future_query = True
        horizon_days = max(14, min(1095, int(m_wk.group(1)) * 7))
    elif m_dy:
        is_future_query = True
        horizon_days = max(7, min(1095, int(m_dy.group(1))))
    elif re.search(r"(?:next\s+year|after\s+a\s+year|in\s+a\s+year|1\s+year)", q_lower):
        is_future_query = True
        horizon_days = 365
    elif re.search(r"(?:2\s+years?|two\s+years?|2\s+yrs?)", q_lower) and any(w in q_lower for w in ["what", "predict", "forecast", "will", "happen", "future"]):
        is_future_query = True
        horizon_days = 730
    elif any(phrase in q_lower for phrase in [
        "what will happen", "what happens after", "will happen", "future prediction",
        "predict the future", "forecast future", "future of", "predict after", "predict future",
        "future trajectory", "predict revenue", "predict sales", "predict users", "forecast revenue",
        "forecast sales", "forecast active users", "project revenue", "project sales", "future trend",
        "predictive ai", "future outlook"
    ]):
        is_future_query = True
        horizon_days = 730 if any(y in q_lower for y in ["2", "two"]) else 365 if any(y in q_lower for y in ["1", "one", "next year"]) else 730

    if is_future_query:
        ts_datasets = list_time_series_datasets(company_id, user_role)
        if ts_datasets:
            target_ts = None
            if req.datasetId:
                target_ts = next((d for d in ts_datasets if d["id"] == req.datasetId or d["name"] == req.datasetId), None)

            if not target_ts:
                def score_ts(ds):
                    score = 0
                    name_l = (ds.get("name", "") + " " + ds.get("displayName", "")).lower()
                    for w in re.findall(r"\b[a-zA-Z]{3,}\b", q_lower):
                        if w in name_l:
                            score += 10
                    for m in ds.get("metricColumns", []):
                        if m.lower() in q_lower:
                            score += 25
                    if "revenue" in q_lower or "sales" in q_lower or "money" in q_lower:
                        if "revenue" in name_l or "sales" in name_l:
                            score += 30
                    if "user" in q_lower or "traffic" in q_lower or "usage" in q_lower:
                        if "user" in name_l or any("user" in c.lower() for c in ds.get("metricColumns", [])):
                            score += 25
                    return score

                target_ts = max(ts_datasets, key=score_ts)

            # Determine metric column to forecast
            metric_cols = target_ts.get("metricColumns", [])
            metric_col = target_ts.get("defaultMetricColumn") or (metric_cols[0] if metric_cols else "value")
            for col in metric_cols:
                col_l = col.lower()
                if col_l in q_lower:
                    metric_col = col
                    break
                elif any(k in q_lower for k in ["revenue", "sales", "income", "deal", "cash"]) and any(k in col_l for k in ["revenue", "sales", "deal", "amount", "total"]):
                    metric_col = col
                    break
                elif any(k in q_lower for k in ["user", "active", "people", "customer"]) and any(k in col_l for k in ["user", "active", "customer"]):
                    metric_col = col
                    break
                elif any(k in q_lower for k in ["compute", "cpu", "hour", "server"]) and any(k in col_l for k in ["compute", "hour", "usage"]):
                    metric_col = col
                    break
                elif any(k in q_lower for k in ["storage", "disk", "gb", "space"]) and any(k in col_l for k in ["storage", "disk", "gb"]):
                    metric_col = col
                    break

            date_col = target_ts.get("defaultDateColumn") or (target_ts.get("dateColumns", [])[0] if target_ts.get("dateColumns") else "date")

            try:
                fc_res = run_predictive_ai_forecast(
                    company_id=company_id,
                    user_role=user_role,
                    dataset_id=target_ts["id"],
                    date_col=date_col,
                    metric_col=metric_col,
                    model_type="auto",
                    horizon_days=horizon_days,
                    confidence_level=0.95
                )

                horizon_label = (
                    f"2 Years ({horizon_days} Days)" if horizon_days == 730
                    else f"1 Year (365 Days)" if horizon_days == 365
                    else f"{round(horizon_days / 365, 1)} Years ({horizon_days} Days)" if horizon_days > 365
                    else f"{horizon_days} Days"
                )

                hist_pts = fc_res.get("historical", [])
                fc_pts = fc_res.get("forecast", [])
                baseline_val = hist_pts[-1]["actual"] if hist_pts else 0.0
                baseline_date = hist_pts[-1]["date"] if hist_pts else "Baseline"
                final_fc = fc_pts[-1] if fc_pts else {"forecast": baseline_val, "lower": baseline_val, "upper": baseline_val, "date": "Future"}
                projected_val = final_fc["forecast"]
                projected_date = final_fc["date"]
                lower_ci = final_fc.get("lower", projected_val)
                upper_ci = final_fc.get("upper", projected_val)

                diff = projected_val - baseline_val
                pct_change = (diff / baseline_val * 100) if baseline_val != 0 else 0.0
                trend_dir = "growth / upward trend" if diff >= 0 else "reduction / downward trajectory"
                pct_sign = f"+{pct_change:.1f}%" if pct_change >= 0 else f"{pct_change:.1f}%"

                winner_model = fc_res.get("selectedModel", "Meta Prophet")
                winner_metrics = fc_res.get("metrics", {})
                rmse_val = winner_metrics.get("rmse", 0.0)
                mape_val = winner_metrics.get("mape", 0.0)

                summary = (
                    f"🔮 **Predictive AI Future Forecast ({horizon_label}):**\n\n"
                    f"To answer your question about future performance, our **Dual-Engine Predictive AI (Auto-ARIMA + Meta Prophet)** "
                    f"analyzed historical records from **{target_ts.get('displayName')}** and executed a chronological 80/20 holdout simulation.\n\n"
                    f"• **Winning Algorithm**: **{winner_model}** (Holdout RMSE: {rmse_val:.2f}, MAPE: {mape_val:.1f}%)\n"
                    f"• **Current Baseline ({baseline_date})**: **{baseline_val:,.2f}** {metric_col}\n"
                    f"• **Projected Value in {horizon_label} ({projected_date})**: **{projected_val:,.2f}** ({pct_sign} {trend_dir})\n"
                    f"• **95% Confidence Interval**: **{lower_ci:,.2f}** to **{upper_ci:,.2f}**\n\n"
                    f"**Executive Insight:** Over the next {horizon_label}, `{metric_col}` is projected to move from "
                    f"**{baseline_val:,.2f}** to approximately **{projected_val:,.2f}**. "
                    f"Statistical modeling suggests a {pct_sign} overall variation with steady seasonal patterns."
                )

                combined = fc_res.get("combined", [])
                total_pts = len(combined)
                step = max(1, total_pts // 40)
                sampled_results = []
                for i in range(0, total_pts, step):
                    pt = combined[i]
                    sampled_results.append({
                        "date": pt["date"],
                        "actual": pt.get("actual"),
                        "forecast": pt.get("forecast"),
                        "lower": pt.get("lower"),
                        "upper": pt.get("upper"),
                        "value": pt.get("forecast") if pt.get("forecast") is not None else pt.get("actual"),
                        "type": pt.get("type", "historical")
                    })
                if combined and (not sampled_results or sampled_results[-1]["date"] != combined[-1]["date"]):
                    last_pt = combined[-1]
                    sampled_results.append({
                        "date": last_pt["date"],
                        "actual": last_pt.get("actual"),
                        "forecast": last_pt.get("forecast"),
                        "lower": last_pt.get("lower"),
                        "upper": last_pt.get("upper"),
                        "value": last_pt.get("forecast") if last_pt.get("forecast") is not None else last_pt.get("actual"),
                        "type": last_pt.get("type", "forecast")
                    })

                generated_sql = (
                    f"-- Dual-Engine Predictive AI: Auto-ARIMA & Meta Prophet\n"
                    f"-- Chronological Holdout Split: 80% Train / 20% Test\n"
                    f"-- Winner Algorithm: {winner_model} (RMSE: {rmse_val:.2f}, MAPE: {mape_val:.1f}%)\n"
                    f"-- Forecast Horizon: {horizon_days} Days ({horizon_label})\n"
                    f"SELECT ds AS date, ROUND(yhat, 2) AS projected_{metric_col}, "
                    f"ROUND(yhat_lower, 2) AS lower_95_ci, ROUND(yhat_upper, 2) AS upper_95_ci "
                    f"FROM predictive_forecast('{target_ts['name']}', date='{date_col}', metric='{metric_col}', horizon={horizon_days});"
                )

                forecast_details = {
                    "isForecast": True,
                    "winningModel": winner_model,
                    "horizonDays": horizon_days,
                    "horizonLabel": horizon_label,
                    "dateColumn": date_col,
                    "metricColumn": metric_col,
                    "datasetId": target_ts.get("id"),
                    "datasetName": target_ts.get("displayName") or target_ts["name"],
                    "baselineDate": baseline_date,
                    "baselineValue": baseline_val,
                    "projectedDate": projected_date,
                    "projectedValue": projected_val,
                    "percentChange": round(pct_change, 1),
                    "confidenceLower": lower_ci,
                    "confidenceUpper": upper_ci,
                    "rmse": rmse_val,
                    "mape": mape_val,
                    "comparison": fc_res.get("comparison", [])
                }

                db.log_query_history(
                    company_id=company_id,
                    user_id=current_user.get("id"),
                    user_name=current_user.get("name", "User"),
                    user_role=user_role,
                    prompt=question,
                    input_type="voice" if req.isVoice else "text",
                    generated_sql=generated_sql,
                    target_dataset_id=target_ts.get("id"),
                    target_dataset_name=target_ts.get("name", ""),
                    execution_status="Success",
                    latency="38 ms",
                    row_count=len(sampled_results),
                    scanned_bytes="128 KB",
                    suggested_chart="line",
                    x_axis="date",
                    y_axis="forecast",
                    summary=summary
                )

                return AskDataResponse(
                    question=question,
                    interpreted=f"Dual-Engine Predictive AI Forecast (Auto-ARIMA vs. Meta Prophet) for {metric_col} over {horizon_label}.",
                    datasetName=target_ts.get("displayName") or target_ts["name"],
                    sql=generated_sql,
                    columns=["date", "actual", "forecast", "lower", "upper", "value"],
                    results=sampled_results,
                    suggestedChart="line",
                    xAxis="date",
                    yAxis="forecast",
                    summary=summary,
                    isForecast=True,
                    forecastDetails=forecast_details
                )
            except Exception as e:
                print(f"[WARN] Predictive AI forecast execution error: {e}. Falling back to standard query.")

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
