'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { A4StampInstance, COMMON_A4_PRESET_SIZES } from '../../types/a4-sheet';
import {
  getA4PageDimensions,
  printA4Sheet,
  downloadA4Svg,
  downloadA4Pdf,
  cloneStampToSize,
} from '../../lib/a4-export-engine';
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
      className={`flex items-center h-8 bg-slate-50/90 hover:bg-slate-100/70 rounded-xl border border-slate-200/80 focus-within:border-[#0d99ff] focus-within:ring-2 focus-within:ring-[#0d99ff]/15 focus-within:bg-white transition-all shadow-2xs overflow-hidden ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      }`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || (min !== undefined && value <= min)}
        className="w-7 h-full flex items-center justify-center text-slate-500 hover:text-[#0d99ff] hover:bg-slate-200/60 active:bg-slate-300/60 disabled:opacity-30 transition-colors shrink-0 select-none cursor-pointer"
        title={`Decrease (-${step}${unit})`}
      >
        <Minus className="w-3 h-3 stroke-[2.2]" />
      </button>
      <div className="flex-1 flex items-center justify-center min-w-0 px-1 border-x border-slate-200/80 h-full">
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
          className="w-full text-center bg-transparent font-mono font-bold text-xs text-slate-800 outline-none p-0"
        />
        {unit && <span className="text-[10px] text-slate-400 font-medium select-none ml-0.5">{unit}</span>}
      </div>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || (max !== undefined && value >= max)}
        className="w-7 h-full flex items-center justify-center text-slate-500 hover:text-[#0d99ff] hover:bg-slate-200/60 active:bg-slate-300/60 disabled:opacity-30 transition-colors shrink-0 select-none cursor-pointer"
        title={`Increase (+${step}${unit})`}
      >
        <Plus className="w-3 h-3 stroke-[2.2]" />
      </button>
    </div>
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

  const [a4Zoom, setA4Zoom] = useState<number>(0.58);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);

  const isSpacePressedRef = useRef<boolean>(false);
  const isPanningRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasDuplicatedOnAltDragRef = useRef<boolean>(false);

  const [isDraggingStamp, setIsDraggingStamp] = useState<boolean>(false);
  const [dragOffsetMm, setDragOffsetMm] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredInstanceId, setHoveredInstanceId] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [isAddPresetOpen, setIsAddPresetOpen] = useState<boolean>(false);

  const sheetRef = useRef<SVGSVGElement | null>(null);

  const { widthMm: pageW, heightMm: pageH } = getA4PageDimensions(a4Config.orientation);

  // If no instances yet, automatically populate with current design
  useEffect(() => {
    if (a4Instances.length === 0 && currentElements.length > 0) {
      addCurrentToA4();
    }
  }, []);

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

    // ONLY Ctrl + Mouse Wheel zooms in / zooms out (Normal wheel does NOT move the A4 sheet)
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        return; // Don't move the A4 sheet when scrolling wheel normally
      }

      const target = e.target as HTMLElement;
      const isInsideSidebar = target && target.closest('aside');
      if (isInsideSidebar) {
        return;
      }

      e.preventDefault();

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

    setA4Instances((prev) => [...prev, newInst]);
    setSelectedA4InstanceId(newInst.instanceId);
    setIsAddPresetOpen(false);
  };

  const selectedInstance = a4Instances.find((x) => x.instanceId === selectedA4InstanceId) || null;

  return (
    <div
      className={`relative flex-1 flex flex-row h-full overflow-hidden bg-[#eef2f6] select-none ${
        isPanning ? 'cursor-grabbing' : isSpacePressed ? 'cursor-grab' : ''
      }`}
      onPointerMove={handleSheetPointerMove}
      onPointerUp={handleSheetPointerUp}
      onPointerLeave={handleSheetPointerUp}
    >
      {/* --- 1. LEFT SIDEBAR: A4 IMPOSITION TOOLKIT --- */}
      <aside
        onClick={(e) => e.stopPropagation()}
        className="w-72 bg-white border-r border-slate-200/90 flex flex-col p-4 z-20 shrink-0 gap-4 overflow-y-auto shadow-xs"
      >
        {/* Header Sheet Info */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="font-bold text-sm text-slate-900 block">A4 Gang-Sheet</span>
            <span className="text-[11px] text-slate-400 font-mono">
              {pageW} × {pageH} mm (1:1 Scale)
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0d99ff] border border-blue-200 font-mono text-[10px] font-bold">
            {a4Instances.length} {a4Instances.length === 1 ? 'Stamp' : 'Stamps'}
          </span>
        </div>

        {/* Section: Stamp Generation */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Add & Arrange Stamps
          </span>

          {/* Add Current Stamp */}
          <button
            type="button"
            onClick={addCurrentToA4}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs shadow-2xs hover:border-[#0d99ff] hover:text-[#0d99ff] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#0d99ff]" />
            <span>Add Stamp (Current Size)</span>
          </button>

          {/* Clone In Standard Size Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAddPresetOpen(!isAddPresetOpen)}
              className="w-full flex items-center justify-between py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Clone In Size...</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isAddPresetOpen && (
              <div className="absolute left-0 mt-1 w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Target Mount Size
                </div>
                <div className="space-y-1 mt-1">
                  {COMMON_A4_PRESET_SIZES.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleAddPresetSize(preset)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50/80 hover:text-[#0d99ff] transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 group-hover:text-[#0d99ff]">
                          {preset.label}
                        </div>
                        <div className="text-[10px] text-slate-400">{preset.mountName}</div>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0d99ff]" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Auto Multi-Sizes */}
          <button
            type="button"
            onClick={generateA4SizeVariants}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 text-[#0d99ff] font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto Multi-Sizes (5 Sizes)</span>
          </button>

          {/* Auto-Pack */}
          <button
            type="button"
            onClick={autoNestA4}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Scissors className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auto-Pack (Save Rubber)</span>
          </button>
        </div>

        {/* Section: Premium Production Settings */}
        <div className="pt-4 pb-2 border-t border-slate-100">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 px-1">
            Production Settings
          </span>
          <div className="grid grid-cols-1 gap-2.5">
            {/* Setting: Laser Invert */}
            <label className="group relative flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-slate-50/60 border-2 border-slate-200/50 hover:border-[#0d99ff]/30 shadow-sm hover:shadow-md hover:shadow-[#0d99ff]/5 cursor-pointer transition-all duration-300 overflow-hidden">
              <input type="checkbox" checked={a4Config.laserInvert} onChange={(e) => setA4Config((prev) => ({ ...prev, laserInvert: e.target.checked }))} className="sr-only peer" />
              <div className="absolute inset-0 bg-[#0d99ff]/0 peer-checked:bg-[#0d99ff]/[0.04] transition-colors duration-300" />
              <div className="relative z-10 flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-all duration-300 ${a4Config.laserInvert ? 'bg-[#0d99ff] text-white shadow-md shadow-[#0d99ff]/30' : 'bg-slate-100 text-slate-500 group-hover:bg-[#0d99ff]/10 group-hover:text-[#0d99ff]'}`}>
                  <Contrast className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold text-sm tracking-tight transition-colors duration-300 ${a4Config.laserInvert ? 'text-[#0d99ff]' : 'text-slate-700'}`}>Laser Invert</span>
                  <span className="text-[10px] text-slate-400 font-medium">White on black relief</span>
                </div>
              </div>
              <div className={`relative z-10 w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-300 ${a4Config.laserInvert ? 'bg-[#0d99ff] border-[#0d99ff]' : 'bg-transparent border-slate-300 group-hover:border-[#0d99ff]/50'}`}>
                <Check className={`w-3.5 h-3.5 text-white transition-transform duration-300 ${a4Config.laserInvert ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} strokeWidth={3} />
              </div>
            </label>

            {/* Setting: Mirror Flipping */}
            <label className="group relative flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-slate-50/60 border-2 border-slate-200/50 hover:border-[#0d99ff]/30 shadow-sm hover:shadow-md hover:shadow-[#0d99ff]/5 cursor-pointer transition-all duration-300 overflow-hidden">
              <input type="checkbox" checked={a4Config.laserMirror} onChange={(e) => setA4Config((prev) => ({ ...prev, laserMirror: e.target.checked }))} className="sr-only peer" />
              <div className="absolute inset-0 bg-[#0d99ff]/0 peer-checked:bg-[#0d99ff]/[0.04] transition-colors duration-300" />
              <div className="relative z-10 flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-all duration-300 ${a4Config.laserMirror ? 'bg-[#0d99ff] text-white shadow-md shadow-[#0d99ff]/30' : 'bg-slate-100 text-slate-500 group-hover:bg-[#0d99ff]/10 group-hover:text-[#0d99ff]'}`}>
                  <FlipHorizontal className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold text-sm tracking-tight transition-colors duration-300 ${a4Config.laserMirror ? 'text-[#0d99ff]' : 'text-slate-700'}`}>Mirror Flipping</span>
                  <span className="text-[10px] text-slate-400 font-medium">Horizontal plate mirror</span>
                </div>
              </div>
              <div className={`relative z-10 w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-300 ${a4Config.laserMirror ? 'bg-[#0d99ff] border-[#0d99ff]' : 'bg-transparent border-slate-300 group-hover:border-[#0d99ff]/50'}`}>
                <Check className={`w-3.5 h-3.5 text-white transition-transform duration-300 ${a4Config.laserMirror ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} strokeWidth={3} />
              </div>
            </label>

            {/* Setting: Show Crop Marks */}
            <label className="group relative flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-slate-50/60 border-2 border-slate-200/50 hover:border-[#0d99ff]/30 shadow-sm hover:shadow-md hover:shadow-[#0d99ff]/5 cursor-pointer transition-all duration-300 overflow-hidden">
              <input type="checkbox" checked={a4Config.showCropMarks} onChange={(e) => setA4Config((prev) => ({ ...prev, showCropMarks: e.target.checked }))} className="sr-only peer" />
              <div className="absolute inset-0 bg-[#0d99ff]/0 peer-checked:bg-[#0d99ff]/[0.04] transition-colors duration-300" />
              <div className="relative z-10 flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-all duration-300 ${a4Config.showCropMarks ? 'bg-[#0d99ff] text-white shadow-md shadow-[#0d99ff]/30' : 'bg-slate-100 text-slate-500 group-hover:bg-[#0d99ff]/10 group-hover:text-[#0d99ff]'}`}>
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold text-sm tracking-tight transition-colors duration-300 ${a4Config.showCropMarks ? 'text-[#0d99ff]' : 'text-slate-700'}`}>Show Crop Marks</span>
                  <span className="text-[10px] text-slate-400 font-medium">Corner cutting ticks</span>
                </div>
              </div>
              <div className={`relative z-10 w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-300 ${a4Config.showCropMarks ? 'bg-[#0d99ff] border-[#0d99ff]' : 'bg-transparent border-slate-300 group-hover:border-[#0d99ff]/50'}`}>
                <Check className={`w-3.5 h-3.5 text-white transition-transform duration-300 ${a4Config.showCropMarks ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} strokeWidth={3} />
              </div>
            </label>

            {/* Setting: Show Cut Outlines */}
            <label className="group relative flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-slate-50/60 border-2 border-slate-200/50 hover:border-[#0d99ff]/30 shadow-sm hover:shadow-md hover:shadow-[#0d99ff]/5 cursor-pointer transition-all duration-300 overflow-hidden">
              <input type="checkbox" checked={a4Config.showCutLines} onChange={(e) => setA4Config((prev) => ({ ...prev, showCutLines: e.target.checked }))} className="sr-only peer" />
              <div className="absolute inset-0 bg-[#0d99ff]/0 peer-checked:bg-[#0d99ff]/[0.04] transition-colors duration-300" />
              <div className="relative z-10 flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-all duration-300 ${a4Config.showCutLines ? 'bg-[#0d99ff] text-white shadow-md shadow-[#0d99ff]/30' : 'bg-slate-100 text-slate-500 group-hover:bg-[#0d99ff]/10 group-hover:text-[#0d99ff]'}`}>
                  <Scissors className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold text-sm tracking-tight transition-colors duration-300 ${a4Config.showCutLines ? 'text-[#0d99ff]' : 'text-slate-700'}`}>Show Cut Outlines</span>
                  <span className="text-[10px] text-slate-400 font-medium">Dashed bounding box</span>
                </div>
              </div>
              <div className={`relative z-10 w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-300 ${a4Config.showCutLines ? 'bg-[#0d99ff] border-[#0d99ff]' : 'bg-transparent border-slate-300 group-hover:border-[#0d99ff]/50'}`}>
                <Check className={`w-3.5 h-3.5 text-white transition-transform duration-300 ${a4Config.showCutLines ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} strokeWidth={3} />
              </div>
            </label>
          </div>
        </div>

        {/* Section: Print & Export (Pinned at Bottom) */}
        <div className="mt-auto space-y-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => printA4Sheet(a4Instances, a4Config, projectTitle)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#0d99ff] hover:bg-[#0c8ce9] text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Print 1:1 A4 Sheet</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => downloadA4Svg(a4Instances, a4Config, `${projectTitle}_a4_sheet.svg`)}
              className="flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-500" />
              <span>SVG Vector</span>
            </button>
            <button
              type="button"
              onClick={() => downloadA4Pdf(a4Instances, a4Config, `${projectTitle}_a4_sheet.pdf`)}
              className="flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-red-500" />
              <span>1:1 PDF</span>
            </button>
          </div>
        </div>
      </aside>

      {/* --- 2. CENTER CANVAS: A4 SHEET SURFACE (AUTO-FITTED & FULLY VISIBLE) --- */}
      <div
        className={`flex-1 overflow-hidden flex items-center justify-center p-6 relative bg-[#e2e8f0] ${
          isPanning ? 'cursor-grabbing' : isSpacePressed ? 'cursor-grab' : ''
        }`}
      >
        {/* Floating Mini Zoom Controls */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-4 top-4 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-200/80 shadow-md text-xs"
        >
          <button
            type="button"
            onClick={() => {
              setA4Zoom(0.58);
              setPanOffset({ x: 0, y: 0 });
            }}
            className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              Math.abs(a4Zoom - 0.58) < 0.05 && panOffset.x === 0 && panOffset.y === 0
                ? 'bg-blue-50 text-[#0d99ff]'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Fit Entire A4 Page on Screen"
          >
            Fit Page
          </button>
          <button
            type="button"
            onClick={() => setA4Zoom(1.0)}
            className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              Math.abs(a4Zoom - 1.0) < 0.05 ? 'bg-blue-50 text-[#0d99ff]' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="100% Actual Physical Print Scale"
          >
            100%
          </button>
          <div className="h-4 w-px bg-slate-200 mx-0.5" />
          <button
            type="button"
            onClick={() => setA4Zoom((z) => Math.max(0.3, Number((z - 0.1).toFixed(2))))}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] font-bold text-slate-500 w-10 text-center select-none">
            {Math.round(a4Zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setA4Zoom((z) => Math.min(2.0, Number((z + 0.1).toFixed(2))))}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
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
                backgroundColor: a4Config.laserInvert ? '#000000' : '#ffffff',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              }}
              className="relative transition-colors duration-200"
            >
              {/* Margin Cutting Safe Area Guides (10mm from page edges) */}
              <div
                style={{
                  position: 'absolute',
                  inset: `${10 * 3.7795}px`,
                  border: `1px dashed ${a4Config.laserInvert ? 'rgba(255,255,255,0.15)' : 'rgba(13,153,255,0.2)'}`,
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
                    fill={a4Config.laserInvert ? '#ffffff' : '#0f172a'}
                  >
                    STAMIOX A4 GANG-SHEET PRODUCTION
                  </text>
                  <text
                    x="0"
                    y="3.2"
                    fontFamily="sans-serif"
                    fontSize="1.6"
                    fill={a4Config.laserInvert ? '#888888' : '#64748b'}
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
                    stroke={a4Config.laserInvert ? '#ffffff' : '#000000'}
                    strokeWidth="0.3"
                  />
                  <line x1="0" y1="0" x2="0" y2="3" stroke={a4Config.laserInvert ? '#ffffff' : '#000000'} strokeWidth="0.6" />
                  <line x1="25" y1="0" x2="25" y2="3" stroke={a4Config.laserInvert ? '#ffffff' : '#000000'} strokeWidth="0.3" />
                  <line x1="50" y1="0" x2="50" y2="3" stroke={a4Config.laserInvert ? '#ffffff' : '#000000'} strokeWidth="0.6" />
                  <text
                    x="25"
                    y="-1.2"
                    fontFamily="sans-serif"
                    fontSize="1.6"
                    fontWeight="bold"
                    textAnchor="middle"
                    fill={a4Config.laserInvert ? '#ffffff' : '#000000'}
                  >
                    1:1 CALIBRATION BAR (50 mm)
                  </text>
                  <text
                    x="0"
                    y="5"
                    fontFamily="monospace"
                    fontSize="1.3"
                    textAnchor="middle"
                    fill={a4Config.laserInvert ? '#ffffff' : '#000000'}
                  >
                    0
                  </text>
                  <text
                    x="25"
                    y="5"
                    fontFamily="monospace"
                    fontSize="1.3"
                    textAnchor="middle"
                    fill={a4Config.laserInvert ? '#ffffff' : '#000000'}
                  >
                    25
                  </text>
                  <text
                    x="50"
                    y="5"
                    fontFamily="monospace"
                    fontSize="1.3"
                    textAnchor="middle"
                    fill={a4Config.laserInvert ? '#ffffff' : '#000000'}
                  >
                    50mm
                  </text>
                </g>

                {/* Placed Stamps Layer */}
                {a4Instances.map((inst, index) => {
                  const isSelected = inst.instanceId === selectedA4InstanceId;
                  const isHovered = inst.instanceId === hoveredInstanceId;

                  const rawSvg = generateStampSvg({
                    widthMm: inst.widthMm,
                    heightMm: inst.heightMm,
                    inkColor: a4Config.laserInvert ? '#ffffff' : inst.inkColor,
                    elements: inst.elements,
                    shape: inst.shape,
                    invert: a4Config.laserInvert,
                    mirror: a4Config.laserMirror,
                    distressEffect: false,
                  });

                  const contentMatch = rawSvg.match(/<g id="stamp-content"[\s\S]*?<\/g>/);
                  const innerSvgContent = contentMatch ? contentMatch[0] : rawSvg;

                  // Corner tick marks (Crop Marks)
                  const tickLen = 2.5;
                  const guideStroke = a4Config.laserInvert ? '#4ade80' : '#0d99ff';

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
                      <g dangerouslySetInnerHTML={{ __html: innerSvgContent }} />

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

                      {/* Dimension Badge Label */}
                      <text
                        x={inst.widthMm / 2}
                        y={inst.heightMm + 2.8}
                        fontFamily="sans-serif"
                        fontSize="1.7"
                        fontWeight="bold"
                        textAnchor="middle"
                        fill={isSelected ? '#0d99ff' : a4Config.laserInvert ? '#aaaaaa' : '#64748b'}
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
            className="w-72 bg-white/95 backdrop-blur-md border-l border-slate-200 flex flex-col p-4 shadow-xl z-20 overflow-y-auto animate-in slide-in-from-right-4 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-bold text-xs text-slate-900 block">Stamp Variant</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedInstance.widthMm} × {selectedInstance.heightMm} mm
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => duplicateA4Instance(selectedInstance.instanceId)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[#0d99ff] transition-all"
                  title="Duplicate this stamp variant"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteA4Instance(selectedInstance.instanceId)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all"
                  title="Delete stamp from A4 sheet"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Primary Action: Edit in Single Stamp Studio */}
            <button
              type="button"
              onClick={() => editA4InstanceInSingleEditor(selectedInstance.instanceId)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 mt-3 bg-[#0d99ff] hover:bg-[#0c8ce9] text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer group"
              title="Open and edit this stamp with full vector tools in Single Stamp Studio"
            >
              <Edit3 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Edit in Single Stamp Studio</span>
            </button>

            {/* Stamp Label / Variant Name */}
            <div className="mt-3 space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Label / Name</label>
              <input
                type="text"
                value={selectedInstance.name}
                onChange={(e) => updateA4Instance(selectedInstance.instanceId, { name: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#0d99ff]"
              />
            </div>

            {/* Position Coordinates on A4 Sheet */}
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">X Pos</label>
                <ModernStepper
                  value={selectedInstance.xMm}
                  step={1}
                  unit="mm"
                  onChange={(val) => updateA4Instance(selectedInstance.instanceId, { xMm: val })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">Y Pos</label>
                <ModernStepper
                  value={selectedInstance.yMm}
                  step={1}
                  unit="mm"
                  onChange={(val) => updateA4Instance(selectedInstance.instanceId, { yMm: val })}
                />
              </div>
            </div>

            {/* In-Place Quick Text Edits for this Specific Variant */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-700 block mb-2">
                Quick Text Edits for this Copy
              </span>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {selectedInstance.elements
                  .filter((el) => el.type === 'text' || el.type === 'arc-text')
                  .map((el: any, elIdx) => (
                    <div key={el.id || elIdx} className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                        <span>{el.type === 'arc-text' ? (el.isReversed ? 'Bottom Arc' : 'Top Arc') : 'Straight Text'}</span>
                        <span className="font-mono">{el.fontSize}mm</span>
                      </div>
                      <input
                        type="text"
                        value={el.text || ''}
                        onChange={(e) => {
                          const updatedElements = selectedInstance.elements.map((x) =>
                            x.id === el.id ? { ...x, text: e.target.value } : x
                          );
                          updateA4Instance(selectedInstance.instanceId, { elements: updatedElements });
                        }}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-[#0d99ff]"
                      />
                    </div>
                  ))}
              </div>
            </div>
          </aside>
        )}
      </div>
  );
};
