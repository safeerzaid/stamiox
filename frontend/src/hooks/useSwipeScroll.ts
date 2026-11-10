'use client';

import { useCallback, useRef } from 'react';

/**
 * Makes a horizontal strip swipeable without a visible scrollbar:
 * mouse drag, vertical mouse wheel → sideways, and native touch swipe.
 * A drag never triggers the click of the chip under the pointer.
 *
 *   const swipe = useSwipeScroll<HTMLDivElement>();
 *   <div ref={swipe.ref} {...swipe.handlers} className="overflow-x-auto no-scrollbar">…</div>
 */
export function useSwipeScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const drag = useRef({ down: false, startX: 0, startScroll: 0, moved: false });
  const detachRef = useRef<(() => void) | null>(null);

  // Callback ref: works for elements that mount later (e.g. inside a dropdown)
  const setRef = useCallback((el: T | null) => {
    detachRef.current?.();
    detachRef.current = null;
    ref.current = el;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    detachRef.current = () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || !ref.current) return; // touch uses native swipe
      drag.current = { down: true, startX: e.clientX, startScroll: ref.current.scrollLeft, moved: false };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = drag.current;
      const el = ref.current;
      if (!d.down || !el) return;
      const dx = e.clientX - d.startX;
      if (!d.moved && Math.abs(dx) > 4) {
        d.moved = true;
        el.setPointerCapture(e.pointerId);
      }
      if (d.moved) el.scrollLeft = d.startScroll - dx;
    },
    onPointerUp: (e: React.PointerEvent) => {
      drag.current.down = false;
      if (ref.current?.hasPointerCapture(e.pointerId)) ref.current.releasePointerCapture(e.pointerId);
    },
    onClickCapture: (e: React.MouseEvent) => {
      if (drag.current.moved) {
        e.stopPropagation();
        e.preventDefault();
        drag.current.moved = false;
      }
    },
  };

  return { ref: setRef, handlers };
}
