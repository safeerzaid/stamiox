'use client';

import { useEffect } from 'react';

/**
 * Feeds the cursor position into --mx / --my on whichever `.fx-item` is hovered,
 * so its glow follows the pointer. One passive listener for the whole app.
 */
export function HoverFx() {
  useEffect(() => {
    let raf = 0;
    let last: { el: HTMLElement; x: number; y: number } | null = null;
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.('.fx-item, .fx-tool') as HTMLElement | null;
      if (!el) return;
      last = { el, x: e.clientX, y: e.clientY };
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!last) return;
        const r = last.el.getBoundingClientRect();
        last.el.style.setProperty('--mx', `${last.x - r.left}px`);
        last.el.style.setProperty('--my', `${last.y - r.top}px`);
      });
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
