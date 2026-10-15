import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  Sparkles,
  Play,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Calendar,
  Layers,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Info,
  Clock,
  Cpu,
  BarChart3,
  Award,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';

export function PredictiveAiPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const urlDatasetId = searchParams.get('dataset');

  // Datasets State
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [dateColumn, setDateColumn] = useState('');
  const [metricColumn, setMetricColumn] = useState('');

  // Forecasting Parameters State
  const [modelType, setModelType] = useState('auto'); // 'auto' | 'prophet' | 'arima'
  const [horizonDays, setHorizonDays] = useState(14);
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);

  // Execution & Results State
  const [forecasting, setForecasting] = useState(false);
  const [forecastResult, setForecastResult] = useState(null);
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [chartViewMode, setChartViewMode] = useState('combined'); // 'combined' | 'forecast_only'

  // Fetch Eligible Time Series Datasets on mount
  useEffect(() => {
    let isMounted = true;
    async function loadDatasets() {
      setLoadingDatasets(true);
      try {
        const res = await api.getForecastDatasets();
        if (isMounted && res.datasets && res.datasets.length > 0) {
          setDatasets(res.datasets);
          // Prefer URL param or daily_revenue_and_usage_trends.parquet if present
          const preferred =
            (urlDatasetId && res.datasets.find((d) => d.id === urlDatasetId || d.name === urlDatasetId)) ||
            res.datasets.find((d) => d.name.includes('revenue_and_usage') || d.name.includes('daily_revenue')) ||
            res.datasets[0];

          setSelectedDatasetId(preferred.id);
          setDateColumn(preferred.defaultDateColumn || preferred.dateColumns[0]);
          setMetricColumn(preferred.defaultMetricColumn || preferred.metricColumns[0]);

          // Trigger initial forecast automatically for instant WOW effect
          executeForecast(
            preferred.id,
            preferred.defaultDateColumn || preferred.dateColumns[0],
            preferred.defaultMetricColumn || preferred.metricColumns[0],
            'auto',
            14
          );
        }
      } catch (err) {
        console.error('Failed to load forecast datasets:', err);
        if (isMounted) {
          toast?.error('Failed to scan lakehouse datasets for time series metrics.');
        }
      } finally {
        if (isMounted) setLoadingDatasets(false);
      }
    }
    loadDatasets();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update date/metric columns when dataset selection changes
  const handleDatasetChange = (newDsId) => {
    setSelectedDatasetId(newDsId);
    const ds = datasets.find((d) => d.id === newDsId);
    if (ds) {
      const nextDate = ds.defaultDateColumn || ds.dateColumns[0] || '';
      const nextMetric = ds.defaultMetricColumn || ds.metricColumns[0] || '';
      setDateColumn(nextDate);
      setMetricColumn(nextMetric);
    }
  };

  // Run Forecast API
  const executeForecast = async (
    dsId = selectedDatasetId,
    dtCol = dateColumn,
    mtCol = metricColumn,
    mType = modelType,
    hDays = horizonDays
  ) => {
    if (!dsId || !dtCol || !mtCol) {
      toast?.error('Please select a dataset, date column, and metric column.');
      return;
    }

    setForecasting(true);
    try {
      const payload = {
        datasetId: dsId,
        dateColumn: dtCol,
        metricColumn: mtCol,
        modelType: mType,
        horizonDays: Number(hDays),
        confidenceLevel: Number(confidenceLevel),
      };

      const result = await api.runForecast(payload);
      setForecastResult(result);
      toast?.success(
        `Forecast generated using ${result.selectedModel} (${result.autoSelected ? 'Auto-Selected Winner' : 'Selected Model'})!`
      );
    } catch (err) {
      console.error('Forecast failed:', err);
      toast?.error(err.message || 'Failed to generate forecast.');
    } finally {
      setForecasting(false);
    }
  };

  // Selected dataset object
  const activeDataset = datasets.find((d) => d.id === selectedDatasetId);

  // Formatted Chart Data
  const chartData = useMemo(() => {
    if (!forecastResult || !forecastResult.combined) return [];

    if (chartViewMode === 'forecast_only') {
      // Show only last 7 days of actuals + forecast
      const histPoints = forecastResult.historical.slice(-7).map((h) => ({
        date: h.date,
        actual: h.actual,
        forecast: null,
        lower: null,
        upper: null,
      }));
      // Bridge point
      if (histPoints.length > 0) {
        histPoints[histPoints.length - 1].forecast = histPoints[histPoints.length - 1].actual;
        histPoints[histPoints.length - 1].lower = histPoints[histPoints.length - 1].actual;
        histPoints[histPoints.length - 1].upper = histPoints[histPoints.length - 1].actual;
      }
      const fcPoints = forecastResult.forecast.map((f) => ({
        date: f.date,
        actual: null,
        forecast: f.forecast,
        lower: f.lower,
        upper: f.upper,
        lower80: f.lower80,
        upper80: f.upper80,
      }));
      return [...histPoints, ...fcPoints];
    }

    // Combined full view (subsampled if > 150 points for smooth rendering)
    return forecastResult.combined;
  }, [forecastResult, chartViewMode]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!forecastResult || !forecastResult.forecast) return;

    const headers = ['Date', 'Type', 'Actual', 'Forecast', 'Lower_95_CI', 'Upper_95_CI', 'Lower_80_CI', 'Upper_80_CI'];
    const rows = [];

    // Historical
    forecastResult.historical.forEach((h) => {
      rows.push([h.date, 'Historical', h.actual, '', '', '', '', '']);
    });

    // Forecast
    forecastResult.forecast.forEach((f) => {
      rows.push([f.date, 'Forecast', '', f.forecast, f.lower, f.upper, f.lower80 || '', f.upper80 || '']);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `lakehouse_forecast_${metricColumn}_${forecastResult.selectedModel.toLowerCase()}_${horizonDays}d.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast?.success('Forecast CSV downloaded successfully.');
  };

  // Copy SQL query to clipboard
  const handleCopySql = () => {
    if (!activeDataset) return;
    const tableName = activeDataset.name.replace('.parquet', '');
    const sql = `SELECT "${dateColumn}", AVG("${metricColumn}") AS value\nFROM "${tableName}"\nGROUP BY "${dateColumn}"\nORDER BY "${dateColumn}" ASC;`;
    navigator.clipboard.writeText(sql);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
    toast?.success('SQL query copied to clipboard.');
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const item = payload[0]?.payload;
    if (!item) return null;

    const isForecast = item.type === 'forecast' || (item.forecast !== null && item.actual === null);

    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-1.5 min-w-[200px]">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
          <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{label}</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              isForecast
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300'
            }`}
          >
            {isForecast ? 'AI Forecast' : 'Historical Actual'}
          </span>
        </div>

        {item.actual !== null && item.actual !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
              Actual:
            </span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {Number(item.actual).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {item.forecast !== null && item.forecast !== undefined && (
          <>
            <div className="flex items-center justify-between gap-4">
              <span className="text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Predicted:
              </span>
              <span className="font-bold text-purple-600 dark:text-purple-300 font-mono text-sm">
                {Number(item.forecast).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {item.upper !== null && item.lower !== null && (
              <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Upper 95% Bound:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {Number(item.upper).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Lower 95% Bound:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {Number(item.lower).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Confidence Spread:</span>
                  <span className="font-mono">
                    ±{((Number(item.upper) - Number(item.lower)) / 2).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                Dual Engine Predictive Intelligence
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ARIMA + Meta Prophet
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Predictive AI Studio
              <TrendingUp className="w-7 h-7 text-indigo-400" />
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Forecast mission-critical business metrics directly from your Parquet Lakehouse datasets. 
              The Dual Engine autonomously tests statistical ARIMA against Meta Prophet, runs chronological validation, 
              and projects future trajectories with 95% confidence intervals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySql}
              className="bg-white/10 hover:bg-white/15 border-white/20 text-white"
            >
              {copiedQuery ? <Check className="w-4 h-4 text-emerald-400 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
              {copiedQuery ? 'SQL Copied' : 'Copy DuckDB SQL'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={!forecastResult}
              className="bg-white/10 hover:bg-white/15 border-white/20 text-white"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Export Forecast CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls + Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Forecast Controls & Setup (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  Forecasting Controls
                </h2>
                <Badge variant="subtle" className="text-[10px] font-mono">
                  DuckDB 1.0
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Dataset Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  Select Parquet Dataset
                </label>
                <select
                  value={selectedDatasetId}
                  onChange={(e) => handleDatasetChange(e.target.value)}
                  disabled={loadingDatasets || forecasting}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.displayName} ({d.rowCount} rows)
                    </option>
                  ))}
                </select>
                {activeDataset && (
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{activeDataset.description}</p>
                )}
              </div>

              {/* Date & Metric Column Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Date Column
                  </label>
                  <select
                    value={dateColumn}
                    onChange={(e) => setDateColumn(e.target.value)}
                    disabled={forecasting || !activeDataset}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {(activeDataset?.dateColumns || []).map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                    Target Metric
                  </label>
                  <select
                    value={metricColumn}
                    onChange={(e) => setMetricColumn(e.target.value)}
                    disabled={forecasting || !activeDataset}
                    className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {(activeDataset?.metricColumns || []).map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Model Selector Toggle (The Dual Engine Choice) */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                    Predictive Model Engine
                  </span>
                  <span className="text-[10px] text-slate-400">User Selectable</span>
                </label>

                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setModelType('auto')}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
                      modelType === 'auto'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Auto-Select
                  </button>
                  <button
                    type="button"
                    onClick={() => setModelType('prophet')}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
                      modelType === 'prophet'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Prophet
                  </button>
                  <button
                    type="button"
                    onClick={() => setModelType('arima')}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
                      modelType === 'arima'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    ARIMA
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 leading-tight">
                  {modelType === 'auto' && (
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      Runs both ARIMA and Prophet against holdout validation; selects the lowest RMSE model.
                    </span>
                  )}
                  {modelType === 'prophet' && 'Meta Prophet handles seasonal cyclic patterns and trend changes.'}
                  {modelType === 'arima' && 'Auto-ARIMA fits mathematical autoregression with stationary differencing.'}
                </p>
              </div>

              {/* Forecast Horizon Selector */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Forecast Horizon
                  </label>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {horizonDays} Days Ahead
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1">
                  {[7, 14, 30, 60, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setHorizonDays(days)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        horizonDays === days
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/50 dark:border-indigo-500 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="7"
                  max="90"
                  step="1"
                  value={horizonDays}
                  onChange={(e) => setHorizonDays(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Confidence Interval Selector */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  Confidence Level
                </span>
                <div className="flex items-center gap-1 text-xs">
                  {[0.90, 0.95, 0.99].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setConfidenceLevel(lvl)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        confidenceLevel === lvl
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {Math.round(lvl * 100)}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                variant="primary"
                onClick={() => executeForecast()}
                disabled={forecasting || !selectedDatasetId}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-600/25 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {forecasting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Fitting Models...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Run Predictive Forecast</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Presets Quick Actions */}
          <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Quick Forecast Presets
            </h3>
            <div className="space-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMetricColumn('daily_revenue');
                  setHorizonDays(14);
                  executeForecast(selectedDatasetId, dateColumn, 'daily_revenue', 'auto', 14);
                }}
                className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-indigo-500 hover:shadow-xs transition-all flex items-center justify-between"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200">14-Day Revenue Trajectory</span>
                <span className="text-[10px] text-indigo-500 font-mono">Auto (Dual)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMetricColumn('active_users');
                  setHorizonDays(30);
                  executeForecast(selectedDatasetId, dateColumn, 'active_users', 'prophet', 30);
                }}
                className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-indigo-500 hover:shadow-xs transition-all flex items-center justify-between"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200">30-Day Active Users (Prophet)</span>
                <span className="text-[10px] text-purple-500 font-mono">Seasonal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMetricColumn('compute_hours');
                  setHorizonDays(30);
                  executeForecast(selectedDatasetId, dateColumn, 'compute_hours', 'arima', 30);
                }}
                className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-indigo-500 hover:shadow-xs transition-all flex items-center justify-between"
              >
                <span className="font-medium text-slate-800 dark:text-slate-200">30-Day Compute Utilization</span>
                <span className="text-[10px] text-cyan-500 font-mono">ARIMA</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Recharts Visualizer & Narrative (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Visualizer Card */}
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                      {metricColumn.replace(/_/g, ' ')} Forecast
                    </h2>
                    {forecastResult && (
                      <Badge
                        variant="primary"
                        className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-semibold"
                      >
                        Model: {forecastResult.selectedModel}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Historical Actuals ({forecastResult?.historicalCount || 0} days) + {horizonDays}-Day Projected
                    Horizon (95% CI)
                  </p>
                </div>

                {/* View toggles */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-900 text-xs">
                    <button
                      type="button"
                      onClick={() => setChartViewMode('combined')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        chartViewMode === 'combined'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      All Historical
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartViewMode('forecast_only')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        chartViewMode === 'forecast_only'
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Focus Forecast
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {forecasting ? (
                <div className="h-80 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 animate-spin"></div>
                    <Sparkles className="w-5 h-5 text-indigo-500 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      Running Dual-Engine Time Series Fitting...
                    </p>
                    <p className="text-xs text-slate-500">
                      Evaluating stationary transformations, training ARIMA & Meta Prophet holdout validation.
                    </p>
                  </div>
                </div>
              ) : chartData.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                      <defs>
                        {/* Shaded Confidence Interval Gradient */}
                        <linearGradient id="ciGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} />

                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                        dy={8}
                        minTickGap={25}
                      />

                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                        dx={-8}
                        domain={['auto', 'auto']}
                        tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                      />

                      <Tooltip content={<CustomTooltip />} />

                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                      />

                      {/* Upper Bound for CI */}
                      <Area
                        type="monotone"
                        dataKey="upper"
                        name="95% Confidence Upper"
                        stroke="none"
                        fill="url(#ciGradient)"
                        legendType="none"
                      />

                      {/* Lower Bound for CI masking */}
                      <Area
                        type="monotone"
                        dataKey="lower"
                        name="95% Confidence Band"
                        stroke="#c084fc"
                        strokeDasharray="2 2"
                        strokeWidth={1}
                        fill="#ffffff"
                        fillOpacity={0.0}
                      />

                      {/* Historical Actuals Line */}
                      <Line
                        type="monotone"
                        dataKey="actual"
                        name="Historical Actual"
                        stroke="#0ea5e9"
                        strokeWidth={2.5}
                        dot={{ r: 2, fill: '#0ea5e9' }}
                        activeDot={{ r: 6, fill: '#0284c7' }}
                        connectNulls={false}
                      />

                      {/* Forecast Line */}
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        name="AI Forecast"
                        stroke="#8b5cf6"
                        strokeWidth={2.5}
                        strokeDasharray="5 5"
                        dot={{ r: 3, fill: '#8b5cf6' }}
                        activeDot={{ r: 6, fill: '#7c3aed' }}
                        connectNulls={true}
                      />

                      {/* Split Divider at Historical End Date */}
                      {forecastResult?.historical?.length > 0 && (
                        <ReferenceLine
                          x={forecastResult.historical[forecastResult.historical.length - 1].date}
                          stroke="#94a3b8"
                          strokeDasharray="3 3"
                          label={{
                            value: 'Forecast Start',
                            position: 'top',
                            fill: '#64748b',
                            fontSize: 10,
                            offset: 10,
                          }}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-400 text-sm">
                  No forecast data available. Select a dataset and click 'Run Predictive Forecast'.
                </div>
              )}

              {/* Legend & Summary Info Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-sky-500 rounded-full"></span>
                    <span>Actual Historical</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-t-2 border-dashed border-purple-500"></span>
                    <span>Projected Trajectory</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-purple-400/20 border border-purple-400/40"></span>
                    <span>95% Confidence Band</span>
                  </span>
                </div>
                <div className="font-mono text-[11px] text-slate-400">
                  {forecastResult?.diagnostics?.stationarity || 'Stationary series validated'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Executive Narrative & Strategic Insights */}
          {forecastResult?.narrative && (
            <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-pink-50/40 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 p-5 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {forecastResult.narrative.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {forecastResult.narrative.summary}
                  </p>
                </div>

                <Badge
                  variant={forecastResult.narrative.pctChange >= 0 ? 'success' : 'danger'}
                  className="shrink-0 flex items-center gap-1 text-xs py-1 px-2.5 font-bold"
                >
                  {forecastResult.narrative.pctChange >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {forecastResult.narrative.trendStatus} ({forecastResult.narrative.pctChange > 0 ? '+' : ''}
                  {forecastResult.narrative.pctChange}%)
                </Badge>
              </div>

              {/* Key Highlights Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Recent Baseline
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                    {forecastResult.narrative.recentBaseline?.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </span>
                </div>

                <div className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Projected Average
                  </span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 block">
                    {forecastResult.narrative.projectedAverage?.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </span>
                </div>

                <div className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Peak Projection
                  </span>
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400 font-mono mt-0.5 block">
                    {forecastResult.narrative.projectedPeak?.value?.toLocaleString(undefined, {
                      maximumFractionDigits: 1,
                    })}{' '}
                    <span className="text-[10px] font-normal text-slate-400">
                      ({forecastResult.narrative.projectedPeak?.date?.slice(5)})
                    </span>
                  </span>
                </div>

                <div className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Accuracy Rating
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                    {forecastResult.narrative.confidenceAssessment}
                  </span>
                </div>
              </div>

              {/* Recommendation Callout */}
              <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-slate-200/60 dark:border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>
                  <strong className="text-slate-900 dark:text-white">Strategic Recommendation: </strong>
                  {forecastResult.narrative.recommendation}
                </span>
              </div>
            </div>
          )}

          {/* Model Tournament & Performance Telemetry Card */}
          {forecastResult?.comparison && forecastResult.comparison.length > 0 && (
            <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      Dual Engine Model Evaluation Tournament
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Chronological holdout test comparison evaluating accuracy metrics (RMSE, MAE, MAPE, R²)
                    </p>
                  </div>
                  <Badge variant="subtle" className="text-[10px]">
                    Chronological 80/20 Holdout Split
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-3.5 py-2.5 rounded-l-lg font-semibold">Engine</th>
                        <th className="px-3 py-2.5 font-semibold">Architecture / Notes</th>
                        <th className="px-3 py-2.5 font-semibold font-mono text-right">Holdout RMSE</th>
                        <th className="px-3 py-2.5 font-semibold font-mono text-right">MAE</th>
                        <th className="px-3 py-2.5 font-semibold font-mono text-right">MAPE (%)</th>
                        <th className="px-3 py-2.5 font-semibold font-mono text-right">R² Score</th>
                        <th className="px-3 py-2.5 font-semibold font-mono text-right">Fit Time</th>
                        <th className="px-3.5 py-2.5 rounded-r-lg font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono">
                      {forecastResult.comparison.map((comp) => (
                        <tr
                          key={comp.model}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors ${
                            comp.winner ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                          }`}
                        >
                          <td className="px-3.5 py-3 font-sans font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {comp.winner && <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                            {comp.name}
                          </td>
                          <td className="px-3 py-3 font-sans text-slate-500 text-[11px]">{comp.notes}</td>
                          <td
                            className={`px-3 py-3 text-right font-bold ${
                              comp.winner
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {comp.rmse?.toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-600 dark:text-slate-400">
                            {comp.mae?.toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                            {comp.mape?.toFixed(2)}%
                          </td>
                          <td className="px-3 py-3 text-right text-slate-600 dark:text-slate-400">
                            {comp.r2 !== undefined ? comp.r2.toFixed(3) : 'N/A'}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-500 text-[11px]">{comp.fitTimeMs} ms</td>
                          <td className="px-3.5 py-3 text-center">
                            {comp.winner ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-500/20 inline-flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" />
                                Selected Winner
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                                Runner-up
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default PredictiveAiPage;
