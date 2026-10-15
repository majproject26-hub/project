import React from 'react';

export function SkeletonLoader({ type = 'card', count = 1, className = '' }) {
  if (type === 'card') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 animate-pulse"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-7 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-40 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 animate-pulse ${className}`}>
        <div className="h-9 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg mb-4" />
        {Array.from({ length: count || 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center py-2 border-b border-slate-100 dark:border-slate-800/60">
            <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-1/4 bg-slate-100 dark:bg-slate-800/80 rounded" />
            <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-4 w-1/4 bg-slate-100 dark:bg-slate-800/80 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 animate-pulse ${className}`}>
        <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800/40 rounded-xl flex items-end justify-between p-6 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-full bg-slate-200 dark:bg-slate-800 rounded-t"
              style={{ height: `${20 + (i % 5) * 18}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse ${className}`} />
  );
}
