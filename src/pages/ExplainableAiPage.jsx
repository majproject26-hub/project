import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Eye,
  Sliders,
  Layers,
  Image as ImageIcon,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
  Upload,
  ArrowRight,
  Maximize2,
  Cpu,
  Database,
  BarChart2,
  Activity,
  Compass,
  FileCode,
  Share2,
  Download,
  Crosshair,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';

export function ExplainableAiPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Active Tab: 'visual' (Grad-CAM) | 'forecast' (SHAP & Time Series) | 'tabular' (Lakehouse Churn/Telemetry)
  const initialTab = searchParams.get('mode') === 'forecast' ? 'forecast' : 'visual';
  const [activeTab, setActiveTab] = useState(initialTab);

  // ============================================================================
  // 1. VISUAL AI & GRAD-CAM STATE
  // ============================================================================
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState('nova_satellite_solar_array');
  const [customImageBase64, setCustomImageBase64] = useState(null);

  // Grad-CAM Controls
  const [executingGradCam, setExecutingGradCam] = useState(false);
  const [gradCamResult, setGradCamResult] = useState(null);
  const [viewMode, setViewMode] = useState('overlay'); // 'overlay' | 'raw' | 'heatmap' | 'split'
  const [opacity, setOpacity] = useState(0.55);
  const [colormap, setColormap] = useState('jet');
  const [selectedClassIdx, setSelectedClassIdx] = useState(null);

  // ============================================================================
  // 2. PREDICTIVE FORECAST & SHAP STATE
  // ============================================================================
  const [loadingForecastDatasets, setLoadingForecastDatasets] = useState(false);
  const [forecastDatasets, setForecastDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [dateCol, setDateCol] = useState('');
  const [metricCol, setMetricCol] = useState('');
  const [selectedForecastDate, setSelectedForecastDate] = useState('');
  const [loadingXaiForecast, setLoadingXaiForecast] = useState(false);
  const [xaiForecastResult, setXaiForecastResult] = useState(null);

  // What-If Counterfactual Simulator State
  const [whatIfTrendShift, setWhatIfTrendShift] = useState(0); // -30% to +30%
  const [whatIfSeasonalityScale, setWhatIfSeasonalityScale] = useState(1.0); // 0.5 to 1.5

  // ============================================================================
  // 3. TABULAR LAKEHOUSE XAI STATE
  // ============================================================================
  const [loadingTabularXai, setLoadingTabularXai] = useState(false);
  const [tabularRecordIndex, setTabularRecordIndex] = useState(0);
  const [tabularXaiResult, setTabularXaiResult] = useState(null);

  // Load Visual Presets on mount
  useEffect(() => {
    let isMounted = true;
    async function loadPresets() {
      setLoadingPresets(true);
      try {
        const res = await api.getVisualPresets();
        if (isMounted && res.presets) {
          setPresets(res.presets);
          if (res.presets.length > 0) {
            setSelectedPresetId(res.presets[0].id);
            // Run initial Grad-CAM
            runGradCam(res.presets[0].id, null, null, 'jet', 0.55);
          }
        }
      } catch (err) {
        console.error('Failed to load visual presets:', err);
        if (isMounted) toast?.error('Failed to load visual inspection presets.');
      } finally {
        if (isMounted) setLoadingPresets(false);
      }
    }
    loadPresets();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load Time Series Datasets for Forecast SHAP
  useEffect(() => {
    let isMounted = true;
    async function loadForecastDs() {
      setLoadingForecastDatasets(true);
      try {
        const res = await api.getForecastDatasets();
        if (isMounted && res.datasets && res.datasets.length > 0) {
          setForecastDatasets(res.datasets);
          const first = res.datasets[0];
          setSelectedDatasetId(first.id);
          setDateCol(first.defaultDateColumn || first.dateColumns[0]);
          setMetricCol(first.defaultMetricColumn || first.metricColumns[0]);

          // Trigger initial forecast attribution
          runForecastAttribution(
            first.id,
            first.defaultDateColumn || first.dateColumns[0],
            first.defaultMetricColumn || first.metricColumns[0]
          );
        }
      } catch (err) {
        console.error('Failed to load forecast datasets:', err);
      } finally {
        if (isMounted) setLoadingForecastDatasets(false);
      }
    }
    loadForecastDs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load Tabular XAI
  useEffect(() => {
    loadTabularExplanation(tabularRecordIndex);
  }, []);

  // ============================================================================
  // GRAD-CAM EXECUTION
  // ============================================================================
  const runGradCam = async (presetId, imgB64, targetClassIdx, cmap, opac) => {
    setExecutingGradCam(true);
    try {
      const res = await api.runVisualGradCam({
        presetId: imgB64 ? null : presetId || selectedPresetId,
        imageBase64: imgB64 || customImageBase64,
        targetClassIdx: targetClassIdx !== undefined ? targetClassIdx : selectedClassIdx,
        colormap: cmap || colormap,
        opacity: opac !== undefined ? opac : opacity,
      });
      setGradCamResult(res);
      if (res.targetClassIdx !== undefined) {
        setSelectedClassIdx(res.targetClassIdx);
      }
    } catch (err) {
      console.error('Grad-CAM failed:', err);
      toast?.error(err.message || 'Failed to compute Grad-CAM heatmap.');
    } finally {
      setExecutingGradCam(false);
    }
  };

  const handlePresetSelect = (pid) => {
    setSelectedPresetId(pid);
    setCustomImageBase64(null);
    setSelectedClassIdx(null);
    runGradCam(pid, null, null, colormap, opacity);
  };

  const handleCustomUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast?.error('Please upload an image file (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target.result;
      setCustomImageBase64(b64);
      setSelectedPresetId('');
      setSelectedClassIdx(null);
      runGradCam(null, b64, null, colormap, opacity);
      toast?.success('Custom image uploaded. Grad-CAM saliency computed.');
    };
    reader.readAsDataURL(file);
  };

  const handleColormapChange = (newCmap) => {
    setColormap(newCmap);
    runGradCam(selectedPresetId, customImageBase64, selectedClassIdx, newCmap, opacity);
  };

  const handleOpacityChange = (newOpac) => {
    setOpacity(newOpac);
    runGradCam(selectedPresetId, customImageBase64, selectedClassIdx, colormap, newOpac);
  };

  const handleClassSelect = (classIdx) => {
    setSelectedClassIdx(classIdx);
    runGradCam(selectedPresetId, customImageBase64, classIdx, colormap, opacity);
  };

  // ============================================================================
  // FORECAST ATTRIBUTION (SHAP & WATERFALL)
  // ============================================================================
  const runForecastAttribution = async (dsId, dCol, mCol, date) => {
    setLoadingXaiForecast(true);
    try {
      const res = await api.explainForecast({
        datasetId: dsId || selectedDatasetId,
        dateColumn: dCol || dateCol,
        metricColumn: mCol || metricCol,
        selectedDate: date || selectedForecastDate || null,
        horizonDays: 14,
      });
      setXaiForecastResult(res);
      if (res.xai?.targetDate) {
        setSelectedForecastDate(res.xai.targetDate);
      }
      // Reset what-if sliders
      setWhatIfTrendShift(0);
      setWhatIfSeasonalityScale(1.0);
    } catch (err) {
      console.error('Forecast attribution failed:', err);
      toast?.error(err.message || 'Failed to compute forecast attribution.');
    } finally {
      setLoadingXaiForecast(false);
    }
  };

  const handleForecastDatasetChange = (dsId) => {
    setSelectedDatasetId(dsId);
    const ds = forecastDatasets.find((d) => d.id === dsId);
    if (ds) {
      const nextDate = ds.defaultDateColumn || ds.dateColumns[0] || '';
      const nextMetric = ds.defaultMetricColumn || ds.metricColumns[0] || '';
      setDateCol(nextDate);
      setMetricCol(nextMetric);
      runForecastAttribution(dsId, nextDate, nextMetric, null);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedForecastDate(date);
    runForecastAttribution(selectedDatasetId, dateCol, metricCol, date);
  };

  // What-If Simulated Value calculation
  const simulatedWhatIfValue = useMemo(() => {
    if (!xaiForecastResult?.xai) return 0;
    const { baselineMean, waterfall, whatIfSensitivity } = xaiForecastResult.xai;
    const trendItem = waterfall.find((w) => w.name.includes('Trend'));
    const seasonalItem = waterfall.find((w) => w.name.includes('Seasonality'));
    const recencyItem = waterfall.find((w) => w.name.includes('Recency'));
    const residualItem = waterfall.find((w) => w.name.includes('Variance'));

    const baseTrend = trendItem?.value || 0;
    const baseSeasonal = seasonalItem?.value || 0;
    const baseRecency = recencyItem?.value || 0;
    const baseResidual = residualItem?.value || 0;

    const adjustedTrend = baseTrend * (1 + whatIfTrendShift / 100);
    const adjustedSeasonal = baseSeasonal * whatIfSeasonalityScale;

    return baselineMean + adjustedTrend + adjustedSeasonal + baseRecency + baseResidual;
  }, [xaiForecastResult, whatIfTrendShift, whatIfSeasonalityScale]);

  // ============================================================================
  // TABULAR LAKEHOUSE XAI
  // ============================================================================
  const loadTabularExplanation = async (recIdx) => {
    setLoadingTabularXai(true);
    try {
      const res = await api.explainTabular({
        datasetId: 'customer_churn_risk_telemetry.parquet',
        recordIndex: recIdx,
      });
      setTabularXaiResult(res);
      setTabularRecordIndex(recIdx);
    } catch (err) {
      console.error('Tabular XAI failed:', err);
    } finally {
      setLoadingTabularXai(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 antialiased">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Model Interpretability & Audit Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Explainable AI (XAI) Transparency Studio
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            Demystify black-box machine learning decisions. Inspect <strong>Grad-CAM visual saliency heatmaps</strong>{' '}
            for image-based telemetry and <strong>SHAP additive feature attributions</strong> for lakehouse forecasts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/predict')}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            Predictive AI Studio
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/ask')}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <Activity className="w-3.5 h-3.5 text-teal-500" />
            Ask Your Data
          </Button>
        </div>
      </div>

      {/* Main Navigation Tabs: Visual Grad-CAM vs Forecast SHAP vs Tabular */}
      <div className="flex items-center gap-2 p-1 bg-slate-100/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('visual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'visual'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-indigo-500" />
          <span>Visual AI: Grad-CAM Saliency</span>
          <Badge variant="info" size="xs">
            CNN
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('forecast')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'forecast'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-purple-500" />
          <span>Predictive AI: SHAP Waterfall</span>
          <Badge variant="purple" size="xs">
            Dual-Engine
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('tabular')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'tabular'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Database className="w-4 h-4 text-teal-500" />
          <span>Tabular Risk: Driver Attributions</span>
          <Badge variant="teal" size="xs">
            TreeSHAP
          </Badge>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: VISUAL AI & GRAD-CAM SALIENCY HEATMAPS */}
      {/* ==================================================================== */}
      {activeTab === 'visual' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Preset Selector Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {presets.map((p) => {
              const isSelected = selectedPresetId === p.id && !customImageBase64;
              return (
                <div
                  key={p.id}
                  onClick={() => handlePresetSelect(p.id)}
                  className={`cursor-pointer rounded-2xl p-3 border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={p.thumbnail}
                      alt={p.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-800 bg-slate-950"
                    />
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {p.category}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                        {p.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate font-mono">{p.datasetAssociation}</span>
                    {isSelected && (
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Custom Image Upload Dropzone */}
            <label
              className={`cursor-pointer rounded-2xl p-3 border-2 border-dashed transition-all flex flex-col items-center justify-center text-center group ${
                customImageBase64
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-indigo-400'
              }`}
            >
              <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
              <Upload className="w-6 h-6 text-indigo-500 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {customImageBase64 ? 'Custom Image Loaded' : 'Upload Inspection Asset'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WebP (Optical / Infrared)</span>
            </label>
          </div>

          {/* Main Inspection Canvas & Diagnostics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Image Canvas & Controls (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Convolutional Activation Canvas
                    </h3>
                  </div>

                  {/* View Mode Switcher */}
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                    <button
                      onClick={() => setViewMode('overlay')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                        viewMode === 'overlay'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Blended Overlay
                    </button>
                    <button
                      onClick={() => setViewMode('raw')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                        viewMode === 'raw'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Raw Image
                    </button>
                    <button
                      onClick={() => setViewMode('heatmap')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                        viewMode === 'heatmap'
                          ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Heatmap Only
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Canvas Display Frame */}
                  <div className="relative aspect-square max-w-md mx-auto rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-950 flex items-center justify-center">
                    {executingGradCam ? (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                        <span className="text-xs font-mono">Computing Grad-CAM Backprop...</span>
                      </div>
                    ) : gradCamResult ? (
                      <>
                        {/* Selected Image Layer */}
                        <img
                          src={
                            viewMode === 'raw'
                              ? gradCamResult.images.raw
                              : viewMode === 'heatmap'
                              ? gradCamResult.images.heatmap
                              : gradCamResult.images.overlay
                          }
                          alt="Grad-CAM Activation"
                          className="w-full h-full object-contain"
                        />

                        {/* Saliency Attention Bounding Box Overlay */}
                        {viewMode === 'overlay' && gradCamResult.boundingBox && (
                          <div
                            style={{
                              left: `${(gradCamResult.boundingBox.x / 320) * 100}%`,
                              top: `${(gradCamResult.boundingBox.y / 320) * 100}%`,
                              width: `${(gradCamResult.boundingBox.width / 320) * 100}%`,
                              height: `${(gradCamResult.boundingBox.height / 320) * 100}%`,
                            }}
                            className="absolute border-2 border-dashed border-amber-400/90 rounded-lg pointer-events-none transition-all shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                          >
                            <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-mono font-bold tracking-tight uppercase shadow-xs">
                              Saliency Hotspot (Peak {(gradCamResult.boundingBox.peakActivation * 100).toFixed(0)}%)
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Loading Grad-CAM...</span>
                    )}
                  </div>

                  {/* Interactive Controls Bar: Opacity & Colormap */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {/* Heatmap Alpha Opacity Slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                          Heatmap Alpha Opacity
                        </span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {Math.round(opacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.10"
                        max="0.90"
                        step="0.05"
                        value={opacity}
                        onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    {/* Colormap Palette Switcher */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          Colormap Gradient
                        </span>
                        <span className="font-mono text-slate-400 text-[11px] uppercase">{colormap}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {['jet', 'turbo', 'viridis', 'plasma'].map((cmap) => (
                          <button
                            key={cmap}
                            onClick={() => handleColormapChange(cmap)}
                            className={`py-1 text-[11px] font-bold rounded-lg border transition-all uppercase ${
                              colormap === cmap
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {cmap}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attention Coordinates & Receptive Field Telemetry */}
              {gradCamResult?.boundingBox && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Attention Focus</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                      {gradCamResult.explanation.focusQuadrant}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Centroid Coordinates</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 block">
                      [{gradCamResult.boundingBox.centroidX}, {gradCamResult.boundingBox.centroidY}]
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Surface Area Ratio</span>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono mt-0.5 block">
                      {gradCamResult.boundingBox.coveragePercent}% of frame
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Gradient Latency</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                      {gradCamResult.latencyMs} ms
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Model Decision Transparency & Class Discrimination (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Classification Confidence Distribution */}
              <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-500" />
                      Class-Discriminative Saliency Head
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Click any class below to inspect its unique backpropagated activation map:
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="pt-3 space-y-3">
                  {gradCamResult?.predictions?.map((pred) => {
                    const isWinning = pred.isPredicted;
                    const isSelected = pred.isSelected;
                    return (
                      <div
                        key={pred.classId}
                        onClick={() => handleClassSelect(pred.classId)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                          <span className="text-slate-900 dark:text-white flex items-center gap-1.5">
                            {isWinning && (
                              <Badge variant="danger" size="xs">
                                Top Prediction
                              </Badge>
                            )}
                            {pred.className}
                          </span>
                          <span className="font-mono text-indigo-600 dark:text-indigo-400">
                            {pred.probability}%
                          </span>
                        </div>

                        {/* Probability Progress Bar */}
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pred.probability}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${
                              isWinning
                                ? 'bg-gradient-to-r from-indigo-500 to-rose-500'
                                : 'bg-slate-400 dark:bg-slate-600'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* AI Transparency Audit Certificate */}
              {gradCamResult?.explanation && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Transparency Verification Report
                    </span>
                    <Badge variant={gradCamResult.explanation.badgeColor === 'red' ? 'danger' : 'success'} size="xs">
                      {gradCamResult.explanation.status}
                    </Badge>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {gradCamResult.explanation.headline}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {gradCamResult.explanation.summary}
                  </p>

                  <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40 flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white">Prescribed Action: </strong>
                      {gradCamResult.explanation.recommendation}
                    </div>
                  </div>

                  <div className="font-mono text-[10px] text-slate-400 pt-1">
                    {gradCamResult.explanation.auditStamp}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: PREDICTIVE FORECAST SHAP WATERFALL & DECOMPOSITION */}
      {/* ==================================================================== */}
      {activeTab === 'forecast' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Dataset & Parameter Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Dataset Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Lakehouse Parquet Dataset
                </label>
                <select
                  value={selectedDatasetId}
                  onChange={(e) => handleForecastDatasetChange(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  {forecastDatasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.displayName || d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Metric Column */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Target Metric
                </label>
                <span className="inline-block px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold">
                  {metricCol}
                </span>
              </div>

              {/* Date Focus Picker */}
              {xaiForecastResult?.xai?.availableDates && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Forecast Target Day (Local SHAP)
                  </label>
                  <select
                    value={selectedForecastDate}
                    onChange={(e) => handleDateSelect(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold text-slate-900 dark:text-white"
                  >
                    {xaiForecastResult.xai.availableDates.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => runForecastAttribution(selectedDatasetId, dateCol, metricCol, selectedForecastDate)}
              className="flex items-center gap-1.5 text-xs font-bold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingXaiForecast ? 'animate-spin' : ''}`} />
              Recalculate Attribution
            </Button>
          </div>

          {/* Forecast SHAP Waterfall & Feature Rankings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Waterfall Driver Attribution (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-indigo-500" />
                      SHAP Additive Waterfall Attribution
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Step-by-step feature forces driving baseline mean to final projected value for{' '}
                      <span className="font-mono text-indigo-500">{selectedForecastDate}</span>
                    </p>
                  </div>
                  <Badge variant="purple" size="xs">
                    Additive SHAP
                  </Badge>
                </CardHeader>

                <CardContent className="pt-4">
                  {loadingXaiForecast ? (
                    <div className="h-72 flex items-center justify-center text-slate-400 text-xs">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
                      Computing additive feature attributions...
                    </div>
                  ) : xaiForecastResult?.xai?.waterfall ? (
                    <div className="space-y-4">
                      {/* Bar Visualization of Waterfall */}
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={xaiForecastResult.xai.waterfall}
                            layout="vertical"
                            margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                            <XAxis
                              type="number"
                              tick={{ fontSize: 11, fill: '#94a3b8' }}
                              tickFormatter={(val) => val.toLocaleString()}
                            />
                            <YAxis
                              type="category"
                              dataKey="name"
                              width={140}
                              tick={{ fontSize: 10, fill: '#64748b' }}
                            />
                            <Tooltip
                              formatter={(value, name, item) => [
                                `${value > 0 ? '+' : ''}${value?.toLocaleString()} (${item.payload.type})`,
                                'Attribution Impact',
                              ]}
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '0.75rem',
                                color: '#f8fafc',
                                fontSize: '11px',
                              }}
                            />
                            <ReferenceLine x={0} stroke="#64748b" />
                            <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                              {xaiForecastResult.xai.waterfall.map((entry, index) => {
                                let fillColor = '#6366f1'; // base
                                if (entry.type === 'positive') fillColor = '#10b981'; // green
                                if (entry.type === 'negative') fillColor = '#ef4444'; // red
                                if (entry.type === 'total') fillColor = '#8b5cf6'; // purple
                                return <Cell key={`cell-${index}`} fill={fillColor} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legend */}
                      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-indigo-500"></span>
                          <span>Baseline Mean</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-emerald-500"></span>
                          <span>Positive Force (+)</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-rose-500"></span>
                          <span>Negative Dampener (-)</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-purple-500"></span>
                          <span>Final Prediction</span>
                        </span>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* What-If Counterfactual Sensitivity Simulator */}
              <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-slate-50/50 to-indigo-50/20 dark:from-slate-900 dark:to-indigo-950/20">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Compass className="w-4 h-4 text-purple-500" />
                        Counterfactual "What-If" Sensitivity Simulator
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Slide feature parameters to simulate how predictive trajectory shifts under shock conditions
                      </p>
                    </div>
                    <Badge variant="purple" size="xs">
                      Counterfactual
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Slider 1: Trend Shift */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Trend Velocity Drift
                        </span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {whatIfTrendShift > 0 ? '+' : ''}
                          {whatIfTrendShift}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-30"
                        max="30"
                        step="5"
                        value={whatIfTrendShift}
                        onChange={(e) => setWhatIfTrendShift(parseInt(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    {/* Slider 2: Seasonality Multiplier */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Seasonal Swing Intensity
                        </span>
                        <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                          {(whatIfSeasonalityScale * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={whatIfSeasonalityScale}
                        onChange={(e) => setWhatIfSeasonalityScale(parseFloat(e.target.value))}
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Simulated Result Callout */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Original Model Projection
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {xaiForecastResult?.xai?.projectedValue?.toLocaleString()}
                      </span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400" />

                    <div>
                      <span className="text-[10px] text-purple-500 uppercase tracking-wider block font-bold">
                        Simulated What-If Projection
                      </span>
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400 text-sm">
                        {Math.round(simulatedWhatIfValue).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Variance Delta</span>
                      <span
                        className={`font-mono font-bold text-xs ${
                          simulatedWhatIfValue >= (xaiForecastResult?.xai?.projectedValue || 0)
                            ? 'text-emerald-500'
                            : 'text-rose-500'
                        }`}
                      >
                        {simulatedWhatIfValue >= (xaiForecastResult?.xai?.projectedValue || 0) ? '+' : ''}
                        {(
                          ((simulatedWhatIfValue - (xaiForecastResult?.xai?.projectedValue || 0)) /
                            (xaiForecastResult?.xai?.projectedValue || 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Global Feature Importance & Narrative (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Feature Importance Card */}
              <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Global Feature Importance Weight
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Mean absolute contribution across full 14-day projection horizon
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="pt-3 space-y-3">
                  {xaiForecastResult?.xai?.featureImportance?.map((feat) => (
                    <div
                      key={feat.feature}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-900 dark:text-white">{feat.feature}</span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400">{feat.importance}%</span>
                      </div>

                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${feat.importance}%` }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        />
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{feat.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Model Diagnostics Summary */}
              {xaiForecastResult?.forecastDetails?.narrative && (
                <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Model Selected: {xaiForecastResult.forecastDetails.selectedModel}
                    </span>
                    <Badge variant="success" size="xs">
                      Validated
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {xaiForecastResult.forecastDetails.narrative.summary}
                  </p>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between font-mono">
                    <span>Validation MAPE: {xaiForecastResult.forecastDetails.metrics.mape}%</span>
                    <span>RMSE: {xaiForecastResult.forecastDetails.metrics.rmse}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: TABULAR LAKEHOUSE RISK & ANOMALY EXPLAINABILITY */}
      {/* ==================================================================== */}
      {activeTab === 'tabular' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-teal-500" />
                  Tabular Lakehouse Driver Attribution (TreeSHAP)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Instance-level explainability for{' '}
                  <span className="font-mono text-teal-600 dark:text-teal-400">
                    customer_churn_risk_telemetry.parquet
                  </span>
                </p>
              </div>

              {/* Record Selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold">Inspect Record:</span>
                {[0, 1, 2, 3, 4].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => loadTabularExplanation(idx)}
                    className={`w-7 h-7 rounded-lg font-mono font-bold transition-all ${
                      tabularRecordIndex === idx
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    #{idx + 1}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-6">
              {loadingTabularXai ? (
                <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-teal-500 mr-2" />
                  Fitting TreeSHAP model across parquet partitions...
                </div>
              ) : tabularXaiResult ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Waterfall Attribution Chart */}
                  <div className="lg:col-span-7 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Local Feature Contributions (Delta to Baseline Risk)
                    </h4>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={tabularXaiResult.localWaterfall}
                          layout="vertical"
                          margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={140}
                            tick={{ fontSize: 10, fill: '#64748b' }}
                          />
                          <Tooltip
                            formatter={(value) => [`${value}%`, 'Risk Contribution']}
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              border: '1px solid #334155',
                              borderRadius: '0.75rem',
                              color: '#f8fafc',
                              fontSize: '11px',
                            }}
                          />
                          <ReferenceLine x={0} stroke="#64748b" />
                          <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                            {tabularXaiResult.localWaterfall.map((entry, index) => {
                              let fillColor = '#0d9488'; // base teal
                              if (entry.type === 'positive') fillColor = '#ef4444'; // risk positive
                              if (entry.type === 'negative') fillColor = '#10b981'; // risk dampener
                              if (entry.type === 'total') fillColor = '#6366f1';
                              return <Cell key={`cell-tab-${index}`} fill={fillColor} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right Column: Global Importance & Record Breakdown */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                          Predicted Risk Score
                        </span>
                        <Badge
                          variant={tabularXaiResult.predictedRiskScore > 50 ? 'danger' : 'success'}
                          size="xs"
                        >
                          {tabularXaiResult.predictedRiskScore > 50 ? 'CRITICAL RISK' : 'LOW RISK'}
                        </Badge>
                      </div>
                      <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                        {tabularXaiResult.predictedRiskScore}%
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Baseline Population Risk: {tabularXaiResult.baselineRiskScore}%
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                        Global Feature Importance (Random Forest MDI)
                      </h5>
                      {tabularXaiResult.globalFeatureImportance?.map((f) => (
                        <div
                          key={f.feature}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800"
                        >
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{f.feature}</span>
                          <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                            {f.importance}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ExplainableAiPage;
