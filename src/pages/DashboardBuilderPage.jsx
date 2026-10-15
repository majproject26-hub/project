import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  LayoutGrid,
  Plus,
  RefreshCw,
  Eye,
  Lock,
  Globe,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  Maximize2,
  BarChart3,
  Check,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
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
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export function DashboardBuilderPage() {
  const { currentUser, currentCompany } = useAuth();
  const { dashboards, charts, addDashboard, updateDashboard, deleteDashboard } = useData();
  const { toast } = useToast();

  const role = currentUser ? currentUser.role : 'STAFF';

  // All roles are directed to the main comprehensive Dashboard
  return <Navigate to="/dashboard" replace />;

  const canEdit = role === 'ADMIN' || role === 'HR';

  const [activeDashId, setActiveDashId] = useState(dashboards[0]?.id || '');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(30);

  // Modals
  const [newDashModalOpen, setNewDashModalOpen] = useState(false);
  const [addChartModalOpen, setAddChartModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // New Dashboard Form
  const [newDashName, setNewDashName] = useState('');
  const [newDashDesc, setNewDashDesc] = useState('');
  const [newDashVisibility, setNewDashVisibility] = useState('Company-wide');
  const [newDashRefresh, setNewDashRefresh] = useState('30 seconds');

  const activeDashboard = dashboards.find((d) => d.id === activeDashId) || dashboards[0];

  // Refresh timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          triggerDataRefresh();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerDataRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleCreateDashboard = (e) => {
    e.preventDefault();
    if (!newDashName.trim()) return;

    const created = addDashboard({
      name: newDashName,
      description: newDashDesc || 'Custom analytics dashboard.',
      visibility: newDashVisibility,
      refreshInterval: newDashRefresh,
      chartIds: charts.slice(0, 2).map((c) => c.id),
      tiles: charts.slice(0, 2).map((c) => ({
        chartId: c.id,
        colSpan: 'col-span-12 lg:col-span-6',
      })),
    });

    setActiveDashId(created.id);
    setNewDashModalOpen(false);
    setNewDashName('');
    setNewDashDesc('');
    toast({
      title: 'Dashboard Created',
      message: `"${created.name}" is now live.`,
      type: 'success',
    });
  };

  const handleAddChartToActive = (chartId) => {
    if (!activeDashboard) return;
    const currentChartIds = activeDashboard.chartIds || [];
    if (currentChartIds.includes(chartId)) {
      toast({
        title: 'Already on Dashboard',
        message: 'This visualization tile is already present.',
        type: 'info',
      });
      return;
    }

    const updatedChartIds = [...currentChartIds, chartId];
    const updatedTiles = [
      ...(activeDashboard.tiles || []),
      { chartId, colSpan: 'col-span-12 lg:col-span-6' },
    ];

    updateDashboard(activeDashboard.id, {
      chartIds: updatedChartIds,
      tiles: updatedTiles,
    });

    setAddChartModalOpen(false);
    toast({
      title: 'Tile Added',
      message: 'Chart tile added to dashboard layout.',
      type: 'success',
    });
  };

  const handleRemoveTile = (chartId) => {
    if (!activeDashboard || !canEdit) return;
    const updatedChartIds = (activeDashboard.chartIds || []).filter((id) => id !== chartId);
    const updatedTiles = (activeDashboard.tiles || []).filter((t) => t.chartId !== chartId);

    updateDashboard(activeDashboard.id, {
      chartIds: updatedChartIds,
      tiles: updatedTiles,
    });

    toast({
      title: 'Tile Removed',
      message: 'Chart removed from dashboard view.',
      type: 'info',
    });
  };

  const handleToggleTileWidth = (chartId) => {
    if (!activeDashboard || !canEdit) return;
    const updatedTiles = (activeDashboard.tiles || []).map((t) => {
      if (t.chartId === chartId) {
        const nextSpan = t.colSpan.includes('lg:col-span-6')
          ? 'col-span-12'
          : 'col-span-12 lg:col-span-6';
        return { ...t, colSpan: nextSpan };
      }
      return t;
    });

    updateDashboard(activeDashboard.id, { tiles: updatedTiles });
  };

  const handleDeleteActiveDashboard = () => {
    if (!activeDashboard) return;
    deleteDashboard(activeDashboard.id);
    setDeleteConfirmOpen(false);
    const remaining = dashboards.filter((d) => d.id !== activeDashboard.id);
    if (remaining.length > 0) {
      setActiveDashId(remaining[0].id);
    }
    toast({
      title: 'Dashboard Deleted',
      message: 'Dashboard layout removed.',
      type: 'success',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Dashboard Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {activeDashboard?.name || 'Dashboards'}
            </h1>
            <Badge variant="primary" size="xs">
              {activeDashboard?.visibility === 'Private' ? 'Private' : 'Company-wide'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {activeDashboard?.description || 'Custom interactive data views.'}
          </p>
        </div>

        {/* Dashboard Switcher Tabs & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh indicator */}
          <button
            onClick={() => {
              triggerDataRefresh();
              setRefreshCountdown(30);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Manual refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-500' : ''}`} />
            <span>Refreshes in {refreshCountdown}s</span>
          </button>

          {canEdit && (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={() => setAddChartModalOpen(true)}
              >
                Add Chart Tile
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={LayoutGrid}
                onClick={() => setNewDashModalOpen(true)}
              >
                New Dashboard
              </Button>
            </>
          )}

          {canEdit && dashboards.length > 1 && (
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setDeleteConfirmOpen(true)}
              title="Delete dashboard"
            />
          )}
        </div>
      </div>

      {/* Dashboard Selection Pill Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1">
        {dashboards.map((db) => {
          const isActive = db.id === activeDashboard?.id;
          return (
            <button
              key={db.id}
              onClick={() => setActiveDashId(db.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>{db.name}</span>
              <span className={`text-[10px] opacity-80 ${isActive ? 'text-sky-200' : 'text-slate-400'}`}>
                ({db.chartIds?.length || 0})
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of Chart Tiles */}
      <div className="grid grid-cols-12 gap-6">
        {activeDashboard?.tiles && activeDashboard.tiles.length > 0 ? (
          activeDashboard.tiles.map((tile, idx) => {
            const chartObj = charts.find((c) => c.id === tile.chartId);
            if (!chartObj) return null;

            return (
              <div
                key={tile.chartId || idx}
                className={`${tile.colSpan || 'col-span-12 lg:col-span-6'} transition-all`}
              >
                <Card className="p-5 h-full flex flex-col justify-between">
                  <div>
                    {/* Tile Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {chartObj.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {chartObj.subtitle || `Source: ${chartObj.datasetName}`}
                        </p>
                      </div>

                      {canEdit && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleTileWidth(chartObj.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Toggle Full Width / Half Width"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveTile(chartObj.id)}
                            className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Remove Tile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Chart Canvas */}
                    <div className="h-64 w-full pt-2">
                      {(!chartObj.data || !Array.isArray(chartObj.data) || chartObj.data.length === 0) ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                          No data points configured for this tile
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          {chartObj.chartType === 'line' ? (
                            <LineChart data={chartObj.data || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                              <XAxis dataKey={chartObj.xAxis || 'name'} tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip />
                              <Line type="monotone" dataKey={chartObj.yAxis || 'value'} stroke="#4D5A2A" strokeWidth={2.5} dot={{ r: 3 }} />
                            </LineChart>
                          ) : chartObj.chartType === 'pie' ? (
                            <PieChart>
                              <Pie data={chartObj.data || []} dataKey={chartObj.yAxis || 'value'} nameKey={chartObj.xAxis || 'name'} cx="50%" cy="50%" outerRadius={75}>
                                {(chartObj.data || []).map((_, i) => (
                                  <Cell key={i} fill={['#4D5A2A', '#748447', '#DCE4C2', '#25291D', '#93A65E'][i % 5]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend wrapperStyle={{ fontSize: '10px' }} />
                            </PieChart>
                          ) : (
                            <BarChart data={chartObj.data || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                              <XAxis dataKey={chartObj.xAxis || 'name'} tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip />
                              <Bar dataKey={chartObj.yAxis || 'value'} fill="#748447" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Tile Bottom status */}
                  <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                    <span className="font-mono">{chartObj.datasetName}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-teal-400" />
                      <span>Live Cache</span>
                    </span>
                  </div>
                </Card>
              </div>
            );
          })
        ) : (
          <div className="col-span-12 py-12">
            <Card className="p-8 text-center space-y-3">
              <BarChart3 className="w-10 h-10 mx-auto text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No Visualization Tiles in this Dashboard
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click "Add Chart Tile" to choose from your saved charts and add them to this dashboard.
              </p>
              {canEdit && (
                <Button size="sm" onClick={() => setAddChartModalOpen(true)}>
                  Add Chart Tile
                </Button>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Modal: Create New Dashboard */}
      <Modal
        isOpen={newDashModalOpen}
        onClose={() => setNewDashModalOpen(false)}
        title="Create New Dashboard"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateDashboard} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Dashboard Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newDashName}
              onChange={(e) => setNewDashName(e.target.value)}
              placeholder="e.g. Q4 Executive Operations"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={newDashDesc}
              onChange={(e) => setNewDashDesc(e.target.value)}
              placeholder="Brief summary of metrics displayed"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Visibility
              </label>
              <select
                value={newDashVisibility}
                onChange={(e) => setNewDashVisibility(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Company-wide">Company-wide</option>
                <option value="Private">Private (Author Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Refresh Cadence
              </label>
              <select
                value={newDashRefresh}
                onChange={(e) => setNewDashRefresh(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="5 seconds">5 seconds</option>
                <option value="30 seconds">30 seconds</option>
                <option value="1 minute">1 minute</option>
                <option value="5 minutes">5 minutes</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setNewDashModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Dashboard
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Saved Chart to Active Dashboard */}
      <Modal
        isOpen={addChartModalOpen}
        onClose={() => setAddChartModalOpen(false)}
        title="Add Saved Chart to Dashboard"
        maxWidth="max-w-md"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select a saved organization visualization to insert as a tile:
          </p>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {charts.map((c) => {
              const alreadyAdded = (activeDashboard?.chartIds || []).includes(c.id);
              return (
                <div
                  key={c.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{c.title}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">{c.datasetName}</p>
                  </div>

                  <Button
                    size="xs"
                    variant={alreadyAdded ? 'secondary' : 'primary'}
                    disabled={alreadyAdded}
                    onClick={() => handleAddChartToActive(c.id)}
                  >
                    {alreadyAdded ? 'Added' : 'Add Tile'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Dashboard Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteActiveDashboard}
        title={`Delete "${activeDashboard?.name}"?`}
        message="Are you sure you want to delete this dashboard view? This does not delete the underlying datasets or charts."
      />
    </div>
  );
}
