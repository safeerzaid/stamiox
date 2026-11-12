'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Cloud, Check, ChevronDown, BookmarkPlus, Loader2 } from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { Tooltip } from '../common/Tooltip';

/**
 * Toolbar save: the main part saves the design to the account; the ▾ part saves it as a
 * reusable template (asks for a name first).
 */
export const SaveSplitButton: React.FC = () => {
  const { saveProjectToCloud, saveAsTemplate, isSaving, hasUnsavedChanges, projectId, projectTitle, elements } = useEditor();
  const needsSave = hasUnsavedChanges || !projectId; // "Saved" only once it really is on the account
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [open]);

  useEffect(() => {
    if (!msg) return;
    const t = window.setTimeout(() => setMsg(null), 2600);
    return () => window.clearTimeout(t);
  }, [msg]);

  const saveTemplate = async () => {
    if (!elements.length) {
      setMsg({ ok: false, text: 'Add something to the stamp first' });
      return;
    }
    const title = (name || projectTitle).trim();
    setBusy(true);
    const ok = await saveAsTemplate(title);
    setBusy(false);
    setOpen(false);
    setMsg(ok ? { ok: true, text: `Saved “${title}” as a template` } : { ok: false, text: 'Could not save the template' });
  };

  const tone = needsSave
    ? 'border-[#0d99ff]/40 text-[#0d99ff] bg-[#e5f2ff] dark:bg-blue-950/60'
    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300';
  const hover = needsSave ? 'hover:bg-[#d6ebff] dark:hover:bg-blue-900/60' : 'hover:bg-slate-100 dark:hover:bg-slate-800';

  return (
    <div ref={wrapRef} className="relative shrink-0 ml-1.5">
      <div className={`flex items-stretch h-8 rounded-lg border ${tone}`}>
        <Tooltip content={isSaving ? 'Saving…' : needsSave ? 'Save to your account' : 'Saved to your account'} shortcut="Ctrl+S" side="bottom">
          <button
            type="button"
            onClick={() => saveProjectToCloud()}
            disabled={isSaving}
            aria-label="Save"
            className={`h-full pl-2.5 pr-2 rounded-l-lg flex items-center gap-1.5 text-[12px] font-semibold transition-colors cursor-pointer ${hover}`}
          >
            {isSaving ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-[#0d99ff] animate-spin" />
            ) : needsSave ? (
              <Cloud className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4 text-emerald-500" />
            )}
            <span>{isSaving ? 'Saving…' : needsSave ? 'Save' : 'Saved'}</span>
          </button>
        </Tooltip>
        <span aria-hidden className="w-px my-1.5 bg-current opacity-25" />
        <button
          type="button"
          onClick={() => {
            setName(projectTitle);
            setOpen((v) => !v);
          }}
          aria-label="More save options"
          aria-expanded={open}
          title="Save as template"
          className={`h-full w-6 rounded-r-lg flex items-center justify-center transition-colors cursor-pointer ${hover}`}
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50 fx-menu space-y-2">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-900 dark:text-white">
            <BookmarkPlus className="w-4 h-4 text-slate-400" />
            Save as template
          </p>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTemplate();
              if (e.key === 'Escape') setOpen(false);
            }}
            placeholder="Template name"
            aria-label="Template name"
            className="w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] text-slate-900 dark:text-white outline-none focus:border-[#0d99ff] focus:ring-4 focus:ring-[#0d99ff]/10"
          />
          <button
            type="button"
            onClick={saveTemplate}
            disabled={busy}
            className="w-full h-9 rounded-lg bg-[#0d99ff] hover:bg-[#0b87e0] disabled:opacity-70 text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Save template
          </button>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Find it later in My designs → Templates.</p>
        </div>
      )}

      {msg && !open && (
        <div
          role="status"
          className={`absolute right-0 top-full mt-2 whitespace-nowrap rounded-lg text-[12px] px-3 py-1.5 shadow-lg flex items-center gap-1.5 fx-panel z-50 ${
            msg.ok ? 'bg-slate-900 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {msg.ok && <Check className="w-3.5 h-3.5 text-emerald-400" />}
          {msg.text}
        </div>
      )}
    </div>
  );
};
