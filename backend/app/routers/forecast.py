from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any, List, Optional

from app.models import ForecastRequest
from app.services.auth_service import get_current_user
from app.services.forecasting_service import (
    list_time_series_datasets,
    run_predictive_ai_forecast
)

router = APIRouter(prefix="/api/forecast", tags=["Predictive AI Forecasting"])

@router.get("/datasets")
def get_forecast_datasets(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns all accessible datasets containing date and numeric metric columns
    ready for time-series forecasting.
    """
    company_id = current_user.get("companyId", "").upper()
    role = current_user.get("role", "STAFF")

    try:
        datasets = list_time_series_datasets(company_id, role)
        return {
            "success": True,
            "count": len(datasets),
            "datasets": datasets
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to scan datasets for forecasting: {str(e)}")

@router.post("/predict")
def generate_forecast(
    req: ForecastRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Executes time-series forecast using ARIMA, Prophet, or Auto-Select Dual Engine.
    Returns historical actuals, forecasted trajectory, 80% & 95% confidence bands,
    evaluation metrics (RMSE, MAE, MAPE, R2, AIC), and AI executive narrative.
    """
    company_id = current_user.get("companyId", "").upper()
    role = current_user.get("role", "STAFF")

    if not req.datasetId or not req.dateColumn or not req.metricColumn:
        raise HTTPException(status_code=400, detail="datasetId, dateColumn, and metricColumn are required.")

    horizon = max(7, min(730, req.horizonDays or 14))
    ci = max(0.80, min(0.99, req.confidenceLevel or 0.95))
    model_type = (req.modelType or "auto").lower()

    try:
        result = run_predictive_ai_forecast(
            company_id=company_id,
            user_role=role,
            dataset_id=req.datasetId,
            date_col=req.dateColumn,
            metric_col=req.metricColumn,
            model_type=model_type,
            horizon_days=horizon,
            confidence_level=ci
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting engine error: {str(e)}")
