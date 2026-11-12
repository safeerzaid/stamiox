'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { History, LayoutTemplate, LogOut, BookmarkPlus, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEditor } from '../../context/EditorContext';
import { MyDesignsModal } from './MyDesignsModal';

/** Avatar menu for the signed-in user: history (saved designs), save as template, log out. */
export const AccountMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const { saveAsTemplate, projectTitle } = useEditor();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'designs' | 'templates' | null>(null);
  const [naming, setNaming] = useState(false);
  const [tplName, setTplName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setNaming(false);
      }
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [open]);

  useEffect(() => {
    if (!savedMsg) return;
    const t = window.setTimeout(() => setSavedMsg(null), 2500);
    return () => window.clearTimeout(t);
  }, [savedMsg]);

  if (!user) return null;
  const display = user.username || user.name || 'Account';
  const initial = display.trim()[0]?.toUpperCase() || 'U';

  const doSaveTemplate = async () => {
    setSaving(true);
    const ok = await saveAsTemplate(tplName || projectTitle);
    setSaving(false);
    if (ok) {
      setNaming(false);
      setOpen(false);
      setSavedMsg(`Saved “${(tplName || projectTitle).trim()}” to your templates`);
    } else {
      setSavedMsg('Could not save the template');
    }
  };

  const ITEM =
    'w-full h-9 px-2.5 rounded-lg flex items-center gap-2.5 text-[13px] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer';

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={display}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold text-white bg-gradient-to-br from-[#0d99ff] to-indigo-600 ring-2 transition-shadow cursor-pointer ${
          open ? 'ring-[#0d99ff]/40' : 'ring-transparent hover:ring-slate-200 dark:hover:ring-slate-700'
        }`}
      >
        {initial}
      </button>

      {savedMsg && !open && (
        <div role="status" className="absolute right-0 top-full mt-2 whitespace-nowrap rounded-lg bg-slate-900 text-white text-[12px] px-3 py-1.5 shadow-lg flex items-center gap-1.5 fx-panel">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          {savedMsg}
        </div>
      )}

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 fx-menu">
          <div className="px-2.5 pt-1.5 pb-2.5 mb-1 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">{display}</p>
            {user.mobile && <p className="text-[12px] text-slate-500 dark:text-slate-400 tabular-nums">{user.mobile}</p>}
          </div>

          <button type="button" role="menuitem" className={ITEM} onClick={() => { setOpen(false); setModalTab('designs'); }}>
            <History className="w-4 h-4 text-slate-400" />
            My designs
          </button>

          {!naming ? (
            <button type="button" role="menuitem" className={ITEM} onClick={() => { setTplName(projectTitle); setNaming(true); }}>
              <BookmarkPlus className="w-4 h-4 text-slate-400" />
              Save as template
            </button>
          ) : (
            <div className="p-1.5 space-y-1.5">
              <input
                autoFocus
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') doSaveTemplate();
                  if (e.key === 'Escape') setNaming(false);
                }}
                placeholder="Template name"
                aria-label="Template name"
                className="w-full h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] text-slate-900 dark:text-white outline-none focus:border-[#0d99ff]"
              />
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setNaming(false)} className="flex-1 h-8 rounded-md text-[12px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={doSaveTemplate}
                  disabled={saving}
                  className="flex-1 h-8 rounded-md bg-[#0d99ff] hover:bg-[#0b87e0] disabled:opacity-70 text-white text-[12px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save template
                </button>
              </div>
            </div>
          )}

          <button type="button" role="menuitem" className={ITEM} onClick={() => { setOpen(false); setModalTab('templates'); }}>
            <LayoutTemplate className="w-4 h-4 text-slate-400" />
            Saved templates
          </button>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
          <button
            type="button"
            role="menuitem"
            className={`${ITEM} !text-rose-600 dark:!text-rose-400 hover:!bg-rose-50 dark:hover:!bg-rose-950/40`}
            onClick={() => {
              logout();
              router.replace('/login?tab=login');
            }}
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      )}

      <MyDesignsModal isOpen={modalTab !== null} initialTab={modalTab || 'designs'} onClose={() => setModalTab(null)} />
    </div>
  );
};
