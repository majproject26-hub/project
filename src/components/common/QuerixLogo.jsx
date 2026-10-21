import React from 'react';

/**
 * QuerixLogo Component
 * Features the signature 'Q' mark with 3 ascending analytical bars and dynamic swoosh tail.
 * 
 * Brand Colors:
 * - Deep Olive: #25291D
 * - Olive:      #4D5A2A
 * - Sage Olive: #748447
 * - Pale Sage:  #DCE4C2
 * - Ivory:      #F7F4E8
 */
export function QuerixLogo({
  size = 'md',
  showText = true,
  showTagline = false,
  tagline = 'A Unified Multi-Tenant Lakehouse Analytics',
  variant = 'auto', // 'auto' | 'light' | 'dark'
  className = '',
  textClassName = '',
}) {
  const sizeMap = {
    xs: 20,
    sm: 26,
    md: 34,
    lg: 44,
    xl: 60,
    '2xl': 88,
  };

  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 34;

  // Unique gradient IDs to avoid SVG collision across pages
  const idPrefix = React.useId().replace(/:/g, '');
  const ringGradId = `querix-ring-${idPrefix}`;
  const swooshGradId = `querix-swoosh-${idPrefix}`;

  // Determine active fill styling
  const isDark = variant === 'dark';
  const isLight = variant === 'light';

  const ringFill = isDark 
    ? `url(#${ringGradId}-dark)` 
    : isLight 
    ? `url(#${ringGradId}-light)` 
    : undefined;

  const swooshFill = isDark 
    ? `url(#${swooshGradId}-dark)` 
    : isLight 
    ? `url(#${swooshGradId}-light)` 
    : undefined;

  const barFill = isDark 
    ? '#DCE4C2' 
    : isLight 
    ? '#4D5A2A' 
    : undefined;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* SVG Icon Mark */}
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 group-hover:scale-105"
        aria-label="QUERIX Logo Mark"
      >
        <defs>
          {/* Light Mode Gradient (Deep Olive to Olive) */}
          <linearGradient id={`${ringGradId}-light`} x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#4D5A2A" />
            <stop offset="60%" stopColor="#38431E" />
            <stop offset="100%" stopColor="#25291D" />
          </linearGradient>
          <linearGradient id={`${swooshGradId}-light`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#748447" />
            <stop offset="50%" stopColor="#4D5A2A" />
            <stop offset="100%" stopColor="#25291D" />
          </linearGradient>

          {/* Dark Mode Gradient (Ivory to Pale Sage to Sage Olive) */}
          <linearGradient id={`${ringGradId}-dark`} x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#F7F4E8" />
            <stop offset="55%" stopColor="#DCE4C2" />
            <stop offset="100%" stopColor="#A4B774" />
          </linearGradient>
          <linearGradient id={`${swooshGradId}-dark`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F7F4E8" />
            <stop offset="45%" stopColor="#DCE4C2" />
            <stop offset="100%" stopColor="#748447" />
          </linearGradient>

          {/* Auto Mode Gradients */}
          <linearGradient id={`${ringGradId}-auto-light`} x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#4D5A2A" />
            <stop offset="100%" stopColor="#25291D" />
          </linearGradient>
        </defs>

        <g>
          {/* Main Q Outer Ring */}
          <path
            d="M 68 67.5
               A 36 36 0 1 1 76.5 53
               L 66.5 50.5
               A 25.5 25.5 0 1 0 60 63.5
               Z"
            fill={ringFill}
            className={!ringFill ? "fill-[#38431E] dark:fill-[#DCE4C2] transition-colors" : ""}
          />

          {/* 3 Ascending Analytical Bars */}
          {/* Bar 1 (Short) */}
          <rect
            x="32.5"
            y="44"
            width="6.5"
            height="18"
            rx="1.5"
            fill={barFill}
            className={!barFill ? "fill-[#4D5A2A] dark:fill-[#DCE4C2] transition-colors" : ""}
          />
          {/* Bar 2 (Medium) */}
          <rect
            x="42.5"
            y="32"
            width="6.5"
            height="30"
            rx="1.5"
            fill={barFill}
            className={!barFill ? "fill-[#4D5A2A] dark:fill-[#DCE4C2] transition-colors" : ""}
          />
          {/* Bar 3 (Tall) */}
          <rect
            x="52.5"
            y="20"
            width="6.5"
            height="42"
            rx="1.5"
            fill={barFill}
            className={!barFill ? "fill-[#4D5A2A] dark:fill-[#DCE4C2] transition-colors" : ""}
          />

          {/* Dynamic Q Tail / Swoosh */}
          <path
            d="M 45 64
               C 54 58, 68 56, 76 65
               C 80 69, 86 74, 94 75
               C 85 81, 74 80, 64 73
               C 56 67, 50 66, 45 64
               Z"
            fill={swooshFill}
            className={!swooshFill ? "fill-[#748447] dark:fill-[#DCE4C2] opacity-95 transition-all" : "opacity-95 transition-all"}
          />
        </g>
      </svg>

      {/* Typography: QUERIX & Tagline */}
      {showText && (
        <div className={`flex flex-col ${textClassName}`}>
          <div className="flex items-center gap-1.5">
            <span
              className={`font-extrabold tracking-[0.22em] uppercase font-sans leading-none text-base sm:text-lg ${
                isDark
                  ? 'text-[#F7F4E8]'
                  : isLight
                  ? 'text-[#25291D]'
                  : 'text-[#25291D] dark:text-[#F7F4E8]'
              }`}
            >
              QUERIX
            </span>
          </div>

          {showTagline && (
            <span
              className={`text-[10px] font-medium tracking-tight mt-1 line-clamp-1 ${
                isDark
                  ? 'text-[#DCE4C2]/85'
                  : isLight
                  ? 'text-[#4D5A2A]'
                  : 'text-slate-500 dark:text-[#DCE4C2]/80'
              }`}
            >
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default QuerixLogo;
