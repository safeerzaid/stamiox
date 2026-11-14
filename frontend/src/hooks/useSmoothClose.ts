'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Matches the `.fx-modal-closing` animation in globals.css. */
export const MODAL_CLOSE_MS = 380;

/**
 * Lets a modal play its closing animation before it unmounts.
 * Put `fx-modal-closing` on the modal's backdrop while `closing` is true, and call `close()` instead of `onClose()`.
 */
export function useSmoothClose(onClose: () => void, isOpen = true, ms = MODAL_CLOSE_MS) {
  const [closing, setClosing] = useState(false);
  const timer = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const close = useCallback(() => {
    if (timer.current !== null) return; // already closing
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      onCloseRef.current();
      return;
    }
    setClosing(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      onCloseRef.current();
    }, ms);
  }, [ms]);

  // ready for the next opening
  useEffect(() => {
    if (isOpen) setClosing(false);
  }, [isOpen]);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    []
  );

  return { closing, close };
}
