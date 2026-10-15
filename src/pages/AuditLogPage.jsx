import React, { useState, useMemo } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Table } from '../components/common/Table';

export function AuditLogPage() {
  const { currentUser, currentCompany } = useAuth();
  const { auditLogs } = useData();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');

  const companyId = currentUser ? currentUser.companyId : 'ACME-001';

  // Unique actions and users for filters
  const uniqueActions = useMemo(() => {
    const set = new Set();
    auditLogs.forEach((a) => set.add(a.action));
    return Array.from(set);
  }, [auditLogs]);

  const uniqueUsers = useMemo(() => {
    const set = new Set();
    auditLogs.forEach((a) => set.add(a.userName));
    return Array.from(set);
  }, [auditLogs]);

  // Filter audit logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((a) => {
      const matchAction = actionFilter === 'all' || a.action === actionFilter;
      const matchUser = userFilter === 'all' || a.userName === userFilter;
      const matchSearch =
        a.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.userName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchAction && matchUser && matchSearch;
    });
  }, [auditLogs, actionFilter, userFilter, searchTerm]);

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['id', 'timestamp', 'userName', 'userRole', 'action', 'resource', 'details', 'ip', 'status'];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...filteredLogs.map((log) =>
          headers.map((h) => `"${log[h] !== undefined ? String(log[h]).replace(/"/g, '""') : ''}"`).join(',')
        ),
      ].join('\n');

    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `audit_logs_${companyId}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Audit Logs Exported',
      message: `Exported ${filteredLogs.length} audit records to CSV.`,
      type: 'info',
    });
  };

  const tableColumns = [
    {
      header: 'Timestamp',
      key: 'timestamp',
      render: (val) => <span className="font-mono text-slate-500 whitespace-nowrap">{val}</span>,
    },
    {
      header: 'Actor / User',
      key: 'userName',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-white block">{val}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.userRole}</span>
        </div>
      ),
    },
    {
      header: 'Action Category',
      key: 'action',
      render: (val) => (
        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
          {val}
        </span>
      ),
    },
    {
      header: 'Resource Target',
      key: 'resource',
      render: (val) => <span className="font-mono text-sky-600 dark:text-sky-400 max-w-xs truncate block">{val}</span>,
    },
    {
      header: 'Event Details',
      key: 'details',
      render: (val) => <span className="text-slate-600 dark:text-slate-300 max-w-sm truncate block">{val}</span>,
    },
    {
      header: 'IP Address',
      key: 'ip',
      render: (val) => <span className="font-mono text-slate-400">{val}</span>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (val) => (
        <Badge
          variant={val === 'Success' ? 'emerald' : val === 'Warning' ? 'amber' : 'rose'}
          size="xs"
          dot
        >
          {val}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Audit & Compliance Log
            <Badge variant="ADMIN" size="xs">
              ADMIN Only
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Immutable system events, security operations, and query telemetry for organization{' '}
            <span className="font-mono font-semibold text-teal-600 dark:text-teal-400">{companyId}</span>.
          </p>
        </div>

        <Button variant="outline" size="sm" icon={Download} onClick={handleExportCsv}>
          Export Audit CSV
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search text */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by action, user, resource..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Actions ({uniqueActions.length})</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Users ({uniqueUsers.length})</option>
              {uniqueUsers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Table
            columns={tableColumns}
            data={filteredLogs}
            searchable={false}
            defaultPageSize={10}
            emptyMessage="No audit log events match your selected filters."
          />
        </CardContent>
      </Card>
    </div>
  );
}
