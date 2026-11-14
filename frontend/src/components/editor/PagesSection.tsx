'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Plus, Copy, Trash2, FileText, Crown, X } from 'lucide-react';
import { useEditor, FREE_PAGE_LIMIT } from '../../context/EditorContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import { GUEST_DESIGN_LIMIT, requireLogin } from '../../lib/require-login';

/**
 * Figma-style pages: each page has its own design and layers. Switching pages keeps the
 * page you leave saved. Free accounts get FREE_PAGE_LIMIT pages; more need an upgrade.
 */
export const PagesSection: React.FC = () => {
  const { pages, activePageId, addPage, switchPage, renamePage, deletePage, duplicatePage } = useEditor();
  const { isPro, openUpgradeModal } = useSubscription();
  const { user } = useAuth();
  const isGuest = !user;
  // guests: a short free trial · free accounts: FREE_PAGE_LIMIT · Pro: no limit
  const limit = isGuest ? GUEST_DESIGN_LIMIT : isPro ? Infinity : FREE_PAGE_LIMIT;

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showLimit, setShowLimit] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const atLimit = pages.length >= limit;

  // the limit note goes away by itself
  useEffect(() => {
    if (!showLimit) return;
    const t = window.setTimeout(() => setShowLimit(false), 6000);
    return () => window.clearTimeout(t);
  }, [showLimit]);

  // keep the open page in view
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active-page="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [activePageId, pages.length]);

  const tryAdd = (fn: () => void) => {
    if (atLimit) {
      if (isGuest) requireLogin(user, 'limit'); // trial used up → log in / register
      else setShowLimit(true); // free account → upgrade
      return;
    }
    setShowLimit(false);
    fn();
  };

  const startRename = (id: string, name: string) => {
    setConfirmDeleteId(null);
    setRenamingId(id);
    setDraftName(name);
  };
  const finishRename = () => {
    if (renamingId) renamePage(renamingId, draftName);
    setRenamingId(null);
  };

  if (!pages.length) return null;

  return (
    <div className="border-b border-slate-100 dark:border-slate-800 shrink-0">
      {/* Header */}
      <div className="h-9 px-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">Pages</span>
          {isGuest ? (
            <span
              className={`h-[18px] px-1.5 rounded-full text-[10px] font-semibold tabular-nums flex items-center ${
                atLimit ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' : 'bg-[#e5f2ff] dark:bg-blue-950/60 text-[#0d99ff]'
              }`}
              title={`Free trial: ${GUEST_DESIGN_LIMIT} designs without an account`}
            >
              Trial {pages.length}/{GUEST_DESIGN_LIMIT}
            </span>
          ) : (
            !isPro && (
              <span
                className={`text-[10px] font-semibold tabular-nums ${atLimit ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}
                title={`Free plan: ${FREE_PAGE_LIMIT} pages`}
              >
                {pages.length}/{FREE_PAGE_LIMIT}
              </span>
            )
          )}
        </div>
        <button
          type="button"
          onClick={() => tryAdd(() => addPage())}
          className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={atLimit ? (isGuest ? 'Log in to create more designs' : `Free plan includes ${FREE_PAGE_LIMIT} pages`) : 'Add page'}
          aria-label="Add page"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Upgrade note when the free limit is reached */}
      {showLimit && (
        <div className="mx-2 mb-2 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 fx-lang-menu">
          <div className="flex items-start gap-2">
            <Crown className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="flex-1 text-[11.5px] leading-snug text-amber-900 dark:text-amber-200">
              Your free plan includes {FREE_PAGE_LIMIT} pages. Upgrade to add more.
            </p>
            <button
              type="button"
              onClick={() => setShowLimit(false)}
              className="text-amber-500 hover:text-amber-700 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowLimit(false);
              openUpgradeModal();
            }}
            className="mt-2 w-full h-7 rounded-lg bg-[#0d99ff] hover:bg-[#0b87e0] text-white text-[11.5px] font-semibold transition-colors cursor-pointer"
          >
            Upgrade
          </button>
        </div>
      )}

      {/* Page list */}
      <div ref={listRef} className="max-h-[176px] overflow-y-auto px-1.5 pb-1.5 space-y-0.5">
        {pages.map((p) => {
          const active = p.id === activePageId;
          if (confirmDeleteId === p.id) {
            return (
              <div key={p.id} className="h-8 px-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center gap-1.5">
                <span className="flex-1 truncate text-[11.5px] text-rose-700 dark:text-rose-300">Delete “{p.name}”?</span>
                <button
                  type="button"
                  onClick={() => {
                    deletePage(p.id);
                    setConfirmDeleteId(null);
                  }}
                  className="h-6 px-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold cursor-pointer"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="h-6 px-2 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            );
          }
          return (
            <div
              key={p.id}
              data-active-page={active}
              onClick={() => renamingId !== p.id && switchPage(p.id)}
              onDoubleClick={() => startRename(p.id, p.name)}
              className={`group h-8 pl-2.5 pr-1 rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${
                active
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
              title="Click to open · double-click to rename"
            >
              <FileText className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#0d99ff]' : 'text-slate-400'}`} />
              {renamingId === p.id ? (
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onBlur={finishRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishRename();
                    if (e.key === 'Escape') setRenamingId(null);
                    e.stopPropagation();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-w-0 h-6 px-1.5 -ml-1 rounded-md text-[12px] font-medium bg-white dark:bg-slate-900 border border-[#0d99ff] outline-none text-slate-900 dark:text-white"
                />
              ) : (
                <span className="flex-1 min-w-0 truncate text-[12px]">{p.name}</span>
              )}
              {renamingId !== p.id && (
                <span className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      tryAdd(() => duplicatePage(p.id));
                    }}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                    title="Duplicate page"
                    aria-label={`Duplicate ${p.name}`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {pages.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(p.id);
                      }}
                      className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                      title="Delete page"
                      aria-label={`Delete ${p.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
