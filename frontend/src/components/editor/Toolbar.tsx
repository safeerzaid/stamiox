'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useEditor } from '../../context/EditorContext';
import { STAMP_MOUNT_PRESETS } from '../../lib/units';
import { Tooltip } from '../common/Tooltip';
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
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  PanelLeft,
  PanelRight,
  LayoutGrid,
  Sparkles,
  X,
} from 'lucide-react';

interface ToolbarProps {
  onOpenClipartModal: () => void;
  onOpenExportModal: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onOpenClipartModal,
  onOpenExportModal,
}) => {
  const {
    mountPreset,
    setMountPreset,
    widthMm,
    heightMm,
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

  return (
    <header className="w-full bg-white text-[#1e1e1e] border-b border-[#e5e5e5] px-2 sm:px-3 h-12 flex items-center justify-between gap-1.5 sm:gap-2 select-none z-40 relative shadow-2xs min-w-0">
      {/* --- LEFT: BACK BUTTON, PROJECT TITLE & HARDWARE PRESET --- */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
        {/* Toggle Left Layers Panel */}
        <Tooltip content={isLeftSidebarOpen ? 'Hide Layers Panel' : 'Show Layers Panel'} shortcut="L" side="bottom">
          <button
            type="button"
            onClick={toggleLeftSidebar}
            className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
              isLeftSidebarOpen
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {isLeftSidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
          </button>
        </Tooltip>

        {/* Prominent Back Button */}
        <Tooltip content="Back to Homepage" side="bottom">
          <Link
            href="/"
            className="flex items-center gap-1 h-8 px-2 sm:px-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 hover:text-slate-900 transition-all shadow-2xs group shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 group-hover:text-slate-900 transition-transform shrink-0" />
            <span className="hidden sm:inline">Back</span>
          </Link>
        </Tooltip>

        <div className="h-4 w-px bg-slate-200 shrink-0 hidden sm:block" />

        {/* Project Name Breadcrumb */}
        <div className="flex items-center gap-1.5 min-w-0">
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="font-semibold text-xs sm:text-sm text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-[#0d99ff] px-2 h-8 rounded-lg outline-none max-w-[100px] sm:max-w-[140px] md:max-w-[180px] truncate transition-all"
            placeholder="Untitled Stamp"
            title="Click to rename design"
          />
          {hasUnsavedChanges ? (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" title="Unsaved changes" />
          ) : (
            <span title="Saved to cloud" className="shrink-0">
              <Check className="w-3 h-3 text-slate-400" />
            </span>
          )}
        </div>

        {/* Stamp Mount Hardware Sizing Selector */}
        <div className="relative hidden xl:block ml-0.5">
          <button
            onClick={() => setIsMountOpen(!isMountOpen)}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-all shadow-2xs"
          >
            <Compass className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="max-w-[120px] truncate">{mountPreset ? mountPreset.name : `${widthMm}×${heightMm}mm`}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {isMountOpen && (
            <div
              className="absolute left-0 mt-2 w-84 sm:w-96 max-h-[460px] overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in zoom-in-95 duration-150 text-xs flex flex-col"
              onMouseLeave={() => setIsMountOpen(false)}
            >
              {/* Header */}
              <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[12px] font-bold text-slate-900">Stamp Mount & Casing Sizing</div>
                  <div className="text-[10px] text-slate-500">Colop, Trodat & Shiny physical casing presets</div>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#0d99ff] bg-[#e5f2ff] px-2 py-0.5 rounded-full">
                  {widthMm}×{heightMm}mm
                </span>
              </div>

              {/* Shape Filter Tabs */}
              <div className="px-3 pt-2.5 pb-2 flex items-center gap-1 overflow-x-auto bg-slate-50/70 border-b border-slate-100 shrink-0">
                {[
                  { id: 'ALL', label: 'All Shapes' },
                  { id: 'ROUND', label: '◯ Round' },
                  { id: 'RECTANGULAR', label: '▭ Rect' },
                  { id: 'OVAL', label: '⬭ Oval' },
                  { id: 'SQUARE', label: '▢ Square' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMountShapeFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                      mountShapeFilter === tab.id
                        ? 'bg-white text-[#0d99ff] shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Presets List */}
              <div className="p-2.5 overflow-y-auto space-y-1.5 max-h-[300px]">
                {STAMP_MOUNT_PRESETS
                  .filter((p) => mountShapeFilter === 'ALL' || p.shape === mountShapeFilter)
                  .map((preset) => {
                    const isSelected = mountPreset?.id === preset.id || (!mountPreset && widthMm === preset.widthMm && heightMm === preset.heightMm);

                    return (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setMountPreset(preset);
                          setIsMountOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-all group ${
                          isSelected
                            ? 'bg-[#e5f2ff]/80 border-[#0d99ff] shadow-xs'
                            : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Visual Shape Mini Preview Icon */}
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                              isSelected
                                ? 'bg-white text-[#0d99ff] border-[#0d99ff]'
                                : 'bg-slate-50 text-slate-600 border-slate-200 group-hover:border-[#0d99ff] group-hover:text-[#0d99ff]'
                            }`}
                          >
                            {preset.shape === 'ROUND' ? (
                              <div className="w-4 h-4 rounded-full border-2 border-current" />
                            ) : preset.shape === 'OVAL' ? (
                              <div className="w-5 h-3.5 rounded-[50%] border-2 border-current" />
                            ) : preset.shape === 'SQUARE' ? (
                              <div className="w-4 h-4 rounded-xs border-2 border-current" />
                            ) : (
                              <div className="w-5 h-3 rounded-xs border-2 border-current" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md ${
                                  preset.brand === 'Colop'
                                    ? 'bg-blue-100 text-blue-700'
                                    : preset.brand === 'Trodat'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-purple-100 text-purple-700'
                                }`}
                              >
                                {preset.brand}
                              </span>
                              <span className="font-bold text-[12px] text-slate-800 truncate">
                                {preset.name.replace(/\(.*\)/, '').trim()}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono block">
                              {preset.shape === 'ROUND'
                                ? `Ø ${preset.widthMm} mm Diameter`
                                : `${preset.widthMm} × ${preset.heightMm} mm`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`font-mono font-bold text-xs px-2 py-1 rounded-lg ${
                              isSelected ? 'bg-[#0d99ff] text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {preset.widthMm}×{preset.heightMm}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-[#0d99ff]" />}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Studio View Mode Switcher: Single Stamp vs A4 Gang-Sheet */}
        <div className="hidden 2xl:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 text-xs font-semibold shrink-0 ml-1">
          <button
            type="button"
            onClick={() => setViewMode('SINGLE')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              viewMode === 'SINGLE'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Design Single Stamp"
          >
            <Compass className="w-3 h-3 text-[#0d99ff]" />
            <span>Single</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('A4_SHEET')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              viewMode === 'A4_SHEET'
                ? 'bg-white text-[#0d99ff] shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Multi-Stamp A4 Gang-Sheet Imposition Layout"
          >
            <LayoutGrid className="w-3 h-3 text-[#0d99ff]" />
            <span>A4 Sheet</span>
            {a4Instances.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-blue-100 text-[#0d99ff] text-[10px] font-bold">
                {a4Instances.length}
              </span>
            )}
          </button>
        </div>

        {/* Live Editing A4 Variant Quick Return Banner */}
        {editingA4InstanceId && viewMode === 'SINGLE' && (
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg shadow-2xs animate-in fade-in zoom-in-95 duration-150">
            <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0d99ff] animate-pulse" />
              A4 Variant
            </span>
            <button
              type="button"
              onClick={stopEditingA4Instance}
              className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#0d99ff] hover:bg-[#0c8ce9] px-2 py-0.5 rounded-md transition-all cursor-pointer shadow-2xs"
              title="Save changes and return to full A4 Gang-Sheet"
            >
              <span>Back →</span>
            </button>
          </div>
        )}
      </div>

      {/* --- RIGHT: UNDO/REDO, ZOOM, SAVE & EXPORT --- */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

        {/* Undo / Redo (Wider & More Spacious) */}
        <div className="hidden sm:flex items-center gap-1.5 bg-[#f8f9fa] h-8 px-1.5 py-0.5 rounded-lg border border-[#e5e5e5] shrink-0 shadow-2xs">
          <Tooltip content="Undo last action" shortcut="Ctrl+Z" side="bottom">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`h-6.5 w-8 flex items-center justify-center rounded-md transition-all ${
                canUndo ? 'text-[#333] hover:text-[#111] hover:bg-white hover:shadow-2xs active:scale-95 cursor-pointer' : 'text-[#bbb] cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-4 h-4 shrink-0" strokeWidth={2.2} />
            </button>
          </Tooltip>
          <div className="w-[1px] h-3.5 bg-slate-200 shrink-0" />
          <Tooltip content="Redo action" shortcut="Ctrl+Y" side="bottom">
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`h-6.5 w-8 flex items-center justify-center rounded-md transition-all ${
                canRedo ? 'text-[#333] hover:text-[#111] hover:bg-white hover:shadow-2xs active:scale-95 cursor-pointer' : 'text-[#bbb] cursor-not-allowed'
              }`}
            >
              <Redo2 className="w-4 h-4 shrink-0" strokeWidth={2.2} />
            </button>
          </Tooltip>
        </div>

        {/* Zoom Selector */}
        <div className="relative shrink-0">
          <Tooltip content="Canvas Zoom Level" side="bottom">
            <button
              onClick={() => setIsZoomOpen(!isZoomOpen)}
              className="h-8 px-2.5 rounded-lg border border-[#e5e5e5] bg-[#f8f9fa] hover:bg-[#f0f0f0] text-xs font-semibold text-[#444] flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
            >
              <span>{Math.round(zoom * 100)}%</span>
              <ChevronDown className="w-3 h-3 text-[#888] shrink-0" />
            </button>
          </Tooltip>

          {isZoomOpen && (
            <div
              className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-2xl border border-[#e5e5e5] py-1.5 z-50 animate-in fade-in text-xs"
              onMouseLeave={() => setIsZoomOpen(false)}
            >
              {[1, 1.5, 2, 2.2, 2.5, 3].map((z) => (
                <button
                  key={z}
                  onClick={() => {
                    setZoom(z);
                    setIsZoomOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-[#f0f7ff] text-[13px] cursor-pointer ${
                    zoom === z ? 'text-[#0d99ff] font-bold bg-[#f0f7ff]' : 'text-[#333]'
                  }`}
                >
                  {Math.round(z * 100)}%
                </button>
              ))}
              <div className="h-px bg-[#f0f0f0] my-1" />
              <button
                onClick={() => {
                  setZoom(2.2);
                  setIsZoomOpen(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-[#f0f7ff] text-[#444] text-[13px] cursor-pointer"
              >
                Fit Screen (220%)
              </button>
            </div>
          )}
        </div>

        {/* Save to Cloud Button */}
        <Tooltip content="Save Project to Cloud" shortcut="Ctrl+S" side="bottom">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs shrink-0 cursor-pointer"
          >
            <Cloud className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          </button>
        </Tooltip>

        {/* Primary Export Button */}
        <Tooltip content="Export Production Vector" side="bottom">
          <button
            onClick={onOpenExportModal}
            className="hidden md:flex h-8 items-center justify-center gap-1.5 px-3 rounded-lg border border-[#0d99ff]/20 bg-[#0d99ff] hover:bg-[#0c8ce9] text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-px shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">Export</span>
          </button>
        </Tooltip>

        {/* Toggle Right Inspector Panel */}
        <Tooltip content={isRightSidebarOpen ? 'Hide Inspector Panel' : 'Show Inspector Panel'} side="bottom">
          <button
            type="button"
            onClick={toggleRightSidebar}
            className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
              isRightSidebarOpen
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {isRightSidebarOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
          </button>
        </Tooltip>
      </div>

    </header>
  );
};
