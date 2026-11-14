'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Languages, ChevronDown, Check, Search, Globe } from 'lucide-react';
import { INDIAN_LANGUAGES, findLanguage } from '../../../../backend/src/data/languages';

export type LanguageMode = string; // 'AUTO' | 'ENGLISH' | <language id> | <mixed id>

const STORE_KEY = 'stamiox_ai_language';

export function loadAiLanguage(): LanguageMode {
  try {
    const v = localStorage.getItem(STORE_KEY);
    if (v && (v === 'AUTO' || v === 'ENGLISH' || findLanguage(v))) return v;
  } catch {
    /* ignore */
  }
  return 'AUTO';
}

/** Short name for the button: Auto, English, हिन्दी, Hinglish, Tamil + En … */
export function shortLanguageLabel(id: LanguageMode) {
  if (id === 'AUTO') return 'Auto';
  if (id === 'ENGLISH') return 'English';
  const f = findLanguage(id);
  if (!f) return 'Auto';
  return f.mixed ? f.lang.mixName || `${f.lang.name} + En` : f.lang.native;
}

/** Reply-language menu for Clixio AI: search, Auto Detect, English, and every Indian language (script or mixed with English). */
export const AiLanguagePicker: React.FC<{
  value: LanguageMode;
  onChange: (id: LanguageMode) => void;
  onOpen?: () => void;
}> = ({ value, onChange, onOpen }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  // keep the menu inside the side panel (the button sits in the middle of it)
  const [place, setPlace] = useState<{ left: number; width: number }>({ left: 0, width: 272 });

  // close with a short fade instead of vanishing
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const close = () => {
    if (closeTimer.current !== null) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      setClosing(false);
      setOpen(false);
    }, 180);
  };
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const btn = wrapRef.current?.getBoundingClientRect();
    const panel = (wrapRef.current?.closest('aside') as HTMLElement | null)?.getBoundingClientRect();
    if (btn && panel) {
      const width = Math.min(272, panel.width - 16);
      const minLeft = panel.left + 8 - btn.left;
      const maxLeft = panel.right - 8 - width - btn.left;
      setPlace({ width, left: Math.max(minLeft, Math.min(0, maxLeft)) });
    }
    const t = window.setTimeout(() => searchRef.current?.focus(), 60);
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) closeRef.current();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (id: LanguageMode) => {
    onChange(id);
    try {
      localStorage.setItem(STORE_KEY, id);
    } catch {
      /* ignore */
    }
    close();
  };

  const q = query.trim().toLowerCase();
  const matches = (...words: (string | undefined)[]) => !q || words.some((w) => w && w.toLowerCase().includes(q));
  const list = useMemo(
    () => INDIAN_LANGUAGES.filter((l) => matches(l.name, l.native, l.mixName, l.mixName ? '' : `${l.name} english`)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q]
  );
  const showAuto = matches('auto detect', 'automatic', 'smart');
  const showEnglish = matches('english');

  const fixedRow = (id: LanguageMode, icon: React.ReactNode, title: string, sub: string, delay = 0) => {
    const on = value === id;
    return (
      <button
        type="button"
        onClick={() => pick(id)}
        style={{ animationDelay: `${delay}ms` }}
        className={`fx-lang-row w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
          on ? 'bg-[#e5f2ff] dark:bg-blue-950/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${on ? 'bg-[#0d99ff] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300'}`}>{icon}</span>
        <span className="flex-1 min-w-0">
          <span className={`block text-[12px] font-semibold ${on ? 'text-[#0d99ff]' : 'text-slate-800 dark:text-slate-100'}`}>{title}</span>
          <span className="block text-[10.5px] text-slate-400 dark:text-slate-500 truncate">{sub}</span>
        </span>
        {on && <Check className="w-3.5 h-3.5 text-[#0d99ff] shrink-0" />}
      </button>
    );
  };

  const chip = (id: string, label: string, title: string) => {
    const on = value === id;
    return (
      <button
        type="button"
        onClick={() => pick(id)}
        title={title}
        className={`h-6 px-2 rounded-full text-[11px] font-medium border transition-colors cursor-pointer whitespace-nowrap ${
          on
            ? 'bg-[#0d99ff] border-[#0d99ff] text-white'
            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#0d99ff] hover:text-[#0d99ff]'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (open) close();
          else {
            setOpen(true);
            onOpen?.();
          }
        }}
        aria-expanded={open && !closing}
        aria-haspopup="dialog"
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 max-w-[120px]"
        title="Reply language"
      >
        <Languages className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />
        <span className="truncate">{shortLanguageLabel(value)}</span>
        <ChevronDown className={`w-2.5 h-2.5 text-slate-400 dark:text-slate-500 transition-transform shrink-0 ${open && !closing ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Reply language"
          style={{ left: place.left, width: place.width }}
          className={`absolute bottom-[calc(100%+6px)] z-50 max-h-[380px] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl fx-lang-menu ${closing ? 'is-closing' : ''}`}
        >
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1 pb-1.5">Reply language</p>
            <div className="flex items-center gap-2 h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:border-[#0d99ff] transition-colors">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search languages…"
                aria-label="Search languages"
                className="flex-1 min-w-0 bg-transparent outline-none text-[12px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 min-h-0">
            {showAuto && fixedRow('AUTO', <Globe className="w-3.5 h-3.5" />, 'Auto detect', 'Replies in the language you type', 40)}
            {showEnglish && fixedRow('ENGLISH', 'En', 'English', 'Plain English replies', 70)}

            {list.length > 0 && (
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2.5 pt-2 pb-1">Indian languages</p>
            )}
            {list.map((l, i) => {
              const active = value === l.id || value === l.mixId;
              return (
                <div
                  key={l.id}
                  style={{ animationDelay: `${Math.min(100 + i * 35, 420)}ms` }}
                  className={`fx-lang-row flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${active ? 'bg-[#e5f2ff]/70 dark:bg-blue-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12.5px] font-medium text-slate-800 dark:text-slate-100 truncate">{l.native}</span>
                    <span className="block text-[10.5px] text-slate-400 dark:text-slate-500 truncate">{l.name}</span>
                  </span>
                  {chip(l.id, 'Script', `Reply in ${l.name} script (${l.native})`)}
                  {chip(l.mixId, l.mixName || '+ English', `Reply in ${l.name} mixed with English, in English letters`)}
                </div>
              );
            })}

            {!showAuto && !showEnglish && list.length === 0 && (
              <p className="text-[12px] text-slate-400 text-center py-6">No language matches “{query}”.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
