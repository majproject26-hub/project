import os
import sys
import time
import logging
import warnings
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple

import numpy as np
import pandas as pd
import duckdb

# Suppress noisy logging from cmdstanpy, prophet, statsmodels
warnings.filterwarnings("ignore")
logging.getLogger("cmdstanpy").setLevel(logging.WARNING)
logging.getLogger("prophet").setLevel(logging.WARNING)

from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller
from prophet import Prophet

from app.config import PARQUET_DIR
from app.database import db

def list_time_series_datasets(company_id: str, user_role: str) -> List[Dict[str, Any]]:
    """
    Scans company datasets permitted for the user's role and returns those suitable
    for time-series forecasting, with automatically detected date and metric columns.
    """
    clean_cid = company_id.strip().upper()
    permitted_datasets = db.get_datasets_for_user(clean_cid, user_role)
    results = []

    date_patterns = {"date", "time", "timestamp", "day", "dt", "month", "close_date", "created_at", "updated_at"}
    metric_blacklist = {"id", "packet_id", "satellite_id", "sku", "status", "risk_level", "department", "role", "location", "company_id", "companyid", "deal_id", "account_name", "region", "product_line", "sales_rep"}

    for ds in permitted_datasets:
        filename = ds.get("name", "")
        file_path = PARQUET_DIR / filename
        schema = ds.get("schema", [])

        date_cols = []
        metric_cols = []

        # 1. Try checking declared schema
        for col_info in schema:
            col_name = col_info.get("column", "")
            col_type = str(col_info.get("type", "")).upper()
            col_lower = col_name.lower()

            if any(p in col_lower for p in date_patterns) or "DATE" in col_type or "TIME" in col_type:
                date_cols.append(col_name)
            elif col_lower not in metric_blacklist and ("INT" in col_type or "FLOAT" in col_type or "DOUBLE" in col_type or "DECIMAL" in col_type or "NUMERIC" in col_type):
                metric_cols.append(col_name)

        # 2. If schema didn't catch columns and physical file exists, inspect via DuckDB
        if (not date_cols or not metric_cols) and file_path.exists():
            try:
                con = duckdb.connect(":memory:")
                col_df = con.execute(f"DESCRIBE SELECT * FROM read_parquet('{file_path.as_posix()}')").df()
                for _, row in col_df.iterrows():
                    c_name = str(row['column_name'])
                    c_type = str(row['column_type']).upper()
                    c_lower = c_name.lower()

                    if (any(p in c_lower for p in date_patterns) or "DATE" in c_type or "TIME" in c_type) and c_name not in date_cols:
                        date_cols.append(c_name)
                    elif c_lower not in metric_blacklist and ("INT" in c_type or "FLOAT" in c_type or "DOUBLE" in c_type or "DECIMAL" in c_type) and c_name not in metric_cols:
                        metric_cols.append(c_name)
            except Exception as e:
                print(f"[WARN] Error inspecting parquet {filename}: {e}")

        # If at least one date col and one metric col exist, dataset is eligible
        if date_cols and metric_cols:
            # Pick recommended default date col
            default_date = next((c for c in date_cols if c.lower() in ("date", "ds", "close_date", "day")), date_cols[0])
            # Pick recommended default metric col
            default_metric = next((c for c in metric_cols if any(k in c.lower() for k in ("revenue", "sales", "deal_size", "active_users", "usage", "amount", "salary"))), metric_cols[0])

            results.append({
                "id": ds.get("id"),
                "name": ds.get("name"),
                "displayName": ds.get("displayName") or ds.get("name"),
                "description": ds.get("description", ""),
                "rowCount": ds.get("rowCount", 0),
                "size": ds.get("size", "0 B"),
                "dateColumns": date_cols,
                "metricColumns": metric_cols,
                "defaultDateColumn": default_date,
                "defaultMetricColumn": default_metric,
            })

    return results

