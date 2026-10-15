import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Database,
  Layers,
  HardDrive,
  Activity,
  Users,
  UploadCloud,
  MessageSquareCode,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  FileSpreadsheet,
  Terminal,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export function DashboardPage() {
  const { currentUser, currentCompany, users } = useAuth();
  const { datasets, charts, auditLogs, savedQueries } = useData();

  const role = currentUser ? currentUser.role : 'STAFF';
  const companyId = currentUser ? currentUser.companyId : 'ACME-001';

  // Metrics computation
  const totalDatasets = datasets.length;
  const totalRows = datasets.reduce((acc, d) => acc + (d.rowCount || 0), 0);
  const totalStorageMB = datasets.reduce((acc, d) => {
    const sizeNum = parseFloat(d.size) || 0;
    return acc + sizeNum;
  }, 0).toFixed(1);

  const pendingUsers = users.filter((u) => u.companyId === companyId && u.status === 'PENDING');
  const activeUsersCount = users.filter((u) => u.companyId === companyId && u.status === 'ACTIVE').length;

  // Recharts Chart Data
  const uploadsOverTime = [
    { date: 'May', uploads: 2, rows: 28000 },
    { date: 'Jun', uploads: 3, rows: 45000 },
    { date: 'Jul', uploads: 4, rows: 62000 },
    { date: 'Aug', uploads: 6, rows: 89000 },
    { date: 'Sep', uploads: 8, rows: 142000 },
    { date: 'Oct', uploads: 11, rows: totalRows },
  ];

  const queriesPerDay = [
    { day: 'Mon', count: 142 },
    { day: 'Tue', count: 189 },
    { day: 'Wed', count: 230 },
    { day: 'Thu', count: 195 },
    { day: 'Fri', count: 284 },
    { day: 'Sat', count: 85 },
    { day: 'Sun', count: 62 },
  ];



  const pinnedCharts = charts.filter((c) => c.isPinned);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-sky-500/10 via-teal-500/5 to-transparent pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome back, {currentUser?.name}
            </h1>
            <Badge variant={role} size="xs">{role}</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            {currentCompany?.name} • Lakehouse Cluster <span className="font-mono text-teal-300">ONLINE</span> • 100% Data Isolation Active
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10">
          <NavLink to="/ask">
            <Button variant="secondary" size="sm" icon={MessageSquareCode}>
              Ask Your Data
            </Button>
          </NavLink>
          <NavLink to="/upload">
            <Button variant="primary" size="sm" icon={UploadCloud}>
              Upload Dataset
            </Button>
          </NavLink>
        </div>
      </div>

      {/* Admin Quick Action Alert Banner for Pending Approvals */}
      {role === 'ADMIN' && pendingUsers.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">
                {pendingUsers.length} Registration Request{pendingUsers.length > 1 ? 's' : ''} Awaiting Your Approval
              </h4>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                New applicants are waiting to join {currentCompany?.id}. Review roles and approve or reject access.
              </p>
            </div>
          </div>
          <NavLink to="/users">
            <Button variant="outline" size="sm" className="border-amber-400 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60" icon={ArrowRight} iconPosition="right">
              Review Users
            </Button>
          </NavLink>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <Card hover className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Datasets</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {totalDatasets}
          </div>
          <div className="text-[11px] text-teal-600 dark:text-teal-400 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>100% Parquet optimized</span>
          </div>
        </Card>

        {/* KPI 2 */}
        <Card hover className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Total Rows Ingested</span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {totalRows.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Across {totalDatasets} tables
          </div>
        </Card>

        {/* KPI 3 */}
        <Card hover className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Lakehouse Storage</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {totalStorageMB} MB
          </div>
          <div className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
            ~70% compression ratio
          </div>
        </Card>

        {/* KPI 4 */}
        <Card hover className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Queries Executed</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            1,187
          </div>
          <div className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">
            Avg latency: 142ms
          </div>
        </Card>

        {/* KPI 5 */}
        <Card hover className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Active Team</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {activeUsersCount} Users
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {pendingUsers.length} pending review
          </div>
        </Card>
      </div>

      {/* Main Chart: Datasets & Rows Ingested over time (Line) */}
      <Card>
        <CardHeader
          title="Dataset Ingestion & Row Volume Growth"
          subtitle="Monthly cumulative records transformed into Parquet"
          action={
            <Badge variant="teal" size="xs">
              +38% vs Q2
            </Badge>
          }
        />
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={uploadsOverTime} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  borderRadius: '12px',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line
                type="monotone"
                dataKey="rows"
                name="Total Rows"
                stroke="#4D5A2A"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="uploads"
                name="Datasets Uploaded"
                stroke="#748447"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pinned Charts Section */}
      {pinnedCharts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Pinned Organization Charts
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pinnedCharts.map((ch) => (
              <Card key={ch.id} className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{ch.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{ch.subtitle}</p>
                  </div>
                  <Badge variant="primary" size="xs">
                    {ch.datasetName}
                  </Badge>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    {ch.chartType === 'line' ? (
                      <LineChart data={ch.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey={ch.xAxis} tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey={ch.yAxis} stroke="#4D5A2A" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    ) : ch.chartType === 'pie' ? (
                      <PieChart>
                        <Pie data={ch.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                          {ch.data.map((_, i) => (
                            <Cell key={i} fill={['#4D5A2A', '#748447', '#DCE4C2', '#25291D'][i % 4]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    ) : (
                      <BarChart data={ch.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey={ch.xAxis} tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey={ch.yAxis} fill="#748447" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Grids: Recent Datasets & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Uploads Table */}
        <Card>
          <CardHeader
            title="Recent Datasets"
            subtitle="Latest columnar tables registered in lakehouse"
            action={
              <NavLink to="/datasets" className="text-xs text-sky-600 hover:text-sky-500 font-medium">
                View all ({totalDatasets})
              </NavLink>
            }
          />
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {datasets.slice(0, 4).map((d) => (
                <NavLink
                  key={d.id}
                  to={`/datasets/${d.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors font-mono">
                        {d.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {d.rowCount.toLocaleString()} rows • {d.size} • {d.format}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={d.accessLevel === 'All' ? 'default' : 'primary'} size="xs">
                      {d.accessLevel}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
                  </div>
                </NavLink>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity & Audit Stream */}
        <Card>
          <CardHeader
            title="Audit & Activity Feed"
            subtitle="Immutable events within tenant partition"
            action={
              role === 'ADMIN' ? (
                <NavLink to="/audit" className="text-xs text-sky-600 hover:text-sky-500 font-medium">
                  Full Audit Log
                </NavLink>
              ) : null
            }
          />
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.slice(0, 4).map((a) => (
                <div key={a.id} className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {a.action}
                      </span>
                      <span className="text-[10px] text-slate-400">{a.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {a.details}
                    </p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                      <span>By {a.userName}</span>
                      <span>•</span>
                      <span className="font-mono">{a.userRole}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
