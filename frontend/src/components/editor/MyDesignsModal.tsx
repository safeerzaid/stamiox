'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, Search, Trash2, FolderOpen, Loader2 } from 'lucide-react';
import { ApiService } from '../../lib/api';
import { generateStampSvg } from '../../lib/svg-generator';
import { useEditor } from '../../context/EditorContext';
import { useSmoothClose } from '../../hooks/useSmoothClose';

type Tab = 'designs' | 'templates';

const timeAgo = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

/** The signed-in user's saved designs (history) and saved templates, stored on their account. */
export const MyDesignsModal: React.FC<{ isOpen: boolean; onClose: () => void; initialTab?: Tab }> = ({ isOpen, onClose, initialTab = 'designs' }) => {
  const { loadProject, loadTemplate, projectId } = useEditor();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { closing, close } = useSmoothClose(onClose, isOpen);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.getProjects();
      setItems(res.projects || []);
    } catch (e: any) {
      setError(e?.message || 'Could not load your designs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setTab(initialTab);
    setQuery('');
    setConfirmDelete(null);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((p) => (tab === 'templates' ? !!p.isTemplate : !p.isTemplate))
      .filter((p) => !q || String(p.title || '').toLowerCase().includes(q))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [items, tab, query]);

  const previews = useMemo(() => {
    const map: Record<string, { __html: string }> = {};
    for (const p of list) {
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
  }, [list]);

  const counts = useMemo(
    () => ({ designs: items.filter((p) => !p.isTemplate).length, templates: items.filter((p) => p.isTemplate).length }),
    [items]
  );

  if (!isOpen) return null;

  const open = (p: any) => {
    if (p.isTemplate) {
      // a template opens as a NEW design, so the template itself stays unchanged
      loadTemplate({
        id: p.id,
        title: p.title,
        description: p.description || '',
        category: 'my-templates',
        shape: p.shape,
        widthMm: p.widthMm,
        heightMm: p.heightMm,
        tags: [],
        defaultData: { inkColor: p.inkColor || '#111827', fields: {}, elements: p.elementsJson || [] },
      } as any);
    } else {
      loadProject(p);
    }
    close();
  };

  const remove = async (id: string) => {
    try {
      await ApiService.deleteProject(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      setError(e?.message || 'Could not delete.');
    }
    setConfirmDelete(null);
  };

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm fx-modal-backdrop ${closing ? 'fx-modal-closing' : ''}`} onMouseDown={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="My designs"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[86vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl fx-modal-open"
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h2 className="text-[16px] font-semibold text-slate-900 dark:text-white">
            {tab === 'templates' ? 'My templates' : 'My designs'}
            {counts[tab] > 0 && <span className="ml-2 text-[13px] font-medium text-slate-400 tabular-nums">{counts[tab]}</span>}
          </h2>
          <button type="button" onClick={close} aria-label="Close" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* search (only when there are many) */}
        {counts[tab] > 6 && (
        <div className="px-5 pb-3">
            <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="flex-1 min-w-0 bg-transparent outline-none text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
        </div>
        )}

        {error && <p className="mx-5 mb-2 text-[12px] text-rose-600 dark:text-rose-400">{error}</p>}

        {/* list */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-[200px]">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-center gap-1.5">
              <p className="text-[14px] text-slate-500 dark:text-slate-400">
                {query ? 'Nothing found' : tab === 'templates' ? 'No templates yet' : 'No saved designs yet'}
              </p>
              {!query && tab === 'designs' && (
                <p className="text-[12px] text-slate-400 dark:text-slate-500">Click Save in the toolbar to keep a design here.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {list.map((p) => (
                <div key={p.id} className="group relative rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 hover:border-[#0d99ff] hover:shadow-md transition-all">
                  <button type="button" onClick={() => open(p)} className="block w-full text-left cursor-pointer" title={p.isTemplate ? 'Use this template' : 'Open this design'}>
                    <div className="aspect-square bg-slate-50 dark:bg-slate-950/50 p-3 flex items-center justify-center">
                      <div className="ink-preview w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full" dangerouslySetInnerHTML={previews[p.id]} />
                    </div>
                    <div className="px-2.5 py-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[12px] font-medium text-slate-800 dark:text-slate-100 truncate">
                        {p.title}
                        {p.id === projectId && <span className="ml-1 text-[10px] font-semibold text-[#0d99ff]">· open</span>}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {p.isTemplate ? 'Template' : 'Saved'} {timeAgo(p.updatedAt)}
                      </p>
                    </div>
                  </button>
                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button type="button" onClick={() => open(p)} title={p.isTemplate ? 'Use template' : 'Open'} className="w-7 h-7 rounded-md bg-white/95 dark:bg-slate-800/95 shadow flex items-center justify-center text-slate-600 dark:text-slate-200 hover:text-[#0d99ff] cursor-pointer">
                      <FolderOpen className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => (confirmDelete === p.id ? remove(p.id) : setConfirmDelete(p.id))}
                      title={confirmDelete === p.id ? 'Click again to delete' : 'Delete'}
                      className={`h-7 rounded-md shadow flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                        confirmDelete === p.id ? 'px-2 bg-rose-600 text-white text-[11px] font-semibold' : 'w-7 bg-white/95 dark:bg-slate-800/95 text-slate-600 dark:text-slate-200 hover:text-rose-600'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {confirmDelete === p.id && 'Delete?'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
