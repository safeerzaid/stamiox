'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useEditor } from '../../context/EditorContext';
import { STAMP_MOUNT_PRESETS } from '../../lib/units';
import { Tooltip } from '../common/Tooltip';
import { ShapeSizeBadge } from '../common/ShapeSizeBadge';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  ArrowLeft,
  ChevronDown,
  Play,
  Share2,
  Download,
  Cloud,
  Check,
  Compass,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  PanelLeft,
  PanelRight,
  LayoutGrid,
  X,
  Minus,
  Plus,
  HelpCircle,
} from 'lucide-react';

interface ToolbarProps {
  onOpenClipartModal: () => void;
  onOpenExportModal: () => void;
  onOpenSupportModal?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onOpenClipartModal,
  onOpenExportModal,
  onOpenSupportModal,
}) => {
  const {
    mountPreset,
    setMountPreset,
    switchCanvasShape,
    widthMm,
    heightMm,
    shape,
    zoom,
    setZoom,
    saveProjectToCloud,
    isSaving,
    hasUnsavedChanges,
    projectTitle,
    setProjectTitle,
    canUndo,
    canRedo,
    undo,
    redo,
    canCopy,
    canPaste,
    copySelected,
    pasteElement,
    isLeftSidebarOpen,
    isRightSidebarOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
    viewMode,
    setViewMode,
    a4Instances,
    editingA4InstanceId,
    stopEditingA4Instance,
  } = useEditor();

  const [isMountOpen, setIsMountOpen] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [mountShapeFilter, setMountShapeFilter] = useState<string>('ALL');

  const handleSave = async () => {
    await saveProjectToCloud();
  };

  // Choosing a shape tab switches the canvas to that shape right away, using the preset
  // closest in area to the current stamp (borders are morphed by setMountPreset).
  const handleShapeTab = (shapeId: string) => {
    setMountShapeFilter(shapeId);
    if (shapeId !== 'ALL') switchCanvasShape(shapeId as any);
  };

  return (
    <header className="w-full bg-white dark:bg-slate-900 text-[#1e1e1e] dark:text-slate-100 border-b border-[#e5e5e5] dark:border-slate-800 px-2 sm:px-3 h-12 flex items-center justify-between gap-1.5 sm:gap-2 select-none z-40 relative shadow-2xs min-w-0 transition-colors">
      {/* --- LEFT: PANEL TOGGLE, HOME, DESIGN NAME & STAMP SIZE --- */}
      <div className="flex items-center gap-0.5 min-w-0 shrink">
        <Tooltip content={isLeftSidebarOpen ? 'Hide layers' : 'Show layers'} shortcut="L" side="bottom">
          <button
            type="button"
            onClick={toggleLeftSidebar}
            aria-pressed={isLeftSidebarOpen}
            aria-label="Toggle layers panel"
            className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
              isLeftSidebarOpen
                ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isLeftSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </Tooltip>

        <Tooltip content="Back to home" side="bottom">
          <Link
            href="/"
            aria-label="Back to home"
            className="h-8 w-8 rounded-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
        </Tooltip>

        <span aria-hidden className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1.5 shrink-0" />

        {/* Design name — click to rename */}
        <div className="flex items-center min-w-0">
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="font-semibold text-[13px] text-slate-900 dark:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 ring-1 ring-transparent focus:ring-[#0d99ff] px-2 h-8 rounded-md outline-none w-[110px] sm:w-[150px] md:w-[190px] truncate transition-colors"
            placeholder="Untitled stamp"
            title="Click to rename"
          />
        </div>

        {/* Stamp size chip */}
        <div className="relative hidden lg:block shrink-0">
          <button
            onClick={() => setIsMountOpen(!isMountOpen)}
            aria-expanded={isMountOpen}
            title={mountPreset ? mountPreset.name : 'Stamp size'}
            className={`flex items-center gap-1 h-7 pl-2.5 pr-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer select-none ${
              isMountOpen
                ? 'bg-[#e5f2ff] dark:bg-blue-950/60 text-[#0d99ff]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700'
            }`}
          >
            <ShapeSizeBadge shape={shape} widthMm={widthMm} heightMm={heightMm} />
            <ChevronDown className={`w-3.5 h-3.5 opacity-60 shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMountOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMountOpen && (
            <div
              className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl ring-1 ring-slate-200 dark:ring-slate-750 z-50 fx-menu text-xs flex flex-col overflow-hidden text-slate-800 dark:text-slate-200"
              onMouseLeave={() => setIsMountOpen(false)}
            >
              {/* Header */}
              <div className="px-3.5 pt-3 pb-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <span className="text-[13px] font-semibold text-slate-900 dark:text-white">Stamp size</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
                  <ShapeSizeBadge shape={shape} widthMm={widthMm} heightMm={heightMm} />
                </span>
              </div>

              {/* Shape filter */}
              <div className="px-3 py-2">
                <div className="grid grid-cols-5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: 'ROUND', label: 'Round' },
                    { id: 'RECTANGULAR', label: 'Rect' },
                    { id: 'OVAL', label: 'Oval' },
                    { id: 'SQUARE', label: 'Square' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleShapeTab(tab.id)}
                      className={`h-6 rounded-md text-[11px] font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] active:scale-[0.95] active:duration-100 cursor-pointer ${
                        mountShapeFilter === tab.id
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Presets */}
              <div className="px-1.5 pb-1.5 overflow-y-auto max-h-[320px] border-t border-slate-100 dark:border-slate-800 pt-1.5">
                {STAMP_MOUNT_PRESETS
                  .filter((p) => mountShapeFilter === 'ALL' || p.shape === mountShapeFilter)
                  .map((preset) => {
                    const isSelected = mountPreset?.id === preset.id || (!mountPreset && widthMm === preset.widthMm && heightMm === preset.heightMm);
                    const k = 18 / Math.max(preset.widthMm, preset.heightMm);
                    const gw = Math.max(6, preset.widthMm * k);
                    const gh = Math.max(6, preset.heightMm * k);
                    const radius = preset.shape === 'ROUND' || preset.shape === 'OVAL' ? '50%' : '2px';

                    return (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setMountPreset(preset);
                          setIsMountOpen(false);
                        }}
                        className={`fx-item w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-left ${
                          isSelected ? 'bg-[#e5f2ff] dark:bg-blue-950/60' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="w-6 h-6 flex items-center justify-center shrink-0">
                          <span
                            className={`border-[1.5px] ${isSelected ? 'border-[#0d99ff]' : 'border-slate-400'}`}
                            style={{ width: gw, height: gh, borderRadius: radius }}
                          />
                        </span>
                        <span className="flex flex-col min-w-0 flex-1 leading-tight">
                          <span className={`text-[12px] font-medium truncate ${isSelected ? 'text-[#0d99ff]' : 'text-slate-800 dark:text-slate-200'}`}>
                            {preset.name.replace(/\(.*\)/, '').trim()}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                            {preset.brand} ·{' '}
                            {preset.shape === 'ROUND' ? `Ø ${preset.widthMm} mm` : `${preset.widthMm} × ${preset.heightMm} mm`}
                          </span>
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[#0d99ff] shrink-0" />}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* --- CENTER: SINGLE / A4 SHEET SWITCH (or the way back while editing an A4 copy) --- */}
      <div className="hidden md:flex flex-1 justify-center min-w-0">
        {editingA4InstanceId && viewMode === 'SINGLE' ? (
          <button
            type="button"
            onClick={stopEditingA4Instance}
            title="Save changes and return to the A4 sheet"
            className="fx-panel h-8 pl-2 pr-3 flex items-center gap-2 rounded-full bg-[#e5f2ff] dark:bg-blue-950/60 text-[#0d99ff] text-[12px] font-semibold hover:bg-[#d6ebff] dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
          >
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-[#0d99ff] animate-ping opacity-60" />
              <span className="relative w-2 h-2 rounded-full bg-[#0d99ff]" />
            </span>
            Editing a copy
            <span className="flex items-center gap-1 pl-2 ml-0.5 border-l border-[#0d99ff]/25">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to A4 sheet
            </span>
          </button>
        ) : (
          <div role="tablist" aria-label="Workspace" className="relative grid grid-cols-2 p-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
            {/* sliding highlight */}
            <span
              aria-hidden
              className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-white dark:bg-slate-700 shadow-[0_1px_3px_rgba(15,23,42,0.12)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                viewMode === 'A4_SHEET' ? 'translate-x-full' : ''
              }`}
            />
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'SINGLE'}
              onClick={() => setViewMode('SINGLE')}
              title="Design one stamp"
              className={`relative z-10 h-7 px-3.5 flex items-center justify-center gap-1.5 rounded-full text-[12px] transition-colors cursor-pointer ${
                viewMode === 'SINGLE' ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <Compass className={`w-3.5 h-3.5 ${viewMode === 'SINGLE' ? 'text-[#0d99ff]' : ''}`} />
              Single
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'A4_SHEET'}
              onClick={() => setViewMode('A4_SHEET')}
              title="Arrange many stamps on an A4 sheet"
              className={`relative z-10 h-7 px-3.5 flex items-center justify-center gap-1.5 rounded-full text-[12px] transition-colors cursor-pointer ${
                viewMode === 'A4_SHEET' ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <LayoutGrid className={`w-3.5 h-3.5 ${viewMode === 'A4_SHEET' ? 'text-[#0d99ff]' : ''}`} />
              A4 sheet
              {a4Instances.length > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#0d99ff] text-white text-[10px] font-bold leading-[18px] text-center tabular-nums">
                  {a4Instances.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* --- RIGHT: UNDO/REDO, ZOOM, THEME, SAVE & EXPORT --- */}
      {(() => {
        const ICON = 'h-8 w-8 rounded-md flex items-center justify-center transition-colors shrink-0 cursor-pointer select-none';
        const IDLE = 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800';
        const OFF = 'text-slate-300 dark:text-slate-600 cursor-not-allowed';
        const DIVIDER = <span aria-hidden className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />;
        const ZOOM_LEVELS = [1, 1.5, 2, 2.2, 2.5, 3];
        const stepZoom = (dir: 1 | -1) => {
          const next = dir > 0 ? ZOOM_LEVELS.find((z) => z > zoom + 0.001) : [...ZOOM_LEVELS].reverse().find((z) => z < zoom - 0.001);
          if (next) setZoom(next);
        };
        const atMin = zoom <= ZOOM_LEVELS[0] + 0.001;
        const atMax = zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1] - 0.001;

        return (
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Undo / Redo / Copy / Paste */}
            <div className="hidden sm:flex items-center gap-0.5">
              <Tooltip content="Undo" shortcut="Ctrl+Z" side="bottom">
                <button onClick={undo} disabled={!canUndo} className={`${ICON} ${canUndo ? IDLE : OFF}`} aria-label="Undo">
                  <Undo2 className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="Redo" shortcut="Ctrl+Y" side="bottom">
                <button onClick={redo} disabled={!canRedo} className={`${ICON} ${canRedo ? IDLE : OFF}`} aria-label="Redo">
                  <Redo2 className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="Copy element" shortcut="Ctrl+C" side="bottom">
                <button onClick={copySelected} disabled={!canCopy} className={`${ICON} ${canCopy ? IDLE : OFF}`} aria-label="Copy element">
                  <Copy className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="Paste element" shortcut="Ctrl+V" side="bottom">
                <button onClick={() => pasteElement()} disabled={!canPaste} className={`${ICON} ${canPaste ? IDLE : OFF}`} aria-label="Paste element">
                  <ClipboardPaste className="w-4 h-4" />
                </button>
              </Tooltip>
              {DIVIDER}
            </div>

            {/* Zoom: − 220% ▾ + */}
            <div className="relative flex items-center">
              <button type="button" onClick={() => stepZoom(-1)} disabled={atMin} className={`${ICON} w-7 ${atMin ? OFF : IDLE}`} title="Zoom out" aria-label="Zoom out">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsZoomOpen(!isZoomOpen)}
                className={`h-8 min-w-[60px] px-1.5 rounded-md flex items-center justify-center gap-0.5 text-[12px] font-medium tabular-nums transition-colors ${
                  isZoomOpen ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Zoom level"
                aria-expanded={isZoomOpen}
              >
                {Math.round(zoom * 100)}%
                <ChevronDown className={`w-3 h-3 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isZoomOpen ? 'rotate-180' : ''}`} />
              </button>
              <button type="button" onClick={() => stepZoom(1)} disabled={atMax} className={`${ICON} w-7 ${atMax ? OFF : IDLE}`} title="Zoom in" aria-label="Zoom in">
                <Plus className="w-3.5 h-3.5" />
              </button>

              {isZoomOpen && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-40 bg-white dark:bg-slate-900 rounded-xl shadow-xl ring-1 ring-slate-200 dark:ring-slate-700 p-1 z-50 fx-menu text-slate-700 dark:text-slate-200"
                  onMouseLeave={() => setIsZoomOpen(false)}
                >
                  {ZOOM_LEVELS.map((z) => {
                    const active = Math.abs(zoom - z) < 0.001;
                    return (
                      <button
                        key={z}
                        onClick={() => {
                          setZoom(z);
                          setIsZoomOpen(false);
                        }}
                        className={`fx-item w-full h-7 px-2.5 flex items-center justify-between rounded-md text-[12px] tabular-nums cursor-pointer ${
                          active ? 'text-[#0d99ff] font-medium bg-[#e5f2ff] dark:bg-blue-950/60' : ''
                        }`}
                      >
                        {Math.round(z * 100)}%
                        {active && <Check className="w-3.5 h-3.5 text-[#0d99ff]" />}
                      </button>
                    );
                  })}
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                  <button
                    onClick={() => {
                      setZoom(2.2);
                      setIsZoomOpen(false);
                    }}
                    className="fx-item w-full h-7 px-2.5 flex items-center justify-between rounded-md text-[12px] text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Fit to screen
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">220%</span>
                  </button>
                </div>
              )}
            </div>

            {DIVIDER}

            {/* Support, Requirements & Suggestions */}
            {onOpenSupportModal && (
              <Tooltip content="Support, Requirements & Suggestions" side="bottom">
                <button
                  type="button"
                  onClick={onOpenSupportModal}
                  className={`${ICON} ${IDLE} hover:text-[#0d99ff]`}
                  aria-label="Support, Requirements & Suggestions"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </Tooltip>
            )}

            {/* Theme + Save */}
            <ThemeToggle size="sm" variant="ghost" />
            <Tooltip content={isSaving ? 'Saving…' : hasUnsavedChanges ? 'Save to cloud (unsaved changes)' : 'Saved to cloud'} shortcut="Ctrl+S" side="bottom">
              <button onClick={handleSave} disabled={isSaving} className={`${ICON} ${IDLE} relative`} aria-label="Save to cloud">
                {isSaving ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-[#0d99ff] animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                {hasUnsavedChanges && !isSaving && (
                  <span aria-hidden className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#0d99ff] ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>
            </Tooltip>

            {/* Export — the one primary action */}
            <Tooltip content="Export for laser / print" side="bottom">
              <button
                onClick={onOpenExportModal}
                className="hidden md:flex h-8 ml-1.5 items-center gap-1.5 px-3.5 rounded-lg bg-[#0d99ff] hover:bg-[#0b87e0] active:scale-[0.97] text-white text-[12px] font-semibold shadow-[0_4px_12px_-4px_rgba(13,153,255,0.7)] transition-all shrink-0 cursor-pointer select-none"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </Tooltip>

            {/* Inspector panel toggle */}
            <Tooltip content={isRightSidebarOpen ? 'Hide panel' : 'Show panel'} side="bottom">
              <button
                type="button"
                onClick={toggleRightSidebar}
                aria-pressed={isRightSidebarOpen}
                className={`${ICON} ml-0.5 ${isRightSidebarOpen ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800' : IDLE}`}
                aria-label="Toggle panel"
              >
                {isRightSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </button>
            </Tooltip>
          </div>
        );
      })()}

    </header>
  );
};
