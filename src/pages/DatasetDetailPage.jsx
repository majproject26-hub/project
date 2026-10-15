import React, { useState } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import {
  Database,
  ArrowLeft,
  Terminal,
  BarChart3,
  Download,
  Trash2,
  Clock,
  Layers,
  Shield,
  FileSpreadsheet,
  CheckCircle2,
  HardDrive,
  Cpu,
  Share2,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Tabs } from '../components/common/Tabs';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';

export function DatasetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, currentCompany } = useAuth();
  const { datasets, deleteDataset, updateDataset } = useData();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedAccessLevel, setSelectedAccessLevel] = useState(null);

  const role = currentUser ? currentUser.role : 'STAFF';
  const isAdmin = role === 'ADMIN';

  // Find dataset
  const dataset = datasets.find((d) => d.id === id);

  const isUploader =
    Boolean(dataset?.uploaderName && currentUser?.name && dataset.uploaderName.toLowerCase() === currentUser.name.toLowerCase()) ||
    Boolean(dataset?.uploaderId && currentUser?.id && dataset.uploaderId === currentUser.id) ||
    Boolean(dataset?.uploaderEmail && currentUser?.email && dataset.uploaderEmail.toLowerCase() === currentUser.email.toLowerCase());
  const canDelete = isAdmin || isUploader;

  if (!dataset) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          icon={Database}
          title="Dataset Not Found"
          description="The requested dataset could not be found or you do not have permission to view it."
          actionLabel="Return to Datasets"
          onAction={() => navigate('/datasets')}
        />
      </div>
    );
  }

  const currentAccess = selectedAccessLevel || dataset.accessLevel;

  const handleUpdateAccess = () => {
    if (!isAdmin) return;
    updateDataset(dataset.id, { accessLevel: currentAccess });
    toast({
      title: 'Access Rules Saved',
      message: `Updated permissions for ${dataset.name} to "${currentAccess}".`,
      type: 'success',
    });
  };

  const handleDownloadCsv = () => {
    if (!dataset.previewData || dataset.previewData.length === 0) return;
    const headers = Object.keys(dataset.previewData[0]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...dataset.previewData.map((row) => headers.map((h) => `"${row[h] ?? ''}"`).join(','))].join(
        '\n'
      );
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', dataset.name.replace('.parquet', '.csv'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Complete',
      message: `Downloaded ${dataset.name} as CSV.`,
      type: 'info',
    });
  };

  const handleDelete = () => {
    deleteDataset(dataset.id);
    navigate('/datasets');
    toast({
      title: 'Dataset Deleted',
      message: `${dataset.name} was permanently removed.`,
      type: 'success',
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'schema', label: 'Schema', badge: dataset.schema?.length || 0 },
    { id: 'preview', label: 'Data Preview', badge: dataset.previewData?.length || 0 },
    { id: 'stats', label: 'Column Statistics' },
    { id: 'history', label: 'Version History', badge: dataset.history?.length || 0 },
    { id: 'access', label: 'Access Settings' },
  ];

  // Schema table columns definition
  const schemaColumns = [
    {
      header: 'Column Name',
      key: 'column',
      render: (val) => <span className="font-mono font-semibold text-sky-600 dark:text-sky-400">{val}</span>,
    },
    {
      header: 'SQL Data Type',
      key: 'type',
      render: (val) => (
        <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {val}
        </span>
      ),
    },
    { header: 'Null Count', key: 'nullCount', render: (val) => <span className="font-mono">{val}</span> },
    { header: 'Null %', key: 'nullPct', render: (val) => <span className="font-mono text-slate-500">{val}</span> },
    {
      header: 'Unique Values',
      key: 'uniqueCount',
      render: (val) => <span className="font-mono">{val?.toLocaleString()}</span>,
    },
    {
      header: 'Sample Value',
      key: 'sample',
      render: (val) => <span className="font-mono text-slate-600 dark:text-slate-400 truncate max-w-xs block">{val}</span>,
    },
  ];

  // Preview table columns dynamic definition
  const previewColumns = dataset.previewData && dataset.previewData[0]
    ? Object.keys(dataset.previewData[0]).map((key) => ({
        header: key,
        key,
        render: (val) => (
          <span className={typeof val === 'number' ? 'font-mono text-slate-800 dark:text-slate-200' : ''}>
            {val !== null && val !== undefined ? String(val) : '—'}
          </span>
        ),
      }))
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Back Link & Title Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate('/datasets')}
            aria-label="Back to datasets"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {dataset.displayName || dataset.name}
              </h1>
              <Badge variant="teal" size="xs">
                {dataset.format}
              </Badge>
            </div>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              s3://lakehouse-{currentCompany?.id.toLowerCase()}/{dataset.name}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <NavLink to={`/sql?dataset=${dataset.id}`}>
            <Button variant="secondary" size="sm" icon={Terminal}>
              Query SQL
            </Button>
          </NavLink>

          <Button variant="outline" size="sm" icon={Download} onClick={handleDownloadCsv}>
            Export CSV
          </Button>

          {canDelete && (
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 space-y-1">
              <span className="text-xs text-slate-400">Total Rows</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                {dataset.rowCount.toLocaleString()}
              </p>
              <span className="text-[10px] text-teal-600 dark:text-teal-400">Snappy compressed</span>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-xs text-slate-400">Columns</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                {dataset.colCount || dataset.schema?.length}
              </p>
              <span className="text-[10px] text-slate-500">Inferred Schema</span>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-xs text-slate-400">Parquet Size</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{dataset.size}</p>
              <span className="text-[10px] text-teal-600 dark:text-teal-400">{dataset.compressionRatio}</span>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-xs text-slate-400">Access Policy</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{dataset.accessLevel}</p>
              <span className="text-[10px] text-slate-500">Tenant {dataset.companyId}</span>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader title="Dataset Description & Metadata" />
              <CardContent className="space-y-4">
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {dataset.description}
                </p>

                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-2">
                    Categorization Tags
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(dataset.tags || []).map((t, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-xs font-mono text-sky-700 dark:text-sky-300 font-medium"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Ingested By</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {dataset.uploaderName} ({dataset.uploaderRole})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Ingestion Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {dataset.uploadDate}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Parquet Lakehouse Telemetry" />
              <CardContent className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500">Storage Engine:</span>
                  <span className="font-mono font-medium text-teal-600 dark:text-teal-400">Apache Arrow / Parquet</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500">Compression Codec:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">Snappy (LZO compatible)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500">Partition Scheme:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">Hash(id) mod 16</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500">Row Groups:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">4 (128 MB blocks)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Z-Order Index:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Enabled</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEMA */}
      {activeTab === 'schema' && (
        <Card>
          <CardHeader
            title="Column Schema Specifications"
            subtitle="Column names, SQL data types, null percentage, and unique cardinalities"
          />
          <CardContent className="p-0">
            <Table columns={schemaColumns} data={dataset.schema || []} pagination={false} searchable={false} />
          </CardContent>
        </Card>
      )}

      {/* TAB 3: DATA PREVIEW */}
      {activeTab === 'preview' && (
        <Card>
          <CardHeader
            title="Interactive Parquet Preview"
            subtitle={`Displaying records from memory cache • ${dataset.previewData?.length || 0} sample rows shown`}
          />
          <CardContent className="p-0">
            <Table
              columns={previewColumns}
              data={dataset.previewData || []}
              searchable={true}
              searchPlaceholder="Filter records..."
              defaultPageSize={6}
            />
          </CardContent>
        </Card>
      )}

      {/* TAB 4: COLUMN STATISTICS */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {dataset.columnStats && dataset.columnStats.length > 0 ? (
            dataset.columnStats.map((stat, idx) => (
              <Card key={idx}>
                <CardHeader
                  title={`Distribution for Column: "${stat.column}"`}
                  subtitle={
                    stat.mean !== undefined
                      ? `Min: ${stat.min} • Max: ${stat.max} • Mean: ${stat.mean} • StdDev: ${stat.stdDev}`
                      : `Unique Cardinality: ${stat.uniqueCount}`
                  }
                  action={
                    <Badge variant="teal" size="xs">
                      Histogram & Counts
                    </Badge>
                  }
                />
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stat.distribution} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#748447" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No Column Statistics Computed"
              description="Statistics can be generated by running ANALYZE TABLE in the SQL Editor."
            />
          )}
        </div>
      )}

      {/* TAB 5: VERSION HISTORY */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader title="Version & Commit Audit Trail" subtitle="Changes and delta snapshots recorded for this dataset" />
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(dataset.history || []).map((h) => (
                <div key={h.id} className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {h.version} • {h.action}
                      </span>
                      <span className="text-slate-400">{h.date}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{h.comment}</p>
                    <span className="text-[10px] text-slate-400 block">Committed by {h.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 6: ACCESS SETTINGS */}
      {activeTab === 'access' && (
        <Card>
          <CardHeader
            title="Access Control & Permission Policies"
            subtitle="Regulate who inside your organization can view or query this dataset"
          />
          <CardContent className="space-y-5 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-2">
                Visibility Tier
              </label>
              <div className="space-y-2">
                {['All', 'HR+Admin', 'Admin only'].map((lvl) => (
                  <label
                    key={lvl}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      currentAccess === lvl
                        ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="accessLevel"
                      value={lvl}
                      checked={currentAccess === lvl}
                      disabled={!isAdmin}
                      onChange={() => setSelectedAccessLevel(lvl)}
                      className="mt-0.5 text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <div className="text-xs font-semibold">
                        {lvl === 'All' ? 'All Roles (STAFF, HR, ADMIN)' : lvl === 'HR+Admin' ? 'HR and ADMIN Only' : 'ADMIN Only (Confidential)'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {lvl === 'All'
                          ? 'Available for public company queries, dashboards, and plain-language inquiries.'
                          : lvl === 'HR+Admin'
                          ? 'Restricted to People Operations and Lakehouse Admins.'
                          : 'Hidden from general team members and HR.'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {!isAdmin && (
              <p className="text-xs text-slate-400 italic">
                Note: Only Lakehouse Administrators can modify access permissions.
              </p>
            )}

            {isAdmin && (
              <div className="pt-2">
                <Button size="sm" onClick={handleUpdateAccess}>
                  Save Permission Policy
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title={`Delete "${dataset.displayName || dataset.name}"?`}
        message={`Are you sure you want to permanently delete this dataset from ${currentCompany?.id}? ${
          isAdmin
            ? 'As an Administrator, you have permission to delete any dataset.'
            : 'As the person who uploaded this data, you have permission to delete it.'
        } This action is irreversible.`}
      />
    </div>
  );
}