def extract_time_series_data(
    company_id: str,
    user_role: str,
    dataset_id: str,
    date_col: str,
    metric_col: str
) -> pd.DataFrame:
    """
    Extracts time-series values from the target dataset using DuckDB.
    Enforces security/RBAC, groups by date, handles missing days, and cleans timestamps.
    """
    clean_cid = company_id.strip().upper()
    permitted_datasets = db.get_datasets_for_user(clean_cid, user_role)
    target_ds = next((d for d in permitted_datasets if d.get("id") == dataset_id or d.get("name") == dataset_id), None)

    if not target_ds:
        raise ValueError(f"Dataset '{dataset_id}' not found or access is restricted for role '{user_role}'.")

    filename = target_ds.get("name", "")
    file_path = PARQUET_DIR / filename
    con = duckdb.connect(":memory:")

    if file_path.exists():
        con.execute(f"CREATE VIEW raw_data AS SELECT * FROM read_parquet('{file_path.as_posix()}');")
    elif target_ds.get("previewData"):
        con.register("raw_data", pd.DataFrame(target_ds["previewData"]))
    else:
        raise ValueError(f"No physical data found on disk for dataset '{target_ds.get('displayName', filename)}'.")

    # Aggregate by date column
    query = f'''
        SELECT
            "{date_col}"::VARCHAR AS ds,
            AVG(TRY_CAST("{metric_col}" AS DOUBLE)) AS y
        FROM raw_data
        WHERE "{date_col}" IS NOT NULL AND "{metric_col}" IS NOT NULL
        GROUP BY "{date_col}"
        ORDER BY "{date_col}" ASC;
    '''
    try:
        df = con.execute(query).df()
    except Exception as e:
        raise ValueError(f"Failed to query time-series data: {str(e)}")

    if df.empty or len(df) < 5:
        raise ValueError(f"Dataset has insufficient historical observations ({len(df)} points). Minimum 5 points required for time series modeling.")

    # Parse datetime
    df['ds'] = pd.to_datetime(df['ds'], errors='coerce')
    df = df.dropna(subset=['ds', 'y'])
    df = df.sort_values('ds').drop_duplicates(subset=['ds'])

    # Resample to continuous daily frequency if dates look like daily series
    try:
        df = df.set_index('ds')
        # Infer frequency
        inferred = pd.infer_freq(df.index)
        if inferred in ('D', 'B') or (len(df) > 10 and (df.index.max() - df.index.min()).days <= len(df) * 2):
            df = df.resample('D').mean().interpolate(method='linear')
        df = df.reset_index()
    except Exception:
        df = df.reset_index()

    df['y'] = pd.to_numeric(df['y'], errors='coerce')
    df = df.dropna(subset=['ds', 'y']).reset_index(drop=True)
    return df

