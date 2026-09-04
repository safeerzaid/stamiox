'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  shortcut?: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delayMs?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  children,
  side = 'top',
  delayMs = 250,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayMs);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Positioning classes
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isVisible && content && (
        <div
          className={`absolute z-[99999] pointer-events-none select-none flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/95 text-white text-[11px] font-medium leading-tight shadow-xl shadow-slate-900/30 border border-white/10 backdrop-blur-md whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 ${positionClasses[side]}`}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="px-1 py-0.2 rounded bg-slate-800 text-[10px] font-mono font-semibold text-slate-300 border border-slate-700">
              {shortcut}
            </kbd>
          )}
          {/* Subtle Caret Arrow */}
          <div
            className={`absolute w-1.5 h-1.5 bg-slate-900 rotate-45 border border-white/10 ${
              side === 'top'
                ? 'top-full -translate-y-1 left-1/2 -translate-x-1/2 border-t-0 border-l-0'
                : side === 'bottom'
                ? 'bottom-full translate-y-1 left-1/2 -translate-x-1/2 border-b-0 border-r-0'
                : side === 'left'
                ? 'left-full -translate-x-1 top-1/2 -translate-y-1/2 border-t-0 border-l-0'
                : 'right-full translate-x-1 top-1/2 -translate-y-1/2 border-b-0 border-r-0'
            }`}
          />
        </div>
      )}
    </div>
  );
};
