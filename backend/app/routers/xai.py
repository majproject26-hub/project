import io
import base64
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from PIL import Image

from app.models import (
    XaiGradCamRequest,
    XaiForecastExplainRequest,
    XaiTabularExplainRequest
)
from app.services.auth_service import get_current_user
from app.services.xai_service import (
    gradcam_engine,
    cached_presets,
    explain_time_series_forecast,
    explain_tabular_lakehouse_dataset
)
from app.services.forecasting_service import (
    run_predictive_ai_forecast,
    list_time_series_datasets
)

router = APIRouter(prefix="/api/xai", tags=["Explainable AI (XAI) & Model Transparency"])

@router.get("/overview")
def get_xai_overview(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns the metadata and technical taxonomy of Explainable AI (XAI) capabilities
    integrated within the Comprehensive Data Lakehouse.
    """
    return {
        "success": True,
        "title": "Comprehensive Data Lakehouse Explainable AI (XAI) Framework",
        "version": "2.4.0",
        "modules": [
            {
                "id": "visual_gradcam",
                "name": "Visual AI & Deep Learning Diagnostics",
                "method": "Grad-CAM (Gradient-Weighted Class Activation Mapping)",
                "targetData": "Optical Satellite Imagery, Solar Array Thermals, Avionics PCB Micro-Inspections",
                "explainabilityType": "Local Pixel Saliency Heatmaps & Convolutional Activation Maps",
                "status": "Active"
            },
            {
                "id": "predictive_shap",
                "name": "Predictive Time-Series & Dual-Engine Forecasting",
                "method": "SHAP & Additive Component Decomposition",
                "targetData": "DuckDB Parquet Columnar Time-Series (Revenue, Usage, Constellation Telemetry)",
                "explainabilityType": "Local Waterfall Feature Attributions & Global Feature Importance",
                "status": "Active"
            },
            {
                "id": "tabular_shap",
                "name": "Tabular Lakehouse Risk & Anomaly Classification",
                "method": "TreeSHAP & Permutation Feature Importance",
                "targetData": "Customer Churn Risk Telemetry, Fleet Sensor Packets",
                "explainabilityType": "Driver Waterfall & Attribution Rationale",
                "status": "Active"
            }
        ]
    }

@router.get("/visual/presets")
def get_visual_presets(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns available visual telemetry and inspection presets with thumbnails and metadata.
    """
    presets_list = []
    for pid, pdata in cached_presets.items():
        # Generate thumbnail base64
        thumb = pdata["image"].copy().resize((120, 120), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        thumb.save(buf, format="PNG")
        thumb_b64 = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"

        presets_list.append({
            "id": pdata["id"],
            "title": pdata["title"],
            "subtitle": pdata["subtitle"],
            "datasetAssociation": pdata["datasetAssociation"],
            "category": pdata["category"],
            "description": pdata["description"],
            "thumbnail": thumb_b64
        })

    return {
        "success": True,
        "presets": presets_list
    }

@router.post("/visual/gradcam")
def run_visual_gradcam(
    req: XaiGradCamRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Executes Grad-CAM gradient backpropagation over convolutional feature maps.
    Accepts presetId OR custom imageBase64 data URL.
    Returns:
    - Raw image, Grad-CAM heatmap, and blended overlay
    - Target class classification probability distribution
    - Attention bounding box & centroid coordinates
    - Audit-ready transparent explanation rationale
    """
    try:
        if req.imageBase64 and req.imageBase64.startswith("data:image"):
            # Custom Uploaded Image
            header, encoded = req.imageBase64.split(",", 1)
            raw_bytes = base64.b64decode(encoded)
            pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
            preset_id = None
        elif req.presetId and req.presetId in cached_presets:
            # Lakehouse Preset
            pil_img = cached_presets[req.presetId]["image"]
            preset_id = req.presetId
        else:
            # Default to first preset (NOVA Satellite Solar Array)
            preset_id = "nova_satellite_solar_array"
            pil_img = cached_presets[preset_id]["image"]

        result = gradcam_engine.compute_gradcam(
            img_pil=pil_img,
            preset_id=preset_id,
            target_class_idx=req.targetClassIdx,
            colormap_name=req.colormap or "jet",
            opacity=req.opacity if req.opacity is not None else 0.55
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grad-CAM execution error: {str(e)}")

@router.post("/forecast/explain")
def explain_forecast(
    req: XaiForecastExplainRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Runs predictive forecast and computes SHAP & Additive feature attribution waterfall,
    global driver rankings, and counterfactual sensitivity.
    """
    company_id = current_user.get("companyId", "").upper()
    role = current_user.get("role", "STAFF")

    try:
        # 1. Run the underlying predictive AI forecast
        fc_result = run_predictive_ai_forecast(
            company_id=company_id,
            user_role=role,
            dataset_id=req.datasetId,
            date_col=req.dateColumn,
            metric_col=req.metricColumn,
            model_type=req.modelType or "auto",
            horizon_days=req.horizonDays or 14,
            confidence_level=0.95
        )

        # 2. Compute Explainable AI breakdown
        xai_breakdown = explain_time_series_forecast(
            historical_points=fc_result["historical"],
            forecast_points=fc_result["forecast"],
            metric_name=req.metricColumn.replace("_", " ").title(),
            selected_date=req.selectedDate
        )

        return {
            "success": True,
            "forecastDetails": fc_result,
            "xai": xai_breakdown
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"XAI forecast attribution error: {str(e)}")

@router.post("/tabular/explain")
def explain_tabular(
    req: XaiTabularExplainRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Applies TreeSHAP / Permutation Feature Importance to explain tabular lakehouse
    records (e.g., Customer Churn Risk Telemetry).
    """
    company_id = current_user.get("companyId", "").upper()
    role = current_user.get("role", "STAFF")

    try:
        result = explain_tabular_lakehouse_dataset(
            company_id=company_id,
            user_role=role,
            dataset_id=req.datasetId or "customer_churn_risk_telemetry.parquet",
            record_index=req.recordIndex or 0
        )
        return {
            "success": True,
            **result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tabular XAI error: {str(e)}")
