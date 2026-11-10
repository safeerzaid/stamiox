'use client';

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
  /** 'ghost' = borderless icon button (for dense toolbars) */
  variant?: 'default' | 'ghost';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', size = 'sm', variant = 'default' }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const btnSize = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';

  return (
    <Tooltip
      content={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
      side="bottom"
    >
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
        className={variant === 'ghost'
          ? `${btnSize} rounded-md flex items-center justify-center transition-colors cursor-pointer select-none shrink-0 text-slate-500 dark:text-amber-300 hover:text-slate-900 dark:hover:text-amber-200 hover:bg-slate-100 dark:hover:bg-slate-800 ${className}`
          : `${btnSize} rounded-lg flex items-center justify-center border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 active:scale-90 cursor-pointer select-none shrink-0 ${
          isDark
            ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-750 hover:border-slate-600 shadow-2xs'
            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
        } ${className}`}
      >
        <span className="relative flex items-center justify-center">
          {isDark ? (
            <Sun className={`${iconSize} transition-transform duration-500 rotate-0 hover:rotate-45`} />
          ) : (
            <Moon className={`${iconSize} transition-transform duration-500 rotate-0 hover:-rotate-12`} />
          )}
        </span>
      </button>
    </Tooltip>
  );
};

