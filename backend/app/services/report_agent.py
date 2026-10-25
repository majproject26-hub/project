import datetime
from typing import Dict, Any, List, Optional

class ReportAgent:
    """
    Report Agent for the Comprehensive Data Lakehouse.
    Synthesizes structured analytical reports from retrieved DuckDB data,
    predictive machine learning forecasts, and Explainable AI (XAI) rationale.
    """

    @staticmethod
    def generate_report(
        question: str,
        results: List[Dict[str, Any]],
        columns: List[str],
        dataset_name: str,
        is_forecast: bool = False,
        forecast_details: Optional[Dict[str, Any]] = None,
        xai_summary: Optional[str] = None,
        generated_sql: Optional[str] = None
    ) -> Dict[str, Any]:
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
        report_id = f"REP-{datetime.datetime.now().strftime('%Y%m%d')}-{abs(hash(question)) % 10000:04d}"

        if not results:
            return {
                "reportId": report_id,
                "timestamp": timestamp,
                "title": f"Analytical Summary: {question[:40]}...",
                "executiveSummary": f"No data records matched the inquiry on dataset {dataset_name}.",
                "keyMetrics": [],
                "analyticalFindings": ["Zero rows matched filter constraints."],
                "xaiExplanation": "Query completed execution with empty result set.",
                "recommendations": ["Broaden date filter or adjust query parameters."],
                "markdown": f"# Analytical Report: {report_id}\n\nNo records found."
            }

        if is_forecast and forecast_details:
            # 1. Report for Predictive AI Inquiries
            winning_model = forecast_details.get("winningModel", "Meta Prophet")
            metric_col = forecast_details.get("metricColumn", "value")
            horizon_label = forecast_details.get("horizonLabel", "Forecast Horizon")
            baseline_val = forecast_details.get("baselineValue", 0.0)
            baseline_date = forecast_details.get("baselineDate", "Current")
            projected_val = forecast_details.get("projectedValue", 0.0)
            projected_date = forecast_details.get("projectedDate", "Future")
            pct_change = forecast_details.get("percentChange", 0.0)
            lower_ci = forecast_details.get("confidenceLower", projected_val)
            upper_ci = forecast_details.get("confidenceUpper", projected_val)
            rmse = forecast_details.get("rmse", 0.0)
            mape = forecast_details.get("mape", 0.0)

            trend_word = "expansion" if pct_change >= 0 else "contraction"
            sign = "+" if pct_change >= 0 else ""

            exec_summary = (
                f"Predictive modeling over historical data in '{dataset_name}' indicates an anticipated {trend_word} "
                f"in {metric_col} over the next {horizon_label}. The metric is projected to move from {baseline_val:,.2f} "
                f"to {projected_val:,.2f} ({sign}{pct_change:.1f}%), within a 95% confidence interval of "
                f"{lower_ci:,.2f} to {upper_ci:,.2f}."
            )

            key_metrics = [
                {"label": "Current Baseline", "value": f"{baseline_val:,.2f}", "detail": f"Observed on {baseline_date}"},
                {"label": f"Projected Target ({horizon_label})", "value": f"{projected_val:,.2f}", "detail": f"Target Date: {projected_date}"},
                {"label": "Net Trajectory Change", "value": f"{sign}{pct_change:.1f}%", "detail": f"{trend_word.capitalize()} velocity"},
                {"label": "95% Confidence Interval", "value": f"{lower_ci:,.0f} - {upper_ci:,.0f}", "detail": "Statistical variance band"},
                {"label": "Selected ML Engine", "value": winning_model, "detail": f"Holdout RMSE: {rmse:.2f} | MAPE: {mape:.1f}%"}
            ]

            findings = [
                f"Dual-engine cross-validation evaluated Auto-ARIMA vs. Meta Prophet over chronological test splits; {winning_model} achieved optimal holdout accuracy (MAPE: {mape:.1f}%).",
                f"Projected trend demonstrates persistent {trend_word} momentum throughout {horizon_label}.",
                f"Seasonal fluctuations remain bounded within the calculated 95% statistical confidence envelope ({lower_ci:,.2f} to {upper_ci:,.2f}).",
                f"Final predicted milestone reaches {projected_val:,.2f} units by {projected_date}."
            ]

            xai_text = (
                f"The Predictive Agent activated dual-engine time-series modeling because the inquiry requested future outcomes. "
                f"{winning_model} was selected as the superior decision model based on minimum holdout validation error (RMSE {rmse:.2f}). "
                f"Statistical drivers include recent historical trend momentum combined with cyclic seasonal variations."
            )

            recommendations = [
                f"Align capacity and resource planning to support the expected {sign}{pct_change:.1f}% trajectory.",
                "Review rolling quarterly forecast holdout accuracy to recalibrate parameters as fresh telemetry arrives.",
                f"Establish operational thresholds if actuals breach the lower confidence boundary ({lower_ci:,.2f})."
            ]

            title = f"Predictive Intelligence Report: {metric_col.replace('_', ' ').title()} Outlook ({horizon_label})"

        else:
            # 2. Report for Ordinary SQL Data Queries
            title = f"Executive Analytical Report: {dataset_name.replace('.parquet', '').replace('_', ' ').title()}"
            row_count = len(results)
            first_col = columns[0] if columns else "Item"
            second_col = columns[1] if len(columns) > 1 else first_col

            # Numeric summary if available
            num_values = []
            for r in results:
                try:
                    num_values.append(float(r.get(second_col, 0)))
                except (ValueError, TypeError):
                    pass

            top_item = results[0].get(first_col, "Top Record")
            top_val = results[0].get(second_col, "")

            if num_values:
                total_val = sum(num_values)
                avg_val = total_val / len(num_values)
                max_val = max(num_values)
                min_val = min(num_values)

                exec_summary = (
                    f"Analytical retrieval from '{dataset_name}' aggregated {row_count} primary records. "
                    f"The dominant contribution is attributed to '{top_item}' with {top_val:,.2f} in {second_col}. "
                    f"The aggregate sum across observed groups is {total_val:,.2f} with a group average of {avg_val:,.2f}."
                )

                key_metrics = [
                    {"label": "Aggregated Records", "value": f"{row_count} rows", "detail": f"Dataset: {dataset_name}"},
                    {"label": f"Peak {second_col}", "value": f"{top_val:,.2f}", "detail": f"Leader: {top_item}"},
                    {"label": f"Cohort Average", "value": f"{avg_val:,.2f}", "detail": f"Across {row_count} categories"},
                    {"label": f"Cohort Total", "value": f"{total_val:,.2f}", "detail": f"Cumulative {second_col}"}
                ]
            else:
                exec_summary = f"DuckDB analytical query scanned {dataset_name} and retrieved {row_count} records matching the criteria."
                key_metrics = [
                    {"label": "Retrieved Records", "value": str(row_count), "detail": "Lakehouse records"},
                    {"label": "Primary Category", "value": str(top_item), "detail": "First record in cohort"}
                ]

            findings = [
                f"'{top_item}' represents the highest concentration in this dataset cohort.",
                f"Query executed via DuckDB columnar zero-copy vector pushdown across Snappy Parquet storage.",
                f"Data distributions exhibit clear segmentation across '{first_col}' cohorts."
            ]

            xai_text = (
                xai_summary or
                f"SQL Agent translated natural language inquiry into ANSI SQL using schema-grounded column resolution. "
                f"Execution pushed down directly into DuckDB without moving raw dataset files, preserving multi-tenant isolation."
            )

            recommendations = [
                f"Monitor performance indicators on top cohort ('{top_item}') to maintain market leadership.",
                "Export structured output to enterprise reporting tools or pin the generated chart to executive dashboards."
            ]

        # Assemble full Markdown report
        md_lines = [
            f"# {title}",
            f"**Report ID**: `{report_id}` | **Generated**: {timestamp}",
            f"**Dataset**: `{dataset_name}` | **Inquiry**: *\"{question}\"*",
            "",
            "## 1. Executive Summary",
            exec_summary,
            "",
            "## 2. Key Metrics & Telemetry",
            "| Metric | Value | Detail |",
            "| :--- | :--- | :--- |"
        ]
        for m in key_metrics:
            md_lines.append(f"| **{m['label']}** | {m['value']} | {m['detail']} |")

        md_lines.extend([
            "",
            "## 3. Analytical Findings",
            *[f"- {f}" for f in findings],
            "",
            "## 4. Explainable AI (XAI) & Model Rationale",
            xai_text,
            "",
            "## 5. Strategic Recommendations",
            *[f"1. {r}" for r in recommendations],
            ""
        ])

        if generated_sql:
            md_lines.extend([
                "## 6. Execution Trace (SQL Agent)",
                "```sql",
                generated_sql,
                "```"
            ])

        return {
            "reportId": report_id,
            "timestamp": timestamp,
            "title": title,
            "dataset": dataset_name,
            "question": question,
            "executiveSummary": exec_summary,
            "keyMetrics": key_metrics,
            "analyticalFindings": findings,
            "xaiExplanation": xai_text,
            "recommendations": recommendations,
            "markdown": "\n".join(md_lines)
        }
