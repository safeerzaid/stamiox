'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, History, ArrowRight } from 'lucide-react';
import { ApiService } from '../../lib/api';
import { generateStampSvg } from '../../lib/svg-generator';
import { useEditor } from '../../context/EditorContext';
import { MyDesignsModal } from './MyDesignsModal';
import { useSmoothClose } from '../../hooks/useSmoothClose';

const SHOWN_KEY = 'stamiox_recent_shown';
const MAX = 6;

const timeAgo = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * True when the editor was the first page of this visit (typed URL, bookmark, new tab, refresh) —
 * not when another page (Templates, AI maker, home) just sent a design here.
 */
function openedDirectly() {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return !!nav && new URL(nav.name).pathname.replace(/\/$/, '') === '/editor';
  } catch {
    return false;
  }
}

// decided once per page load: React may run setup code twice in development
let decision: boolean | null = null;
function decideOnce() {
  if (decision !== null) return decision;
  if (typeof window === 'undefined') return false;
  let alreadyShown = false;
  try {
    alreadyShown = sessionStorage.getItem(SHOWN_KEY) === '1';
    sessionStorage.setItem(SHOWN_KEY, '1');
  } catch {
    /* storage blocked — still show once for this load */
  }
  decision = !alreadyShown && openedDirectly();
  return decision;
}

/** On opening the Studio: the latest saved designs, to continue one with one click. Once per tab. */
export const RecentDesignsModal: React.FC = () => {
  const { loadProject, projectId, viewRestored } = useEditor();
  const [designs, setDesigns] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const { closing, close } = useSmoothClose(() => setOpen(false), open);

  const [eligible] = useState(decideOnce);

  useEffect(() => {
    if (!viewRestored || !eligible) return;
    let cancelled = false;
    ApiService.getProjects()
      .then((res) => {
        if (cancelled) return;
        const list = (res.projects || [])
          .filter((p: any) => !p.isTemplate)
          .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        if (list.length) {
          setDesigns(list);
          setOpen(true);
        }
      })
      .catch(() => {
        /* offline / signed out — nothing to show */
      });
    return () => {
      cancelled = true;
    };
  }, [viewRestored, eligible]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const recent = designs.slice(0, MAX);
  const previews = useMemo(() => {
    const map: Record<string, { __html: string }> = {};
    for (const p of recent) {
      try {
        map[p.id] = {
          __html: generateStampSvg({ widthMm: p.widthMm, heightMm: p.heightMm, inkColor: p.inkColor || '#111827', elements: p.elementsJson || [], shape: p.shape })
            .replace(/width="[^"]*mm"/, 'width="100%"')
            .replace(/height="[^"]*mm"/, 'height="100%"'),
        };
      } catch {
        map[p.id] = { __html: '' };
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designs]);

  if (showAll) return <MyDesignsModal isOpen onClose={() => setShowAll(false)} />;
  if (!open) return null;

  const pick = (p: any) => {
    if (p.id !== projectId) loadProject(p);
    close();
  };

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm fx-modal-backdrop ${closing ? 'fx-modal-closing' : ''}`} onMouseDown={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recent-designs-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[86vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl fx-modal-open"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-[#e5f2ff] dark:bg-blue-950/60 text-[#0d99ff] flex items-center justify-center shrink-0">
              <History className="w-4 h-4" />
            </span>
            <div>
              <h2 id="recent-designs-title" className="text-[16px] font-semibold text-slate-900 dark:text-white">
                Continue a recent design
              </h2>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">Pick up where you left off, or keep working on the open one.</p>
            </div>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {recent.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pick(p)}
                title={`Open ${p.title}`}
                className="group text-left rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 hover:border-[#0d99ff] hover:shadow-md active:scale-[0.97] transition-all cursor-pointer"
              >
                <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-950/50 group-hover:bg-[#f0f7ff] dark:group-hover:bg-slate-800/70 p-3 flex items-center justify-center transition-colors">
                  <div className="ink-preview w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full" dangerouslySetInnerHTML={previews[p.id]} />
                </div>
                <div className="px-2.5 py-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[12px] font-medium text-slate-800 dark:text-slate-100 truncate group-hover:text-[#0d99ff]">{p.title}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {p.id === projectId ? <span className="font-semibold text-[#0d99ff]">Open now · </span> : null}
                    Saved {timeAgo(p.updatedAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800">
          {designs.length > MAX ? (
            <button type="button" onClick={() => { setOpen(false); setShowAll(true); }} className="h-9 px-3 rounded-full text-[13px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer">
              All designs ({designs.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span />
          )}
          <button type="button" onClick={close} className="h-9 px-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[13px] font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 cursor-pointer">
            Keep current design
          </button>
        </div>
      </div>
    </div>
  );
};
