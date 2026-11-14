'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  shortcut?: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delayMs?: number;
  className?: string;
}

const GAP = 8; // space between the trigger and the tooltip
const EDGE = 6; // keep this far from the window edges

/**
 * Small hover label. It is drawn on top of the whole page (a portal with fixed position), so side
 * panels can't cover it, and it is nudged back inside the window near the edges.
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  children,
  side = 'top',
  delayMs = 250,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number; arrow: number } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => setIsVisible(true), delayMs);
  };
  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsVisible(false);
    setPos(null);
  };

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // place it next to the trigger, then clamp it inside the window
  useLayoutEffect(() => {
    if (!isVisible || !wrapRef.current || !tipRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const t = tipRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x: number;
    let y: number;
    if (side === 'top' || side === 'bottom') {
      x = r.left + r.width / 2 - t.width / 2;
      y = side === 'top' ? r.top - GAP - t.height : r.bottom + GAP;
      if (side === 'top' && y < EDGE) y = r.bottom + GAP; // no room above → below
      if (side === 'bottom' && y + t.height > vh - EDGE) y = r.top - GAP - t.height;
    } else {
      y = r.top + r.height / 2 - t.height / 2;
      x = side === 'left' ? r.left - GAP - t.width : r.right + GAP;
      if (side === 'left' && x < EDGE) x = r.right + GAP;
      if (side === 'right' && x + t.width > vw - EDGE) x = r.left - GAP - t.width;
    }
    const cx = Math.min(Math.max(x, EDGE), vw - EDGE - t.width);
    const cy = Math.min(Math.max(y, EDGE), vh - EDGE - t.height);
    // the arrow keeps pointing at the trigger even when the box was nudged sideways
    const arrow = side === 'top' || side === 'bottom' ? r.left + r.width / 2 - cx : r.top + r.height / 2 - cy;
    setPos({ x: cx, y: cy, arrow });
  }, [isVisible, side, content, shortcut]);

  const below = pos && wrapRef.current ? pos.y >= wrapRef.current.getBoundingClientRect().bottom : side === 'bottom';
  const vertical = side === 'top' || side === 'bottom';

  return (
    <div
      ref={wrapRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isVisible &&
        content &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={tipRef}
            role="tooltip"
            style={{ position: 'fixed', left: pos?.x ?? -9999, top: pos?.y ?? -9999, visibility: pos ? 'visible' : 'hidden' }}
            className="z-[99999] pointer-events-none select-none flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/95 text-white text-[11px] font-medium leading-tight shadow-xl shadow-slate-900/30 border border-white/10 backdrop-blur-md whitespace-nowrap fx-tip-in"
          >
            <span>{content}</span>
            {shortcut && (
              <kbd className="px-1 py-0.2 rounded bg-slate-800 text-[10px] font-mono font-semibold text-slate-300 border border-slate-700">
                {shortcut}
              </kbd>
            )}
            {/* caret pointing at the trigger */}
            {pos && (
              <div
                className={`absolute w-1.5 h-1.5 bg-slate-900 rotate-45 border border-white/10 ${
                  vertical
                    ? below
                      ? 'bottom-full translate-y-1 border-b-0 border-r-0'
                      : 'top-full -translate-y-1 border-t-0 border-l-0'
                    : side === 'left'
                    ? 'left-full -translate-x-1 border-t-0 border-l-0'
                    : 'right-full translate-x-1 border-b-0 border-r-0'
                }`}
                style={vertical ? { left: pos.arrow - 3 } : { top: pos.arrow - 3 }}
              />
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
