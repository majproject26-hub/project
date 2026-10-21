import json
from app.services.xai_service import (
    gradcam_engine,
    cached_presets,
    explain_time_series_forecast,
    explain_tabular_lakehouse_dataset
)
from app.services.forecasting_service import run_predictive_ai_forecast

def test_xai():
    print("=== Testing Explainable AI (XAI) Engine ===")

    # 1. Test Grad-CAM Presets
    print(f"1. Available Visual Presets: {list(cached_presets.keys())}")
    for pid, pdata in cached_presets.items():
        res = gradcam_engine.compute_gradcam(pdata["image"], preset_id=pid, colormap_name="jet", opacity=0.55)
        print(f"   [Grad-CAM] Preset: '{pid}' -> Predicted: '{res['predictedClass']}' ({res['confidence']}%)")
        print(f"              Saliency BBox: {res['boundingBox']}")
        print(f"              Status: {res['explanation']['status']} | {res['explanation']['headline']}")
        assert res["success"] is True
        assert len(res["images"]["overlay"]) > 100

    # 2. Test Time-Series Forecast SHAP Attribution
    print("\n2. Testing Predictive Forecast SHAP Attribution...")
    fc = run_predictive_ai_forecast(
        company_id="ACME-001",
        user_role="ADMIN",
        dataset_id="daily_revenue_and_usage_trends.parquet",
        date_col="date",
        metric_col="daily_revenue",
        model_type="auto",
        horizon_days=14
    )
    print(f"   Forecast Model Winner: {fc['selectedModel']}")
    xai_fc = explain_time_series_forecast(
        historical_points=fc["historical"],
        forecast_points=fc["forecast"],
        metric_name="Daily Revenue"
    )
    print(f"   Target Forecast Date: {xai_fc['targetDate']}")
    print(f"   Baseline: {xai_fc['baselineMean']} -> Projected: {xai_fc['projectedValue']} (Delta: {xai_fc['netDelta']})")
    print(f"   Waterfall Steps: {len(xai_fc['waterfall'])} items")
    for w in xai_fc["waterfall"]:
        print(f"     * {w['name']}: {w['value']} ({w['type']})")
    print("   Global Feature Importance:")
    for f in xai_fc["featureImportance"]:
        print(f"     - {f['feature']}: {f['importance']}% [{f['impactDirection']}]")

    # 3. Test Tabular Lakehouse Dataset TreeSHAP Explainability
    print("\n3. Testing Tabular Lakehouse Explainability...")
    tab_res = explain_tabular_lakehouse_dataset(
        company_id="ACME-001",
        user_role="ADMIN",
        dataset_id="customer_churn_risk_telemetry.parquet",
        record_index=0
    )
    print(f"   Dataset: {tab_res['datasetName']}")
    print(f"   Predicted Risk: {tab_res['predictedRiskScore']}% (Baseline: {tab_res['baselineRiskScore']}%)")
    print(f"   Global Feature Importance: {[f['feature'] + ': ' + str(f['importance']) + '%' for f in tab_res['globalFeatureImportance']]}")

    print("\n=== ALL XAI TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_xai()
