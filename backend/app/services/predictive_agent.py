import re
from typing import Dict, Any, List, Optional, Tuple
from app.services.forecasting_service import (
    list_time_series_datasets,
    run_predictive_ai_forecast
)

class PredictiveAgent:
    """
    Predictive Agent for the Comprehensive Data Lakehouse.
    Activated ONLY when a user question asks about future outcomes or forecasts.
    Analyzes historical data and predicts future trends using suitable ML models (ARIMA & Prophet).
    Not activated for ordinary data queries.
    """

    @staticmethod
    def detect_future_intent(question: str) -> Tuple[bool, int, str]:
        """
        Determines if the question requires the Predictive Agent to forecast future trends.
        Returns: (is_future_query, horizon_days, horizon_label)
        """
        q_lower = question.lower().strip()

        # Guard: Past questions should remain with SQL Agent
        if any(past in q_lower for past in ["last year", "last month", "last quarter", "yesterday", "previous year", "past year", "history of", "historical data"]) and not any(fut in q_lower for fut in ["predict", "forecast", "future", "what will happen", "after"]):
            return False, 0, ""

        m_yr = re.search(r"(?:after|in|next|over the next)\s+(\d+)\s*(?:years?|yrs?)", q_lower)
        m_mo = re.search(r"(?:after|in|next|over the next)\s+(\d+)\s*(?:months?|mos?)", q_lower)
        m_wk = re.search(r"(?:after|in|next|over the next)\s+(\d+)\s*(?:weeks?|wks?)", q_lower)
        m_dy = re.search(r"(?:after|in|next|over the next)\s+(\d+)\s*(?:days?)", q_lower)

        horizon_days = 365
        is_future = False

        if m_yr:
            is_future = True
            horizon_days = max(14, min(1095, int(m_yr.group(1)) * 365))
        elif m_mo:
            is_future = True
            horizon_days = max(14, min(1095, int(m_mo.group(1)) * 30))
        elif m_wk:
            is_future = True
            horizon_days = max(14, min(1095, int(m_wk.group(1)) * 7))
        elif m_dy:
            is_future = True
            horizon_days = max(7, min(1095, int(m_dy.group(1))))
        elif re.search(r"(?:next\s+year|after\s+a\s+year|in\s+a\s+year|1\s+year|over\s+the\s+next\s+year)", q_lower):
            is_future = True
            horizon_days = 365
        elif re.search(r"(?:next\s+quarter|upcoming\s+quarter|in\s+a\s+quarter)", q_lower):
            is_future = True
            horizon_days = 90
        elif re.search(r"(?:next\s+month|in\s+a\s+month|upcoming\s+month)", q_lower):
            is_future = True
            horizon_days = 30
        elif re.search(r"(?:2\s+years?|two\s+years?|2\s+yrs?)", q_lower):
            is_future = True
            horizon_days = 730
        elif re.search(r"\b(predict|prediction|predicting|predictive|forecast|forecasting|forecasts|projection|projected)\b", q_lower):
            is_future = True
            if any(w in q_lower for w in ["2 year", "two year", "24 month", "2yr"]):
                horizon_days = 730
            elif any(w in q_lower for w in ["1 year", "one year", "12 month", "year", "1yr"]):
                horizon_days = 365
            elif any(w in q_lower for w in ["quarter", "3 month"]):
                horizon_days = 90
            elif any(w in q_lower for w in ["month"]):
                horizon_days = 30
            else:
                horizon_days = 365
        elif any(phrase in q_lower for phrase in [
            "what will happen", "what happens after", "will happen", "future prediction",
            "predict the future", "forecast future", "future of", "predict after", "predict future",
            "future trajectory", "future trend", "future outlook", "in the future"
        ]):
            is_future = True
            horizon_days = 730 if any(y in q_lower for y in ["2", "two"]) else 365

        if not is_future:
            return False, 0, ""

        horizon_label = (
            f"2 Years ({horizon_days} Days)" if horizon_days == 730
            else f"1 Year (365 Days)" if horizon_days == 365
            else f"{round(horizon_days / 365, 1)} Years ({horizon_days} Days)" if horizon_days > 365
            else f"{horizon_days} Days"
        )
        return True, horizon_days, horizon_label

    @classmethod
    def execute_forecast(
        cls,
        company_id: str,
        user_role: str,
        question: str,
        horizon_days: int,
        dataset_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Executes historical trend analysis and dual-engine predictive modeling
        using Auto-ARIMA and Meta Prophet.
        """
        ts_datasets = list_time_series_datasets(company_id, user_role)
        if not ts_datasets:
            return None

        q_lower = question.lower()
        target_ts = None
        if dataset_id:
            target_ts = next((d for d in ts_datasets if d["id"] == dataset_id or d["name"] == dataset_id), None)

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
                if any(k in q_lower for k in ["revenue", "sales", "money"]):
                    if any(k in name_l for k in ["revenue", "sales"]):
                        score += 30
                if any(k in q_lower for k in ["user", "traffic", "usage"]):
                    if any(k in name_l for k in ["user", "usage"]):
                        score += 25
                return score

            target_ts = max(ts_datasets, key=score_ts)

        metric_cols = target_ts.get("metricColumns", [])
        metric_col = target_ts.get("defaultMetricColumn") or (metric_cols[0] if metric_cols else "value")
        for col in metric_cols:
            col_l = col.lower()
            if col_l in q_lower:
                metric_col = col
                break
            elif any(k in q_lower for k in ["revenue", "sales", "income", "deal"]) and any(k in col_l for k in ["revenue", "sales", "deal", "amount"]):
                metric_col = col
                break
            elif any(k in q_lower for k in ["user", "active", "people"]) and any(k in col_l for k in ["user", "active"]):
                metric_col = col
                break

        date_col = target_ts.get("defaultDateColumn") or (target_ts.get("dateColumns", [])[0] if target_ts.get("dateColumns") else "date")

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
        winner_model = fc_res.get("selectedModel", "Meta Prophet")
        winner_metrics = fc_res.get("metrics", {})
        rmse_val = winner_metrics.get("rmse", 0.0)
        mape_val = winner_metrics.get("mape", 0.0)

        # Sample combined points for smooth chart rendering
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
            f"-- Predictive Agent: Dual-Engine Auto-ARIMA & Meta Prophet\n"
            f"-- Chronological Holdout Split: 80% Train / 20% Test\n"
            f"-- Winner Algorithm: {winner_model} (RMSE: {rmse_val:.2f}, MAPE: {mape_val:.1f}%)\n"
            f"SELECT ds AS date, ROUND(yhat, 2) AS projected_{metric_col}, "
            f"ROUND(yhat_lower, 2) AS lower_95_ci, ROUND(yhat_upper, 2) AS upper_95_ci "
            f"FROM predictive_forecast('{target_ts['name']}', date='{date_col}', metric='{metric_col}', horizon={horizon_days});"
        )

        return {
            "targetDataset": target_ts,
            "metricColumn": metric_col,
            "dateColumn": date_col,
            "winningModel": winner_model,
            "rmse": rmse_val,
            "mape": mape_val,
            "baselineDate": baseline_date,
            "baselineValue": baseline_val,
            "projectedDate": projected_date,
            "projectedValue": projected_val,
            "percentChange": round(pct_change, 1),
            "confidenceLower": lower_ci,
            "confidenceUpper": upper_ci,
            "sampledResults": sampled_results,
            "generatedSql": generated_sql,
            "comparison": fc_res.get("comparison", [])
        }
