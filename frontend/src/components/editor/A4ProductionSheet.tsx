'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useTheme } from '../../context/ThemeContext';
import { A4StampInstance, COMMON_A4_PRESET_SIZES } from '../../types/a4-sheet';
import {
  getA4PageDimensions,
  printA4Sheet,
  downloadA4Svg,
  downloadA4Pdf,
  cloneStampToSize,
  autoNestStampsOnA4,
} from '../../lib/a4-export-engine';
import { morphBetweenShapeFamilies } from '../../lib/shape-morph';
import { generateStampSvg } from '../../lib/svg-generator';
import {
  Printer,
  Download,
  Copy,
  Trash2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Grid,
  Layers,
  Sparkles,
  Contrast,
  FlipHorizontal,
  ChevronDown,
  Plus,
  Minus,
  Move,
  Scissors,
  Check,
  RotateCw,
  Eye,
  FileCode,
  FileText,
  ArrowLeft,
  Settings2,
  ExternalLink,
  Edit3,
} from 'lucide-react';

// Stamp SVG markup — only touches the DOM when the markup really changes (a fresh
// { __html } object on every render made React re-insert every stamp, e.g. on each drag frame)
const RawSvgGroup = React.memo(
  ({ html }: { html: string }) => <g dangerouslySetInnerHTML={{ __html: html }} />,
  (a, b) => a.html === b.html
);

