import io
import base64
import json
from typing import Dict, Any, List, Optional
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker
import numpy as np

def generate_matplotlib_figure(
    chart_type: str,
    results: List[Dict[str, Any]],
    x_axis: str,
    y_axis: str,
    is_forecast: bool = False,
    forecast_details: Optional[Dict[str, Any]] = None,
    title: str = "Query Analytical Visualization"
) -> Optional[str]:
    """
    Renders publication-quality data visualization using Matplotlib.
    Outputs a base64 encoded PNG data URL.
    """
    if not results or len(results) == 0:
        return None

    try:
        plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
    except Exception:
        pass

    fig, ax = plt.subplots(figsize=(9, 4.2), dpi=140)
    fig.patch.set_facecolor('#0f172a')  # Slate-900 background
    ax.set_facecolor('#1e293b')         # Slate-800 card background

    ax.grid(True, linestyle='--', alpha=0.25, color='#94a3b8')
    ax.tick_params(colors='#cbd5e1', labelsize=8)
    for spine in ax.spines.values():
        spine.set_color('#334155')

    palette_teal = '#14b8a6'
    palette_indigo = '#6366f1'
    palette_emerald = '#10b981'
    palette_rose = '#f43f5e'
    palette_amber = '#f59e0b'

    try:
        if is_forecast:
            # 1. Predictive Forecast Visualization (Actual vs Projected + Confidence Interval)
            dates = [str(r.get("date", "")) for r in results]
            actuals = [r.get("actual") for r in results]
            forecasts = [r.get("forecast") for r in results]
            lowers = [r.get("lower") for r in results]
            uppers = [r.get("upper") for r in results]

            # Indices
            x_indices = np.arange(len(dates))

            # Filter valid actuals
            act_idx = [i for i, v in enumerate(actuals) if v is not None]
            if act_idx:
                ax.plot([x_indices[i] for i in act_idx], [actuals[i] for i in act_idx],
                        color='#38bdf8', linewidth=2.5, marker='o', markersize=4,
                        label='Historical Actual', zorder=4)

            # Filter valid forecasts
            fc_idx = [i for i, v in enumerate(forecasts) if v is not None]
            if fc_idx:
                # If there's an overlap point, join it
                ax.plot([x_indices[i] for i in fc_idx], [forecasts[i] for i in fc_idx],
                        color=palette_indigo, linewidth=2.5, linestyle='--', marker='s', markersize=4,
                        label=f"Projected Forecast ({forecast_details.get('winningModel', 'ML Model') if forecast_details else 'ML Model'})",
                        zorder=5)

                # Confidence Interval fill
                ci_low = [lowers[i] if lowers[i] is not None else forecasts[i] for i in fc_idx]
                ci_up = [uppers[i] if uppers[i] is not None else forecasts[i] for i in fc_idx]
                ax.fill_between([x_indices[i] for i in fc_idx], ci_low, ci_up,
                                color=palette_indigo, alpha=0.18, label='95% Confidence Interval', zorder=2)

            # Sample x-ticks so labels don't collide
            step = max(1, len(dates) // 7)
            tick_positions = list(range(0, len(dates), step))
            if (len(dates) - 1) not in tick_positions:
                tick_positions.append(len(dates) - 1)
            ax.set_xticks(tick_positions)
            ax.set_xticklabels([dates[i] for i in tick_positions], rotation=25, ha='right', color='#cbd5e1')

            model_name = forecast_details.get('winningModel', 'Predictive AI') if forecast_details else 'Predictive AI'
            ax.set_title(f"🔮 Matplotlib: {model_name} Forecast ({forecast_details.get('horizonLabel', 'Future') if forecast_details else 'Future'})",
                         fontsize=11, fontweight='bold', color='#f8fafc', pad=12)

        elif chart_type == 'line':
            # 2. Line Chart
            x_vals = [str(r.get(x_axis, f"R{i+1}")) for i, r in enumerate(results)]
            y_vals = []
            for r in results:
                try:
                    y_vals.append(float(r.get(y_axis, 0.0) or 0.0))
                except (ValueError, TypeError):
                    y_vals.append(0.0)

            x_idx = np.arange(len(x_vals))
            ax.plot(x_idx, y_vals, color=palette_teal, linewidth=2.5, marker='o', markersize=5, label=y_axis)
            ax.fill_between(x_idx, y_vals, color=palette_teal, alpha=0.12)

            ax.set_xticks(x_idx)
            ax.set_xticklabels([v[:14] + '..' if len(v) > 16 else v for v in x_vals], rotation=30, ha='right')
            ax.set_title(f"📈 Matplotlib: {title}", fontsize=11, fontweight='bold', color='#f8fafc', pad=12)

        elif chart_type == 'pie':
            # 3. Donut / Pie Chart
            x_vals = [str(r.get(x_axis, f"C{i+1}")) for i, r in enumerate(results[:6])]
            y_vals = []
            for r in results[:6]:
                try:
                    y_vals.append(float(r.get(y_axis, 0.0) or 0.0))
                except (ValueError, TypeError):
                    y_vals.append(1.0)

            colors = ['#14b8a6', '#6366f1', '#f59e0b', '#ec4899', '#38bdf8', '#10b981']
            wedges, texts, autotexts = ax.pie(
                y_vals,
                labels=[v[:12] for v in x_vals],
                autopct='%1.1f%%',
                colors=colors[:len(y_vals)],
                startangle=140,
                wedgeprops=dict(width=0.45, edgecolor='#0f172a', linewidth=2),
                textprops=dict(color='#e2e8f0', fontsize=8)
            )
            for at in autotexts:
                at.set_color('#ffffff')
                at.set_fontweight('bold')
                at.set_fontsize(7.5)
            ax.set_title(f"📊 Matplotlib: {title}", fontsize=11, fontweight='bold', color='#f8fafc', pad=12)

        else:
            # 4. Bar Chart (Default)
            x_vals = [str(r.get(x_axis, f"Item {i+1}")) for i, r in enumerate(results[:8])]
            y_vals = []
            for r in results[:8]:
                try:
                    y_vals.append(float(r.get(y_axis, 0.0) or 0.0))
                except (ValueError, TypeError):
                    y_vals.append(0.0)

            x_idx = np.arange(len(x_vals))
            bar_colors = [palette_teal if i % 2 == 0 else '#0d9488' for i in range(len(x_vals))]
            bars = ax.bar(x_idx, y_vals, color=bar_colors, width=0.55, edgecolor='#334155', linewidth=0.8, zorder=3)

            # Data labels on bars
            for bar in bars:
                height = bar.get_height()
                lbl = f"{height:,.0f}" if height >= 10 else f"{height:,.1f}"
                ax.annotate(lbl,
                            xy=(bar.get_x() + bar.get_width() / 2, height),
                            xytext=(0, 4), textcoords="offset points",
                            ha='center', va='bottom', fontsize=7.5, color='#e2e8f0', fontweight='bold')

            ax.set_xticks(x_idx)
            ax.set_xticklabels([v[:14] + '..' if len(v) > 16 else v for v in x_vals], rotation=25, ha='right')
            ax.set_title(f"📊 Matplotlib: {title}", fontsize=11, fontweight='bold', color='#f8fafc', pad=12)

        # Legend & Layout
        if chart_type != 'pie':
            legend = ax.legend(facecolor='#1e293b', edgecolor='#334155', labelcolor='#cbd5e1', fontsize=8, loc='upper left')
            if legend:
                legend.get_frame().set_alpha(0.85)

        ax.yaxis.set_major_formatter(ticker.FuncFormatter(lambda x, pos: f"{x:,.0f}" if abs(x) >= 1 else f"{x:.1f}"))

        plt.tight_layout()

        buf = io.BytesIO()
        plt.savefig(buf, format='png', facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
        plt.close(fig)
        buf.seek(0)
        img_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        return f"data:image/png;base64,{img_b64}"

    except Exception as e:
        print(f"[WARN] Matplotlib visualization generation failed: {e}")
        try:
            plt.close(fig)
        except Exception:
            pass
        return None

def generate_plotly_spec(
    chart_type: str,
    results: List[Dict[str, Any]],
    x_axis: str,
    y_axis: str,
    is_forecast: bool = False,
    forecast_details: Optional[Dict[str, Any]] = None,
    title: str = "Interactive Plotly Analytics"
) -> Dict[str, Any]:
    """
    Generates an interactive Plotly specification (JSON compatible dict)
    with responsive dark/light styling, hover tooltips, and zoom/pan controls.
    """
    if not results or len(results) == 0:
        return {"data": [], "layout": {}}

    if is_forecast:
        dates = [str(r.get("date", "")) for r in results]
        actual_x = []
        actual_y = []
        forecast_x = []
        forecast_y = []
        lower_y = []
        upper_y = []

        for r in results:
            d = str(r.get("date", ""))
            if r.get("actual") is not None:
                actual_x.append(d)
                actual_y.append(r.get("actual"))
            if r.get("forecast") is not None:
                forecast_x.append(d)
                forecast_y.append(r.get("forecast"))
                lower_y.append(r.get("lower", r.get("forecast")))
                upper_y.append(r.get("upper", r.get("forecast")))

        model_name = forecast_details.get("winningModel", "Predictive AI") if forecast_details else "Predictive AI"
        horizon = forecast_details.get("horizonLabel", "Future") if forecast_details else "Future"

        traces = []
        # Trace 1: Historical Actuals
        if actual_x:
            traces.append({
                "type": "scatter",
                "mode": "lines+markers",
                "name": "Historical Actual",
                "x": actual_x,
                "y": actual_y,
                "line": {"color": "#38bdf8", "width": 3},
                "marker": {"size": 6, "color": "#38bdf8"},
                "hovertemplate": "<b>Actual</b>: %{y:,.2f}<br>Date: %{x}<extra></extra>"
            })

        # Trace 2: Upper Confidence Bound
        if forecast_x:
            traces.append({
                "type": "scatter",
                "mode": "lines",
                "name": "Upper 95% Bound",
                "x": forecast_x,
                "y": upper_y,
                "line": {"color": "rgba(99, 102, 241, 0.2)", "width": 1},
                "showlegend": False,
                "hoverinfo": "skip"
            })
            # Trace 3: Lower Confidence Bound + Shaded Area
            traces.append({
                "type": "scatter",
                "mode": "lines",
                "name": "95% Confidence Band",
                "x": forecast_x,
                "y": lower_y,
                "fill": "tonexty",
                "fillcolor": "rgba(99, 102, 241, 0.15)",
                "line": {"color": "rgba(99, 102, 241, 0.2)", "width": 1},
                "hoverinfo": "skip"
            })
            # Trace 4: Forecast Line
            traces.append({
                "type": "scatter",
                "mode": "lines+markers",
                "name": f"Projected ({model_name})",
                "x": forecast_x,
                "y": forecast_y,
                "line": {"color": "#6366f1", "width": 3, "dash": "dash"},
                "marker": {"size": 6, "color": "#6366f1", "symbol": "diamond"},
                "hovertemplate": "<b>Projected</b>: %{y:,.2f}<br>Date: %{x}<extra></extra>"
            })

        layout = {
            "title": {
                "text": f"<b>{model_name} Predictive Trajectory ({horizon})</b>",
                "font": {"size": 14, "color": "#f8fafc"}
            },
            "paper_bgcolor": "rgba(0,0,0,0)",
            "plot_bgcolor": "rgba(15,23,42,0.6)",
            "margin": {"l": 50, "r": 20, "t": 40, "b": 40},
            "hovermode": "x unified",
            "legend": {"orientation": "h", "y": -0.2, "x": 0.05, "font": {"color": "#cbd5e1"}},
            "xaxis": {
                "title": {"text": "Date", "font": {"color": "#94a3b8", "size": 11}},
                "tickfont": {"color": "#cbd5e1", "size": 10},
                "gridcolor": "rgba(148, 163, 184, 0.15)"
            },
            "yaxis": {
                "title": {"text": forecast_details.get("metricColumn", "Value") if forecast_details else "Value", "font": {"color": "#94a3b8", "size": 11}},
                "tickfont": {"color": "#cbd5e1", "size": 10},
                "gridcolor": "rgba(148, 163, 184, 0.15)"
            }
        }

        return {
            "data": traces,
            "layout": layout,
            "config": {"responsive": True, "displayModeBar": True, "displaylogo": False}
        }

    # Regular Query: Bar, Line, or Pie
    x_vals = [str(r.get(x_axis, f"Item {i+1}")) for i, r in enumerate(results)]
    y_vals = []
    for r in results:
        try:
            y_vals.append(float(r.get(y_axis, 0.0) or 0.0))
        except (ValueError, TypeError):
            y_vals.append(0.0)

    if chart_type == "line":
        traces = [{
            "type": "scatter",
            "mode": "lines+markers",
            "name": y_axis,
            "x": x_vals,
            "y": y_vals,
            "line": {"color": "#14b8a6", "width": 3},
            "marker": {"size": 7, "color": "#14b8a6"},
            "fill": "tozeroy",
            "fillcolor": "rgba(20, 184, 166, 0.12)",
            "hovertemplate": "<b>%{x}</b><br>" + y_axis + ": %{y:,.2f}<extra></extra>"
        }]
    elif chart_type == "pie":
        traces = [{
            "type": "pie",
            "labels": x_vals[:8],
            "values": y_vals[:8],
            "hole": 0.45,
            "marker": {"colors": ["#14b8a6", "#6366f1", "#f59e0b", "#ec4899", "#38bdf8", "#10b981", "#8b5cf6", "#f43f5e"]},
            "textinfo": "label+percent",
            "insidetextorientation": "radial",
            "hovertemplate": "<b>%{label}</b><br>Value: %{value:,.2f} (%{percent})<extra></extra>"
        }]
    else:
        # Default Bar
        traces = [{
            "type": "bar",
            "name": y_axis,
            "x": x_vals[:12],
            "y": y_vals[:12],
            "marker": {
                "color": ["#14b8a6" if i % 2 == 0 else "#0d9488" for i in range(len(x_vals[:12]))],
                "line": {"color": "#334155", "width": 1}
            },
            "hovertemplate": "<b>%{x}</b><br>" + y_axis + ": %{y:,.2f}<extra></extra>"
        }]

    layout = {
        "title": {
            "text": f"<b>{title}</b>",
            "font": {"size": 13, "color": "#f8fafc"}
        },
        "paper_bgcolor": "rgba(0,0,0,0)",
        "plot_bgcolor": "rgba(15,23,42,0.6)",
        "margin": {"l": 50, "r": 20, "t": 35, "b": 40},
        "hovermode": "closest",
        "xaxis": {
            "title": {"text": x_axis, "font": {"color": "#94a3b8", "size": 11}},
            "tickfont": {"color": "#cbd5e1", "size": 10},
            "gridcolor": "rgba(148, 163, 184, 0.15)"
        },
        "yaxis": {
            "title": {"text": y_axis, "font": {"color": "#94a3b8", "size": 11}},
            "tickfont": {"color": "#cbd5e1", "size": 10},
            "gridcolor": "rgba(148, 163, 184, 0.15)"
        }
    }

    return {
        "data": traces,
        "layout": layout,
        "config": {"responsive": True, "displayModeBar": True, "displaylogo": False}
    }
