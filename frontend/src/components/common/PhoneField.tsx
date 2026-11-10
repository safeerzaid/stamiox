'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { Country, flagUrl, searchCountries } from '../../lib/countries';

/**
 * Mobile number field with a searchable country / dial-code picker.
 * Search by country name, code ("AE") or dial code ("971"); ↑ ↓ Enter Esc work in the list.
 */
export const PhoneField: React.FC<{
  country: Country;
  onCountry: (c: Country) => void;
  value: string;
  onChange: (v: string) => void;
  bad?: boolean;
}> = ({ country, onCountry, value, onChange, bad }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchCountries(query), [query]);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(Math.max(0, searchCountries('').findIndex((c) => c.iso === country.iso)));
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open, country.iso]);
  useEffect(() => setActive(0), [query]);
  // keep the highlighted row in view
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const choose = (c: Country) => {
    onCountry(c);
    setOpen(false);
    requestAnimationFrame(() => numberRef.current?.focus());
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(results.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[active]) choose(results[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={`flex items-stretch h-14 rounded-xl border bg-white dark:bg-slate-900 transition-all focus-within:border-[#0d99ff] focus-within:ring-4 focus-within:ring-[#0d99ff]/10 ${
          bad ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Country: ${country.name} ${country.dial}`}
          className="flex items-center gap-1.5 pl-3.5 pr-2.5 rounded-l-xl border-r border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          <img src={flagUrl(country.iso)} alt="" className="w-5 h-[15px] rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
          <span className="text-[14px] font-medium text-slate-800 dark:text-slate-100 tabular-nums">{country.dial}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </button>
        <div className="relative flex-1 min-w-0">
          <input
            ref={numberRef}
            id="mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={16}
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/[^\d\s-]/g, ''))}
            placeholder=" "
            className="peer absolute inset-0 w-full h-full bg-transparent outline-none rounded-r-xl pl-3.5 pr-4 pt-5 text-[15px] text-slate-900 dark:text-white tabular-nums"
          />
          <label
            htmlFor="mobile"
            className="absolute left-3.5 pointer-events-none text-slate-500 dark:text-slate-400 transition-all duration-200 top-1/2 -translate-y-1/2 text-[15px] peer-focus:top-[15px] peer-focus:text-[11px] peer-focus:text-[#0d99ff] peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:text-[11px]"
          >
            Mobile number
          </label>
        </div>
      </div>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-[0_18px_40px_-14px_rgba(15,23,42,0.35)] overflow-hidden fx-menu">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 h-9 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKey}
                placeholder="Search country or code"
                aria-label="Search country"
                className="flex-1 min-w-0 bg-transparent outline-none text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>
          <div ref={listRef} role="listbox" className="max-h-60 overflow-y-auto py-1">
            {results.length === 0 ? (
              <p className="px-4 py-6 text-center text-[13px] text-slate-400">No country found</p>
            ) : (
              results.map((c, i) => {
                const selected = c.iso === country.iso;
                return (
                  <button
                    key={c.iso}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    data-i={i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(c)}
                    className={`w-full flex items-center gap-3 px-3.5 h-10 text-left text-[14px] cursor-pointer ${
                      i === active ? 'bg-slate-100 dark:bg-slate-800' : ''
                    } ${selected ? 'text-[#0d99ff] font-medium' : 'text-slate-800 dark:text-slate-100'}`}
                  >
                    <img src={flagUrl(c.iso)} alt="" loading="lazy" className="w-5 h-[15px] rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08)] shrink-0" />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-[13px] text-slate-400 tabular-nums">{c.dial}</span>
                    {selected && <Check className="w-4 h-4 text-[#0d99ff] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