// Symmetrical Modern Stepper Component
const ModernStepper: React.FC<{
  value: number;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  onChange: (val: number) => void;
  disabled?: boolean;
}> = ({ value, step = 1, min, max, unit = 'mm', onChange, disabled }) => {
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

  return (
    <div
      className={`flex items-center h-8 bg-slate-50/90 dark:bg-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 focus-within:border-[#0d99ff] focus-within:ring-2 focus-within:ring-[#0d99ff]/15 focus-within:bg-white transition-all shadow-2xs overflow-hidden ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || (min !== undefined && value <= min)}
        className="w-7 h-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#0d99ff] hover:bg-slate-200/60 dark:hover:bg-slate-700/60 active:bg-slate-300/60 dark:active:bg-slate-600/60 disabled:opacity-30 transition-colors shrink-0 select-none cursor-pointer"
        title={`Decrease (-${step}${unit})`}
      >
        <Minus className="w-3 h-3 stroke-[2.2]" />
      </button>
      <div className="flex-1 flex items-center justify-center min-w-0 px-1 border-x border-slate-200/80 dark:border-slate-700 h-full">
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={isNaN(value) ? '' : Number(value.toFixed(1))}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) onChange(val);
          }}
          disabled={disabled}
          className="w-full text-center bg-transparent font-mono font-bold text-xs text-slate-800 dark:text-slate-100 outline-none p-0"
        />
        {unit && <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium select-none ml-0.5">{unit}</span>}
      </div>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || (max !== undefined && value >= max)}
        className="w-7 h-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#0d99ff] hover:bg-slate-200/60 dark:hover:bg-slate-700/60 active:bg-slate-300/60 dark:active:bg-slate-600/60 disabled:opacity-30 transition-colors shrink-0 select-none cursor-pointer"
        title={`Increase (+${step}${unit})`}
      >
        <Plus className="w-3 h-3 stroke-[2.2]" />
      </button>
    </div>
  );
};

// Compact "X  54.5 mm" field: type a value, or use ↑ / ↓ (Shift = ×10)
const SheetNumberField: React.FC<{
  label: string;
  value: number;
  step?: number;
  onChange: (val: number) => void;
}> = ({ label, value, step = 1, onChange }) => {
  const fmt = (v: number) => (isNaN(v) ? '' : String(Number(v.toFixed(1))));
  const [draft, setDraft] = useState(fmt(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setDraft(fmt(value));
  }, [value, focused]);

  const commit = (text: string) => {
    const v = parseFloat(text);
    if (!isNaN(v)) onChange(Number(v.toFixed(2)));
  };

  return (
    <label className="h-8 flex items-center gap-1.5 px-2.5 rounded-md bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 focus-within:bg-white dark:focus-within:bg-slate-800 ring-1 ring-transparent focus-within:ring-[#0d99ff] transition-colors cursor-text">
      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 select-none">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        onFocus={(e) => {
          setFocused(true);
          e.currentTarget.select();
        }}
        onBlur={() => {
          setFocused(false);
          commit(draft);
        }}
        onChange={(e) => {
          setDraft(e.target.value);
          commit(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const next = Number((value + (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1)).toFixed(2));
            onChange(next);
            setDraft(fmt(next));
          } else if (e.key === 'Enter') {
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        className="min-w-0 flex-1 bg-transparent text-[12px] text-slate-800 dark:text-slate-100 tabular-nums outline-none"
      />
      <span className="text-[11px] text-slate-400 dark:text-slate-500 select-none">mm</span>
    </label>
  );
};

export const A4ProductionSheet: React.FC = () => {
  const {
    projectTitle,
    elements: currentElements,
    widthMm: currentW,
    heightMm: currentH,
    shape: currentShape,
    inkColor: currentInk,
    mountPreset,
    setViewMode,
    a4Instances,
    setA4Instances,
    selectedA4InstanceId,
    setSelectedA4InstanceId,
    a4Config,
    setA4Config,
    addCurrentToA4,
    generateA4SizeVariants,
    autoNestA4,
    updateA4Instance,
    duplicateA4Instance,
    deleteA4Instance,
    clearA4Instances,
    editA4InstanceInSingleEditor,
  } = useEditor();

  // On screen only (printing uses printA4Sheet): dark theme shows a dark sheet with white ink;
  // Laser Invert flips it back to a light sheet. In light theme Invert shows white on black as before.
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const screenInvert = a4Config.laserInvert && !isDark;
  const darkPaper = isDark && !a4Config.laserInvert;

  const [a4Zoom, setA4Zoom] = useState<number>(0.58);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);

  const isSpacePressedRef = useRef<boolean>(false);
  const isPanningRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const sheetAreaRef = useRef<HTMLDivElement>(null);
  // the key handler is registered once — read the live selection / delete through refs
  const selectedIdRef = useRef<string | null>(selectedA4InstanceId);
  selectedIdRef.current = selectedA4InstanceId;
  const deleteRef = useRef(deleteA4Instance);
  deleteRef.current = deleteA4Instance;
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => {
    if (!confirmClear) return;
    const t = window.setTimeout(() => setConfirmClear(false), 3000);
    return () => window.clearTimeout(t);
  }, [confirmClear]);
  const a4ZoomRef = useRef(a4Zoom);
  a4ZoomRef.current = a4Zoom;
  const hasDuplicatedOnAltDragRef = useRef<boolean>(false);

  const [isDraggingStamp, setIsDraggingStamp] = useState<boolean>(false);
  const [dragOffsetMm, setDragOffsetMm] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredInstanceId, setHoveredInstanceId] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [isAddPresetOpen, setIsAddPresetOpen] = useState<boolean>(false);

  const sheetRef = useRef<SVGSVGElement | null>(null);

  const { widthMm: pageW, heightMm: pageH } = getA4PageDimensions(a4Config.orientation);

  // Global Spacebar Key & Window-Level Pointer listeners for Butter-Smooth Pan (Figma / Illustrator style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        isSpacePressedRef.current = true;
        setIsSpacePressed(true);
      }
      // Delete / Backspace removes the selected stamp from the sheet
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdRef.current) {
        e.preventDefault();
        deleteRef.current(selectedIdRef.current);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        isPanningRef.current = false;
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    const handleWindowPointerDown = (e: PointerEvent) => {
      if (isSpacePressedRef.current || e.button === 1) {
        isPanningRef.current = true;
        setIsPanning(true);
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (isPanningRef.current) {
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      }
    };

    const handleWindowPointerUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        setIsPanning(false);
      }
    };

    // Wheel over the sheet: scroll it (Shift = sideways). Ctrl / Cmd + wheel zooms.
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      const area = sheetAreaRef.current;
      if (!area || !target || !area.contains(target)) return; // sidebars and panels scroll normally

      e.preventDefault();

      if (!e.ctrlKey && !e.metaKey) {
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? area.clientHeight : 1;
        let dx = e.deltaX * unit;
        let dy = e.deltaY * unit;
        if (e.shiftKey && !dx) { dx = dy; dy = 0; }
        // keep part of the sheet on screen
        const z = a4ZoomRef.current;
        const longSide = Math.max(pageW, pageH) * 3.7795 * z; // same for portrait / landscape
        const maxX = longSide / 2 + area.clientWidth / 2 - 120;
        const maxY = longSide / 2 + area.clientHeight / 2 - 120;
        const clamp = (v: number, m: number) => Math.max(-Math.max(0, m), Math.min(Math.max(0, m), v));
        setPanOffset((prev) => ({ x: clamp(prev.x - dx, maxX), y: clamp(prev.y - dy, maxY) }));
        return;
      }

      const zoomDelta = e.deltaY < 0 ? 1.08 : 0.92;
      setA4Zoom((prev) => Math.min(3.5, Math.max(0.2, Number((prev * zoomDelta).toFixed(3)))));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('pointerdown', handleWindowPointerDown);
    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointerdown', handleWindowPointerDown);
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Screen pixel to A4 sheet millimeter conversion
  const screenToA4Mm = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      if (!sheetRef.current) return { x: 0, y: 0 };
      const rect = sheetRef.current.getBoundingClientRect();
      const scaleX = pageW / rect.width;
      const scaleY = pageH / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    [pageW, pageH]
  );

  // Drag start handler for individual stamp on A4 sheet
  const handleStampPointerDown = (e: React.PointerEvent, inst: A4StampInstance) => {
    if (isSpacePressedRef.current || e.button === 1) {
      return; // Handled by window pointerdown pan listener
    }
    e.stopPropagation();
    setSelectedA4InstanceId(inst.instanceId);
    setIsDraggingStamp(true);

    const posMm = screenToA4Mm(e.clientX, e.clientY);
    setDragOffsetMm({
      x: posMm.x - inst.xMm,
      y: posMm.y - inst.yMm,
    });
  };

  // Drag move handler across A4 sheet
  const handleSheetPointerMove = (e: React.PointerEvent) => {
    if (isPanningRef.current || !isDraggingStamp || !selectedA4InstanceId) return;

    // Figma Alt + Drag: Duplicate stamp instance on A4 sheet
    if (e.altKey && !hasDuplicatedOnAltDragRef.current) {
      hasDuplicatedOnAltDragRef.current = true;
      const target = a4Instances.find((x) => x.instanceId === selectedA4InstanceId);
      if (target) {
        const newId = `inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const copy: A4StampInstance = {
          ...target,
          instanceId: newId,
          name: `${target.name} (Copy)`,
          elements: JSON.parse(JSON.stringify(target.elements)),
        };
        setA4Instances((prev) => [...prev, copy]);
        setSelectedA4InstanceId(newId);
      }
    }

    const posMm = screenToA4Mm(e.clientX, e.clientY);
    let targetX = posMm.x - dragOffsetMm.x;
    let targetY = posMm.y - dragOffsetMm.y;

    const currentInst = a4Instances.find((x) => x.instanceId === selectedA4InstanceId);
    if (!currentInst) return;

    // Keep within A4 sheet boundaries (respect margins)
    const minX = 2;
    const minY = 2;
    const maxX = pageW - currentInst.widthMm - 2;
    const maxY = pageH - currentInst.heightMm - 2;

    targetX = Math.max(minX, Math.min(maxX, targetX));
    targetY = Math.max(minY, Math.min(maxY, targetY));

    updateA4Instance(selectedA4InstanceId, {
      xMm: Number(targetX.toFixed(1)),
      yMm: Number(targetY.toFixed(1)),
    });
  };

  const handleSheetPointerUp = () => {
    hasDuplicatedOnAltDragRef.current = false;
    setIsDraggingStamp(false);
  };

  // Add specific preset size cloned from current design
  const handleAddPresetSize = (preset: typeof COMMON_A4_PRESET_SIZES[0]) => {
    const newInst = cloneStampToSize(
      currentElements,
      currentW,
      currentH,
      preset.widthMm,
      preset.heightMm,
      preset.shape,
      `${projectTitle} (${preset.label})`,
      currentInk,
      preset.mountName
    );
    // borders redrawn at the new size / shape, everything else scaled evenly to fit inside
    const tag = Math.random().toString(36).slice(2, 6);
    newInst.elements = morphBetweenShapeFamilies(currentElements, currentW, currentH, preset.widthMm, preset.heightMm, preset.shape).map(
      (el: any) => ({ ...el, id: `${el.id}-${tag}` })
    );

    setA4Instances((prev) => autoNestStampsOnA4([...prev, newInst], a4Config));
    setSelectedA4InstanceId(newInst.instanceId);
    setIsAddPresetOpen(false);
  };

  const selectedInstance = a4Instances.find((x) => x.instanceId === selectedA4InstanceId) || null;

  return (
    <div
      className={`relative flex-1 flex flex-row h-full overflow-hidden bg-[#eef2f6] dark:bg-slate-950 select-none ${
        isPanning ? 'cursor-grabbing' : isSpacePressed ? 'cursor-grab' : ''
      }`}
      onPointerMove={handleSheetPointerMove}
      onPointerUp={handleSheetPointerUp}
      onPointerLeave={handleSheetPointerUp}
    >
      {/* --- 1. LEFT SIDEBAR: A4 IMPOSITION TOOLKIT --- */}
      <aside
        onClick={(e) => e.stopPropagation()}
        className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-20 shrink-0 overflow-y-auto"
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">A4 sheet</h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 tabular-nums">
            {pageW} × {pageH} mm · {a4Instances.length} {a4Instances.length === 1 ? 'stamp' : 'stamps'}
          </p>
        </div>

        <div className="flex-1 px-4 py-4 space-y-5">
          {/* Add stamps */}
          <section className="space-y-1.5">
            <h3 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 mb-2">Add stamps</h3>

            <button
              type="button"
              onClick={addCurrentToA4}
              className="w-full h-9 flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-[12px] font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add current stamp
            </button>

            {/* Clone in another size */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAddPresetOpen(!isAddPresetOpen)}
                aria-expanded={isAddPresetOpen}
                className={`w-full h-9 flex items-center gap-2.5 px-2.5 rounded-lg text-[12px] text-slate-700 dark:text-slate-200 transition-colors cursor-pointer ${
                  isAddPresetOpen ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Maximize2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                Add in another size
                <ChevronDown className={`ml-auto w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isAddPresetOpen ? 'rotate-180' : ''}`} />
              </button>

              {isAddPresetOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl ring-1 ring-slate-200 dark:ring-slate-700 p-1 z-50 max-h-64 overflow-y-auto fx-menu">
                  {COMMON_A4_PRESET_SIZES.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleAddPresetSize(preset)}
                      className="fx-item w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="min-w-0">
                        <span className="block text-[12px] font-medium text-slate-800 dark:text-slate-100">{preset.label}</span>
                        <span className="block text-[10.5px] text-slate-400 dark:text-slate-500 truncate">{preset.mountName}</span>
                      </span>
                      <Plus className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={generateA4SizeVariants}
              title="Adds the current design in 5 common sizes"
              className="w-full h-9 flex items-center gap-2.5 px-2.5 rounded-lg text-[12px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              Add 5 sizes
            </button>

            <button
              type="button"
              onClick={autoNestA4}
              title="Packs all stamps tightly to save rubber"
              className="w-full h-9 flex items-center gap-2.5 px-2.5 rounded-lg text-[12px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Scissors className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              Auto-pack
              <span className="ml-auto text-[10.5px] text-slate-400 dark:text-slate-500">saves rubber</span>
            </button>

            {/* Clear the whole sheet — second click confirms */}
            {a4Instances.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearA4Instances();
                }}
                title="Remove all stamps from the A4 sheet"
                className="w-full h-9 flex items-center gap-2.5 px-2.5 rounded-lg text-[12px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Clear sheet
                <span className="ml-auto text-[10.5px] opacity-70 tabular-nums">{a4Instances.length} stamps</span>
              </button>
            )}
          </section>

          {/* Output */}
          <section className="space-y-0.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 mb-1.5">Output</h3>
            {([
              { key: 'laserInvert', label: 'Invert', hint: 'White on black relief', Icon: Contrast },
              { key: 'laserMirror', label: 'Mirror', hint: 'Horizontal plate mirror', Icon: FlipHorizontal },
              { key: 'showCropMarks', label: 'Crop marks', hint: 'Corner cutting ticks', Icon: Maximize2 },
              { key: 'showCutLines', label: 'Cut outlines', hint: 'Dashed box around each stamp', Icon: Scissors },
            ] as const).map(({ key, label, hint, Icon }) => {
              const on = !!(a4Config as any)[key];
              return (
                <label key={key} title={hint} className="flex items-center gap-2.5 h-9 -mx-1.5 px-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                  <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="text-[12px] text-slate-700 dark:text-slate-200">{label}</span>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => setA4Config((prev) => ({ ...prev, [key]: e.target.checked }))}
                    className="sr-only"
                  />
                  <span aria-hidden className={`ml-auto relative w-7 h-4 rounded-full shrink-0 transition-colors ${on ? 'bg-[#0d99ff]' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-3' : ''}`} />
                  </span>
                </label>
              );
            })}
          </section>
        </div>

        {/* Print & export */}
        <div className="p-4 space-y-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => printA4Sheet(a4Instances, a4Config, projectTitle)}
            className="w-full h-9 flex items-center justify-center gap-2 rounded-lg bg-[#0d99ff] hover:bg-[#0b87e0] active:scale-[0.98] text-white text-[12px] font-semibold shadow-[0_4px_12px_-4px_rgba(13,153,255,0.7)] transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print 1:1
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => downloadA4Svg(a4Instances, a4Config, `${projectTitle}_a4_sheet.svg`)}
              className="h-8 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-[12px] font-medium transition-colors cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-slate-400" />
              SVG
            </button>
            <button
              type="button"
              onClick={() => downloadA4Pdf(a4Instances, a4Config, `${projectTitle}_a4_sheet.pdf`)}
              className="h-8 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-[12px] font-medium transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              PDF
            </button>
          </div>
        </div>
      </aside>

      {/* --- 2. CENTER CANVAS: A4 SHEET SURFACE (AUTO-FITTED & FULLY VISIBLE) --- */}
      <div
        ref={sheetAreaRef}
        className={`flex-1 overflow-hidden flex items-center justify-center p-6 relative bg-[#e2e8f0] dark:bg-[#0b0f19] ${
          isPanning ? 'cursor-grabbing' : isSpacePressed ? 'cursor-grab' : ''
        }`}
      >
        {/* Floating Mini Zoom Controls */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-4 top-4 z-20 flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-md text-xs"
        >
          <button
            type="button"
            onClick={() => {
              setA4Zoom(0.58);
              setPanOffset({ x: 0, y: 0 });
            }}
            className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              Math.abs(a4Zoom - 0.58) < 0.05 && panOffset.x === 0 && panOffset.y === 0
                ? 'bg-blue-50 dark:bg-blue-950/40 text-[#0d99ff]'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Fit Entire A4 Page on Screen"
          >
            Fit Page
          </button>
          <button
            type="button"
            onClick={() => setA4Zoom(1.0)}
            className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              Math.abs(a4Zoom - 1.0) < 0.05 ? 'bg-blue-50 dark:bg-blue-950/40 text-[#0d99ff]' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="100% Actual Physical Print Scale"
          >
            100%
          </button>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
          <button
            type="button"
            onClick={() => setA4Zoom((z) => Math.max(0.3, Number((z - 0.1).toFixed(2))))}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 w-10 text-center select-none">
            {Math.round(a4Zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setA4Zoom((z) => Math.min(2.0, Number((z + 0.1).toFixed(2))))}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Interactive A4 Sheet Canvas Area */}
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${a4Zoom})`,
            transformOrigin: 'center center',
            transition: isDraggingStamp || isPanning ? 'none' : 'transform 0.15s ease',
          }}
          className="relative select-none shrink-0"
        >
            {/* Physical A4 Paper Surface (210 x 297 mm at 3.7795 px/mm) */}
            <div
              style={{
                width: `${pageW * 3.7795}px`,
                height: `${pageH * 3.7795}px`,
                backgroundColor: screenInvert ? '#000000' : darkPaper ? '#111827' : '#ffffff',
                boxShadow: isDark
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.12)'
                  : '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              }}
              className="relative transition-colors duration-200"
            >
              {/* Margin Cutting Safe Area Guides (10mm from page edges) */}
              <div
                style={{
                  position: 'absolute',
                  inset: `${10 * 3.7795}px`,
                  border: `1px dashed ${(screenInvert || darkPaper) ? 'rgba(255,255,255,0.15)' : 'rgba(13,153,255,0.2)'}`,
                  pointerEvents: 'none',
                }}
              />

              {/* SVG Vector Renderer for the entire A4 page */}
              <svg
                ref={sheetRef}
                viewBox={`0 0 ${pageW} ${pageH}`}
                className="w-full h-full block"
                style={{ overflow: 'visible' }}
              >
                {/* A4 Sheet Header Meta */}
                <g id="a4-interactive-meta" transform="translate(12, 8)">
                  <text
                    x="0"
                    y="0"
                    fontFamily="sans-serif"
                    fontSize="2.4"
                    fontWeight="bold"
                    fill={(screenInvert || darkPaper) ? '#ffffff' : '#0f172a'}
                  >
                    STAMIOX A4 GANG-SHEET PRODUCTION
                  </text>
                  <text
                    x="0"
                    y="3.2"
                    fontFamily="sans-serif"
                    fontSize="1.6"
                    fill={(screenInvert || darkPaper) ? '#888888' : '#64748b'}
                  >
                    {a4Instances.length} {a4Instances.length === 1 ? 'stamp' : 'stamps'} arranged • 1:1 Scale
                  </text>
                </g>

                {/* 50mm Printer Calibration Bar at bottom */}
                <g id="a4-interactive-ruler" transform={`translate(${pageW - 65}, ${pageH - 12})`}>
                  <rect
                    x="0"
                    y="0"
                    width="50"
                    height="3"
                    fill="none"
                    stroke={(screenInvert || darkPaper) ? '#ffffff' : '#000000'}
                    strokeWidth="0.3"
                  />
                  <line x1="0" y1="0" x2="0" y2="3" stroke={(screenInvert || darkPaper) ? '#ffffff' : '#000000'} strokeWidth="0.6" />
                  <line x1="25" y1="0" x2="25" y2="3" stroke={(screenInvert || darkPaper) ? '#ffffff' : '#000000'} strokeWidth="0.3" />
                  <line x1="50" y1="0" x2="50" y2="3" stroke={(screenInvert || darkPaper) ? '#ffffff' : '#000000'} strokeWidth="0.6" />
                  <text
                    x="25"
                    y="-1.2"
                    fontFamily="sans-serif"
                    fontSize="1.6"
                    fontWeight="bold"
                    textAnchor="middle"
                    fill={(screenInvert || darkPaper) ? '#ffffff' : '#000000'}
                  >
                    1:1 CALIBRATION BAR (50 mm)
                  </text>
                  <text
                    x="0"
                    y="5"
                    fontFamily="monospace"
                    fontSize="1.3"
                    textAnchor="middle"
                    fill={(screenInvert || darkPaper) ? '#ffffff' : '#000000'}
                  >
                    0
                  </text>
                  <text
                    x="25"
                    y="5"
                    fontFamily="monospace"
                    fontSize="1.3"
                    textAnchor="middle"
                    fill={(screenInvert || darkPaper) ? '#ffffff' : '#000000'}
                  >
                    25
                  </text>
                  <text
                    x="50"
                    y="5"
                    fontFamily="monospace"
                    fontSize="1.3"
                    textAnchor="middle"
                    fill={(screenInvert || darkPaper) ? '#ffffff' : '#000000'}
                  >
                    50mm
                  </text>
                </g>

                {/* Empty State when no stamps have been placed */}
                {a4Instances.length === 0 && (
                  <g transform={`translate(${pageW / 2}, ${pageH / 2})`} pointerEvents="none">
                    <rect
                      x="-75"
                      y="-22"
                      width="150"
                      height="44"
                      rx="4"
                      fill={(screenInvert || darkPaper) ? '#1e293b' : '#f8fafc'}
                      stroke={(screenInvert || darkPaper) ? '#334155' : '#cbd5e1'}
                      strokeWidth="0.4"
                      strokeDasharray="2, 2"
                    />
                    <text
                      x="0"
                      y="-5"
                      textAnchor="middle"
                      fontFamily="sans-serif"
                      fontSize="3.8"
                      fontWeight="600"
                      fill={(screenInvert || darkPaper) ? '#f1f5f9' : '#1e293b'}
                    >
                      A4 Sheet is Empty
                    </text>
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fontFamily="sans-serif"
                      fontSize="2.2"
                      fill={(screenInvert || darkPaper) ? '#94a3b8' : '#64748b'}
                    >
                      Click &ldquo;Add current stamp&rdquo; on the left to place your design
                    </text>
                  </g>
                )}

                {/* Placed Stamps Layer */}
                {a4Instances.map((inst, index) => {
                  const isSelected = inst.instanceId === selectedA4InstanceId;
                  const isHovered = inst.instanceId === hoveredInstanceId;

                  const rawSvg = generateStampSvg({
                    widthMm: inst.widthMm,
                    heightMm: inst.heightMm,
                    inkColor: screenInvert ? '#ffffff' : darkPaper ? '#f1f5f9' : inst.inkColor,
                    elements: inst.elements,
                    shape: inst.shape,
                    invert: screenInvert,
                    mirror: a4Config.laserMirror,
                    distressEffect: false,
                  });

                  // Place the whole stamp SVG (sized in mm, with its own viewBox) so every nested group,
                  // transform and mirror stays intact. Cutting out <g id="stamp-content">…</g> with a
                  // regex stopped at the first nested </g> and spilled the rest outside the stamp.
                  const innerSvgContent = rawSvg
                    .replace(/width="[^"]*mm"/, `width="${inst.widthMm}"`)
                    .replace(/height="[^"]*mm"/, `height="${inst.heightMm}" x="0" y="0" overflow="visible"`)
                    .replace(/style="background-color: none;"/, '');

                  // Corner tick marks (Crop Marks)
                  const tickLen = 2.5;
                  const guideStroke = (screenInvert || darkPaper) ? '#4ade80' : '#0d99ff';

                  return (
                    <g
                      key={inst.instanceId}
                      transform={`translate(${inst.xMm}, ${inst.yMm})`}
                      onPointerDown={(e) => handleStampPointerDown(e, inst)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        editA4InstanceInSingleEditor(inst.instanceId);
                      }}
                      onMouseEnter={() => setHoveredInstanceId(inst.instanceId)}
                      onMouseLeave={() => setHoveredInstanceId(null)}
                      className="cursor-move group"
                      style={{ cursor: isDraggingStamp && isSelected ? 'grabbing' : 'grab' }}
                    >
                      {/* Transparent Hit Area for Easy Dragging */}
                      <rect
                        x="0"
                        y="0"
                        width={inst.widthMm}
                        height={inst.heightMm}
                        fill="transparent"
                      />

                      {/* Crop Marks around the stamp */}
                      {a4Config.showCropMarks && (
                        <g opacity={isSelected || isHovered ? 1 : 0.6}>
                          <line x1={-tickLen} y1="0" x2="0" y2="0" stroke={guideStroke} strokeWidth="0.25" />
                          <line x1="0" y1={-tickLen} x2="0" y2="0" stroke={guideStroke} strokeWidth="0.25" />
                          <line x1={inst.widthMm} y1="0" x2={inst.widthMm + tickLen} y2="0" stroke={guideStroke} strokeWidth="0.25" />
                          <line x1={inst.widthMm} y1={-tickLen} x2={inst.widthMm} y2="0" stroke={guideStroke} strokeWidth="0.25" />
                          <line x1={-tickLen} y1={inst.heightMm} x2="0" y2={inst.heightMm} stroke={guideStroke} strokeWidth="0.25" />
                          <line x1="0" y1={inst.heightMm} x2="0" y2={inst.heightMm + tickLen} stroke={guideStroke} strokeWidth="0.25" />
                          <line x1={inst.widthMm} y1={inst.heightMm} x2={inst.widthMm + tickLen} y2={inst.heightMm} stroke={guideStroke} strokeWidth="0.25" />
                          <line x1={inst.widthMm} y1={inst.heightMm} x2={inst.widthMm} y2={inst.heightMm + tickLen} stroke={guideStroke} strokeWidth="0.25" />
                        </g>
                      )}

                      {/* Cutting Contour Outline */}
                      {a4Config.showCutLines && (
                        <rect
                          x="0"
                          y="0"
                          width={inst.widthMm}
                          height={inst.heightMm}
                          fill="none"
                          stroke={guideStroke}
                          strokeWidth="0.15"
                          strokeDasharray="1.5, 1.5"
                          opacity={isSelected ? 1 : 0.5}
                        />
                      )}

                      {/* Stamp SVG Content */}
                      <RawSvgGroup html={innerSvgContent} />

                      {/* Selection Bounding Highlight (Clean Figma style) */}
                      {isSelected && (
                        <g pointerEvents="none">
                          <rect
                            x="-0.6"
                            y="-0.6"
                            width={inst.widthMm + 1.2}
                            height={inst.heightMm + 1.2}
                            fill="none"
                            stroke="#0d99ff"
                            strokeWidth="0.3"
                            strokeDasharray="1.5, 1.5"
                          />
                          {/* Corner handles */}
                          <rect x="-1" y="-1" width="1.2" height="1.2" fill="#0d99ff" />
                          <rect x={inst.widthMm - 0.2} y="-1" width="1.2" height="1.2" fill="#0d99ff" />
                          <rect x="-1" y={inst.heightMm - 0.2} width="1.2" height="1.2" fill="#0d99ff" />
                          <rect x={inst.widthMm - 0.2} y={inst.heightMm - 0.2} width="1.2" height="1.2" fill="#0d99ff" />
                        </g>
                      )}

                      {/* Quick remove (✕) on the hovered / selected stamp */}
                      {(isSelected || isHovered) && (() => {
                        const pxToMmHere = 1 / (3.7795 * a4Zoom); // keep it ~the same size on screen at any zoom
                        const r = 9 * pxToMmHere;
                        const arm = 3.2 * pxToMmHere;
                        const cx = inst.widthMm;
                        const cy = 0;
                        return (
                          <g
                            role="button"
                            aria-label="Remove stamp"
                            className="cursor-pointer"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteA4Instance(inst.instanceId);
                            }}
                          >
                            <title>Remove from sheet (Delete)</title>
                            <circle cx={cx} cy={cy} r={r} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5 * pxToMmHere} />
                            <line x1={cx - arm} y1={cy - arm} x2={cx + arm} y2={cy + arm} stroke="#ffffff" strokeWidth={1.6 * pxToMmHere} strokeLinecap="round" />
                            <line x1={cx + arm} y1={cy - arm} x2={cx - arm} y2={cy + arm} stroke="#ffffff" strokeWidth={1.6 * pxToMmHere} strokeLinecap="round" />
                          </g>
                        );
                      })()}

                      {/* Dimension Badge Label */}
                      <text
                        x={inst.widthMm / 2}
                        y={inst.heightMm + 2.8}
                        fontFamily="sans-serif"
                        fontSize="1.7"
                        fontWeight="bold"
                        textAnchor="middle"
                        fill={isSelected ? '#0d99ff' : (screenInvert || darkPaper) ? '#aaaaaa' : '#64748b'}
                        pointerEvents="none"
                      >
                        #{index + 1}: {Math.round(inst.widthMm)}×{Math.round(inst.heightMm)}mm
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* Right Floating Inspector for Selected Stamp Variant */}
        {selectedInstance && (
          <aside
            onClick={(e) => e.stopPropagation()}
            className="w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col z-20 fx-panel"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0 flex-1">
                <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white">Stamp</h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 tabular-nums">
                  {selectedInstance.widthMm} × {selectedInstance.heightMm} mm
                </p>
              </div>
              <button
                type="button"
                onClick={() => duplicateA4Instance(selectedInstance.instanceId)}
                className="h-8 w-8 rounded-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Duplicate"
                aria-label="Duplicate"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => deleteA4Instance(selectedInstance.instanceId)}
                className="h-8 w-8 rounded-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                title="Remove from sheet"
                aria-label="Remove from sheet"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {/* Name */}
              <section className="space-y-2">
                <h3 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">Name</h3>
                <input
                  type="text"
                  value={selectedInstance.name}
                  onChange={(e) => updateA4Instance(selectedInstance.instanceId, { name: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-md bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 ring-1 ring-transparent focus:ring-[#0d99ff] text-[12px] text-slate-800 dark:text-slate-100 outline-none transition-colors"
                />
              </section>

              {/* Position on the sheet */}
              <section className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">Position on sheet</h3>
                <div className="grid grid-cols-2 gap-2">
                  <SheetNumberField
                    label="X"
                    value={selectedInstance.xMm}
                    onChange={(v) => updateA4Instance(selectedInstance.instanceId, { xMm: v })}
                  />
                  <SheetNumberField
                    label="Y"
                    value={selectedInstance.yMm}
                    onChange={(v) => updateA4Instance(selectedInstance.instanceId, { yMm: v })}
                  />
                </div>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-500">Drag on the sheet · ↑ ↓ to nudge</p>
              </section>

              {/* Text of this copy */}
              {(() => {
                const texts = selectedInstance.elements.filter((el) => el.type === 'text' || el.type === 'arc-text') as any[];
                return (
                  <section className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">Text</h3>
                      <span className="text-[10.5px] text-slate-400 dark:text-slate-500">this copy only</span>
                    </div>
                    {texts.length === 0 ? (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 py-2">This stamp has no text.</p>
                    ) : (
                      texts.map((el, i) => (
                        <label key={el.id || i} className="block space-y-1">
                          <span className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            {el.type === 'arc-text' ? (el.isReversed ? 'Bottom curve' : 'Top curve') : 'Text'}
                            <span className="tabular-nums text-slate-400 dark:text-slate-500">{el.fontSize} mm</span>
                          </span>
                          <input
                            type="text"
                            value={el.text || ''}
                            onChange={(e) => {
                              const updatedElements = selectedInstance.elements.map((x) =>
                                x.id === el.id ? { ...x, text: e.target.value } : x
                              );
                              updateA4Instance(selectedInstance.instanceId, { elements: updatedElements });
                            }}
                            className="w-full h-8 px-2.5 rounded-md bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 ring-1 ring-transparent focus:ring-[#0d99ff] text-[12px] text-slate-800 dark:text-slate-100 outline-none transition-colors"
                          />
                        </label>
                      ))
                    )}
                  </section>
                );
              })()}
            </div>

            {/* Edit the full design */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => editA4InstanceInSingleEditor(selectedInstance.instanceId)}
                className="w-full h-9 flex items-center justify-center gap-2 rounded-lg bg-[#0d99ff] hover:bg-[#0b87e0] active:scale-[0.98] text-white text-[12px] font-semibold shadow-[0_4px_12px_-4px_rgba(13,153,255,0.7)] transition-all cursor-pointer"
                title="Open this stamp with all design tools"
              >
                <Edit3 className="w-4 h-4" />
                Edit in Studio
              </button>
            </div>
          </aside>
        )}
      </div>
  );
};
