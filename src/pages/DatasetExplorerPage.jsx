import React, { useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Database,
  LayoutGrid,
  List,
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Terminal,
  BarChart3,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  ArrowRight,
  HardDrive,
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';

export function DatasetExplorerPage() {
  const { currentUser, currentCompany } = useAuth();
  const { datasets, deleteDataset, updateDataset } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();

  const role = currentUser ? currentUser.role : 'STAFF';
  const isAdmin = role === 'ADMIN';

  const canDeleteDataset = (dataset) => {
    if (!currentUser || !dataset) return false;
    if (isAdmin) return true; // Admin can delete all the data
    // The person who uploaded the data can delete the data they uploaded
    return (
      (dataset.uploaderId && currentUser.id && dataset.uploaderId === currentUser.id) ||
      (dataset.uploaderEmail && currentUser.email && dataset.uploaderEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
      (dataset.uploaderName && currentUser.name && dataset.uploaderName.toLowerCase() === currentUser.name.toLowerCase())
    );
  };

  const canEditDataset = (dataset) => {
    return canDeleteDataset(dataset);
  };

  // Filters & layout state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('all');

  // Modal states for Rename & Delete
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameName, setRenameName] = useState('');
  const [renameDisplayName, setRenameDisplayName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set();
    datasets.forEach((d) => (d.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [datasets]);

  // Filter datasets
  const filteredDatasets = useMemo(() => {
    return datasets.filter((d) => {
      const matchSearch =
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.displayName && d.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchTag = selectedTag === 'all' || (d.tags && d.tags.includes(selectedTag));
      const matchFormat = selectedFormat === 'all' || d.format.toLowerCase().includes(selectedFormat.toLowerCase());

      return matchSearch && matchTag && matchFormat;
    });
  }, [datasets, searchTerm, selectedTag, selectedFormat]);

  const handleDownloadCsv = (dataset, e) => {
    e.stopPropagation();
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
      title: 'Export Started',
      message: `Exporting ${dataset.name} as CSV file.`,
      type: 'info',
    });
  };

  const handleOpenRename = (dataset, e) => {
    e.stopPropagation();
    setRenameTarget(dataset);
    setRenameName(dataset.name);
    setRenameDisplayName(dataset.displayName || dataset.name);
  };

  const handleSaveRename = () => {
    if (!renameTarget) return;
    updateDataset(renameTarget.id, {
      name: renameName,
      displayName: renameDisplayName,
    });
    setRenameTarget(null);
    toast({
      title: 'Dataset Renamed',
      message: `Updated name to ${renameName}.`,
      type: 'success',
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteDataset(deleteTarget.id);
    setDeleteTarget(null);
    toast({
      title: 'Dataset Deleted',
      message: 'Dataset permanently removed from storage catalog.',
      type: 'success',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dataset Catalog & Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Browse and inspect isolated columnar tables for organization{' '}
            <span className="font-mono font-semibold text-teal-600 dark:text-teal-400">{currentCompany?.id}</span>.
          </p>
        </div>

        <NavLink to="/upload">
          <Button variant="primary" size="sm" icon={UploadCloud}>
            Upload New Dataset
          </Button>
        </NavLink>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search datasets by name, tags, description..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Format filter */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">All Formats</option>
            <option value="snappy">Parquet (Snappy)</option>
            <option value="zstd">Parquet (ZSTD)</option>
          </select>

          {/* Tag filter */}
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">All Tags ({allTags.length})</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dataset Content: Grid vs List */}
      {filteredDatasets.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No Datasets Match Your Filter"
          description="Try adjusting your search criteria or upload a new dataset into this lakehouse partition."
          actionLabel={canManage ? 'Upload Dataset' : undefined}
          onAction={() => navigate('/upload')}
        />
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDatasets.map((d) => (
            <Card
              key={d.id}
              hover
              onClick={() => navigate(`/datasets/${d.id}`)}
              className="p-5 flex flex-col justify-between cursor-pointer group"
            >
              <div className="space-y-3">
                {/* Card Top */}
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#4D5A2A]/15 to-[#748447]/15 text-[#4D5A2A] dark:text-[#DCE4C2] group-hover:scale-105 transition-transform border border-[#DCE4C2] dark:border-[#4D5A2A]/40">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <Badge variant={d.accessLevel === 'All' ? 'default' : 'primary'} size="xs">
                    {d.accessLevel}
                  </Badge>
                </div>

                {/* Name & Title */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    {d.displayName || d.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">{d.name}</p>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {d.description}
                </p>

                {/* Tags */}
                {d.tags && (
                  <div className="flex flex-wrap gap-1">
                    {d.tags.slice(0, 3).map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Bottom Meta & Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="block font-semibold text-slate-800 dark:text-slate-200">
                      {d.rowCount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">Rows</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="block font-semibold text-slate-800 dark:text-slate-200">
                      {d.colCount || d.schema?.length}
                    </span>
                    <span className="text-[10px] text-slate-400">Cols</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="block font-semibold text-slate-800 dark:text-slate-200">{d.size}</span>
                    <span className="text-[10px] text-slate-400">Parquet</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">
                    By {d.uploaderName} • {d.uploadDate}
                  </span>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleDownloadCsv(d, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Download as CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {canEditDataset(d) && (
                      <button
                        onClick={(e) => handleOpenRename(d, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDeleteDataset(d) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(d);
                        }}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title={isAdmin ? 'Delete Dataset (Admin)' : 'Delete My Dataset'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* List Layout */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-3 px-4 font-semibold">Dataset</th>
                  <th className="py-3 px-4 font-semibold">Rows</th>
                  <th className="py-3 px-4 font-semibold">Columns</th>
                  <th className="py-3 px-4 font-semibold">Size</th>
                  <th className="py-3 px-4 font-semibold">Format</th>
                  <th className="py-3 px-4 font-semibold">Access</th>
                  <th className="py-3 px-4 font-semibold">Uploader</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredDatasets.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => navigate(`/datasets/${d.id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <FileSpreadsheet className="w-4 h-4 text-sky-500 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {d.displayName || d.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">{d.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">{d.rowCount.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono">{d.colCount || d.schema?.length}</td>
                    <td className="py-3 px-4 font-mono">{d.size}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{d.format}</td>
                    <td className="py-3 px-4">
                      <Badge variant={d.accessLevel === 'All' ? 'default' : 'primary'} size="xs">
                        {d.accessLevel}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {d.uploaderName}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => handleDownloadCsv(d, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          title="Download CSV"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {canEditDataset(d) && (
                          <button
                            onClick={(e) => handleOpenRename(d, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title="Rename"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDeleteDataset(d) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(d);
                            }}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600"
                            title={isAdmin ? 'Delete Dataset (Admin)' : 'Delete My Dataset'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Rename Dataset Modal */}
      <Modal
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title="Rename Dataset"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={renameDisplayName}
              onChange={(e) => setRenameDisplayName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Parquet Filename
            </label>
            <input
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveRename}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete "${deleteTarget?.name}"?`}
        message={`Are you sure you want to permanently remove this dataset from ${currentCompany?.id}? ${
          isAdmin
            ? 'As an Administrator, you have permission to delete any dataset.'
            : 'As the uploader, you have permission to delete this dataset.'
        } Any queries and pinned dashboard widgets depending on this table will be affected.`}
      />
    </div>
  );
}
