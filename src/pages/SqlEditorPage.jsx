import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Terminal,
  Play,
  Save,
  Download,
  Plus,
  X,
  Database,
  ChevronRight,
  ChevronDown,
  Table as TableIcon,
  Columns,
  Sparkles,
  AlertTriangle,
  Clock,
  Layers,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { SqlCodeEditor } from '../components/common/SqlCodeEditor';
import { Table } from '../components/common/Table';
import { api } from '../services/api';

export function SqlEditorPage() {
  const { currentUser, currentCompany } = useAuth();
  const { datasets, saveQuery } = useData();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const role = currentUser ? currentUser.role : 'STAFF';
  const isStaff = role === 'STAFF';
  const companyId = currentUser ? currentUser.companyId : 'ACME-001';

  // Check URL query parameters for initial dataset
  const searchParams = new URLSearchParams(location.search);
  const initialDatasetId = searchParams.get('dataset');
  const tabularDataset = datasets.find((d) => (d.schema || []).length > 2) || datasets[0];
  const initialDataset = datasets.find((d) => d.id === initialDatasetId) || tabularDataset || datasets[0];

  const buildDepartmentQuery = (ds) => {
    if (!ds) return 'SELECT 1;';
    const cols = ds.schema || [];
    const deptCol = cols.find((c) => /dept|department|team|group|category/i.test(c.column))?.column;
    const salaryCol = cols.find((c) => /salary|comp|wage|pay|deal|revenue|amount/i.test(c.column))?.column;
    if (deptCol && salaryCol) {
      return `SELECT \n  "${deptCol}",\n  COUNT(*) as headcount,\n  ROUND(AVG("${salaryCol}"), 2) as avg_compensation\nFROM read_parquet('s3://lakehouse-${companyId.toLowerCase()}/${ds.name}')\nGROUP BY "${deptCol}"\nORDER BY avg_compensation DESC;`;
    }
    if (cols.length >= 2) {
      return `SELECT \n  "${cols[0].column}",\n  COUNT(*) as count_records\nFROM read_parquet('s3://lakehouse-${companyId.toLowerCase()}/${ds.name}')\nGROUP BY "${cols[0].column}"\nORDER BY count_records DESC\nLIMIT 10;`;
    }
    return `SELECT * FROM read_parquet('s3://lakehouse-${companyId.toLowerCase()}/${ds.name}') LIMIT 10;`;
  };

  // Editor Tabs
  const [tabs, setTabs] = useState([
    {
      id: 'tab-1',
      title: 'Query 1',
      sql: initialDataset
        ? `SELECT \n  *\nFROM read_parquet('s3://lakehouse-${companyId.toLowerCase()}/${initialDataset.name}')\nLIMIT 10;`
        : 'SELECT 1;',
    },
    {
      id: 'tab-2',
      title: 'Department Aggregates',
      sql: buildDepartmentQuery(initialDataset),
    },
  ]);

  const [activeTabId, setActiveTabId] = useState('tab-1');
  const [expandedTables, setExpandedTables] = useState({ [initialDataset?.name || '']: true });

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResults, setQueryResults] = useState(null);
  const [queryError, setQueryError] = useState(null);
  const [executionTelemetry, setExecutionTelemetry] = useState(null);
  const [destructiveWarning, setDestructiveWarning] = useState(null);
  const resultsRef = useRef(null);

  // Sync tabs when datasets load
  useEffect(() => {
    if (datasets && datasets.length > 0) {
      const best = datasets.find((d) => (d.schema || []).length > 2) || datasets[0];
      setTabs((prev) => {
        const needsFix = prev.some(
          (t) => (t.id === 'tab-2' && t.sql.includes('acme_employees_2025') && companyId !== 'ACME-001') ||
                 (t.id === 'tab-1' && t.sql.includes('SELECT 1;'))
        );
        if (!needsFix) return prev;
        return [
          {
            id: 'tab-1',
            title: best.displayName || best.name,
            sql: `SELECT \n  *\nFROM read_parquet('s3://lakehouse-${companyId.toLowerCase()}/${best.name}')\nLIMIT 10;`,
          },
          {
            id: 'tab-2',
            title: 'Aggregates & Metrics',
            sql: buildDepartmentQuery(best),
          },
          ...prev.filter((t) => t.id !== 'tab-1' && t.id !== 'tab-2'),
        ];
      });
    }
  }, [datasets, companyId]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleUpdateActiveSql = (newSql) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, sql: newSql } : t))
    );

    // Destructive statement detection
    const isDestructive = /\b(DROP|DELETE|UPDATE|TRUNCATE|ALTER)\b/i.test(newSql);
    if (isStaff && isDestructive) {
      setDestructiveWarning('STAFF role is restricted to read-only analytical queries. Destructive statements (DROP, DELETE, UPDATE) are blocked.');
    } else {
      setDestructiveWarning(null);
    }
  };

  const handleAddTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab = {
      id: newId,
      title: `Query ${tabs.length + 1}`,
      sql: `-- New analytical query\nSELECT 1;`,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (tabId, e) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const remaining = tabs.filter((t) => t.id !== tabId);
    setTabs(remaining);
    if (activeTabId === tabId) {
      setActiveTabId(remaining[0].id);
    }
  };

  const toggleExpandTable = (tableName) => {
    setExpandedTables((prev) => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  const insertSchemaItem = (itemText) => {
    const newSql = activeTab.sql + ' ' + itemText;
    handleUpdateActiveSql(newSql);
    toast({
      title: 'Inserted into Editor',
      message: `Appended ${itemText} to active query.`,
      type: 'info',
    });
  };

  // Run Query
  const handleRunQuery = async () => {
    // Check destructive query block for STAFF
    const isDestructive = /\b(DROP|DELETE|UPDATE|TRUNCATE|ALTER)\b/i.test(activeTab.sql);
    if (isStaff && isDestructive) {
      const errMsg = 'Security policy violation: STAFF users cannot run destructive modifications.';
      setQueryError(errMsg);
      setQueryResults(null);
      toast({
        title: 'Action Blocked by Lakehouse RBAC',
        message: errMsg,
        type: 'error',
      });
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }

    setIsExecuting(true);
    setQueryError(null);
    const startTime = performance.now();

    try {
      const res = await api.runSql(activeTab.sql, 500);
      setIsExecuting(false);
      if (res && res.success) {
        setQueryError(null);
        setQueryResults(res.rows || []);
        setExecutionTelemetry(res.telemetry || {
          latency: `${Math.round(performance.now() - startTime)} ms`,
          rowCount: (res.rows || []).length,
          scannedBytes: '2.4 MB'
        });
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        toast({
          title: 'DuckDB Query Executed',
          message: `Returned ${(res.rows || []).length} rows in ${res.telemetry?.latency || 'fast'} time.`,
          type: 'success',
        });
      } else {
        setQueryResults(null);
        setQueryError(res?.error || 'SQL execution failed.');
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        toast({
          title: 'Query Error',
          message: res?.error || 'SQL execution failed.',
          type: 'error',
        });
      }
    } catch (err) {
      setIsExecuting(false);
      setQueryResults(null);
      setQueryError(err.message || 'Connection error to lakehouse execution cluster.');
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      toast({
        title: 'Query Execution Failed',
        message: err.message || 'SQL execution failed.',
        type: 'error',
      });
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunQuery();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeTab.sql, isStaff]);

  const handleSaveCurrentQuery = () => {
    saveQuery({
      question: activeTab.title,
      interpreted: 'Saved custom SQL query tab.',
      datasetId: initialDataset?.id || 'ds-default',
      datasetName: initialDataset?.name || 'lakehouse_table.parquet',
      sql: activeTab.sql,
      results: queryResults || initialDataset?.previewData || [],
      date: 'Just now',
    });
    toast({
      title: 'Query Saved',
      message: 'Query added to company analytical library.',
      type: 'success',
    });
  };

  const handleExportCsv = () => {
    if (!queryResults || queryResults.length === 0) return;
    const headers = Object.keys(queryResults[0]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...queryResults.map((r) => headers.map((h) => `"${r[h] ?? ''}"`).join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = `lakehouse_query_result.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: 'Export Complete',
      message: 'Query results downloaded as CSV.',
      type: 'info',
    });
  };

  // Convert schema list for editor autocomplete
  const schemaForEditor = datasets.map((d) => ({
    name: d.name,
    columns: (d.schema || []).map((s) => s.column),
  }));

  // Result table dynamic columns
  const resultColumns = queryResults && queryResults[0]
    ? Object.keys(queryResults[0]).map((key) => ({
        header: key,
        key,
        render: (val) => (
          <span className={typeof val === 'number' ? 'font-mono' : ''}>
            {val !== null && val !== undefined ? String(val) : '—'}
          </span>
        ),
      }))
    : [];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            SQL Query Studio
            <Badge variant="teal" size="xs">
              DuckDB Parquet Engine
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Execute high-performance analytical queries directly against columnar Parquet files in S3/Blob storage.
          </p>
        </div>

        {isStaff && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>STAFF: Read-Only Mode (SELECT queries permitted)</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Sidebar: Schema Browser */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-500" />
                <span>Lakehouse Schema Browser</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{companyId}</span>
            </div>

            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {datasets.map((d) => {
                const isExpanded = !!expandedTables[d.name];
                return (
                  <div key={d.id} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
                    {/* Table Name Header */}
                    <button
                      type="button"
                      onClick={() => toggleExpandTable(d.name)}
                      className="w-full p-2.5 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <TableIcon className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                        <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate">
                          {d.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {d.rowCount.toLocaleString()} r
                      </span>
                    </button>

                    {/* Columns List */}
                    {isExpanded && (
                      <div className="p-2 pt-0 divide-y divide-slate-100 dark:divide-slate-800/80">
                        <button
                          type="button"
                          onClick={() => insertSchemaItem(`read_parquet('s3://lakehouse-${companyId.toLowerCase()}/${d.name}')`)}
                          className="w-full px-2 py-1.5 text-left text-[11px] font-mono text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1.5"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Insert Table Ref</span>
                        </button>

                        {(d.schema || []).map((col, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => insertSchemaItem(col.column)}
                            className="w-full px-2 py-1.5 flex items-center justify-between text-left hover:bg-white dark:hover:bg-slate-800 rounded-lg group text-[11px]"
                          >
                            <span className="font-mono text-slate-700 dark:text-slate-300 group-hover:text-sky-600 transition-colors truncate">
                              {col.column}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {col.type?.split('(')[0]}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Editor Area */}
        <div className="lg:col-span-9 space-y-4">
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
            {/* Tabs Header Bar */}
            <div className="flex items-center justify-between bg-slate-900 border-b border-slate-800 px-3 pt-2">
              <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none">
                {tabs.map((tab) => {
                  const isActive = tab.id === activeTabId;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTabId(tab.id)}
                      className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs font-medium font-mono transition-colors border-t border-x ${
                        isActive
                          ? 'bg-slate-950 text-white border-slate-800'
                          : 'bg-slate-900 text-slate-400 border-transparent hover:text-slate-200'
                      }`}
                    >
                      <Terminal className="w-3 h-3 text-sky-400" />
                      <span>{tab.title}</span>
                      {tabs.length > 1 && (
                        <span
                          onClick={(e) => handleCloseTab(tab.id, e)}
                          className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded"
                        >
                          <X className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  );
                })}

                <button
                  onClick={handleAddTab}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="New Query Tab"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-2 pb-2">
                <Button
                  variant="outline"
                  size="xs"
                  icon={Save}
                  className="text-slate-300 border-slate-700 hover:bg-slate-800"
                  onClick={handleSaveCurrentQuery}
                >
                  Save
                </Button>

                <Button
                  variant="primary"
                  size="xs"
                  icon={Play}
                  loading={isExecuting}
                  onClick={handleRunQuery}
                >
                  Run (Ctrl+Enter)
                </Button>
              </div>
            </div>

            {/* Code Editor */}
            <SqlCodeEditor
              value={activeTab.sql}
              onChange={handleUpdateActiveSql}
              onRun={handleRunQuery}
              tables={datasets}
              height="260px"
              destructiveWarning={destructiveWarning}
            />

            {/* Telemetry Status Bar */}
            <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>Execution: {executionTelemetry?.latency || 'Ready'}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span>Rows: {executionTelemetry?.rowCount !== undefined ? executionTelemetry.rowCount : '—'}</span>
                </span>
                <span className="hidden sm:inline">
                  Scanned: {executionTelemetry?.scannedBytes || '0 KB'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-teal-400 font-semibold">DuckDB v0.10.2</span>
              </div>
            </div>
          </Card>

          {/* Results Area */}
          {queryError ? (
            <div ref={resultsRef} className="scroll-mt-6">
              <Card className="space-y-3 p-5 border-rose-500/30 bg-rose-50/60 dark:bg-rose-950/20">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>SQL Execution Error</span>
                </div>
                <div className="text-xs text-rose-800 dark:text-rose-200 font-mono bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 leading-relaxed whitespace-pre-wrap">
                  {queryError}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tip: Verify column names in the Lakehouse Schema Browser on the left, or confirm that your role has access to the target dataset.
                </p>
              </Card>
            </div>
          ) : queryResults ? (
            <div ref={resultsRef} className="scroll-mt-6">
              <Card className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Query Results Output
                  </h3>
                  <Badge variant="teal" size="xs">
                    {queryResults.length} records returned
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    icon={Download}
                    onClick={handleExportCsv}
                  >
                    Export CSV
                  </Button>
                </div>
              </div>

              {queryResults.length > 0 ? (
                <Table
                  columns={resultColumns}
                  data={queryResults}
                  defaultPageSize={8}
                  searchPlaceholder="Search in results..."
                />
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Query executed successfully, but 0 records matched your query filters.
                </div>
              )}
            </Card>
          </div>
          ) : (
            <Card className="p-8 text-center text-slate-400 text-xs">
              <Play className="w-6 h-6 mx-auto mb-2 text-slate-500 opacity-60" />
              Click "Run" or press Ctrl+Enter to execute the SQL statement and view data records.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
