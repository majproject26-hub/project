import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * QuerixLogo Component
 * Features the signature 'Q' mark with 3 ascending analytical bars and dynamic swoosh tail.
 * 
 * - Light Theme: User-uploaded Olive & Sage signature mark on warm Ivory badge (#F7F4E8)
 * - Dark Theme:  Ivory/Sage gradient vector mark for dark environments (#F7F4E8 / #DCE4C2)
 */
export function QuerixLogo({
  size = 'md',
  showText = true,
  showTagline = false,
  tagline = 'A Unified Multi-Tenant Lakehouse Analytics',
  variant = 'auto', // 'auto' | 'light' | 'dark'
  transparent = false,
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
  const borderRadius = transparent ? 0 : Math.max(4, Math.round(pixelSize * 0.22));

  // Determine active theme from context (with fallback if outside ThemeProvider)
  let isContextDark = false;
  try {
    const themeContext = useTheme();
    isContextDark = themeContext ? themeContext.isDark : false;
  } catch {
    isContextDark = false;
  }

  const isDark = variant === 'dark' || (variant === 'auto' && isContextDark);

  // Image sources for light and dark themes
  const lightLogoSrc = transparent
    ? '/querix-logo-light-transparent.png'
    : '/querix-logo-light.png';

  const darkLogoSrc = transparent
    ? '/querix-logo-dark-transparent.png'
    : '/querix-logo-dark.png';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Light Theme Icon: Shown when isDark is false */}
      {!isDark ? (
        <img
          src={lightLogoSrc}
          alt="QUERIX"
          width={pixelSize}
          height={pixelSize}
          style={{
            width: `${pixelSize}px`,
            height: `${pixelSize}px`,
            borderRadius: `${borderRadius}px`,
          }}
          className={`shrink-0 object-contain transition-transform duration-200 group-hover:scale-105 select-none ${
            transparent ? '' : 'shadow-xs border border-[#4D5A2A]/20'
          }`}
        />
      ) : (
        /* Dark Theme Icon: User-uploaded Dark Theme Icon on Deep Olive background */
        <img
          src={darkLogoSrc}
          alt="QUERIX"
          width={pixelSize}
          height={pixelSize}
          style={{
            width: `${pixelSize}px`,
            height: `${pixelSize}px`,
            borderRadius: `${borderRadius}px`,
          }}
          className={`shrink-0 object-contain transition-transform duration-200 group-hover:scale-105 select-none ${
            transparent ? '' : 'shadow-xs border border-[#748447]/30'
          }`}
        />
      )}

      {/* Typography: QUERIX & Tagline */}
      {showText && (
        <div className={`flex flex-col ${textClassName}`}>
          <div className="flex items-center gap-1.5">
            <span
              className={`font-extrabold tracking-[0.22em] uppercase font-sans leading-none text-base sm:text-lg ${
                isDark ? 'text-[#F7F4E8]' : 'text-[#25291D]'
              }`}
            >
              QUERIX
            </span>
          </div>

          {showTagline && (
            <span
              className={`text-[10px] font-medium tracking-tight mt-1 line-clamp-1 ${
                isDark ? 'text-[#DCE4C2]/85' : 'text-[#4D5A2A]'
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
