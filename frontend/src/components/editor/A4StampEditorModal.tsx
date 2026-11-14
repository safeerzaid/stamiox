'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Layers } from 'lucide-react';
import { EditorProvider, useEditor } from '../../context/EditorContext';
import type { A4StampInstance } from '../../types/a4-sheet';
import { useSmoothClose } from '../../hooks/useSmoothClose';
import { Canvas } from './Canvas';
import { PropertiesPanel } from './PropertiesPanel';
import { ClipartModal } from './ClipartModal';

type Saved = Pick<A4StampInstance, 'elements' | 'widthMm' | 'heightMm' | 'shape' | 'inkColor'>;

const sizeLabel = (shape: string, w: number, h: number) => (shape === 'ROUND' ? `Ø ${w} mm` : `${w} × ${h} mm`);

/** Inside the popup's own editor: header (Cancel / Save) + canvas + Setup / AI panel. */
const PopupEditor: React.FC<{ name: string; original: string; onCancel: () => void; onSave: (s: Saved) => void }> = ({ name, original, onCancel, onSave }) => {
  const { elements, widthMm, heightMm, shape, inkColor, selectedId, selectedIds } = useEditor();
  const [activeRightTab, setActiveRightTab] = useState<'SETUP' | 'AI'>('SETUP');

  // Esc first clears a selection on the canvas; with nothing selected it closes the popup
  const hasSelection = !!selectedId || selectedIds.length > 0;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || hasSelection) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasSelection, onCancel]);
  const [clipartOpen, setClipartOpen] = useState(false);
  const changed = useMemo(
    () => JSON.stringify({ elements, widthMm, heightMm, shape, inkColor }) !== original,
    [elements, widthMm, heightMm, shape, inkColor, original]
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="h-14 shrink-0 flex items-center justify-between gap-3 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-full bg-[#e5f2ff] dark:bg-blue-950/60 text-[#0d99ff] flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-slate-900 dark:text-white truncate">{name}</p>
            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate">
              {sizeLabel(shape, widthMm, heightMm)} · Changes apply only to this stamp on the A4 sheet
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 pl-3 pr-4 rounded-full border border-slate-200 dark:border-slate-700 text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            {changed ? 'Discard' : 'Close'}
          </button>
          <button
            type="button"
            onClick={() => onSave({ elements: JSON.parse(JSON.stringify(elements)), widthMm, heightMm, shape, inkColor })}
            disabled={!changed}
            className="h-9 px-4 rounded-full bg-[#0d99ff] hover:bg-[#0b87e0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Save to sheet
          </button>
        </div>
      </div>
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 min-w-0 relative overflow-hidden flex flex-col bg-slate-100/50 dark:bg-[#0b0f19]">
          <Canvas onOpenClipartModal={() => setClipartOpen(true)} />
        </div>
        <PropertiesPanel activeRightTab={activeRightTab} setActiveRightTab={setActiveRightTab} />
      </div>
      <ClipartModal isOpen={clipartOpen} onClose={() => setClipartOpen(false)} />
    </div>
  );
};

/**
 * One stamp of the A4 sheet opened in its own popup editor. Only that stamp changes, and only
 * when "Save to sheet" is pressed — the main design and the other stamps stay untouched.
 */
export const A4StampEditorModal: React.FC<{
  instance: A4StampInstance;
  onSave: (updates: Saved) => void;
  onClose: () => void;
}> = ({ instance, onSave, onClose }) => {
  const { closing, close } = useSmoothClose(onClose, true, 200); // closes quickly
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // the design is handed over once, when the popup opens
  const [design] = useState(() => ({
    elements: JSON.parse(JSON.stringify(instance.elements)),
    widthMm: instance.widthMm,
    heightMm: instance.heightMm,
    shape: instance.shape,
    inkColor: instance.inkColor,
    title: instance.name,
  }));
  const original = useMemo(
    () => JSON.stringify({ elements: design.elements, widthMm: design.widthMm, heightMm: design.heightMm, shape: design.shape, inkColor: design.inkColor }),
    [design]
  );

  if (!mounted) return null;
  return createPortal(
    <div className={`fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-sm fx-modal-backdrop ${closing ? 'fx-modal-closing fx-close-fast' : ''}`}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${instance.name}`}
        className="w-full max-w-[1400px] h-full max-h-[920px] rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl fx-modal-open"
      >
        <EditorProvider isolated={design}>
          <PopupEditor
            name={instance.name}
            original={original}
            onCancel={close}
            onSave={(s) => {
              onSave(s);
              close();
            }}
          />
        </EditorProvider>
      </div>
    </div>,
    document.body
  );
};
