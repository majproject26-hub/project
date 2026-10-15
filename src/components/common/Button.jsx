import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-xl';

  const variants = {
    primary: 'bg-gradient-to-r from-[#4D5A2A] to-[#748447] hover:from-[#3D4721] hover:to-[#5E6D38] text-[#F7F4E8] shadow-md shadow-[#4D5A2A]/30 focus:ring-[#748447] active:scale-[0.98]',
    secondary: 'bg-[#DCE4C2]/50 hover:bg-[#DCE4C2] text-[#25291D] dark:bg-[#2D3323] dark:hover:bg-[#39441D] dark:text-[#F7F4E8] focus:ring-[#748447] active:scale-[0.98]',
    outline: 'border border-[#DCE4C2] dark:border-[#4D5A2A] hover:bg-[#DCE4C2]/30 dark:hover:bg-[#2D3323]/60 text-[#25291D] dark:text-[#F7F4E8] focus:ring-[#748447] active:scale-[0.98]',
    ghost: 'text-[#4D5A2A] hover:text-[#25291D] hover:bg-[#DCE4C2]/30 dark:text-[#DCE4C2] dark:hover:text-[#F7F4E8] dark:hover:bg-[#2D3323]/60 focus:ring-[#748447]',
    danger: 'bg-rose-700 hover:bg-rose-600 text-white shadow-md shadow-rose-700/20 focus:ring-rose-500 active:scale-[0.98]',
    success: 'bg-gradient-to-r from-[#4D5A2A] to-[#748447] hover:from-[#3D4721] hover:to-[#5E6D38] text-[#F7F4E8] shadow-md shadow-[#4D5A2A]/20 focus:ring-[#748447] active:scale-[0.98]',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs gap-1.5',
    sm: 'px-3 py-1.5 text-xs font-semibold gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
}
