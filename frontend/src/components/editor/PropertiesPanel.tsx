'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useEditor } from '../../context/EditorContext';
import { FONT_OPTIONS, STAMP_INK_COLORS, STAMP_MOUNT_PRESETS } from '../../lib/units';
import {
  ArcTextElement,
  StraightTextElement,
  RingElement,
  SerratedRingElement,
  RectElement,
  OvalElement,
  LineElement,
  ClipartElement,
} from '../../types/stamp';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Sliders,
  Sparkles,
  Layers,
  Download,
  Lock,
  Unlock,
  ChevronDown,
  Contrast,
  Trash2,
  Search,
  PanelRightClose,
  Check,
  Wand2,
  Orbit,
  Type,
} from 'lucide-react';

import { AiStudioCopilot } from './AiStudioCopilot';
import { AiOrbIcon } from './AiOrbIcon';

interface PropertiesPanelProps {
  activeRightTab: 'SETUP' | 'AI';
  setActiveRightTab: (tab: 'SETUP' | 'AI') => void;
}

// Unified Ultra-Clean Modern Stepper (Figma / Linear Style with Pixel-Perfect Controls)
const ModernStepper: React.FC<{
  value: number;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  onChange: (val: number) => void;
  disabled?: boolean;
}> = ({ value, step = 0.1, min, max, unit = 'mm', onChange, disabled }) => {
  const handleDecrement = () => {
    let next = Number((value - step).toFixed(2));
    if (min !== undefined && next < min) next = min;
    onChange(next);
  };

  const handleIncrement = () => {
    let next = Number((value + step).toFixed(2));
    if (max !== undefined && next > max) next = max;
    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    }
  };

  const displayVal = isNaN(value) ? '' : step >= 1 ? Math.round(value) : Number(value.toFixed(1));

  return (
    <div
      className={`flex items-center h-9 bg-slate-50 hover:bg-white focus-within:bg-white rounded-xl border border-slate-200 shadow-2xs focus-within:border-[#0d99ff] focus-within:ring-2 focus-within:ring-[#0d99ff]/15 transition-all overflow-hidden ${
        disabled ? 'bg-slate-50/60 border-slate-200/60 cursor-not-allowed' : ''
      }`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || (min !== undefined && value <= min)}
        className="w-8 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 active:bg-slate-200 disabled:opacity-40 transition-colors shrink-0 cursor-pointer rounded-l-xl border-r border-slate-200/60 select-none"
        title={`Decrease (-${step}${unit})`}
      >
        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>

      <div className="flex-1 flex items-center justify-center min-w-0 px-2 h-full gap-1">
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={displayVal}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) onChange(val);
          }}
          disabled={disabled}
          className={`w-full text-center bg-transparent font-bold text-xs outline-none p-0 tracking-tight [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono ${
            disabled ? 'text-slate-500' : 'text-slate-900'
          }`}
        />
        {unit && (
          <span className="text-[10px] text-slate-500 font-bold select-none shrink-0 font-sans">
            {unit}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || (max !== undefined && value >= max)}
        className="w-8 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 active:bg-slate-200 disabled:opacity-40 transition-colors shrink-0 cursor-pointer rounded-r-xl border-l border-slate-200/60 select-none"
        title={`Increase (+${step}${unit})`}
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
    </div>
  );
};

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ activeRightTab, setActiveRightTab }) => {
  const {
    selectedId,
    selectedElement,
    setElements,
    pushHistory,
    updateElement,
    deleteElement,
    duplicateElement,
    bringForward,
    sendBackward,
    alignSelected,
    nudgeElement,
    shape,
    widthMm,
    setWidthMm,
    heightMm,
    setHeightMm,
    inkColor,
    setInkColor,
    mountPreset,
    setMountPreset,
    laserInvert,
    setLaserInvert,
    laserMirror,
    setLaserMirror,
    distressEffect,
    setDistressEffect,
    zoom,
    isRightSidebarOpen,
    toggleRightSidebar,
  } = useEditor();

  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [fontSearchQuery, setFontSearchQuery] = useState('');
  const [fontCategoryFilter, setFontCategoryFilter] = useState('ALL');

  // Resizable Panel Width State (Figma / VS Code style)
  const [panelWidth, setPanelWidth] = useState<number>(310);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 260 && newWidth <= 520) {
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleAlignCenterX = () => {
    if (!selectedId) return;
    pushHistory();
    if (selectedElement?.type === 'text') {
      updateElement(selectedId, { x: widthMm / 2 });
    } else if (selectedElement && 'cx' in selectedElement) {
      updateElement(selectedId, { cx: widthMm / 2 } as any);
    }
  };

  const handleAlignCenterY = () => {
    if (!selectedId) return;
    pushHistory();
    if (selectedElement?.type === 'text') {
      updateElement(selectedId, { y: heightMm / 2 });
    } else if (selectedElement && 'cy' in selectedElement) {
      updateElement(selectedId, { cy: heightMm / 2 } as any);
    }
  };

  return (
    <aside
      style={{
        width: isRightSidebarOpen ? `${panelWidth}px` : '0px',
        opacity: isRightSidebarOpen ? 1 : 0,
      }}
      className={`relative bg-white text-[#333] border-l border-[#e5e5e5] flex flex-col select-none text-xs shadow-xs z-30 shrink-0 h-full overflow-hidden ${
        isResizing ? 'transition-none select-none pointer-events-auto' : 'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
      } ${!isRightSidebarOpen ? 'border-l-0 pointer-events-none' : ''}`}
    >
      <style>{`
        @keyframes clixio-aurora {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div style={{ width: `${panelWidth}px` }} className="flex flex-col h-full shrink-0">
        {/* Left Resizer Drag Handle */}
        {isRightSidebarOpen && (
          <div
            onMouseDown={startResizing}
            className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-40 group flex items-center justify-center hover:bg-[#0d99ff]/20 transition-all ${
              isResizing ? 'bg-[#0d99ff] w-1' : ''
            }`}
            title="Drag left/right to resize properties panel"
          >
            <div className={`w-[2px] h-10 rounded-full bg-slate-300 group-hover:bg-[#0d99ff] transition-all ${isResizing ? 'bg-[#0d99ff] h-20' : ''}`} />
          </div>
        )}
        {/* Inspector Header & Tabs */}
        <div className="flex flex-col bg-white sticky top-0 z-20 shrink-0 border-b border-slate-200">
          <div className="px-4 h-12 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wider truncate mr-2">
              {activeRightTab === 'AI' ? 'Clixio AI Copilot' : selectedElement ? (selectedElement.type === 'arc-text' ? 'Arc Text' : selectedElement.type === 'ring' ? 'Ring' : selectedElement.type === 'serrated-ring' ? 'Starburst' : selectedElement.type === 'text' ? 'Straight Text' : selectedElement.type === 'rect' ? 'Box Frame' : 'Element') : 'Stamp Setup'}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {activeRightTab === 'SETUP' && (
                <span className="text-xs text-[#0d99ff] font-bold bg-[#e5f2ff] px-2.5 py-1 rounded-full">
                  {widthMm}×{heightMm}mm
                </span>
              )}
              {activeRightTab === 'SETUP' && selectedId && (
                <button
                  onClick={() => deleteElement(selectedId)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Delete Selected Element (Del)"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              )}
              {/* Collapse Inspector Button */}
              <button
                type="button"
                onClick={toggleRightSidebar}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Collapse Panel"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Tab Switcher */}
          <div className="px-3 pb-2.5">
            <div className="flex items-center p-1 bg-slate-100/90 rounded-full border border-slate-200/80 gap-1.5">
              {/* Stamp Setup Tab */}
              <button
                type="button"
                onClick={() => setActiveRightTab('SETUP')}
                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeRightTab === 'SETUP'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>STAMP SETUP</span>
              </button>

              {/* Clixio AI Tab */}
              <button
                type="button"
                onClick={() => setActiveRightTab('AI')}
                className={`relative flex-1 py-1.5 px-3 text-xs font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer select-none overflow-hidden group ${
                  activeRightTab === 'AI'
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'hover:scale-[1.01] shadow-[0_0_12px_rgba(147,51,234,0.4)] opacity-95 hover:opacity-100'
                }`}
              >
                {/* Moving Aurora Fluid Background - Only when inactive / closed */}
                {activeRightTab !== 'AI' && (
                  <>
                    <span
                      className="absolute inset-0 z-0 pointer-events-none"
                      style={{
                        background: 'linear-gradient(120deg, #3b82f6, #7c3aed, #c026d3, #4f46e5, #9333ea, #2563eb)',
                        backgroundSize: '250% 250%',
                        animation: 'clixio-aurora 4s ease infinite',
                      }}
                    />
                    
                    {/* Glossy Bright Outer/Inner Glow Rim */}
                    <span
                      className="absolute inset-0 rounded-full z-1 pointer-events-none"
                      style={{
                        boxShadow: 'inset 0 0 0 1.2px rgba(255,255,255,0.75), inset 0 2px 4px rgba(255,255,255,0.45), inset 0 -2px 4px rgba(0,0,0,0.35)',
                      }}
                    />

                    {/* Glass Tint */}
                    <span className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px] z-1 pointer-events-none" />
                  </>
                )}

                {/* Content */}
                <span className={`relative z-10 flex items-center justify-center gap-1.5 font-extrabold tracking-wider text-[11px] ${
                  activeRightTab === 'AI' ? 'text-white' : 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]'
                }`}>
                  <Wand2 className={`w-3.5 h-3.5 transition-transform duration-300 ${
                    activeRightTab === 'AI'
                      ? 'text-purple-400 group-hover:rotate-12 group-hover:scale-110'
                      : 'text-white group-hover:rotate-12 group-hover:scale-110'
                  }`} />
                  <span>CLIXIO AI</span>
                </span>
              </button>
            </div>
          </div>
        </div>

      {activeRightTab === 'AI' ? (
        <AiStudioCopilot />
      ) : (
      <div className="p-4 space-y-5 flex-1 overflow-y-auto">
        {/* --- 1. ARC TEXT & TYPOGRAPHY (Prioritized at TOP when Text is Selected) --- */}
        {selectedElement && (selectedElement.type === 'arc-text' || selectedElement.type === 'text') && (
          <div className="space-y-3 pb-4 border-b border-slate-100">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
              Text Properties
            </span>

            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1.5">Text Content</label>
              <textarea
                value={(selectedElement as any).text || ''}
                onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                rows={2}
                placeholder="Type your stamp text here..."
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:border-[#0d99ff] focus:ring-1 focus:ring-[#0d99ff]/20 text-xs text-slate-900 outline-none resize-none font-medium shadow-2xs transition-all"
                autoFocus
              />
            </div>

            {/* Text Layout Style Switcher (Straight vs Curved Arc) */}
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1.5">Text Layout Mode</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedElement.type === 'arc-text') {
                      pushHistory();
                      const arc = selectedElement as any;
                      const cx = widthMm / 2;
                      const cy = heightMm / 2;
                      const targetY = arc.isReversed ? (cy + (arc.radius || 10) * 0.7) : (cy - (arc.radius || 10) * 0.7);

                      setElements((prev) =>
                        prev.map((el) => {
                          if (el.id !== selectedElement.id) return el;
                          return {
                            id: el.id,
                            type: 'text',
                            name: el.name ? el.name.replace('(Arc)', '').trim() : 'Straight Text',
                            text: arc.text || 'STAMP TEXT',
                            x: cx,
                            y: Number(targetY.toFixed(1)),
                            fontSize: arc.fontSize || 3.0,
                            fontFamily: arc.fontFamily || 'Inter',
                            fontWeight: arc.fontWeight || 'bold',
                            fontStyle: arc.fontStyle || 'normal',
                            letterSpacing: arc.letterSpacing || 0,
                            align: 'center',
                            visible: true,
                            locked: false,
                          } as any;
                        })
                      );
                    }
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedElement.type === 'text'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Type className="w-3.5 h-3.5 text-slate-600" />
                  <span>Straight Line</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedElement.type === 'text') {
                      pushHistory();
                      const t = selectedElement as any;
                      const cx = widthMm / 2;
                      const cy = heightMm / 2;
                      const currentY = t.y ?? cy;
                      const isBottom = currentY > cy;
                      const r = Math.max(8, Number((Math.min(widthMm, heightMm) / 2 - 4.5).toFixed(1)));

                      setElements((prev) =>
                        prev.map((el) => {
                          if (el.id !== selectedElement.id) return el;
                          return {
                            id: el.id,
                            type: 'arc-text',
                            name: el.name ? `${el.name} (Arc)` : 'Curved Text',
                            text: t.text || 'STAMP TEXT',
                            cx,
                            cy,
                            radius: r,
                            startAngle: isBottom ? 40 : -140,
                            sweepAngle: 100,
                            isReversed: isBottom,
                            angleOffset: 0,
                            letterSpacing: t.letterSpacing || 0.15,
                            fontSize: t.fontSize || 3.0,
                            fontFamily: t.fontFamily || 'Inter',
                            fontWeight: t.fontWeight || 'bold',
                            fontStyle: t.fontStyle || 'normal',
                            visible: true,
                            locked: false,
                          } as any;
                        })
                      );
                    }
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedElement.type === 'arc-text'
                      ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200/80 font-extrabold'
                      : 'text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  <Orbit className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Curved (Arc)</span>
                </button>
              </div>
            </div>

            {/* Custom Theme-Styled Font Style Dropdown with Search & Category Filters */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-700">Font Typography</label>
                <span className="text-[10px] text-slate-400 font-mono">35+ Fonts</span>
              </div>

              <button
                type="button"
                onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#0d99ff] focus:border-[#0d99ff] focus:ring-2 focus:ring-[#0d99ff]/10 flex items-center justify-between transition-all shadow-2xs group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-slate-800 truncate" style={{ fontFamily: (selectedElement as any).fontFamily || FONT_OPTIONS[0].value }}>
                    {FONT_OPTIONS.find((f) => f.value === (selectedElement as any).fontFamily)?.name || 'Plus Jakarta Sans'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-[#0d99ff] transition-transform duration-200 shrink-0 ${isFontDropdownOpen ? 'rotate-180 text-[#0d99ff]' : ''}`} />
              </button>

              {isFontDropdownOpen && (
                <div
                  className="absolute left-0 right-0 mt-1.5 bg-white/98 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-2 z-50 max-h-80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-xs"
                  onMouseLeave={() => setIsFontDropdownOpen(false)}
                >
                  {/* Search Bar & Category Filters */}
                  <div className="pb-2 border-b border-slate-100 space-y-1.5 shrink-0">
                    <div className="flex items-center bg-slate-50 border border-slate-200 focus-within:border-[#0d99ff] focus-within:bg-white rounded-xl px-2.5 py-1.5 transition-all">
                      <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                      <input
                        type="text"
                        value={fontSearchQuery}
                        onChange={(e) => setFontSearchQuery(e.target.value)}
                        placeholder="Search fonts by name..."
                        className="w-full bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-400 font-medium"
                        autoFocus
                      />
                      {fontSearchQuery && (
                        <button onClick={() => setFontSearchQuery('')} className="text-slate-400 hover:text-slate-600 text-xs">
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                      {[
                        { id: 'ALL', label: 'All' },
                        { id: 'sans', label: 'Sans' },
                        { id: 'serif', label: 'Serif' },
                        { id: 'bold', label: 'Bold' },
                        { id: 'script', label: 'Script' },
                        { id: 'mono', label: 'Dater' },
                        { id: 'vintage', label: 'Vintage' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFontCategoryFilter(cat.id)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                            fontCategoryFilter === cat.id
                              ? 'bg-[#0d99ff] text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filtered Fonts List */}
                  <div className="overflow-y-auto space-y-1 pt-1.5 max-h-56 pr-0.5">
                    {FONT_OPTIONS
                      .filter((f) => {
                        const matchesSearch = f.name.toLowerCase().includes(fontSearchQuery.toLowerCase()) || f.tag.toLowerCase().includes(fontSearchQuery.toLowerCase());
                        const matchesCat = fontCategoryFilter === 'ALL' || f.category === fontCategoryFilter;
                        return matchesSearch && matchesCat;
                      })
                      .map((f, i) => {
                        const isSelected = (selectedElement as any).fontFamily === f.value || (!((selectedElement as any).fontFamily) && f.value === FONT_OPTIONS[0].value);

                        return (
                          <button
                            key={`${f.value}-${i}`}
                            type="button"
                            onClick={() => {
                              updateElement(selectedElement.id, { fontFamily: f.value });
                              setIsFontDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-all group ${
                              isSelected
                                ? 'bg-[#e5f2ff] text-[#0d99ff] font-bold border border-[#0d99ff]/30 shadow-2xs'
                                : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-transparent'
                            }`}
                          >
                            <span className="text-[13px] truncate" style={{ fontFamily: f.value }}>
                              {f.name}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {f.tag}
                              </span>
                              {isSelected && <span className="text-[#0d99ff] font-bold text-xs">✓</span>}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Font Size & Interactive Slider Controls */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">Text Size</label>
                <div className="w-32">
                  <ModernStepper
                    value={(selectedElement as any).fontSize || 3.0}
                    step={0.1}
                    min={1.0}
                    max={25.0}
                    unit="mm"
                    onChange={(val) => updateElement(selectedElement.id, { fontSize: val })}
                  />
                </div>
              </div>

              {/* Smooth Interactive Range Slider for Size */}
              <input
                type="range"
                min="1.2"
                max="10.0"
                step="0.1"
                value={(selectedElement as any).fontSize || 3.0}
                onChange={(e) => updateElement(selectedElement.id, { fontSize: parseFloat(e.target.value) })}
                className="w-full accent-[#0d99ff] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />

              {/* Quick Preset Size Pills */}
              <div className="grid grid-cols-4 gap-1 pt-0.5">
                {[
                  { label: 'Small', size: 2.2 },
                  { label: 'Medium', size: 3.2 },
                  { label: 'Large', size: 4.5 },
                  { label: 'Title', size: 6.0 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => updateElement(selectedElement.id, { fontSize: p.size })}
                    className={`py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                      Math.abs(((selectedElement as any).fontSize || 3.0) - p.size) < 0.2
                        ? 'bg-[#0d99ff] text-white border-[#0d99ff] font-bold shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Arc Radius with Stepper & Slider */}
            {selectedElement.type === 'arc-text' && (() => {
              const arc = selectedElement as any;
              const isOvalShape = shape === 'OVAL';
              const maxDim = Math.max(widthMm || 40, heightMm || 40);
              const currentRx = arc.rx || Number((arc.radius * ((widthMm || 40) / maxDim)).toFixed(1));
              const currentRy = arc.ry || Number((arc.radius * ((heightMm || 40) / maxDim)).toFixed(1));

              // Helper to auto-spread text across the entire top or bottom arc contour
              const handleSpreadAcrossArc = () => {
                const textStr = arc.text || '';
                if (textStr.length < 2) return;
                const rxVal = isOvalShape ? currentRx : (arc.radius || 15);
                const ryVal = isOvalShape ? currentRy : (arc.radius || 15);
                // Approximate half-perimeter of the ellipse/circle available for top/bottom arc (~70% of half circumference)
                const halfCircumference = Math.PI * Math.sqrt((rxVal * rxVal + ryVal * ryVal) / 2);
                const usableArcMm = halfCircumference * 0.72; // Leave comfortable margin at sides
                const approxCharW = (arc.fontSize || 3.0) * 0.58;
                const baseTextW = textStr.length * approxCharW;
                const targetSpacing = Math.max(0, (usableArcMm - baseTextW) / (textStr.length - 1));
                updateElement(selectedElement.id, { letterSpacing: Number(targetSpacing.toFixed(2)) });
              };

              return (
                <div className="space-y-3 text-xs pt-2 border-t border-blue-100/70">
                  {/* General Arc Curve Size */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700">
                        {isOvalShape ? 'Oval Arc Curve' : 'Arc Radius (Curve Size)'}
                      </label>
                      <div className="w-32">
                        <ModernStepper
                          value={arc.radius || 15.0}
                          step={0.5}
                          min={4.0}
                          max={60.0}
                          unit="mm"
                          onChange={(newR) => {
                            if (isOvalShape) {
                              const newRx = Number((newR * ((widthMm || 40) / maxDim)).toFixed(1));
                              const newRy = Number((newR * ((heightMm || 40) / maxDim)).toFixed(1));
                              updateElement(selectedElement.id, { radius: newR, rx: newRx, ry: newRy });
                            } else {
                              updateElement(selectedElement.id, { radius: newR });
                            }
                          }}
                        />
                      </div>
                    </div>

                    <input
                      type="range"
                      min="6.0"
                      max="35.0"
                      step="0.2"
                      value={arc.radius || 15.0}
                      onChange={(e) => {
                        const newR = parseFloat(e.target.value);
                        if (isOvalShape) {
                          const newRx = Number((newR * ((widthMm || 40) / maxDim)).toFixed(1));
                          const newRy = Number((newR * ((heightMm || 40) / maxDim)).toFixed(1));
                          updateElement(selectedElement.id, { radius: newR, rx: newRx, ry: newRy });
                        } else {
                          updateElement(selectedElement.id, { radius: newR });
                        }
                      }}
                      className="w-full accent-[#0d99ff] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* If Oval, dedicated Width Curve (rx) and Height Curve (ry) controls */}
                  {isOvalShape && (
                    <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 border border-slate-200/70 rounded-xl text-[11px]">
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">Width Curve (rx)</label>
                        <ModernStepper
                          value={currentRx}
                          step={0.5}
                          min={4}
                          max={45}
                          unit="mm"
                          onChange={(val) => updateElement(selectedElement.id, { rx: val })}
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600 block mb-1">Height Curve (ry)</label>
                        <ModernStepper
                          value={currentRy}
                          step={0.5}
                          min={3}
                          max={40}
                          unit="mm"
                          onChange={(val) => updateElement(selectedElement.id, { ry: val })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Sweep Angle & Letter Spacing for Arc */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">Sweep Angle</label>
                      <ModernStepper
                        value={arc.sweepAngle || 140}
                        step={5}
                        min={20}
                        max={360}
                        unit="°"
                        onChange={(val) => updateElement(selectedElement.id, { sweepAngle: val })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">Letter Spacing</label>
                      <ModernStepper
                        value={arc.letterSpacing || 0}
                        step={0.05}
                        min={-1}
                        max={10}
                        unit="mm"
                        onChange={(val) => updateElement(selectedElement.id, { letterSpacing: val })}
                      />
                    </div>
                  </div>

                  {/* 1-Click: Spread Across Full Arc Area */}
                  <button
                    type="button"
                    onClick={handleSpreadAcrossArc}
                    className="w-full py-2 px-3 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/60 rounded-xl text-[#0d99ff] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer group"
                    title="Automatically adjust letter spacing so text spans evenly across the whole curve"
                  >
                    <span>↔️ Spread Across Full Arc</span>
                  </button>

                  {/* Circle Path Position & Rotation along circle line */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/70">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <span>🔄 Position on Circle</span>
                      </label>
                      <div className="w-32">
                        <ModernStepper
                          value={arc.angleOffset || 0}
                          step={1}
                          min={-180}
                          max={180}
                          unit="°"
                          onChange={(val) => updateElement(selectedElement.id, { angleOffset: val })}
                        />
                      </div>
                    </div>

                    {/* Quick Rotation Angle Slider */}
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={arc.angleOffset || 0}
                      onChange={(e) => updateElement(selectedElement.id, { angleOffset: parseFloat(e.target.value) || 0 })}
                      className="w-full accent-[#0d99ff] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />

                    {/* Quick Preset Buttons along Circle */}
                    <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => updateElement(selectedElement.id, { angleOffset: 0 })}
                        className={`py-1.5 px-1 rounded-lg border font-semibold text-center transition-all ${
                          !arc.angleOffset
                            ? 'bg-[#0d99ff] text-white border-[#0d99ff] font-bold shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                        title="Center Apex (0°)"
                      >
                        Apex 0°
                      </button>
                      <button
                        type="button"
                        onClick={() => updateElement(selectedElement.id, { angleOffset: -90 })}
                        className={`py-1.5 px-1 rounded-lg border font-semibold text-center transition-all ${
                          arc.angleOffset === -90
                            ? 'bg-[#0d99ff] text-white border-[#0d99ff] font-bold shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                        title="Rotate Left (-90°)"
                      >
                        Left -90°
                      </button>
                      <button
                        type="button"
                        onClick={() => updateElement(selectedElement.id, { angleOffset: 90 })}
                        className={`py-1.5 px-1 rounded-lg border font-semibold text-center transition-all ${
                          arc.angleOffset === 90
                            ? 'bg-[#0d99ff] text-white border-[#0d99ff] font-bold shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                        title="Rotate Right (+90°)"
                      >
                        Right +90°
                      </button>
                      <button
                        type="button"
                        onClick={() => updateElement(selectedElement.id, { angleOffset: 180 })}
                        className={`py-1.5 px-1 rounded-lg border font-semibold text-center transition-all ${
                          arc.angleOffset === 180
                            ? 'bg-[#0d99ff] text-white border-[#0d99ff] font-bold shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                        title="Flip (180°)"
                      >
                        Flip 180°
                      </button>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => updateElement(selectedElement.id, { isReversed: !arc.isReversed })}
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                        arc.isReversed
                          ? 'bg-[#e5f2ff] border-[#0d99ff] text-[#0d99ff]'
                          : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>Arc Direction</span>
                      <span className="text-[10px] font-bold uppercase">{arc.isReversed ? 'Bottom Arc' : 'Top Arc'}</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* --- 2. ALIGNMENT & POSITION MATRIX --- */}
        <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-3 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider block">
              Alignment & Position
            </span>
            {selectedElement ? (
              <span className="text-[10px] text-blue-700 font-bold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                Layer Active
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                Canvas Center
              </span>
            )}
          </div>

          {/* Alignment Icons Grid */}
          <div className="grid grid-cols-6 gap-1 bg-white p-1 rounded-xl border border-slate-200/80 text-slate-700 shadow-2xs">
            <button
              onClick={() => alignSelected('center-h')}
              disabled={!selectedId}
              className={`h-7 flex items-center justify-center rounded-lg transition-all ${
                selectedId ? 'hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 cursor-pointer' : 'opacity-35 cursor-not-allowed'
              }`}
              title="Align Center Horizontal"
            >
              <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => alignSelected('center-v')}
              disabled={!selectedId}
              className={`h-7 flex items-center justify-center rounded-lg transition-all ${
                selectedId ? 'hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 cursor-pointer' : 'opacity-35 cursor-not-allowed'
              }`}
              title="Align Center Vertical"
            >
              <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => alignSelected('left')}
              disabled={!selectedId}
              className={`h-7 flex items-center justify-center rounded-lg transition-all ${
                selectedId ? 'hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 cursor-pointer' : 'opacity-35 cursor-not-allowed'
              }`}
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => alignSelected('right')}
              disabled={!selectedId}
              className={`h-7 flex items-center justify-center rounded-lg transition-all ${
                selectedId ? 'hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 cursor-pointer' : 'opacity-35 cursor-not-allowed'
              }`}
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => alignSelected('top')}
              disabled={!selectedId}
              className={`h-7 flex items-center justify-center rounded-lg transition-all font-mono text-[10px] font-bold ${
                selectedId ? 'hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 cursor-pointer' : 'opacity-35 cursor-not-allowed'
              }`}
              title="Align Top / Top Arc"
            >
              TOP
            </button>
            <button
              onClick={() => alignSelected('bottom')}
              disabled={!selectedId}
              className={`h-7 flex items-center justify-center rounded-lg transition-all font-mono text-[10px] font-bold ${
                selectedId ? 'hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 cursor-pointer' : 'opacity-35 cursor-not-allowed'
              }`}
              title="Align Bottom / Bottom Arc"
            >
              BTM
            </button>
          </div>

          {/* Coordinates X & Y with Interactive Steppers */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
            {/* X Coordinate */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight block">X (Horizontal)</span>
              <ModernStepper
                value={
                  selectedElement
                    ? Number((('cx' in selectedElement ? (selectedElement as any).cx : (selectedElement as any).x) ?? (widthMm / 2)).toFixed(1))
                    : Number((widthMm / 2).toFixed(1))
                }
                step={0.5}
                unit="mm"
                disabled={!selectedId}
                onChange={(val) => {
                  if (!selectedId) return;
                  if (selectedElement && 'cx' in selectedElement) updateElement(selectedId, { cx: val } as any);
                  else updateElement(selectedId, { x: val } as any);
                }}
              />
            </div>

            {/* Y Coordinate */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight block">Y (Vertical)</span>
              <ModernStepper
                value={
                  selectedElement
                    ? Number((('cy' in selectedElement ? (selectedElement as any).cy : (selectedElement as any).y) ?? (heightMm / 2)).toFixed(1))
                    : Number((heightMm / 2).toFixed(1))
                }
                step={0.5}
                unit="mm"
                disabled={!selectedId}
                onChange={(val) => {
                  if (!selectedId) return;
                  if (selectedElement && 'cy' in selectedElement) updateElement(selectedId, { cy: val } as any);
                  else updateElement(selectedId, { y: val } as any);
                }}
              />
            </div>
          </div>
          {!selectedId && (
            <p className="text-[10px] text-slate-500 text-center font-medium pt-0.5">
              Click any text or ring on canvas to adjust coordinates
            </p>
          )}
        </div>

        {/* --- 3. SHAPE STROKE WEIGHT & GEOMETRY PROPERTIES --- */}
        {selectedElement && (selectedElement.type === 'ring' || selectedElement.type === 'oval' || selectedElement.type === 'rect' || selectedElement.type === 'serrated-ring' || selectedElement.type === 'line') && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
                {selectedElement.type === 'ring'
                  ? 'Ring Stroke & Size'
                  : selectedElement.type === 'oval'
                  ? 'Oval Stroke & Size'
                  : selectedElement.type === 'rect'
                  ? 'Box Frame & Stroke'
                  : selectedElement.type === 'serrated-ring'
                  ? 'Starburst Ring & Stroke'
                  : 'Line Stroke & Weight'}
              </span>
              <span className="text-[10px] font-mono font-bold text-[#0d99ff] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {((selectedElement as any).strokeWidth || 0.8).toFixed(1)} mm
              </span>
            </div>

            {/* Stroke Thickness / Weight (കട്ടി) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 block">
                Stroke Thickness (Border Weight)
              </label>

              {/* Quick Weight Preset Pills */}
              <div className="grid grid-cols-5 gap-1">
                {[
                  { label: 'Fine', val: 0.4 },
                  { label: 'Normal', val: 0.8 },
                  { label: 'Medium', val: 1.5 },
                  { label: 'Thick', val: 2.5 },
                  { label: 'Heavy', val: 4.0 },
                ].map((preset) => {
                  const isCurrent = Math.abs(((selectedElement as any).strokeWidth || 0.8) - preset.val) < 0.08;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => updateElement(selectedElement.id, { strokeWidth: preset.val } as any)}
                      className={`py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#0d99ff] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Continuous Live Weight Slider + Stepper */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="range"
                  min={0.1}
                  max={8.0}
                  step={0.1}
                  value={(selectedElement as any).strokeWidth || 0.8}
                  onChange={(e) =>
                    updateElement(selectedElement.id, { strokeWidth: parseFloat(e.target.value) } as any)
                  }
                  className="flex-1 accent-[#0d99ff] cursor-pointer"
                />
                <div className="w-24 shrink-0">
                  <ModernStepper
                    value={(selectedElement as any).strokeWidth || 0.8}
                    step={0.1}
                    min={0.1}
                    max={15.0}
                    unit="mm"
                    onChange={(val) => updateElement(selectedElement.id, { strokeWidth: val } as any)}
                  />
                </div>
              </div>
            </div>

            {/* Border Style (Pattern) */}
            {selectedElement.type !== 'serrated-ring' && (
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Border Style
                </label>
                <select
                  value={(selectedElement as any).strokeType || 'solid'}
                  onChange={(e) =>
                    updateElement(selectedElement.id, { strokeType: e.target.value as any } as any)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 focus:border-[#0d99ff] focus:bg-white text-xs text-slate-900 font-semibold outline-none cursor-pointer transition-all"
                >
                  <option value="solid">Solid Continuous Line</option>
                  <option value="dashed">Dashed Line (Equal Spaced)</option>
                  <option value="dotted">Dotted Seal Border</option>
                </select>
              </div>
            )}

            {/* Specific Shape Geometry: Ring */}
            {selectedElement.type === 'ring' && (
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Ring Radius</label>
                <ModernStepper
                  value={(selectedElement as any).radius || 19}
                  step={0.5}
                  min={2}
                  max={60}
                  unit="mm"
                  onChange={(val) => updateElement(selectedElement.id, { radius: val })}
                />
              </div>
            )}

            {/* Specific Shape Geometry: Oval */}
            {selectedElement.type === 'oval' && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Width Radius RX</label>
                  <ModernStepper
                    value={(selectedElement as any).rx || 20}
                    step={0.5}
                    min={2}
                    max={60}
                    unit="mm"
                    onChange={(val) => updateElement(selectedElement.id, { rx: val } as any)}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Height Radius RY</label>
                  <ModernStepper
                    value={(selectedElement as any).ry || 12}
                    step={0.5}
                    min={2}
                    max={60}
                    unit="mm"
                    onChange={(val) => updateElement(selectedElement.id, { ry: val } as any)}
                  />
                </div>
              </div>
            )}

            {/* Specific Shape Geometry: Rect / Box Frame */}
            {selectedElement.type === 'rect' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Width</label>
                    <ModernStepper
                      value={(selectedElement as any).width || 30}
                      step={0.5}
                      min={2}
                      max={120}
                      unit="mm"
                      onChange={(val) => updateElement(selectedElement.id, { width: val } as any)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Height</label>
                    <ModernStepper
                      value={(selectedElement as any).height || 20}
                      step={0.5}
                      min={2}
                      max={120}
                      unit="mm"
                      onChange={(val) => updateElement(selectedElement.id, { height: val } as any)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Corner Rounding (Radius)</label>
                  <ModernStepper
                    value={(selectedElement as any).rx || 0}
                    step={0.5}
                    min={0}
                    max={30}
                    unit="mm"
                    onChange={(val) => updateElement(selectedElement.id, { rx: val, ry: val } as any)}
                  />
                </div>
              </div>
            )}

            {/* Specific Shape Geometry: Starburst (Serrated Ring) */}
            {selectedElement.type === 'serrated-ring' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Outer Radius</label>
                    <ModernStepper
                      value={(selectedElement as any).outerRadius || 18}
                      step={0.5}
                      min={4}
                      max={60}
                      unit="mm"
                      onChange={(val) => updateElement(selectedElement.id, { outerRadius: val } as any)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Inner Radius</label>
                    <ModernStepper
                      value={(selectedElement as any).innerRadius || 16}
                      step={0.5}
                      min={2}
                      max={55}
                      unit="mm"
                      onChange={(val) => updateElement(selectedElement.id, { innerRadius: val } as any)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Starburst Points (Teeth)</label>
                  <ModernStepper
                    value={(selectedElement as any).teeth || 36}
                    step={2}
                    min={8}
                    max={96}
                    unit="pts"
                    onChange={(val) => updateElement(selectedElement.id, { teeth: val } as any)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- 4. STAMP PAD INK COLOR --- */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-bold tracking-wider">
            <span>Stamp Pad Ink Color</span>
          </div>

          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-3 py-2.5 rounded-xl text-xs">
            <div className="flex items-center gap-2.5">
              <span
                className="w-5 h-5 rounded-lg border border-black/10 shadow-xs bg-[#111827]"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 text-xs">Official Laser Black</span>
                <span className="font-mono text-slate-400 text-[10px]">#111827</span>
              </div>
            </div>
            <span className="text-[#0d99ff] font-bold text-[11px] bg-[#e5f2ff] px-2 py-0.5 rounded-md">Active</span>
          </div>
        </div>

        {/* --- 5. LASER PRODUCTION ENGINE --- */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-bold tracking-wider">
            <span>Laser Production Engine</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Setting: Laser Invert */}
            <label className="group relative flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-slate-50/60 border-2 border-slate-200/50 hover:border-[#0d99ff]/30 shadow-sm hover:shadow-md hover:shadow-[#0d99ff]/5 cursor-pointer transition-all duration-300 overflow-hidden">
              <input type="checkbox" checked={laserInvert} onChange={(e) => setLaserInvert(e.target.checked)} className="sr-only peer" />
              <div className="absolute inset-0 bg-[#0d99ff]/0 peer-checked:bg-[#0d99ff]/[0.04] transition-colors duration-300" />
              <div className="relative z-10 flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-all duration-300 ${laserInvert ? 'bg-[#0d99ff] text-white shadow-md shadow-[#0d99ff]/30' : 'bg-slate-100 text-slate-500 group-hover:bg-[#0d99ff]/10 group-hover:text-[#0d99ff]'}`}>
                  <Contrast className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold text-sm tracking-tight transition-colors duration-300 ${laserInvert ? 'text-[#0d99ff]' : 'text-slate-700'}`}>Laser Invert</span>
                  <span className="text-[10px] text-slate-400 font-medium">White on black relief</span>
                </div>
              </div>
              <div className={`relative z-10 w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-300 ${laserInvert ? 'bg-[#0d99ff] border-[#0d99ff]' : 'bg-transparent border-slate-300 group-hover:border-[#0d99ff]/50'}`}>
                <Check className={`w-3.5 h-3.5 text-white transition-transform duration-300 ${laserInvert ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} strokeWidth={3} />
              </div>
            </label>

            {/* Setting: Laser Mirror */}
            <label className="group relative flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-slate-50/60 border-2 border-slate-200/50 hover:border-[#0d99ff]/30 shadow-sm hover:shadow-md hover:shadow-[#0d99ff]/5 cursor-pointer transition-all duration-300 overflow-hidden">
              <input type="checkbox" checked={laserMirror} onChange={(e) => setLaserMirror(e.target.checked)} className="sr-only peer" />
              <div className="absolute inset-0 bg-[#0d99ff]/0 peer-checked:bg-[#0d99ff]/[0.04] transition-colors duration-300" />
              <div className="relative z-10 flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-all duration-300 ${laserMirror ? 'bg-[#0d99ff] text-white shadow-md shadow-[#0d99ff]/30' : 'bg-slate-100 text-slate-500 group-hover:bg-[#0d99ff]/10 group-hover:text-[#0d99ff]'}`}>
                  <FlipHorizontal className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold text-sm tracking-tight transition-colors duration-300 ${laserMirror ? 'text-[#0d99ff]' : 'text-slate-700'}`}>Mirror Flipping</span>
                  <span className="text-[10px] text-slate-400 font-medium">Mirror plate for vulcanization</span>
                </div>
              </div>
              <div className={`relative z-10 w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-300 ${laserMirror ? 'bg-[#0d99ff] border-[#0d99ff]' : 'bg-transparent border-slate-300 group-hover:border-[#0d99ff]/50'}`}>
                <Check className={`w-3.5 h-3.5 text-white transition-transform duration-300 ${laserMirror ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} strokeWidth={3} />
              </div>
            </label>

            {/* Setting: Rubber Press Texture */}
            <label className="group relative flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-slate-50/60 border-2 border-slate-200/50 hover:border-[#0d99ff]/30 shadow-sm hover:shadow-md hover:shadow-[#0d99ff]/5 cursor-pointer transition-all duration-300 overflow-hidden">
              <input type="checkbox" checked={distressEffect} onChange={(e) => setDistressEffect(e.target.checked)} className="sr-only peer" />
              <div className="absolute inset-0 bg-[#0d99ff]/0 peer-checked:bg-[#0d99ff]/[0.04] transition-colors duration-300" />
              <div className="relative z-10 flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-all duration-300 ${distressEffect ? 'bg-[#0d99ff] text-white shadow-md shadow-[#0d99ff]/30' : 'bg-slate-100 text-slate-500 group-hover:bg-[#0d99ff]/10 group-hover:text-[#0d99ff]'}`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold text-sm tracking-tight transition-colors duration-300 ${distressEffect ? 'text-[#0d99ff]' : 'text-slate-700'}`}>Rubber Texture</span>
                  <span className="text-[10px] text-slate-400 font-medium">Realistic vintage ink stamping</span>
                </div>
              </div>
              <div className={`relative z-10 w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-300 ${distressEffect ? 'bg-[#0d99ff] border-[#0d99ff]' : 'bg-transparent border-slate-300 group-hover:border-[#0d99ff]/50'}`}>
                <Check className={`w-3.5 h-3.5 text-white transition-transform duration-300 ${distressEffect ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} strokeWidth={3} />
              </div>
            </label>
          </div>
        </div>

      </div>
      )}
      </div>
    </aside>
  );
};