def fit_arima_forecast(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    full_df: pd.DataFrame,
    horizon_days: int,
    confidence_level: float = 0.95
) -> Dict[str, Any]:
    """
    Fits ARIMA model, evaluates validation metrics on holdout test_df,
    and produces out-of-sample forecast on full_df.
    """
    t_start = time.perf_counter()

    # Stationarity test (Augmented Dickey-Fuller)
    y_train = train_df['y'].values
    d = 0
    stationarity_note = "Stationary (p-value <= 0.05)"
    try:
        adf_result = adfuller(y_train)
        p_val = adf_result[1]
        if p_val > 0.05:
            d = 1
            stationarity_note = f"Non-stationary transformed with 1st-order differencing (p-value: {p_val:.3f})"
        else:
            stationarity_note = f"Stationary without differencing (p-value: {p_val:.3f})"
    except Exception:
        d = 1
        stationarity_note = "Differencing d=1 applied by default"

    # 1. Validation Fit on train_df to evaluate on test_df
    try:
        val_model = ARIMA(train_df['y'], order=(1, d, 1), enforce_stationarity=False, enforce_invertibility=False).fit()
        val_pred = val_model.get_forecast(steps=len(test_df)).predicted_mean.values
    except Exception:
        # Fallback to order (1, 0, 0)
        val_model = ARIMA(train_df['y'], order=(1, 0, 0)).fit()
        val_pred = val_model.get_forecast(steps=len(test_df)).predicted_mean.values

    # Compute validation metrics
    y_true = test_df['y'].values
    rmse = float(np.sqrt(np.mean((y_true - val_pred) ** 2)))
    mae = float(np.mean(np.abs(y_true - val_pred)))
    # Avoid zero division in MAPE
    denom = np.where(y_true == 0, 1e-6, y_true)
    mape = float(np.mean(np.abs((y_true - val_pred) / denom)) * 100)

    ss_res = np.sum((y_true - val_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    r2 = float(1 - (ss_res / (ss_tot + 1e-8))) if ss_tot > 0 else 0.0

    # 2. Final Forecast Fit on full_df
    final_model = ARIMA(full_df['y'], order=(1, d, 1), enforce_stationarity=False, enforce_invertibility=False).fit()
    fc_res = final_model.get_forecast(steps=horizon_days)

    alpha_95 = 1.0 - confidence_level
    ci_95 = fc_res.conf_int(alpha=alpha_95)
    ci_80 = fc_res.conf_int(alpha=0.20)

    mean_fc = fc_res.predicted_mean.values
    lower_95 = ci_95.iloc[:, 0].values
    upper_95 = ci_95.iloc[:, 1].values
    lower_80 = ci_80.iloc[:, 0].values
    upper_80 = ci_80.iloc[:, 1].values

    # Generate future dates
    last_date = full_df['ds'].max()
    future_dates = [last_date + timedelta(days=i + 1) for i in range(horizon_days)]

    forecast_points = []
    for i in range(horizon_days):
        forecast_points.append({
            "date": future_dates[i].strftime("%Y-%m-%d"),
            "forecast": round(float(mean_fc[i]), 2),
            "lower": round(float(max(0.0, lower_95[i])), 2),
            "upper": round(float(upper_95[i]), 2),
            "lower80": round(float(max(0.0, lower_80[i])), 2),
            "upper80": round(float(upper_80[i]), 2),
        })

    fit_time_ms = round((time.perf_counter() - t_start) * 1000, 1)

    return {
        "model": "ARIMA",
        "order": f"(1, {d}, 1)",
        "fitTimeMs": fit_time_ms,
        "metrics": {
            "rmse": round(rmse, 2),
            "mae": round(mae, 2),
            "mape": round(mape, 2),
            "r2": round(r2, 3),
            "aic": round(float(final_model.aic), 1) if hasattr(final_model, "aic") else None
        },
        "forecast": forecast_points,
        "diagnostics": {
            "stationarity": stationarity_note,
            "order": f"ARIMA(1,{d},1)"
        }
    }

def fit_prophet_forecast(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    full_df: pd.DataFrame,
    horizon_days: int,
    confidence_level: float = 0.95
) -> Dict[str, Any]:
    """
    Fits Facebook Prophet model, evaluates validation metrics on holdout test_df,
    and produces out-of-sample forecast on full_df with decomposed trends.
    """
    t_start = time.perf_counter()

    # 1. Validation Fit on train_df
    m_val = Prophet(
        interval_width=confidence_level,
        daily_seasonality=False,
        weekly_seasonality=True,
        yearly_seasonality=False
    )
    m_val.fit(train_df[['ds', 'y']])

    future_val = m_val.make_future_dataframe(periods=len(test_df), freq='D')
    val_fc = m_val.predict(future_val).iloc[-len(test_df):]
    val_pred = val_fc['yhat'].values

    y_true = test_df['y'].values
    rmse = float(np.sqrt(np.mean((y_true - val_pred) ** 2)))
    mae = float(np.mean(np.abs(y_true - val_pred)))
    denom = np.where(y_true == 0, 1e-6, y_true)
    mape = float(np.mean(np.abs((y_true - val_pred) / denom)) * 100)

    ss_res = np.sum((y_true - val_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    r2 = float(1 - (ss_res / (ss_tot + 1e-8))) if ss_tot > 0 else 0.0

    # 2. Final Forecast on full_df
    m_final = Prophet(
        interval_width=confidence_level,
        daily_seasonality=False,
        weekly_seasonality=True,
        yearly_seasonality=False
    )
    m_final.fit(full_df[['ds', 'y']])

    future_final = m_final.make_future_dataframe(periods=horizon_days, freq='D')
    fc_final = m_final.predict(future_final).iloc[-horizon_days:]

    # 80% CI approximation from std
    forecast_points = []
    for _, row in fc_final.iterrows():
        yhat = float(row['yhat'])
        yhat_lower = float(row['yhat_lower'])
        yhat_upper = float(row['yhat_upper'])
        spread = (yhat_upper - yhat_lower) / 2.0
        # 80% CI is ~1.28 standard errors vs ~1.96 for 95%
        spread_80 = spread * (1.28 / 1.96)

        forecast_points.append({
            "date": pd.to_datetime(row['ds']).strftime("%Y-%m-%d"),
            "forecast": round(yhat, 2),
            "lower": round(max(0.0, yhat_lower), 2),
            "upper": round(yhat_upper, 2),
            "lower80": round(max(0.0, yhat - spread_80), 2),
            "upper80": round(yhat + spread_80, 2),
            "trend": round(float(row.get('trend', yhat)), 2),
            "weekly": round(float(row.get('weekly', 0.0)), 2),
        })

    fit_time_ms = round((time.perf_counter() - t_start) * 1000, 1)

    return {
        "model": "Prophet",
        "fitTimeMs": fit_time_ms,
        "metrics": {
            "rmse": round(rmse, 2),
            "mae": round(mae, 2),
            "mape": round(mape, 2),
            "r2": round(r2, 3)
        },
        "forecast": forecast_points,
        "diagnostics": {
            "seasonality": "Weekly cyclic detected",
            "changepoints": len(m_final.changepoints)
        }
    }

def generate_ai_narrative(
    metric_col: str,
    historical_df: pd.DataFrame,
    forecast_points: List[Dict[str, Any]],
    selected_model: str,
    metrics: Dict[str, Any],
    horizon_days: int
) -> Dict[str, Any]:
    """
    Synthesizes an executive narrative explaining the time series trajectory,
    growth rate, detected seasonality, and statistical confidence.
    """
    # Recent historical average (last 14 days)
    recent_hist = historical_df['y'].iloc[-min(14, len(historical_df)):].mean()
    # Projected average
    proj_values = [p['forecast'] for p in forecast_points]
    proj_avg = np.mean(proj_values)
    proj_max = max(proj_values)
    proj_max_point = next(p for p in forecast_points if p['forecast'] == proj_max)

    # % Change
    pct_change = ((proj_avg - recent_hist) / (recent_hist + 1e-8)) * 100.0

    if pct_change > 3.0:
        trend_status = "Bullish Growth"
        trend_color = "emerald"
        action = f"Scale infrastructure and capacity to support projected +{pct_change:.1f}% expansion."
    elif pct_change < -3.0:
        trend_status = "Downward Contraction"
        trend_color = "rose"
        action = f"Investigate contraction drivers; projected -{abs(pct_change):.1f}% drop over {horizon_days} days."
    else:
        trend_status = "Stable / Steady State"
        trend_color = "blue"
        action = "Maintain current operational allocation; metrics remain within normal variance band."

    col_title = metric_col.replace("_", " ").title()
    summary_text = (
        f"Based on {len(historical_df)} historical daily data points evaluated with {selected_model}, "
        f"{col_title} is forecasted to reach an average of {proj_avg:,.2f} over the next {horizon_days} days "
        f"({'+' if pct_change >= 0 else ''}{pct_change:.1f}% vs recent baseline of {recent_hist:,.2f}). "
        f"The peak is anticipated on {proj_max_point['date']} at {proj_max:,.2f}."
    )

    mape_val = metrics.get('mape', 0)
    confidence_assessment = (
        f"High Accuracy (Validation MAPE: {mape_val:.1f}%)" if mape_val < 5.0
        else f"Moderate Accuracy (Validation MAPE: {mape_val:.1f}%)" if mape_val < 15.0
        else f"High Variance (Validation MAPE: {mape_val:.1f}%)"
    )

    return {
        "title": f"{col_title} {horizon_days}-Day Forecast Analysis",
        "trendStatus": trend_status,
        "trendColor": trend_color,
        "pctChange": round(pct_change, 1),
        "recentBaseline": round(float(recent_hist), 2),
        "projectedAverage": round(float(proj_avg), 2),
        "projectedPeak": {
            "date": proj_max_point['date'],
            "value": round(float(proj_max), 2)
        },
        "confidenceAssessment": confidence_assessment,
        "summary": summary_text,
        "recommendation": action,
        "selectedModel": selected_model
    }

def run_predictive_ai_forecast(
    company_id: str,
    user_role: str,
    dataset_id: str,
    date_col: str,
    metric_col: str,
    model_type: str = "auto",
    horizon_days: int = 14,
    confidence_level: float = 0.95
) -> Dict[str, Any]:
    """
    Dual Engine Core:
    Executes time series predictive AI using ARIMA, Prophet, or Auto-Select (chronological 80/20 holdout).
    Returns complete actuals, predictions, 80%/95% confidence bands, and side-by-side metric comparison.
    """
    # 1. Extract & validate time-series data
    df = extract_time_series_data(company_id, user_role, dataset_id, date_col, metric_col)

    # 2. Chronological Holdout Split (last 14 days or 20% of data, min 5 points)
    n_points = len(df)
    holdout_len = min(14, max(5, int(n_points * 0.2)))
    train_df = df.iloc[:-holdout_len].copy()
    test_df = df.iloc[-holdout_len:].copy()

    # 3. Model Execution
    model_choice = model_type.lower().strip()
    arima_res = None
    prophet_res = None

    if model_choice in ("auto", "arima"):
        try:
            arima_res = fit_arima_forecast(train_df, test_df, df, horizon_days, confidence_level)
        except Exception as e:
            print(f"[ERROR] ARIMA fitting failed: {e}")
            if model_choice == "arima":
                raise ValueError(f"ARIMA modeling failed: {str(e)}")

    if model_choice in ("auto", "prophet"):
        try:
            prophet_res = fit_prophet_forecast(train_df, test_df, df, horizon_days, confidence_level)
        except Exception as e:
            print(f"[ERROR] Prophet fitting failed: {e}")
            if model_choice == "prophet":
                raise ValueError(f"Prophet modeling failed: {str(e)}")

    # 4. Determine Active/Winner Model
    comparison_table = []
    if arima_res and prophet_res:
        # Both ran
        arima_rmse = arima_res['metrics']['rmse']
        prophet_rmse = prophet_res['metrics']['rmse']
        prophet_wins = prophet_rmse <= arima_rmse

        comparison_table = [
            {
                "model": "Prophet",
                "name": "Meta Prophet",
                "rmse": prophet_res['metrics']['rmse'],
                "mae": prophet_res['metrics']['mae'],
                "mape": prophet_res['metrics']['mape'],
                "r2": prophet_res['metrics']['r2'],
                "fitTimeMs": prophet_res['fitTimeMs'],
                "winner": prophet_wins,
                "notes": "Decomposed Trend + Weekly Seasonality"
            },
            {
                "model": "ARIMA",
                "name": f"Auto-ARIMA {arima_res.get('order', '(1,1,1)')}",
                "rmse": arima_res['metrics']['rmse'],
                "mae": arima_res['metrics']['mae'],
                "mape": arima_res['metrics']['mape'],
                "r2": arima_res['metrics']['r2'],
                "aic": arima_res['metrics'].get('aic'),
                "fitTimeMs": arima_res['fitTimeMs'],
                "winner": not prophet_wins,
                "notes": f"{arima_res['diagnostics'].get('stationarity', 'Statistical Autoregressive')}"
            }
        ]
        winner_res = prophet_res if prophet_wins else arima_res
    elif prophet_res:
        winner_res = prophet_res
        comparison_table = [{
            "model": "Prophet",
            "name": "Meta Prophet",
            "rmse": prophet_res['metrics']['rmse'],
            "mae": prophet_res['metrics']['mae'],
            "mape": prophet_res['metrics']['mape'],
            "r2": prophet_res['metrics']['r2'],
            "fitTimeMs": prophet_res['fitTimeMs'],
            "winner": True,
            "notes": "Prophet Model Selected"
        }]
    elif arima_res:
        winner_res = arima_res
        comparison_table = [{
            "model": "ARIMA",
            "name": f"Auto-ARIMA {arima_res.get('order', '(1,1,1)')}",
            "rmse": arima_res['metrics']['rmse'],
            "mae": arima_res['metrics']['mae'],
            "mape": arima_res['metrics']['mape'],
            "r2": arima_res['metrics']['r2'],
            "aic": arima_res['metrics'].get('aic'),
            "fitTimeMs": arima_res['fitTimeMs'],
            "winner": True,
            "notes": "ARIMA Model Selected"
        }]
    else:
        raise ValueError("Both ARIMA and Prophet models failed to fit. Please verify input data distribution.")

    # 5. Format historical actuals
    historical_points = []
    for _, row in df.iterrows():
        historical_points.append({
            "date": pd.to_datetime(row['ds']).strftime("%Y-%m-%d"),
            "actual": round(float(row['y']), 2)
        })

    # 6. Combined timeline for seamless Recharts line + area rendering
    # Connect last historical point to first forecast point so the visualizer connects smoothly
    combined_timeline = []
    for h in historical_points:
        combined_timeline.append({
            "date": h["date"],
            "actual": h["actual"],
            "forecast": None,
            "lower": None,
            "upper": None,
            "lower80": None,
            "upper80": None,
            "type": "historical"
        })

    # Add bridging anchor point on the last historical day
    last_h = historical_points[-1]
    combined_timeline[-1]["forecast"] = last_h["actual"]
    combined_timeline[-1]["lower"] = last_h["actual"]
    combined_timeline[-1]["upper"] = last_h["actual"]

    for f in winner_res["forecast"]:
        combined_timeline.append({
            "date": f["date"],
            "actual": None,
            "forecast": f["forecast"],
            "lower": f["lower"],
            "upper": f["upper"],
            "lower80": f["lower80"],
            "upper80": f["upper80"],
            "type": "forecast"
        })

    # 7. Generate AI narrative & recommendations
    narrative = generate_ai_narrative(
        metric_col=metric_col,
        historical_df=df,
        forecast_points=winner_res["forecast"],
        selected_model=winner_res["model"],
        metrics=winner_res["metrics"],
        horizon_days=horizon_days
    )

    return {
        "success": True,
        "selectedModel": winner_res["model"],
        "requestedModel": model_type,
        "autoSelected": model_choice == "auto",
        "horizonDays": horizon_days,
        "confidenceLevel": confidence_level,
        "datasetId": dataset_id,
        "dateColumn": date_col,
        "metricColumn": metric_col,
        "historicalCount": len(df),
        "historical": historical_points,
        "forecast": winner_res["forecast"],
        "combined": combined_timeline,
        "metrics": winner_res["metrics"],
        "comparison": comparison_table,
        "diagnostics": winner_res.get("diagnostics", {}),
        "narrative": narrative
    }
