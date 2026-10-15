import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, CheckCircle2 } from 'lucide-react';
import { PRESET_CSV_FILES } from '../../data/mockData';
import { Button } from './Button';

export function FileDropzone({
  onFileSelect,
  accept = '.csv,.parquet,.json',
  maxSizeMB = 50,
  className = '',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndProcessFile = (file) => {
    setError(null);
    if (!file) return;

    // Check size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File exceeds the maximum allowable limit of ${maxSizeMB} MB.`);
      return;
    }

    // Read content for CSV preview if CSV
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const headers = lines[0] ? lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '')) : [];
      const sampleRows = lines.slice(1, 11).map(line =>
        line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      );

      onFileSelect({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        rowCount: lines.length - 1,
        headers,
        sampleRows,
        rawFile: file,
      });
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleLoadPreset = (preset) => {
    setError(null);
    onFileSelect({
      name: preset.name,
      size: preset.size,
      rowCount: preset.rowCount,
      headers: preset.headers,
      sampleRows: preset.sampleRows,
      isPreset: true,
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-sky-400 dark:hover:border-sky-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-[#4D5A2A]/15 to-[#748447]/15 border border-[#DCE4C2] dark:border-[#4D5A2A]/50 flex items-center justify-center text-[#4D5A2A] dark:text-[#DCE4C2] shadow-sm">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
          Drag and drop your dataset here
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
          Supports CSV, Parquet, and JSON files up to {maxSizeMB} MB. Automatic schema detection and compression indexing included.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <FileSpreadsheet className="w-4 h-4 text-sky-500" />
          <span>Browse local files</span>
        </div>

        {error && (
          <p className="mt-3 text-xs text-rose-500 font-medium bg-rose-50 dark:bg-rose-950/60 py-1.5 px-3 rounded-lg max-w-sm mx-auto">
            {error}
          </p>
        )}
      </div>

      {/* Preset datasets for immediate 1-click testing */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Or test with realistic preset sample datasets
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRESET_CSV_FILES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadPreset(preset)}
              className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500 dark:hover:border-teal-500 text-left transition-all hover:-translate-y-0.5 shadow-sm group"
            >
              <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400">
                  {preset.name}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>{preset.size}</span>
                  <span>•</span>
                  <span>{preset.rowCount.toLocaleString()} rows</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
