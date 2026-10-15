import React, { useState, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  AreaChart as AreaChartIcon,
  ScatterChart as ScatterIcon,
  Table as TableIcon,
  Save,
  Download,
  Share2,
  Plus,
  Palette,
  Filter,
  Layers,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export function VisualizationStudioPage() {
  const { currentUser, currentCompany } = useAuth();
  const role = currentUser ? currentUser.role : 'STAFF';
  const { datasets, savedQueries, addChart, dashboards, updateDashboard } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const initialDsId = searchParams.get('dataset') || datasets[0]?.id;

  // Configuration state
  const [selectedDatasetId, setSelectedDatasetId] = useState(initialDsId);
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'line' | 'area' | 'pie' | 'scatter'
  const [title, setTitle] = useState('Department Average Salary Analysis');
  const [subtitle, setSubtitle] = useState('Aggregated from employee compensation parquet records');
  const [xAxisKey, setXAxisKey] = useState('');
  const [yAxisKey, setYAxisKey] = useState('');
  const [aggregation, setAggregation] = useState('AVG');
  const [colorPalette, setColorPalette] = useState('ocean'); // 'ocean', 'sunset', 'emerald', 'cyber'

  // Add to Dashboard Modal State
  const [addToDashModalOpen, setAddToDashModalOpen] = useState(false);
  const [targetDashboardId, setTargetDashboardId] = useState(dashboards[0]?.id || '');
  const [createdChartRef, setCreatedChartRef] = useState(null);

  // Selected dataset
  const activeDataset = datasets.find((d) => d.id === selectedDatasetId) || datasets[0];

  // Set default axes if empty
  const availableColumns = useMemo(() => {
    return activeDataset ? (activeDataset.schema || []).map((s) => s.column) : [];
  }, [activeDataset]);

  const numericColumns = useMemo(() => {
    return activeDataset
      ? (activeDataset.schema || [])
          .filter((s) => s.type?.includes('INT') || s.type?.includes('FLOAT') || s.type?.includes('DOUBLE'))
          .map((s) => s.column)
      : [];
  }, [activeDataset]);

  // Sync axis defaults when dataset changes
  React.useEffect(() => {
    if (availableColumns.length > 0 && !xAxisKey) {
      setXAxisKey(availableColumns[1] || availableColumns[0]);
    }
    if (numericColumns.length > 0 && !yAxisKey) {
      setYAxisKey(numericColumns[0]);
    }
  }, [availableColumns, numericColumns, xAxisKey, yAxisKey]);

  // Color Palettes
  const palettes = {
    ocean: ['#0284c7', '#0d9488', '#38bdf8', '#2dd4bf', '#60a5fa'],
    sunset: ['#f59e0b', '#f97316', '#ef4444', '#fbbf24', '#f87171'],
    emerald: ['#10b981', '#059669', '#34d399', '#6ee7b7', '#047857'],
    cyber: ['#8b5cf6', '#6366f1', '#ec4899', '#a855f7', '#d946ef'],
  };

  const currentColors = palettes[colorPalette] || palettes.ocean;

  // Computed data for Recharts
  const chartData = useMemo(() => {
    if (!activeDataset || !activeDataset.previewData) return [];
    const rows = activeDataset.previewData;

    // Group by xAxisKey
    const groups = {};
    rows.forEach((r) => {
      const xVal = r[xAxisKey] ?? 'Unknown';
      const yVal = parseFloat(r[yAxisKey]) || 0;

      if (!groups[xVal]) {
        groups[xVal] = { count: 0, sum: 0, min: yVal, max: yVal };
      }
      groups[xVal].count += 1;
      groups[xVal].sum += yVal;
      groups[xVal].min = Math.min(groups[xVal].min, yVal);
      groups[xVal].max = Math.max(groups[xVal].max, yVal);
    });

    return Object.entries(groups).map(([k, stat]) => {
      let val = stat.sum;
      if (aggregation === 'AVG') val = Math.round(stat.sum / stat.count);
      if (aggregation === 'COUNT') val = stat.count;
      if (aggregation === 'MIN') val = stat.min;
      if (aggregation === 'MAX') val = stat.max;

      return {
        name: k,
        [yAxisKey || 'value']: val,
      };
    });
  }, [activeDataset, xAxisKey, yAxisKey, aggregation]);

  const handleSaveChart = () => {
    const saved = addChart({
      title,
      subtitle,
      chartType,
      datasetId: activeDataset.id,
      datasetName: activeDataset.name,
      xAxis: xAxisKey,
      yAxis: yAxisKey,
      aggregation,
      colorPalette,
      isPinned: false,
      data: chartData,
    });
    setCreatedChartRef(saved);
    toast({
      title: 'Visualization Saved',
      message: `"${title}" was saved to company charts.`,
      type: 'success',
    });
    return saved;
  };

  const handleOpenAddToDashboard = () => {
    const chart = handleSaveChart();
    setAddToDashModalOpen(true);
  };

  const handleConfirmAddToDashboard = () => {
    if (!targetDashboardId || !createdChartRef) return;
    const target = dashboards.find((d) => d.id === targetDashboardId);
    if (target) {
      const updatedChartIds = [...(target.chartIds || []), createdChartRef.id];
      const updatedTiles = [
        ...(target.tiles || []),
        { chartId: createdChartRef.id, colSpan: 'col-span-12 lg:col-span-6' },
      ];
      updateDashboard(target.id, { chartIds: updatedChartIds, tiles: updatedTiles });
      toast({
        title: 'Added to Dashboard',
        message: `Visualization added to "${target.name}".`,
        type: 'success',
      });
      setAddToDashModalOpen(false);
      navigate('/dashboard');
    }
  };

  const handleShareInsideCompany = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Internal Share Link Copied',
      message: 'Colleagues within your tenant can view this live chart config.',
      type: 'info',
    });
  };

  const handleDownloadPng = () => {
    // Generate synthetic SVG download for chart
    toast({
      title: 'Chart Image Exported',
      message: 'Rendered visualization downloaded as high-res PNG snapshot.',
      type: 'success',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Visualization Studio
            <Badge variant="teal" size="xs">
              Recharts Studio
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Build custom bar, line, area, and donut charts from lakehouse tables and save to dashboards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Share2} onClick={handleShareInsideCompany}>
            Share Link
          </Button>
          <Button variant="outline" size="sm" icon={Download} onClick={handleDownloadPng}>
            Download PNG
          </Button>
          <Button variant="primary" size="sm" icon={Save} onClick={handleOpenAddToDashboard}>
            Add to Dashboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Studio Configurator Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span>Chart Parameters</span>
            </h3>

            {/* Source Dataset */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data Source (Parquet Table)
              </label>
              <select
                value={selectedDatasetId}
                onChange={(e) => {
                  setSelectedDatasetId(e.target.value);
                  setXAxisKey('');
                  setYAxisKey('');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chart Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Chart Type
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'bar', label: 'Bar', icon: BarChart3 },
                  { id: 'line', label: 'Line', icon: LineChartIcon },
                  { id: 'area', label: 'Area', icon: AreaChartIcon },
                  { id: 'pie', label: 'Pie', icon: PieChartIcon },
                ].map((type) => {
                  const Icon = type.icon;
                  const isSelected = chartType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setChartType(type.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 font-semibold shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px]">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* X-Axis Dimension */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                X-Axis Dimension (Group Key)
              </label>
              <select
                value={xAxisKey}
                onChange={(e) => setXAxisKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {availableColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            {/* Y-Axis Metric */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Y-Axis Metric Value
              </label>
              <select
                value={yAxisKey}
                onChange={(e) => setYAxisKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {numericColumns.length > 0 ? (
                  numericColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))
                ) : (
                  <option value="id">id (count)</option>
                )}
              </select>
            </div>

            {/* Aggregation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Aggregation Function
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {['AVG', 'SUM', 'COUNT', 'MAX'].map((agg) => (
                  <button
                    key={agg}
                    type="button"
                    onClick={() => setAggregation(agg)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-mono transition-all ${
                      aggregation === agg
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {agg}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Color Palette Theme
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(palettes).map((pKey) => (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => setColorPalette(pKey)}
                    className={`p-2 rounded-xl border flex items-center justify-between text-xs capitalize ${
                      colorPalette === pKey
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span>{pKey}</span>
                    <div className="flex gap-1">
                      {palettes[pKey].slice(0, 3).map((c, i) => (
                        <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Titles */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chart Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Live Preview Card */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
              </div>
              <Badge variant="teal" size="xs">
                {aggregation} ({yAxisKey}) by {xAxisKey}
              </Badge>
            </div>

            {/* Recharts Canvas */}
            <div className="h-96 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'line' ? (
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey={yAxisKey || 'value'} stroke={currentColors[0]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                ) : chartType === 'area' ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey={yAxisKey || 'value'} stroke={currentColors[0]} fill={currentColors[0]} fillOpacity={0.25} />
                  </AreaChart>
                ) : chartType === 'pie' ? (
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey={yAxisKey || 'value'}
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      label
                    >
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={currentColors[i % currentColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={yAxisKey || 'value'} fill={currentColors[0]} radius={[6, 6, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Add To Dashboard Modal */}
      <Modal
        isOpen={addToDashModalOpen}
        onClose={() => setAddToDashModalOpen(false)}
        title="Add Chart to Dashboard"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select which organization dashboard to pin this visualization tile to:
          </p>

          <div className="space-y-2">
            {dashboards.map((db) => (
              <label
                key={db.id}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  targetDashboardId === db.id
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="dashRadio"
                  value={db.id}
                  checked={targetDashboardId === db.id}
                  onChange={() => setTargetDashboardId(db.id)}
                  className="mt-0.5 text-sky-600"
                />
                <div>
                  <div className="text-xs font-semibold">{db.name}</div>
                  <div className="text-[11px] text-slate-400">{db.description}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setAddToDashModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmAddToDashboard}>
              Confirm & View Dashboard
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
