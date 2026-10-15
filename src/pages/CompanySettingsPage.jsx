import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  Building2,
  Copy,
  Check,
  Shield,
  Save,
  Layers,
  Sparkles,
  Database,
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Lock,
  Unlock,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export function CompanySettingsPage() {
  const { currentUser, currentCompany, updateCompanySettings } = useAuth();
  const {
    allCompanyDatasets,
    updateDatasetAccess,
    updateAllDatasetsAccess,
    deleteDataset,
    deleteAllCompanyDatasets,
  } = useData();
  const { toast } = useToast();

  const [copiedId, setCopiedId] = useState(false);

  // Form states initialized from current company
  const [companyName, setCompanyName] = useState(currentCompany?.name || '');
  const [tagline, setTagline] = useState(currentCompany?.tagline || '');
  const [industry, setIndustry] = useState(currentCompany?.industry || '');
  const [timezone, setTimezone] = useState(currentCompany?.timezone || '');
  const [defaultAccess, setDefaultAccess] = useState(currentCompany?.defaultAccess || 'Public to Company');
  const [applyDefaultToAll, setApplyDefaultToAll] = useState(false);
  const [allowedRoles, setAllowedRoles] = useState(currentCompany?.allowedRegistrationRoles || ['HR', 'STAFF']);

  // Dataset Access & Deletion Management states
  const [bulkAccessLevel, setBulkAccessLevel] = useState('All');
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [deleteDatasetTarget, setDeleteDatasetTarget] = useState(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [datasetSearch, setDatasetSearch] = useState('');
  const [datasetFilter, setDatasetFilter] = useState('ALL'); // 'ALL' | 'All' | 'HR+Admin' | 'Admin only'

  // Statistics
  const totalDatasets = allCompanyDatasets.length;
  const countPublic = allCompanyDatasets.filter((d) => (d.accessLevel || 'All') === 'All').length;
  const countHR = allCompanyDatasets.filter((d) => d.accessLevel === 'HR+Admin').length;
  const countAdminOnly = allCompanyDatasets.filter((d) => d.accessLevel === 'Admin only').length;

  const filteredDatasets = allCompanyDatasets.filter((d) => {
    const currentLvl = d.accessLevel || 'All';
    const matchesFilter = datasetFilter === 'ALL' ? true : currentLvl === datasetFilter;
    const query = datasetSearch.toLowerCase().trim();
    const matchesSearch =
      !query ||
      d.name.toLowerCase().includes(query) ||
      (d.displayName && d.displayName.toLowerCase().includes(query)) ||
      (d.tags && d.tags.some((t) => t.toLowerCase().includes(query)));
    return matchesFilter && matchesSearch;
  });

  const handleCopyId = () => {
    navigator.clipboard.writeText(currentCompany?.id || '');
    setCopiedId(true);
    toast({
      title: 'Company ID Copied',
      message: `${currentCompany?.id} copied to clipboard.`,
      type: 'info',
    });
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleToggleRole = (roleKey) => {
    setAllowedRoles((prev) =>
      prev.includes(roleKey) ? prev.filter((r) => r !== roleKey) : [...prev, roleKey]
    );
  };

  const handleSingleDatasetAccessChange = (datasetId, datasetName, newLevel) => {
    updateDatasetAccess(datasetId, newLevel);
    toast({
      title: 'Dataset Access Updated',
      message: `"${datasetName}" is now set to ${
        newLevel === 'All'
          ? 'All Roles (Public)'
          : newLevel === 'HR+Admin'
          ? 'HR + Admin Only'
          : 'Admin Only (Confidential)'
      }.`,
      type: 'success',
    });
  };

  const handleConfirmDeleteDataset = () => {
    if (!deleteDatasetTarget) return;
    deleteDataset(deleteDatasetTarget.id);
    toast({
      title: 'Dataset Deleted',
      message: `Administrator deleted "${deleteDatasetTarget.name}" from ${currentCompany?.id}.`,
      type: 'success',
    });
    setDeleteDatasetTarget(null);
  };

  const handleConfirmDeleteAllDatasets = () => {
    deleteAllCompanyDatasets();
    setShowDeleteAllModal(false);
    toast({
      title: 'All Datasets Deleted',
      message: `All datasets for ${currentCompany?.id} have been permanently deleted by Administrator.`,
      type: 'success',
    });
  };

  const handleExecuteBulkAccess = () => {
    updateAllDatasetsAccess(bulkAccessLevel);
    setShowBulkConfirmModal(false);
    toast({
      title: 'Bulk Access Applied',
      message: `Updated all ${totalDatasets} datasets to "${
        bulkAccessLevel === 'All'
          ? 'All Roles (Public to Company)'
          : bulkAccessLevel === 'HR+Admin'
          ? 'HR + Admin Only'
          : 'Admin Only (Confidential)'
      }".`,
      type: 'success',
    });
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateCompanySettings({
      name: companyName,
      tagline,
      industry,
      timezone,
      defaultAccess,
      allowedRegistrationRoles: allowedRoles,
      dataRetentionDays: currentCompany?.dataRetentionDays || 365,
      autoArchiveParquet: currentCompany?.autoArchiveParquet ?? true,
    });

    if (applyDefaultToAll) {
      const targetLevel =
        defaultAccess === 'Public to Company'
          ? 'All'
          : defaultAccess === 'Restricted (Admin approval)'
          ? 'HR+Admin'
          : 'Admin only';
      updateAllDatasetsAccess(targetLevel);
      toast({
        title: 'Settings & Dataset Access Saved',
        message: `Updated organization preferences and set all ${totalDatasets} datasets to "${targetLevel}".`,
        type: 'success',
      });
    } else {
      toast({
        title: 'Settings Saved',
        message: `Updated organization preferences for ${currentCompany?.id}.`,
        type: 'success',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Company Settings
            <Badge variant="ADMIN" size="xs">
              ADMIN Only
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Configure tenant metadata, dataset access governance, and security policies.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Organization Identity Card */}
        <Card className="p-6 space-y-4">
          <CardHeader
            title="Tenant Identity & Storage Partition"
            subtitle="Immutable organizational credentials inside the multi-tenant cluster"
            className="p-0 pb-4 border-none"
          />

          {/* Read-Only Company ID with Copy Button */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Organization Identifier (Company ID)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={currentCompany?.id || 'ACME-001'}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono font-bold text-[#4D5A2A] dark:text-[#DCE4C2] focus:outline-none select-all"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={copiedId ? Check : Copy}
                onClick={handleCopyId}
              >
                {copiedId ? 'Copied' : 'Copy ID'}
              </Button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Share this code with employees when they register accounts for your company.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company Legal Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4D5A2A]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tagline / Department
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4D5A2A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Industry Domain
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4D5A2A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary Operational Timezone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4D5A2A]"
              />
            </div>
          </div>
        </Card>

        {/* Dataset Access Control & Permissions (Instant & Bulk Access Management) */}
        <Card className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-[#4D5A2A] dark:text-[#DCE4C2]" />
                Dataset Access & Visibility Governance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Admin can change access permissions for any individual dataset or all datasets anytime.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="teal" size="sm">
                {totalDatasets} Total Datasets
              </Badge>
            </div>
          </div>

          {/* Metrics & Filter Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setDatasetFilter('ALL')}
              className={`p-3 rounded-xl border text-left transition-all ${
                datasetFilter === 'ALL'
                  ? 'border-[#4D5A2A] bg-[#4D5A2A]/10 dark:bg-[#4D5A2A]/20 shadow-xs ring-1 ring-[#4D5A2A]/30'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">All Datasets</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{totalDatasets}</div>
            </button>

            <button
              type="button"
              onClick={() => setDatasetFilter('All')}
              className={`p-3 rounded-xl border text-left transition-all ${
                datasetFilter === 'All'
                  ? 'border-[#748447] bg-[#748447]/15 dark:bg-[#748447]/25 shadow-xs ring-1 ring-[#748447]/30'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="text-[11px] font-medium text-[#748447] dark:text-[#DCE4C2] flex items-center gap-1">
                <Unlock className="w-3 h-3" /> All Roles
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{countPublic}</div>
            </button>

            <button
              type="button"
              onClick={() => setDatasetFilter('HR+Admin')}
              className={`p-3 rounded-xl border text-left transition-all ${
                datasetFilter === 'HR+Admin'
                  ? 'border-sky-500 bg-sky-500/10 dark:bg-sky-500/20 shadow-xs ring-1 ring-sky-500/30'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="text-[11px] font-medium text-sky-700 dark:text-sky-300 flex items-center gap-1">
                <Shield className="w-3 h-3" /> HR + Admin
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{countHR}</div>
            </button>

            <button
              type="button"
              onClick={() => setDatasetFilter('Admin only')}
              className={`p-3 rounded-xl border text-left transition-all ${
                datasetFilter === 'Admin only'
                  ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/20 shadow-xs ring-1 ring-amber-500/30'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Admin Only
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{countAdminOnly}</div>
            </button>
          </div>

          {/* Bulk Update Tool Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#4D5A2A]/10 via-[#748447]/10 to-transparent border border-[#748447]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#4D5A2A] dark:text-[#DCE4C2]" />
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Bulk Change Access to All Datasets
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400">
                Override visibility permissions across all {totalDatasets} datasets in {currentCompany?.id} in a single click.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <select
                value={bulkAccessLevel}
                onChange={(e) => setBulkAccessLevel(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4D5A2A]"
              >
                <option value="All">All Roles (Staff, HR, Admin)</option>
                <option value="HR+Admin">HR + Admin Only</option>
                <option value="Admin only">Admin Only (Confidential)</option>
              </select>

              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                onClick={() => setShowBulkConfirmModal(true)}
              >
                Apply to All ({totalDatasets})
              </Button>

              {totalDatasets > 0 && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => setShowDeleteAllModal(true)}
                  title="Admin Delete All Datasets"
                >
                  Delete All Data
                </Button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={datasetSearch}
                onChange={(e) => setDatasetSearch(e.target.value)}
                placeholder="Search datasets by name or tags..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4D5A2A]"
              />
            </div>
            {datasetFilter !== 'ALL' && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setDatasetFilter('ALL')}
              >
                Clear Filter
              </Button>
            )}
          </div>

          {/* Individual Datasets Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Dataset</th>
                  <th className="py-2.5 px-3 font-semibold hidden sm:table-cell">Uploaded By</th>
                  <th className="py-2.5 px-3 font-semibold">Current Access</th>
                  <th className="py-2.5 px-3 font-semibold">Change Access Anytime</th>
                  <th className="py-2.5 px-2 font-semibold text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredDatasets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                      No datasets found matching your search or filter.
                    </td>
                  </tr>
                ) : (
                  filteredDatasets.map((ds) => {
                    const currentLvl = ds.accessLevel || 'All';
                    return (
                      <tr key={ds.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#4D5A2A]/10 dark:bg-[#4D5A2A]/30 flex items-center justify-center shrink-0 text-[#4D5A2A] dark:text-[#DCE4C2] mt-0.5">
                              <Database className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                                {ds.displayName || ds.name}
                              </div>
                              <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                {ds.name}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[10px] text-slate-400">
                                  {ds.rowCount?.toLocaleString()} rows • {ds.size}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 hidden sm:table-cell">
                          <div className="text-slate-800 dark:text-slate-200 font-medium">
                            {ds.uploaderName || 'Admin'}
                          </div>
                          <Badge variant={ds.uploaderRole || 'ADMIN'} size="xs" className="mt-0.5">
                            {ds.uploaderRole || 'ADMIN'}
                          </Badge>
                        </td>

                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              currentLvl === 'All'
                                ? 'teal'
                                : currentLvl === 'HR+Admin'
                                ? 'primary'
                                : 'amber'
                            }
                            size="sm"
                            dot
                          >
                            {currentLvl === 'All'
                              ? 'All Roles'
                              : currentLvl === 'HR+Admin'
                              ? 'HR + Admin'
                              : 'Admin Only'}
                          </Badge>
                        </td>

                        <td className="py-3 px-3">
                          <select
                            value={currentLvl}
                            onChange={(e) =>
                              handleSingleDatasetAccessChange(ds.id, ds.displayName || ds.name, e.target.value)
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4D5A2A] ${
                              currentLvl === 'All'
                                ? 'bg-[#748447]/15 border-[#748447]/40 text-[#4D5A2A] dark:text-[#DCE4C2]'
                                : currentLvl === 'HR+Admin'
                                ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-300'
                                : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            <option value="All">All Roles (Public)</option>
                            <option value="HR+Admin">HR + Admin Only</option>
                            <option value="Admin only">Admin Only (Confidential)</option>
                          </select>
                        </td>

                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/datasets/${ds.id}`}
                              className="p-1.5 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Inspect Dataset"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setDeleteDatasetTarget(ds)}
                              className="p-1.5 rounded-lg inline-flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete Dataset (Admin)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Access Policies & Registration Rules */}
        <Card className="p-6 space-y-4">
          <CardHeader
            title="Access Governance & Registration Rules"
            subtitle="Control default visibility policies and which roles applicants can request during self-registration"
            className="p-0 pb-4 border-none"
          />

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Default Dataset Access Policy
            </label>
            <select
              value={defaultAccess}
              onChange={(e) => setDefaultAccess(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4D5A2A]"
            >
              <option value="Public to Company">Public to Company (All roles can query)</option>
              <option value="Restricted (Admin approval)">Restricted (Explicit role tagging required)</option>
              <option value="Confidential">Confidential (Admin only by default)</option>
            </select>

            <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={applyDefaultToAll}
                onChange={(e) => setApplyDefaultToAll(e.target.checked)}
                className="rounded text-[#4D5A2A] focus:ring-[#4D5A2A]"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300">
                Also apply this default access policy to all existing {totalDatasets} datasets when saving
              </span>
            </label>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Permitted Self-Registration Roles
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowedRoles.includes('HR')}
                  onChange={() => handleToggleRole('HR')}
                  className="rounded text-[#4D5A2A] focus:ring-[#4D5A2A]"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Allow HR Role Requests
                  </span>
                  <span className="text-slate-400">
                    Enables new applicants to select HR Operations during registration.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowedRoles.includes('STAFF')}
                  onChange={() => handleToggleRole('STAFF')}
                  className="rounded text-[#4D5A2A] focus:ring-[#4D5A2A]"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Allow STAFF Role Requests
                  </span>
                  <span className="text-slate-400">
                    Enables general employees and data analysts to register.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </Card>

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="md" icon={Save}>
            Save Organization Settings
          </Button>
        </div>
      </form>

      {/* Bulk Access Confirmation Modal */}
      {showBulkConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirm Bulk Access Change
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update permissions for all datasets
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to change the access level of{' '}
              <strong>all {totalDatasets} datasets</strong> in <strong>{currentCompany?.id}</strong> to:
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <Badge
                variant={
                  bulkAccessLevel === 'All'
                    ? 'teal'
                    : bulkAccessLevel === 'HR+Admin'
                    ? 'primary'
                    : 'amber'
                }
                size="md"
                dot
              >
                {bulkAccessLevel === 'All'
                  ? 'All Roles (Staff, HR, Admin)'
                  : bulkAccessLevel === 'HR+Admin'
                  ? 'HR + Admin Only'
                  : 'Admin Only (Confidential)'}
              </Badge>
            </div>

            <p className="text-[11px] text-slate-400">
              {bulkAccessLevel === 'All'
                ? 'All registered staff and HR members will immediately be able to query and view these datasets.'
                : bulkAccessLevel === 'HR+Admin'
                ? 'Only HR operations and Administrators will have query access. Datasets will be hidden from general staff.'
                : 'All datasets will immediately become confidential to Administrators only. Hidden from HR and Staff.'}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBulkConfirmModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                onClick={handleExecuteBulkAccess}
              >
                Confirm & Apply to All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Single Dataset Delete Confirmation Modal */}
      {deleteDatasetTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Permanently Delete Dataset?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Administrator storage action
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to permanently delete <strong>{deleteDatasetTarget.name}</strong> from <strong>{currentCompany?.id}</strong>?
            </p>

            <p className="text-[11px] text-slate-400">
              As an Administrator, you have full privileges to delete this dataset. This will remove all associated Parquet files and invalidate related queries.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteDatasetTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={handleConfirmDeleteDataset}
              >
                Delete Dataset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Datasets Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">
                  Delete All Company Datasets?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Extreme Admin Action • Irreversible
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong>ALL {totalDatasets} datasets</strong> for <strong>{currentCompany?.id}</strong>?
            </p>

            <p className="text-[11px] text-rose-500 dark:text-rose-400 font-medium">
              Warning: This will purge every parquet table, metadata catalog entry, and schema definition for your company.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteAllModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={handleConfirmDeleteAllDatasets}
              >
                Permanently Delete All Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
