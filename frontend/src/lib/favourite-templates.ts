'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Favourite templates — a list of template ids kept in this browser.
 * Every component using the hook stays in sync (same tab via a custom event, other tabs via `storage`).
 */
const KEY = 'stamiox_fav_templates';
const EVENT = 'stamiox:fav-templates';

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* storage blocked — favourites just won't persist */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: ids }));
}

export function useFavouriteTemplates() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read());
    const onLocal = (e: Event) => setIds((e as CustomEvent<string[]>).detail);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setIds(read());
    };
    window.addEventListener(EVENT, onLocal);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT, onLocal);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const isFavourite = useCallback((id: string) => ids.includes(id), [ids]);

  /** Newest favourite goes first. */
  const toggleFavourite = useCallback((id: string) => {
    const cur = read();
    write(cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur]);
  }, []);

  return { favouriteIds: ids, isFavourite, toggleFavourite };
}
