import React from 'react';

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
  ...props
}) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    primary: 'bg-[#DCE4C2]/60 text-[#25291D] dark:bg-[#4D5A2A]/40 dark:text-[#DCE4C2] border-[#748447]/30 dark:border-[#748447]/50',
    teal: 'bg-[#748447]/15 text-[#4D5A2A] dark:bg-[#748447]/30 dark:text-[#DCE4C2] border-[#748447]/30 dark:border-[#748447]/50',
    emerald: 'bg-[#4D5A2A]/15 text-[#4D5A2A] dark:bg-[#4D5A2A]/40 dark:text-[#DCE4C2] border-[#4D5A2A]/30 dark:border-[#748447]/50',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    indigo: 'bg-[#25291D]/10 text-[#25291D] dark:bg-[#25291D] dark:text-[#DCE4C2] border-[#4D5A2A]/30 dark:border-[#4D5A2A]',
    purple: 'bg-[#4D5A2A]/20 text-[#25291D] dark:bg-[#748447]/30 dark:text-[#DCE4C2] border-[#4D5A2A]/40 dark:border-[#748447]/60',
    olive: 'bg-[#4D5A2A]/15 text-[#4D5A2A] dark:bg-[#4D5A2A]/50 dark:text-[#DCE4C2] border-[#4D5A2A]/30 dark:border-[#748447]/50',
    sage: 'bg-[#748447]/15 text-[#748447] dark:bg-[#748447]/40 dark:text-[#DCE4C2] border-[#748447]/30 dark:border-[#748447]/50',
    ivory: 'bg-[#F7F4E8] text-[#25291D] dark:bg-[#25291D] dark:text-[#F7F4E8] border-[#DCE4C2] dark:border-[#4D5A2A]',
    // Role shortcuts
    ADMIN: 'bg-[#25291D]/15 text-[#25291D] dark:bg-[#DCE4C2]/20 dark:text-[#F7F4E8] border-[#25291D]/30 dark:border-[#DCE4C2]/30 font-semibold',
    HR: 'bg-[#4D5A2A]/15 text-[#4D5A2A] dark:bg-[#4D5A2A]/50 dark:text-[#DCE4C2] border-[#4D5A2A]/40 dark:border-[#748447]/50 font-semibold',
    STAFF: 'bg-[#DCE4C2] text-[#25291D] dark:bg-[#748447]/30 dark:text-[#DCE4C2] border-[#748447]/40 dark:border-[#4D5A2A] font-semibold',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-[#4D5A2A]',
    teal: 'bg-[#748447]',
    emerald: 'bg-[#4D5A2A]',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    indigo: 'bg-[#25291D]',
    purple: 'bg-[#4D5A2A]',
    olive: 'bg-[#4D5A2A]',
    sage: 'bg-[#748447]',
    ivory: 'bg-[#DCE4C2]',
    ADMIN: 'bg-[#25291D] dark:bg-[#DCE4C2]',
    HR: 'bg-[#4D5A2A] dark:bg-[#748447]',
    STAFF: 'bg-[#748447] dark:bg-[#DCE4C2]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || 'bg-slate-400'}`} />}
      {children}
    </span>
  );
}
