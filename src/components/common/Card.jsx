import React from 'react';

export function Card({
  children,
  className = '',
  hover = false,
  glass = false,
  ...props
}) {
  const hoverClass = hover ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50' : '';
  const glassClass = glass ? 'glass-panel' : 'bg-white dark:bg-slate-900';

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm ${glassClass} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  children,
  className = '',
}) {
  return (
    <div className={`p-5 pb-4 flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 ${className}`}>
      {title || subtitle ? (
        <div className="space-y-0.5">
          {title && <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      ) : null}
      {children}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`p-4 px-5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/80 rounded-b-2xl flex items-center justify-between gap-3 ${className}`}>
      {children}
    </div>
  );
}
