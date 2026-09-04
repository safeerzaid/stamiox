'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import {
  StampElement,
  ArcTextElement,
  StraightTextElement,
  RingElement,
  SerratedRingElement,
  RectElement,
  OvalElement,
  LineElement,
  ClipartElement,
  QRCodeElement,
} from '../../types/stamp';
import { calculateArcGlyphs, generateSerratedPath, getArcApexPoint } from '../../lib/arc-text';
import { mmToPx, pxToMm, MM_TO_PX } from '../../lib/units';
import { Tooltip } from '../common/Tooltip';
import {
  MousePointer,
  Hash,
  Square,
  PenTool,
  Type,
  Circle,
  Sparkles,
  Layers,
  Wand2,
  MoreHorizontal,
  Contrast,
  AlignCenter,
  RotateCw,
  Copy,
  Trash2,
  FlipHorizontal,
  Plus,
  Star,
  PanelLeft,
  PanelRight,
  Orbit,
} from 'lucide-react';

interface CanvasProps {
  onOpenClipartModal?: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({ onOpenClipartModal }) => {
  const {
    widthMm,
    heightMm,
    shape,
    inkColor,
    elements,
    setElements,
    selectedId,
    selectedIds,
    selectedElement,
    setSelectedId,
    setSelectedIds,
    updateElement,
    deleteElement,
    duplicateElement,
    bringForward,
    sendBackward,
    zoom,
    setZoom,
    laserInvert,
    setLaserInvert,
    laserMirror,
    setLaserMirror,
    distressEffect,
    showRulers,
    showGrid,
    snapToCenter,
    addElement,
    pushHistory,
    isLeftSidebarOpen,
    isRightSidebarOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
  } = useEditor();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [initialElementData, setInitialElementData] = useState<any>(null);
  const [dragStart, setDragStart] = useState<{ xMm: number; yMm: number } | null>(null);
  const [initialElPos, setInitialElPos] = useState<{ x: number; y: number } | null>(null);
  const [mousePosMm, setMousePosMm] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeDockTool, setActiveDockTool] = useState<string>('select');
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const lastClickRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });

  // Figma Marquee Drag-Selection & Multi-selection States
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{ x: number; y: number } | null>(null);
  const [multiInitialPos, setMultiInitialPos] = useState<{ [id: string]: { x: number; y: number } }>({});
  // Track if canvas click resulted in a drag (marquee) vs a simple click (deselect)
  const canvasDraggedRef = useRef(false);
  // Track if the current pointer session started from canvas background (not element)
  const canvasInitiatedRef = useRef(false);
  // Tracks group drag of multi-selection via clicking the group box area
  const [isGroupDragging, setIsGroupDragging] = useState(false);
  // Track if group drag actually moved (to distinguish click-on-group vs drag-group)
  const groupMovedRef = useRef(false);
  // Snapshot of elements before drag/resize/rotate interaction starts (for Undo/Redo)
  const elementsSnapshotBeforeDragRef = useRef<StampElement[] | null>(null);

  // Figma Alt + Drag Duplicate State
  const hasDuplicatedOnAltDragRef = useRef<boolean>(false);

  // Spacebar Pan Navigation States (Figma / Illustrator Style)
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const isSpacePressedRef = useRef<boolean>(false);
  const isPanningRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

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

    // ONLY Ctrl + Mouse Wheel zooms in / zooms out (Normal wheel does NOT move the stamp design)
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        return; // Don't move or shift the stamp when scrolling wheel normally
      }

      const target = e.target as HTMLElement;
      const isInsideSidebar = target && target.closest('aside');
      if (isInsideSidebar) {
        return;
      }

      e.preventDefault();

      const zoomDelta = e.deltaY < 0 ? 1.08 : 0.92;
      const newZ = Math.min(8.0, Math.max(0.4, Number((zoomRef.current * zoomDelta).toFixed(3))));
      setZoom(newZ);
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
  }, [setZoom]);

  // Arc Text Circular Sliding State along circle line
  const [isSlidingArc, setIsSlidingArc] = useState(false);
  const [slidingArcData, setSlidingArcData] = useState<{
    id: string;
    cx: number;
    cy: number;
    startAngleRad: number;
    initialOffset: number;
    startDist?: number;
    initialRadius?: number;
  } | null>(null);

  const canvasWidthPx = mmToPx(widthMm, zoom);
  const canvasHeightPx = mmToPx(heightMm, zoom);

  const actualInk = laserInvert ? '#ffffff' : inkColor;
  const actualBg = laserInvert ? '#000000' : '#ffffff';

  const getElementBounds = (el: StampElement, wMm: number, hMm: number) => {
    let minX = 0, minY = 0, maxX = 10, maxY = 10;
    if (el.type === 'rect') {
      const rc = el as RectElement;
      minX = rc.x; minY = rc.y; maxX = rc.x + rc.width; maxY = rc.y + rc.height;
    } else if (el.type === 'clipart') {
      const cp = el as any;
      const w = cp.width || cp.size || 10;
      const h = cp.height || cp.size || 10;
      minX = cp.cx - w / 2; minY = cp.cy - h / 2; maxX = cp.cx + w / 2; maxY = cp.cy + h / 2;
    } else if (el.type === 'text') {
      const txt = el as StraightTextElement;
      const textLen = (txt.text || '').length || 1;
      const w = textLen * (txt.fontSize || 3) * 0.58;
      const h = (txt.fontSize || 3) * 1.2;
      minX = txt.x - w / 2; minY = txt.y - h / 2; maxX = txt.x + w / 2; maxY = txt.y + h / 2;
    } else if (el.type === 'ring') {
      const r = el as RingElement;
      minX = r.cx - r.radius; minY = r.cy - r.radius; maxX = r.cx + r.radius; maxY = r.cy + r.radius;
    } else if (el.type === 'oval') {
      const ov = el as OvalElement;
      minX = ov.cx - ov.rx; minY = ov.cy - ov.ry; maxX = ov.cx + ov.rx; maxY = ov.cy + ov.ry;
    } else if (el.type === 'serrated-ring') {
      const sr = el as SerratedRingElement;
      minX = sr.cx - sr.outerRadius; minY = sr.cy - sr.outerRadius; maxX = sr.cx + sr.outerRadius; maxY = sr.cy + sr.outerRadius;
    } else if (el.type === 'arc-text') {
      const arc = el as ArcTextElement;
      const r = arc.radius || 15;
      minX = arc.cx - r; minY = arc.cy - r; maxX = arc.cx + r; maxY = arc.cy + r;
    } else if (el.type === 'image' || el.type === 'qrcode') {
      const img = el as any;
      minX = img.x; minY = img.y; maxX = img.x + (img.width || 15); maxY = img.y + (img.height || 15);
    }
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
  };

  // Coordinate Conversion: Screen to MM
  const screenToCanvasMm = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const pxX = clientX - rect.left;
    const pxY = clientY - rect.top;
    return {
      x: pxToMm(pxX, zoom),
      y: pxToMm(pxY, zoom),
    };
  };

  const handleResizeHandlePointerDown = (e: React.PointerEvent, handleType: string) => {
    e.stopPropagation();
    if (!selectedElement || selectedElement.locked) return;
    elementsSnapshotBeforeDragRef.current = JSON.parse(JSON.stringify(elements));
    // Clear arc sliding so resize takes priority
    setIsSlidingArc(false);
    setSlidingArcData(null);
    setIsResizing(true);
    setResizeHandle(handleType);
    const posMm = screenToCanvasMm(e.clientX, e.clientY);
    setDragStart({ xMm: posMm.x, yMm: posMm.y });
    setInitialElementData(JSON.parse(JSON.stringify(selectedElement)));
  };

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (isSpacePressedRef.current || e.button === 1) return;

    setEditingTextId(null);
    const posMm = screenToCanvasMm(e.clientX, e.clientY);
    canvasDraggedRef.current = false;
    canvasInitiatedRef.current = true;
    setIsMarqueeSelecting(true);
    setMarqueeStart(posMm);
    setMarqueeEnd(posMm);
    // Don't clear selection on pointer DOWN — only clear on pointer UP if no drag happened
  };

  const handlePointerDown = (e: React.PointerEvent, el: StampElement) => {
    if (isSpacePressedRef.current || e.button === 1) return;
    e.stopPropagation();
    if (el.locked) return;

    // Cancel any active marquee when clicking an element directly
    canvasInitiatedRef.current = false;
    setIsMarqueeSelecting(false);
    setMarqueeStart(null);
    setMarqueeEnd(null);
    canvasDraggedRef.current = false;

    // Multi-selection with Shift key (Figma style)
    let currentSelection: string[];
    if (e.shiftKey) {
      if (selectedIds.includes(el.id)) {
        currentSelection = selectedIds.filter((id) => id !== el.id);
        setSelectedIds(currentSelection);
      } else {
        currentSelection = [...selectedIds, el.id];
        setSelectedIds(currentSelection);
      }
    } else {
      // If already in selectedIds, keep all selected for group drag; otherwise select just this one
      if (selectedIds.includes(el.id) && selectedIds.length > 1) {
        currentSelection = selectedIds;
      } else {
        currentSelection = [el.id];
        setSelectedIds([el.id]);
        setSelectedId(el.id);
      }
    }

    // Instant Double-Click / Re-click Detection (Figma style)
    const now = Date.now();
    if (
      lastClickRef.current.id === el.id &&
      now - lastClickRef.current.time < 420 &&
      (el.type === 'arc-text' || el.type === 'text')
    ) {
      setEditingTextId(el.id);
      setIsDragging(false);
      lastClickRef.current = { id: '', time: 0 };
      return;
    }
    lastClickRef.current = { id: el.id, time: now };

    elementsSnapshotBeforeDragRef.current = JSON.parse(JSON.stringify(elements));
    setIsDragging(true);

    const posMm = screenToCanvasMm(e.clientX, e.clientY);
    setDragStart({ xMm: posMm.x, yMm: posMm.y });

    // Store initial positions of all currently selected elements for group drag
    const posMap: { [id: string]: { x: number; y: number } } = {};
    currentSelection.forEach((id) => {
      const target = elements.find((x) => x.id === id);
      if (target) {
        if (target.type === 'text' || target.type === 'rect' || target.type === 'image') {
          posMap[id] = { x: (target as any).x, y: (target as any).y };
        } else if ('cx' in target && 'cy' in target) {
          posMap[id] = { x: (target as any).cx, y: (target as any).cy };
        }
      }
    });
    setMultiInitialPos(posMap);

    if (el.type === 'arc-text' && currentSelection.length === 1) {
      const arc = el as ArcTextElement;
      const startAngleRad = Math.atan2(posMm.y - arc.cy, posMm.x - arc.cx);
      const startDist = Math.hypot(posMm.x - arc.cx, posMm.y - arc.cy);
      setIsSlidingArc(true);
      setSlidingArcData({
        id: arc.id,
        cx: arc.cx,
        cy: arc.cy,
        startAngleRad,
        initialOffset: arc.angleOffset || 0,
        startDist,
        initialRadius: arc.radius || 15,
      });
    } else {
      setIsSlidingArc(false);
      setSlidingArcData(null);
    }

    if (el.type === 'text' || el.type === 'rect' || el.type === 'image') {
      setInitialElPos({ x: (el as any).x, y: (el as any).y });
    } else if ('cx' in el && 'cy' in el) {
      setInitialElPos({ x: (el as any).cx, y: (el as any).cy });
    }
  };

  const handleArcKnobPointerDown = (e: React.PointerEvent, arc: ArcTextElement) => {
    e.stopPropagation();
    if (arc.locked) return;
    elementsSnapshotBeforeDragRef.current = JSON.parse(JSON.stringify(elements));
    setSelectedId(arc.id);
    setSelectedIds([arc.id]);
    const posMm = screenToCanvasMm(e.clientX, e.clientY);
    const startAngleRad = Math.atan2(posMm.y - arc.cy, posMm.x - arc.cx);
    const startDist = Math.hypot(posMm.x - arc.cx, posMm.y - arc.cy);
    setIsSlidingArc(true);
    setSlidingArcData({
      id: arc.id,
      cx: arc.cx,
      cy: arc.cy,
      startAngleRad,
      initialOffset: arc.angleOffset || 0,
      startDist,
      initialRadius: arc.radius || 15,
    });
  };

  const handleGroupDragPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (selectedIds.length < 2) return;
    elementsSnapshotBeforeDragRef.current = JSON.parse(JSON.stringify(elements));
    const posMm = screenToCanvasMm(e.clientX, e.clientY);
    setDragStart({ xMm: posMm.x, yMm: posMm.y });
    setIsGroupDragging(true);
    setIsDragging(true);
    groupMovedRef.current = false; // reset — will be set true only if mouse actually moves

    // Capture initial positions of all selected elements
    const posMap: { [id: string]: { x: number; y: number } } = {};
    selectedIds.forEach((id) => {
      const target = elements.find((x) => x.id === id);
      if (target) {
        if (target.type === 'text' || target.type === 'rect' || target.type === 'image') {
          posMap[id] = { x: (target as any).x, y: (target as any).y };
        } else if ('cx' in target && 'cy' in target) {
          posMap[id] = { x: (target as any).cx, y: (target as any).cy };
        }
      }
    });
    setMultiInitialPos(posMap);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanningRef.current) return;

    const posMm = screenToCanvasMm(e.clientX, e.clientY);
    setMousePosMm(posMm);

    // 0. Handle Figma Marquee Drag Selection
    if (isMarqueeSelecting && marqueeStart) {
      const ddx = posMm.x - marqueeStart.x;
      const ddy = posMm.y - marqueeStart.y;
      if (Math.abs(ddx) > 0.5 || Math.abs(ddy) > 0.5) {
        canvasDraggedRef.current = true;
      }
      setMarqueeEnd(posMm);
      return;
    }

    // 0.5. Handle Arc Text Circular Slide along circle line & Radial adjustment
    if (isSlidingArc && slidingArcData && !isResizing) {
      const currentAngleRad = Math.atan2(posMm.y - slidingArcData.cy, posMm.x - slidingArcData.cx);
      let deltaRad = currentAngleRad - slidingArcData.startAngleRad;
      while (deltaRad > Math.PI) deltaRad -= 2 * Math.PI;
      while (deltaRad < -Math.PI) deltaRad += 2 * Math.PI;

      const deltaDeg = (deltaRad * 180) / Math.PI;
      let newOffset = slidingArcData.initialOffset + deltaDeg;

      while (newOffset > 180) newOffset -= 360;
      while (newOffset < -180) newOffset += 360;

      // Snapping to 0° (apex) or key 45°/90°/180° markers
      if (Math.abs(newOffset) < 2.5) newOffset = 0;
      else if (Math.abs(newOffset - 45) < 2.5) newOffset = 45;
      else if (Math.abs(newOffset + 45) < 2.5) newOffset = -45;
      else if (Math.abs(newOffset - 90) < 2.5) newOffset = 90;
      else if (Math.abs(newOffset + 90) < 2.5) newOffset = -90;
      else if (Math.abs(newOffset - 180) < 2.5 || Math.abs(newOffset + 180) < 2.5) newOffset = 180;

      // Radial adjustment:
      const currentDist = Math.hypot(posMm.x - slidingArcData.cx, posMm.y - slidingArcData.cy);
      const deltaDist = currentDist - (slidingArcData.startDist ?? currentDist);
      const maxR = Math.max(widthMm, heightMm) / 2 - 0.5;
      const baseR = slidingArcData.initialRadius ?? 15;
      const newRadius = Math.max(4, Math.min(maxR, Number((baseR + deltaDist).toFixed(1))));

      if (shape === 'OVAL') {
        const maxDim = Math.max(widthMm || 40, heightMm || 40);
        const newRx = Number((newRadius * ((widthMm || 40) / maxDim)).toFixed(1));
        const newRy = Number((newRadius * ((heightMm || 40) / maxDim)).toFixed(1));
        updateElement(slidingArcData.id, {
          angleOffset: Number(newOffset.toFixed(1)),
          radius: newRadius,
          rx: newRx,
          ry: newRy,
        } as any);
      } else {
        updateElement(slidingArcData.id, {
          angleOffset: Number(newOffset.toFixed(1)),
          radius: newRadius,
        } as any);
      }
      return;
    }

    // 1. Handle Interactive Transform Resizing (Photoshop / Figma handles)
    if (isResizing && resizeHandle && dragStart && initialElementData && selectedId) {
      const dx = posMm.x - dragStart.xMm;
      const dy = posMm.y - dragStart.yMm;
      const init = initialElementData;

      if (init.type === 'clipart') {
        const initW = init.width || init.size || 10;
        const initH = init.height || init.size || 10;
        let deltaW = 0;
        let deltaH = 0;

        if (resizeHandle === 'se') { deltaW = dx * 2; deltaH = dy * 2; }
        else if (resizeHandle === 'nw') { deltaW = -dx * 2; deltaH = -dy * 2; }
        else if (resizeHandle === 'ne') { deltaW = dx * 2; deltaH = -dy * 2; }
        else if (resizeHandle === 'sw') { deltaW = -dx * 2; deltaH = dy * 2; }
        else if (resizeHandle === 'e') { deltaW = dx * 2; }
        else if (resizeHandle === 'w') { deltaW = -dx * 2; }
        else if (resizeHandle === 's') { deltaH = dy * 2; }
        else if (resizeHandle === 'n') { deltaH = -dy * 2; }

        const newW = Math.max(2, Number((initW + deltaW).toFixed(1)));
        const newH = Math.max(2, Number((initH + deltaH).toFixed(1)));
        const newSize = Math.max(newW, newH);

        updateElement(selectedId, {
          width: newW,
          height: newH,
          size: newSize,
        } as any);
        return;
      }

      if (init.type === 'text') {
        const initSize = init.fontSize || 3.0;
        let factor = 1;
        if (resizeHandle.includes('e')) factor = 1 + (dx / 15);
        else if (resizeHandle.includes('w')) factor = 1 - (dx / 15);
        else if (resizeHandle.includes('s')) factor = 1 + (dy / 10);
        else if (resizeHandle.includes('n')) factor = 1 - (dy / 10);

        const newFontSize = Math.max(1.0, Math.min(25.0, Number((initSize * factor).toFixed(1))));
        updateElement(selectedId, { fontSize: newFontSize } as any);
        return;
      }

      if (init.type === 'rect') {
        let newX = init.x;
        let newY = init.y;
        let newW = init.width;
        let newH = init.height;

        if (resizeHandle.includes('e')) newW = Math.max(2, init.width + dx);
        if (resizeHandle.includes('s')) newH = Math.max(2, init.height + dy);
        if (resizeHandle.includes('w')) {
          const clampedDx = Math.min(dx, init.width - 2);
          newX = init.x + clampedDx;
          newW = init.width - clampedDx;
        }
        if (resizeHandle.includes('n')) {
          const clampedDy = Math.min(dy, init.height - 2);
          newY = init.y + clampedDy;
          newH = init.height - clampedDy;
        }

        updateElement(selectedId, {
          x: Number(newX.toFixed(1)),
          y: Number(newY.toFixed(1)),
          width: Number(newW.toFixed(1)),
          height: Number(newH.toFixed(1)),
        } as any);
        return;
      }

      if (init.type === 'ring') {
        const dist = Math.hypot(posMm.x - init.cx, posMm.y - init.cy);
        const newR = Math.max(2, Math.min(widthMm * 1.5, Number(dist.toFixed(1))));
        updateElement(selectedId, { radius: newR } as any);
        return;
      }

      if (init.type === 'oval') {
        let newRx = init.rx;
        let newRy = init.ry;
        if (resizeHandle.includes('e') || resizeHandle.includes('w')) {
          newRx = Math.max(2, Number(Math.abs(posMm.x - init.cx).toFixed(1)));
        }
        if (resizeHandle.includes('n') || resizeHandle.includes('s')) {
          newRy = Math.max(2, Number(Math.abs(posMm.y - init.cy).toFixed(1)));
        }
        updateElement(selectedId, { rx: newRx, ry: newRy } as any);
        return;
      }

      if (init.type === 'serrated-ring') {
        const dist = Math.hypot(posMm.x - init.cx, posMm.y - init.cy);
        const ratio = (init.innerRadius || 12) / (init.outerRadius || 15);
        const newOuter = Math.max(3, Number(dist.toFixed(1)));
        const newInner = Number((newOuter * ratio).toFixed(1));
        updateElement(selectedId, { outerRadius: newOuter, innerRadius: newInner } as any);
        return;
      }

      if (init.type === 'arc-text') {
        const dist = Math.hypot(posMm.x - init.cx, posMm.y - init.cy);
        const newR = Math.max(4, Number(dist.toFixed(1)));
        if (shape === 'OVAL') {
          const maxDim = Math.max(widthMm || 40, heightMm || 40);
          const newRx = Number((newR * ((widthMm || 40) / maxDim)).toFixed(1));
          const newRy = Number((newR * ((heightMm || 40) / maxDim)).toFixed(1));
          updateElement(selectedId, { radius: newR, rx: newRx, ry: newRy } as any);
        } else {
          updateElement(selectedId, { radius: newR } as any);
        }
        return;
      }

      if (init.type === 'image' || init.type === 'qrcode') {
        const newW = Math.max(4, Number((init.width + dx).toFixed(1)));
        const newH = Math.max(4, Number((init.height + dy).toFixed(1)));
        updateElement(selectedId, { width: newW, height: newH } as any);
        return;
      }
    }

    // 2. Handle Drag Moving (Single or Multi-layer group drag)
    // Skip if arc sliding is active — arc text uses angle offset, not position
    if (!isSlidingArc && isDragging && dragStart && Object.keys(multiInitialPos).length > 0) {
      const dxMm = posMm.x - dragStart.xMm;
      const dyMm = posMm.y - dragStart.yMm;

      // Figma/Illustrator Alt + Drag: Clone selected elements on drag movement
      if (e.altKey && !hasDuplicatedOnAltDragRef.current && (Math.abs(dxMm) > 0.4 || Math.abs(dyMm) > 0.4)) {
        hasDuplicatedOnAltDragRef.current = true;
        const currentSelected = elements.filter((el) => selectedIds.includes(el.id));
        if (currentSelected.length > 0) {
          const idMap: { [origId: string]: string } = {};
          const clonedElements: StampElement[] = currentSelected.map((orig) => {
            const newId = `${orig.type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            idMap[orig.id] = newId;
            return {
              ...JSON.parse(JSON.stringify(orig)),
              id: newId,
            };
          });

          // Add clones to elements list
          setElements((prev) => [...prev, ...clonedElements]);

          // Remap initial positions to the new clones
          const newMultiPos: { [id: string]: { x: number; y: number } } = {};
          Object.entries(multiInitialPos).forEach(([origId, pos]) => {
            const newId = idMap[origId];
            if (newId) {
              newMultiPos[newId] = pos;
            }
          });
          setMultiInitialPos(newMultiPos);

          const newSelectedIds = clonedElements.map((c) => c.id);
          setSelectedIds(newSelectedIds);
          setSelectedId(newSelectedIds[0]);
        }
      }

      // Mark group as having actually moved (not just a tap)
      if (isGroupDragging && (Math.abs(dxMm) > 0.3 || Math.abs(dyMm) > 0.3)) {
        groupMovedRef.current = true;
      }

      Object.entries(multiInitialPos).forEach(([id, init]) => {
        const target = elements.find((el) => el.id === id);
        if (!target) return;

        let targetX = init.x + dxMm;
        let targetY = init.y + dyMm;

        // Snapping to center if single element is being dragged
        if (snapToCenter && Object.keys(multiInitialPos).length === 1) {
          const centerX = widthMm / 2;
          const centerY = heightMm / 2;
          if (Math.abs(targetX - centerX) < 0.8) targetX = centerX;
          if (Math.abs(targetY - centerY) < 0.8) targetY = centerY;
        }

        if (target.type === 'text' || target.type === 'rect' || target.type === 'image') {
          updateElement(id, { x: Number(targetX.toFixed(2)), y: Number(targetY.toFixed(2)) } as any);
        } else if ('cx' in target && 'cy' in target) {
          updateElement(id, { cx: Number(targetX.toFixed(2)), cy: Number(targetY.toFixed(2)) } as any);
        }
      });
    }
  };

  const handlePointerUp = () => {
    // Case 1: Group drag tap without movement — deselect the group
    if (isGroupDragging && !groupMovedRef.current) {
      setSelectedId(null);
      setSelectedIds([]);
    }

    // Case 2: Finish Figma Marquee Drag Selection — only if canvas background was the pointer origin
    if (canvasInitiatedRef.current && isMarqueeSelecting && marqueeStart && marqueeEnd) {
      const minX = Math.min(marqueeStart.x, marqueeEnd.x);
      const maxX = Math.max(marqueeStart.x, marqueeEnd.x);
      const minY = Math.min(marqueeStart.y, marqueeEnd.y);
      const maxY = Math.max(marqueeStart.y, marqueeEnd.y);
      const w = maxX - minX;
      const h = maxY - minY;

      if (canvasDraggedRef.current && (w > 1.5 || h > 1.5)) {
        // Dragged a marquee box: find all intersecting elements
        const hitElements = elements.filter((el) => {
          if (el.visible === false || el.locked) return false;
          const b = getElementBounds(el, widthMm, heightMm);
          const doesNotIntersect = b.maxX < minX || b.minX > maxX || b.maxY < minY || b.minY > maxY;
          return !doesNotIntersect;
        });

        const hitIds = hitElements.map((el) => el.id);
        if (hitIds.length > 0) {
          setSelectedIds(hitIds);
          if (hitIds.length === 1) { setSelectedId(hitIds[0]); }
        }
      } else if (!canvasDraggedRef.current) {
        // True canvas click (no drag) — clear selection and editing
        setSelectedId(null);
        setSelectedIds([]);
        setEditingTextId(null);
      }
    }

    // Record undo history if an element was actually moved, resized, or rotated
    if (elementsSnapshotBeforeDragRef.current) {
      const beforeStr = JSON.stringify(elementsSnapshotBeforeDragRef.current);
      const afterStr = JSON.stringify(elements);
      if (beforeStr !== afterStr) {
        pushHistory(elementsSnapshotBeforeDragRef.current);
      }
      elementsSnapshotBeforeDragRef.current = null;
    }

    hasDuplicatedOnAltDragRef.current = false;
    setIsPanning(false);
    setIsMarqueeSelecting(false);
    setMarqueeStart(null);
    setMarqueeEnd(null);
    setIsDragging(false);
    setIsGroupDragging(false);
    setIsSlidingArc(false);
    setSlidingArcData(null);
    setIsResizing(false);
    setResizeHandle(null);
    setInitialElementData(null);
    setDragStart(null);
    setInitialElPos(null);
    setMultiInitialPos({});
    canvasDraggedRef.current = false;
    canvasInitiatedRef.current = false;
    groupMovedRef.current = false;
  };

  const handleAlignSelectedToCenter = () => {
    if (!selectedId) return;
    const selectedEl = elements.find((el) => el.id === selectedId);
    if (!selectedEl) return;

    if (selectedEl.type === 'text') {
      updateElement(selectedId, { x: widthMm / 2, y: heightMm / 2 });
    } else if ('cx' in selectedEl && 'cy' in selectedEl) {
      updateElement(selectedId, { cx: widthMm / 2, cy: heightMm / 2 } as any);
    }
  };

  // Keyboard shortcut: Press Enter to edit selected text in-place (Figma style)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (e.key === 'Enter' && selectedId) {
        const el = elements.find((x) => x.id === selectedId);
        if (el && (el.type === 'arc-text' || el.type === 'text')) {
          e.preventDefault();
          setEditingTextId(selectedId);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedId, elements]);

  // Dedicated Stamp Tools
  const handleAddTopArc = () => {
    const id = addElement({
      type: 'arc-text',
      text: 'COMPANY NAME HERE',
      cx: widthMm / 2,
      cy: heightMm / 2,
      radius: Math.min(widthMm, heightMm) * 0.38,
      startAngle: -160,
      sweepAngle: 140,
      fontSize: 3.2,
      fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
      fontWeight: 'bold',
      letterSpacing: 0.2,
    });
    setEditingTextId(id);
  };

  const handleAddBottomArc = () => {
    const id = addElement({
      type: 'arc-text',
      text: '★ OFFICIAL SEAL ★',
      cx: widthMm / 2,
      cy: heightMm / 2,
      radius: Math.min(widthMm, heightMm) * 0.38,
      startAngle: 160,
      sweepAngle: -140,
      fontSize: 2.6,
      fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
      fontWeight: 'bold',
      letterSpacing: 0.2,
      isReversed: true,
    });
    setEditingTextId(id);
  };

  const handleAddStraightText = () => {
    const id = addElement({
      type: 'text',
      text: 'EST. 2026',
      x: widthMm / 2,
      y: heightMm / 2,
      fontSize: 2.8,
      fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
      fontWeight: 'bold',
      align: 'center',
    });
    setEditingTextId(id);
  };

  const handleAddRing = () => {
    addElement({
      type: 'ring',
      cx: widthMm / 2,
      cy: heightMm / 2,
      radius: Math.min(widthMm, heightMm) * 0.46,
      strokeWidth: 0.8,
      strokeType: 'solid',
    });
  };

  const handleAddSerrated = () => {
    addElement({
      type: 'serrated-ring',
      cx: widthMm / 2,
      cy: heightMm / 2,
      outerRadius: Math.min(widthMm, heightMm) * 0.47,
      innerRadius: Math.min(widthMm, heightMm) * 0.42,
      teeth: 36,
      strokeWidth: 0.6,
    });
  };

  const handleAddRect = () => {
    addElement({
      type: 'rect',
      x: widthMm * 0.08,
      y: heightMm * 0.08,
      width: widthMm * 0.84,
      height: heightMm * 0.84,
      strokeWidth: 0.8,
      rx: 2,
      ry: 2,
    });
  };

  return (
    <main
      className={`relative flex-1 flex flex-col items-center justify-center p-8 overflow-hidden select-none bg-[#f8fafc] ${
        isPanning ? 'cursor-grabbing' : isSpacePressed ? 'cursor-grab' : ''
      }`}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Top Precision Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-7 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm text-[11px] text-slate-500 flex items-center justify-between px-4 z-10 shadow-2xs font-medium">
        <div className="flex items-center gap-4">
          <span>X: <strong className="font-mono text-slate-900 font-semibold">{mousePosMm.x.toFixed(1)} mm</strong></span>
          <span>Y: <strong className="font-mono text-slate-900 font-semibold">{mousePosMm.y.toFixed(1)} mm</strong></span>
          <span>Mount: <strong className="text-[#0d99ff] font-semibold">{widthMm} × {heightMm} mm</strong></span>
        </div>
        <div className="text-[11px] text-slate-500 font-medium">
          Drafting Scale: <span className="font-semibold text-slate-700">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Floating Re-Open Sidebar Buttons (when collapsed) */}
      {!isLeftSidebarOpen && (
        <button
          type="button"
          onClick={toggleLeftSidebar}
          className="absolute left-3 top-10 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md border border-slate-200 shadow-md hover:shadow-lg rounded-xl text-xs font-bold text-slate-700 hover:text-[#0d99ff] transition-all group cursor-pointer"
          title="Open Layers & Templates Panel"
        >
          <PanelLeft className="w-4 h-4 text-[#0d99ff] group-hover:scale-110 transition-transform" />
          <span>Layers</span>
        </button>
      )}

      {!isRightSidebarOpen && (
        <button
          type="button"
          onClick={toggleRightSidebar}
          className="absolute right-3 top-10 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md border border-slate-200 shadow-md hover:shadow-lg rounded-xl text-xs font-bold text-slate-700 hover:text-[#0d99ff] transition-all group cursor-pointer"
          title="Open Design Properties Inspector"
        >
          <span>Inspector</span>
          <PanelRight className="w-4 h-4 text-[#0d99ff] group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Main Stamp Canvas Frame with Pan transform */}
      <div
        className="relative mt-3"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          transition: isDragging || isPanning || isResizing || isSlidingArc ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* SVG Viewport Stage */}
        <div
          ref={containerRef}
          className={`relative transition-all ${
            shape === 'ROUND'
              ? 'rounded-full'
              : shape === 'OVAL'
              ? 'rounded-[50%]'
              : 'rounded-sm'
          }`}
          style={{
            width: `${canvasWidthPx}px`,
            height: `${canvasHeightPx}px`,
            backgroundColor: actualBg,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.06)',
            overflow: 'visible',
          }}
        >
          {/* Center Magnetic Crosshair Guides */}
          {snapToCenter && (
            <div className={`absolute inset-0 pointer-events-none z-0 ${shape === 'ROUND' ? 'rounded-full' : shape === 'OVAL' ? 'rounded-[50%]' : ''} overflow-hidden`}>
              <div
                className="absolute top-0 bottom-0 border-l border-[#0d99ff]/50 border-dashed"
                style={{ left: '50%' }}
              />
              <div
                className="absolute left-0 right-0 border-t border-[#0d99ff]/50 border-dashed"
                style={{ top: '50%' }}
              />
            </div>
          )}

          {/* SVG Vector Stamp Canvas */}
          {/* SVG Vector Stamp Canvas */}
          <svg
            className={`w-full h-full relative z-10 ${distressEffect ? 'filter-distress' : ''}`}
            viewBox={`0 0 ${widthMm} ${heightMm}`}
            style={{
              transform: laserMirror ? 'scaleX(-1)' : 'none',
              transformOrigin: 'center center',
              overflow: 'visible',
            }}
            onPointerDown={handleCanvasPointerDown}
          >
            {/* Distress Grunge Filter */}
            {distressEffect && (
              <defs>
                <filter id="canvas-distress-filter" x="-20%" y="-20%" width="140%" height="140%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="4" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </defs>
            )}

            <g
              id="main-stamp-group"
              fill={actualInk}
              stroke={actualInk}
              filter={distressEffect ? 'url(#canvas-distress-filter)' : undefined}
            >
              {elements
                .filter((el) => el.visible !== false)
                .map((el) => (
                  <RenderCanvasElement
                    key={el.id}
                    element={el}
                    isSelected={selectedId === el.id || selectedIds.includes(el.id)}
                    isEditing={editingTextId === el.id}
                    inkColor={actualInk}
                    shape={shape}
                    widthMm={widthMm}
                    heightMm={heightMm}
                    onPointerDown={(e) => handlePointerDown(e, el)}
                    onDoubleClick={() => {
                      if (el.type === 'arc-text' || el.type === 'text') {
                        setSelectedId(el.id);
                        setEditingTextId(el.id);
                      }
                    }}
                  />
                ))}
            </g>

            {/* Editor Selection & Interaction Overlays (Rendered outside stamp ink group) */}
            <g id="editor-selection-overlay-layer">
              {/* Photoshop / Figma Style Interactive Transform Bounding Box with Drag Resize Handles (Single Layer) */}
              {selectedId && selectedIds.length <= 1 && (() => {
                const sel = elements.find((e) => e.id === selectedId);
                if (!sel || sel.visible === false) return null;

                const pad = 0.8;
                let minX = 0;
                let minY = 0;
                let boxW = 10;
                let boxH = 10;
                let isCircular = false;
                let circleRx = 0;
                let circleRy = 0;
                let circleCx = 0;
                let circleCy = 0;

                if (sel.type === 'ring') {
                  const r = sel as RingElement;
                  const isOvalShape = shape === 'OVAL' || (r as any).rx !== undefined;
                  const maxDim = Math.max(widthMm || 40, heightMm || 40);
                  const rx = (r as any).rx || (r.radius * ((widthMm || 40) / maxDim));
                  const ry = (r as any).ry || (r.radius * ((heightMm || 40) / maxDim));
                  isCircular = true;
                  circleRx = rx;
                  circleRy = ry;
                  circleCx = r.cx;
                  circleCy = r.cy;
                  minX = r.cx - rx - pad;
                  minY = r.cy - ry - pad;
                  boxW = rx * 2 + pad * 2;
                  boxH = ry * 2 + pad * 2;
                } else if (sel.type === 'oval') {
                  const ov = sel as OvalElement;
                  isCircular = true;
                  circleRx = ov.rx;
                  circleRy = ov.ry;
                  circleCx = ov.cx;
                  circleCy = ov.cy;
                  minX = ov.cx - ov.rx - pad;
                  minY = ov.cy - ov.ry - pad;
                  boxW = ov.rx * 2 + pad * 2;
                  boxH = ov.ry * 2 + pad * 2;
                } else if (sel.type === 'arc-text') {
                  const arc = sel as ArcTextElement;
                  const isOvalShape = shape === 'OVAL';
                  const maxDim = Math.max(widthMm || 40, heightMm || 40);
                  const rx = (arc as any).rx || (isOvalShape ? arc.radius * ((widthMm || 40) / maxDim) : arc.radius);
                  const ry = (arc as any).ry || (isOvalShape ? arc.radius * ((heightMm || 40) / maxDim) : arc.radius);
                  isCircular = true;
                  circleRx = rx;
                  circleRy = ry;
                  circleCx = arc.cx;
                  circleCy = arc.cy;
                  minX = arc.cx - rx - pad;
                  minY = arc.cy - ry - pad;
                  boxW = rx * 2 + pad * 2;
                  boxH = ry * 2 + pad * 2;
                } else if (sel.type === 'text') {
                  const txt = sel as StraightTextElement;
                  const textLen = (txt.text || '').length || 1;
                  const w = textLen * (txt.fontSize || 3) * 0.58;
                  const h = (txt.fontSize || 3) * 1.2;
                  minX = txt.x - w / 2 - pad;
                  minY = txt.y - h / 2 - pad;
                  boxW = w + pad * 2;
                  boxH = h + pad * 2;
                } else if (sel.type === 'rect') {
                  const rc = sel as RectElement;
                  minX = rc.x - pad;
                  minY = rc.y - pad;
                  boxW = rc.width + pad * 2;
                  boxH = rc.height + pad * 2;
                } else if (sel.type === 'clipart') {
                  const cp = sel as any;
                  const w = cp.width || cp.size || 10;
                  const h = cp.height || cp.size || 10;
                  minX = cp.cx - w / 2 - pad;
                  minY = cp.cy - h / 2 - pad;
                  boxW = w + pad * 2;
                  boxH = h + pad * 2;
                } else if (sel.type === 'serrated-ring') {
                  const sr = sel as SerratedRingElement;
                  isCircular = true;
                  circleRx = sr.outerRadius;
                  circleRy = sr.outerRadius;
                  circleCx = sr.cx;
                  circleCy = sr.cy;
                  minX = sr.cx - sr.outerRadius - pad;
                  minY = sr.cy - sr.outerRadius - pad;
                  boxW = sr.outerRadius * 2 + pad * 2;
                  boxH = sr.outerRadius * 2 + pad * 2;
                } else if (sel.type === 'image' || sel.type === 'qrcode') {
                  const img = sel as any;
                  const w = img.width || 15;
                  const h = img.height || 15;
                  minX = img.x - pad;
                  minY = img.y - pad;
                  boxW = w + pad * 2;
                  boxH = h + pad * 2;
                }

                const hs = 0.9; // Refined ultra-thin resize handle size

                return (
                  <g id="interactive-selection-transform-box">
                    {/* Bounding Box — ultra subtle, light sky blue, extra thin line */}
                    <rect
                      x={minX}
                      y={minY}
                      width={boxW}
                      height={boxH}
                      fill="none"
                      stroke="#7dd3fc"
                      strokeWidth="0.09"
                      strokeDasharray="0.8, 1.2"
                      opacity={0.65}
                      className="pointer-events-none select-none"
                    />

                    {/* Corner Handles — clean subtle light blue squares */}
                    {([
                      { pos: 'nw', x: minX - hs / 2,        y: minY - hs / 2,        cursor: 'cursor-nwse-resize' },
                      { pos: 'ne', x: minX + boxW - hs / 2,  y: minY - hs / 2,        cursor: 'cursor-nesw-resize' },
                      { pos: 'se', x: minX + boxW - hs / 2,  y: minY + boxH - hs / 2, cursor: 'cursor-nwse-resize' },
                      { pos: 'sw', x: minX - hs / 2,         y: minY + boxH - hs / 2, cursor: 'cursor-nesw-resize' },
                    ] as const).map(({ pos, x, y, cursor }) => (
                      <rect
                        key={pos}
                        x={x}
                        y={y}
                        width={hs}
                        height={hs}
                        fill="#ffffff"
                        stroke="#7dd3fc"
                        strokeWidth="0.12"
                        rx="0.12"
                        ry="0.12"
                        opacity={0.85}
                        className={`${cursor} select-none`}
                        onPointerDown={(e) => handleResizeHandlePointerDown(e, pos)}
                      />
                    ))}

                    {/* For arc-text: additional minimal apex knob to spin/slide text along the circle line */}
                    {sel.type === 'arc-text' && (() => {
                      const arc = sel as ArcTextElement;
                      const apexPt = getArcApexPoint(arc, widthMm, heightMm, shape);

                      return (
                        <g id="arc-selection-minimal">
                          {/* Invisible larger hit target for effortless grab without jitter */}
                          <circle
                            cx={apexPt.x}
                            cy={apexPt.y}
                            r={2.2}
                            fill="transparent"
                            stroke="none"
                            className="cursor-grab active:cursor-grabbing select-none"
                            onPointerDown={(e) => handleArcKnobPointerDown(e, arc)}
                          />
                          {/* Small Minimal Dot at Text Apex */}
                          <circle
                            cx={apexPt.x}
                            cy={apexPt.y}
                            r={0.55}
                            fill="#ffffff"
                            stroke="#7dd3fc"
                            strokeWidth={0.14}
                            className="pointer-events-none select-none"
                          />
                        </g>
                      );
                    })()}
                  </g>
                );
              })()}



              {/* Multi-Layer Selection Outline & Group Boundary (Figma style) */}
              {selectedIds.length > 1 && (() => {
                let unionMinX = Infinity;
                let unionMinY = Infinity;
                let unionMaxX = -Infinity;
                let unionMaxY = -Infinity;

                const outlines = selectedIds.map((id) => {
                  const sel = elements.find((e) => e.id === id);
                  if (!sel || sel.visible === false) return null;
                  const b = getElementBounds(sel, widthMm, heightMm);
                  if (b.minX < unionMinX) unionMinX = b.minX;
                  if (b.minY < unionMinY) unionMinY = b.minY;
                  if (b.maxX > unionMaxX) unionMaxX = b.maxX;
                  if (b.maxY > unionMaxY) unionMaxY = b.maxY;

                  return (
                    <rect
                      key={`multi-outline-${id}`}
                      x={b.minX - 0.4}
                      y={b.minY - 0.4}
                      width={b.w + 0.8}
                      height={b.h + 0.8}
                      fill="none"
                      stroke="#7dd3fc"
                      strokeWidth="0.10"
                      strokeDasharray="1.0, 1.0"
                      opacity={0.6}
                      className="pointer-events-none select-none"
                    />
                  );
                });

                if (unionMinX === Infinity) return null;
                const pad = 1.0;
                const boxW = unionMaxX - unionMinX + pad * 2;
                const boxH = unionMaxY - unionMinY + pad * 2;
                const boxX = unionMinX - pad;
                const boxY = unionMinY - pad;

                return (
                  <g id="multi-layer-group-selection">
                    {/* Individual element outlines — very subtle */}
                    {outlines}

                    {/* Group Bounding Box — non-blocking fill so empty clicks pass through */}
                    <rect
                      x={boxX}
                      y={boxY}
                      width={boxW}
                      height={boxH}
                      fill="none"
                      stroke="#7dd3fc"
                      strokeWidth="0.11"
                      strokeDasharray="1.5, 1.5"
                      opacity={0.65}
                      className="pointer-events-none select-none"
                    />

                    {/* Draggable Floating Selection Badge */}
                    <g
                      transform={`translate(${boxX + boxW / 2}, ${Math.max(2, boxY - 2.5)})`}
                      className="cursor-grab active:cursor-grabbing select-none"
                      onPointerDown={handleGroupDragPointerDown}
                    >
                      <rect x={-11} y={-1.8} width={22} height={3.6} rx={1.0} fill="#38bdf8" fillOpacity={0.88} />
                      <text
                        x={0} y={0.1}
                        fontSize={1.4} fontWeight="bold" fontFamily="Arial, sans-serif"
                        fill="#ffffff" textAnchor="middle" dominantBaseline="central"
                        className="select-none pointer-events-none"
                      >
                        ✥ {selectedIds.length} layers
                      </text>
                    </g>
                  </g>
                );
              })()}

              {/* Figma Style Translucent Soft Light Blue Drag Marquee Selection Box */}
              {isMarqueeSelecting && marqueeStart && marqueeEnd && (() => {
                const mMinX = Math.min(marqueeStart.x, marqueeEnd.x);
                const mMaxX = Math.max(marqueeStart.x, marqueeEnd.x);
                const mMinY = Math.min(marqueeStart.y, marqueeEnd.y);
                const mMaxY = Math.max(marqueeStart.y, marqueeEnd.y);
                const mW = mMaxX - mMinX;
                const mH = mMaxY - mMinY;

                return (
                  <g id="figma-drag-marquee-box" className="pointer-events-none select-none">
                    <rect
                      x={mMinX}
                      y={mMinY}
                      width={mW}
                      height={mH}
                      fill="#38bdf8"
                      fillOpacity={0.06}
                      stroke="#7dd3fc"
                      strokeWidth={0.11}
                      strokeDasharray="1.2, 1.0"
                    />
                  </g>
                );
              })()}
            </g>
          </svg>

          {/* Invisible Keystroke Capture Input for Pure Direct On-Canvas Typing */}
          {editingTextId && (() => {
            const el = elements.find((e) => e.id === editingTextId);
            if (!el || (el.type !== 'arc-text' && el.type !== 'text')) return null;

            return (
              <input
                type="text"
                value={(el as any).text || ''}
                onChange={(e) => updateElement(el.id, { text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') {
                    setEditingTextId(null);
                  }
                }}
                onBlur={() => setEditingTextId(null)}
                autoFocus
                className="opacity-0 fixed -top-[9999px] -left-[9999px] pointer-events-none w-1 h-1"
              />
            );
          })()}
        </div>
      </div>

      {/* --- FLOATING DOCK & QUICK ACTIONS WRAPPER --- */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2.5 pointer-events-none select-none max-w-[calc(100%-2rem)]">
          {/* 1. Canvas Quick Actions Bar */}
          <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-slate-200/90 px-2.5 py-1.5 rounded-xl shadow-lg shadow-slate-900/5 text-xs text-slate-700 whitespace-nowrap animate-in fade-in"
        >
          {/* Quick Live Text Input & Size Stepper when Arc Text or Straight Text is selected */}
          {selectedElement && (selectedElement.type === 'arc-text' || selectedElement.type === 'text') ? (
            <div className="flex items-center gap-2 pr-1">
              <span className="font-bold text-[#0d99ff] text-xs flex items-center gap-1">
                <Type className="w-3.5 h-3.5" />
                <span>Text:</span>
              </span>
              <input
                type="text"
                value={(selectedElement as any).text || ''}
                onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                placeholder="Type stamp text..."
                className="bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-[#0d99ff] focus:ring-2 focus:ring-[#0d99ff]/10 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-900 outline-none w-36 sm:w-52 transition-all"
                autoFocus
              />

              {/* Instant Text Size Stepper */}
              <div className="flex items-center gap-0.5 bg-slate-100/90 rounded-lg p-0.5 border border-slate-200/60">
                <button
                  onClick={() => {
                    const cur = (selectedElement as any).fontSize || 3.0;
                    updateElement(selectedElement.id, { fontSize: Math.max(1.0, Number((cur - 0.2).toFixed(1))) });
                  }}
                  className="w-5 h-5 rounded hover:bg-white hover:shadow-2xs flex items-center justify-center font-bold text-[11px] text-slate-700 transition-all"
                  title="Smaller Size (-0.2mm)"
                >
                  -
                </button>
                <span className="font-mono text-[11px] font-bold text-slate-800 px-1 min-w-[34px] text-center">
                  {((selectedElement as any).fontSize || 3.0).toFixed(1)}m
                </span>
                <button
                  onClick={() => {
                    const cur = (selectedElement as any).fontSize || 3.0;
                    updateElement(selectedElement.id, { fontSize: Math.min(20.0, Number((cur + 0.2).toFixed(1))) });
                  }}
                  className="w-5 h-5 rounded hover:bg-white hover:shadow-2xs flex items-center justify-center font-bold text-[11px] text-slate-700 transition-all"
                  title="Larger Size (+0.2mm)"
                >
                  +
                </button>
              </div>

              {/* Curve / Arc Text Toggle Button */}
              <button
                onClick={() => {
                  if (!selectedElement) return;
                  pushHistory();
                  if (selectedElement.type === 'text') {
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
                  } else if (selectedElement.type === 'arc-text') {
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
                className={`h-7 px-2.5 rounded-lg transition-all font-semibold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  selectedElement.type === 'arc-text'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-bold'
                    : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200/60'
                }`}
                title={selectedElement.type === 'arc-text' ? 'Click to convert back to Straight Line Text' : 'Convert Straight Text into Circular Curved Arc Text'}
              >
                <Orbit className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{selectedElement.type === 'arc-text' ? 'Curved ⌒' : 'Add Curve ⌒'}</span>
              </button>

              <div className="h-4 w-[1px] bg-slate-200 shrink-0 mx-0.5" />
            </div>
          ) : null}

          <button
            onClick={handleAlignSelectedToCenter}
            className="h-7 px-2.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors font-semibold text-xs flex items-center gap-1.5 shrink-0"
            title="Center Align (0,0)"
          >
            <AlignCenter className="w-3.5 h-3.5 text-[#0d99ff] shrink-0" />
            <span>Center</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200 shrink-0 mx-0.5" />

          <button
            onClick={() => setLaserInvert(!laserInvert)}
            className={`h-7 px-2.5 rounded-lg transition-colors font-semibold text-xs flex items-center gap-1.5 shrink-0 ${
              laserInvert ? 'bg-red-50 text-red-600 font-bold' : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Laser Invert Negative"
          >
            <Contrast className="w-3.5 h-3.5 shrink-0" />
            <span>Laser Invert</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200 shrink-0 mx-0.5" />

          <button
            onClick={() => setLaserMirror(!laserMirror)}
            className={`h-7 px-2.5 rounded-lg transition-colors font-semibold text-xs flex items-center gap-1.5 shrink-0 ${
              laserMirror ? 'bg-[#e5f2ff] text-[#0d99ff] font-bold' : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Mirror Flip"
          >
            <FlipHorizontal className="w-3.5 h-3.5 shrink-0" />
            <span>Mirror Flip</span>
          </button>

          {selectedId && (
            <>
              <div className="h-4 w-[1px] bg-slate-200 shrink-0 mx-0.5" />
              <button
                onClick={() => duplicateElement(selectedId)}
                className="h-7 px-2.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors font-semibold text-xs flex items-center gap-1.5 shrink-0"
                title="Duplicate (Ctrl+D)"
              >
                <Copy className="w-3.5 h-3.5 text-[#0d99ff] shrink-0" />
                <span>Duplicate</span>
              </button>
              <button
                onClick={() => deleteElement(selectedId)}
                className="h-7 px-2.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors font-semibold text-xs flex items-center gap-1.5 shrink-0"
                title="Delete (Del)"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>

        {/* 2. Primary Stamp Design Bottom Dock */}
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="pointer-events-auto bg-white border border-slate-200/90 shadow-xl shadow-slate-900/5 rounded-2xl p-1.5 flex items-center gap-1 whitespace-nowrap"
        >
          {/* Tool 1: Move / Select (V) */}
          <Tooltip content="Select & Move Layer" shortcut="V" side="top">
            <button
              onClick={() => setActiveDockTool('select')}
              className={`h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                activeDockTool === 'select'
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <MousePointer className="w-4 h-4 shrink-0" />
              <span>Select</span>
            </button>
          </Tooltip>

          <div className="h-5 w-[1px] bg-slate-200 shrink-0 mx-1" />

          {/* Tool 2: Top Arc Text */}
          <Tooltip content="Add Top Curved Arc Text" side="top">
            <button
              onClick={handleAddTopArc}
              className="h-9 px-3 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Type className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Top Arc</span>
            </button>
          </Tooltip>

          {/* Tool 3: Bottom Arc Text */}
          <Tooltip content="Add Bottom Curved Arc Text" side="top">
            <button
              onClick={handleAddBottomArc}
              className="h-9 px-3 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCw className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Bottom Arc</span>
            </button>
          </Tooltip>

          {/* Tool 4: Straight Text (T) */}
          <Tooltip content="Add Center Text Line" shortcut="T" side="top">
            <button
              onClick={handleAddStraightText}
              className="h-9 px-3 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Type className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Center Text</span>
            </button>
          </Tooltip>

          <div className="h-5 w-[1px] bg-slate-200 shrink-0 mx-1" />

          {/* Tool 5: Concentric Ring */}
          <Tooltip content="Add Concentric Circle Ring" side="top">
            <button
              onClick={handleAddRing}
              className="h-9 px-3 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Circle className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Ring</span>
            </button>
          </Tooltip>

          {/* Tool 6: Rectangle Frame */}
          <Tooltip content="Add Box Frame" shortcut="R" side="top">
            <button
              onClick={handleAddRect}
              className="h-9 px-3 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Square className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Box</span>
            </button>
          </Tooltip>

          <div className="h-5 w-[1px] bg-slate-200 shrink-0 mx-1" />

          {/* Tool 8: Clipart & Crests Library */}
          <Tooltip content="Open Vector Clipart Library" side="top">
            <button
              onClick={onOpenClipartModal}
              className="h-9 px-3 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Star className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Clipart</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </main>
  );
};

interface RenderElementProps {
  element: StampElement;
  isSelected: boolean;
  isEditing?: boolean;
  inkColor: string;
  shape?: string;
  widthMm?: number;
  heightMm?: number;
  onPointerDown: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

const RenderCanvasElement: React.FC<RenderElementProps> = ({
  element,
  isSelected,
  isEditing,
  inkColor,
  shape,
  widthMm,
  heightMm,
  onPointerDown,
  onDoubleClick,
}) => {
  switch (element.type) {
    case 'arc-text': {
      const arc = element as ArcTextElement;
      const isOvalShape = shape === 'OVAL';
      const maxDim = Math.max(widthMm || 40, heightMm || 40);
      const rx = (arc as any).rx || (isOvalShape ? arc.radius * ((widthMm || 40) / maxDim) : arc.radius);
      const ry = (arc as any).ry || (isOvalShape ? arc.radius * ((heightMm || 40) / maxDim) : arc.radius);

      const glyphs = calculateArcGlyphs(arc, arc.cx, arc.cy, arc.radius, undefined, undefined, arc.isReversed, arc.letterSpacing, rx, ry, arc.angleOffset);

      // Compute live caret position at end of text
      let caretX = arc.cx;
      let caretY = arc.cy - ry;
      let caretRotation = 0;

      if (glyphs.length > 0) {
        const lastGlyph = glyphs[glyphs.length - 1];
        const effectiveR = (rx + ry) / 2;
        const caretOffsetAngle = (arc.fontSize * 0.35) / effectiveR;
        const caretAngle = arc.isReversed
          ? lastGlyph.angleRad - caretOffsetAngle
          : lastGlyph.angleRad + caretOffsetAngle;

        caretX = arc.cx + rx * Math.cos(caretAngle);
        caretY = arc.cy + ry * Math.sin(caretAngle);
        caretRotation = isOvalShape
          ? (Math.atan2(ry * Math.cos(caretAngle), -rx * Math.sin(caretAngle)) * 180) / Math.PI + (arc.isReversed ? 180 : 0)
          : (caretAngle * 180) / Math.PI + (arc.isReversed ? -90 : 90);
      } else {
        const apexPt = getArcApexPoint(arc, widthMm, heightMm, shape);
        caretX = apexPt.x;
        caretY = apexPt.y;
        caretRotation = isOvalShape
          ? (Math.atan2(ry * Math.cos(apexPt.angleRad), -rx * Math.sin(apexPt.angleRad)) * 180) / Math.PI + (arc.isReversed ? 180 : 0)
          : (apexPt.angleRad * 180) / Math.PI + (arc.isReversed ? -90 : 90);
      }

      return (
        <g
          id={arc.id}
          className="cursor-grab active:cursor-grabbing group"
          onPointerDown={onPointerDown}
          onDoubleClick={onDoubleClick}
        >
          {/* Broad invisible circular hit ribbon across the entire text span for effortless grab & drag */}
          {glyphs.length > 0 && (() => {
            const first = glyphs[0];
            const last = glyphs[glyphs.length - 1];
            return (
              <path
                d={`M ${first.x} ${first.y} A ${rx} ${ry} 0 0 ${arc.isReversed ? 0 : 1} ${last.x} ${last.y}`}
                stroke="#000000"
                strokeWidth={Math.max(8, arc.fontSize * 2.5)}
                fill="none"
                opacity={0}
                style={{ pointerEvents: 'stroke' }}
                className="cursor-grab active:cursor-grabbing"
              />
            );
          })()}

          {glyphs.map((g, i) => (
            <text
              key={i}
              x={g.x}
              y={g.y}
              transform={`rotate(${g.rotation}, ${g.x}, ${g.y})`}
              fontSize={arc.fontSize}
              fontFamily={arc.fontFamily || 'Arial, sans-serif'}
              fontWeight={arc.fontWeight || 'bold'}
              fontStyle={arc.fontStyle || 'normal'}
              fill={inkColor}
              stroke="none"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {g.char}
            </text>
          ))}
          {/* Live Blinking Caret Bar directly on the curve (like native keyboard typing) */}
          {isEditing && (
            <line
              x1={caretX}
              y1={caretY - arc.fontSize * 0.55}
              x2={caretX}
              y2={caretY + arc.fontSize * 0.55}
              transform={`rotate(${caretRotation}, ${caretX}, ${caretY})`}
              stroke="#0d99ff"
              strokeWidth="0.55"
              strokeLinecap="round"
              className="stamp-caret"
            />
          )}
        </g>
      );
    }

    case 'text': {
      const txt = element as StraightTextElement;
      const textLen = (txt.text || '').length || 1;
      const w = textLen * (txt.fontSize || 3) * 0.6;
      const h = (txt.fontSize || 3) * 1.5;

      return (
        <g
          id={txt.id}
          className="cursor-grab active:cursor-grabbing group"
          onPointerDown={onPointerDown}
          onDoubleClick={onDoubleClick}
        >
          {/* 100% invisible hit box (zero black stroke/background) for effortless dragging */}
          <rect
            x={txt.x - w / 2 - 2}
            y={txt.y - h / 2 - 1}
            width={w + 4}
            height={h + 2}
            fill="#000000"
            stroke="none"
            opacity={0}
            style={{ pointerEvents: 'all' }}
            className="cursor-grab active:cursor-grabbing"
          />

          <text
            x={txt.x}
            y={txt.y}
            fontSize={txt.fontSize}
            fontFamily={txt.fontFamily || 'Arial, sans-serif'}
            fontWeight={txt.fontWeight || 'bold'}
            fontStyle={txt.fontStyle || 'normal'}
            fill={inkColor}
            stroke="none"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {txt.text}
          </text>
          {/* Live Blinking Caret for Straight Text */}
          {isEditing && (
            <line
              x1={txt.x + (txt.text ? txt.text.length * (txt.fontSize * 0.32) : 0)}
              y1={txt.y - txt.fontSize * 0.55}
              x2={txt.x + (txt.text ? txt.text.length * (txt.fontSize * 0.32) : 0)}
              y2={txt.y + txt.fontSize * 0.55}
              stroke="#0d99ff"
              strokeWidth="0.55"
              strokeLinecap="round"
              className="stamp-caret"
            />
          )}
        </g>
      );
    }

    case 'ring': {
      const r = element as RingElement;
      let strokeDash = 'none';
      if (r.strokeType === 'dashed') strokeDash = '2,1';
      if (r.strokeType === 'dotted') strokeDash = '0.5,1';

      const isOvalShape = shape === 'OVAL' || (r as any).rx !== undefined;
      if (isOvalShape) {
        const maxDim = Math.max(widthMm || 40, heightMm || 40);
        const rx = (r as any).rx || (r.radius * ((widthMm || 40) / maxDim));
        const ry = (r as any).ry || (r.radius * ((heightMm || 40) / maxDim));

        return (
          <ellipse
            id={r.id}
            cx={r.cx}
            cy={r.cy}
            rx={rx}
            ry={ry}
            fill="none"
            stroke={inkColor}
            strokeWidth={r.strokeWidth}
            strokeDasharray={strokeDash !== 'none' ? strokeDash : undefined}
            className="cursor-move"
            onPointerDown={onPointerDown}
          />
        );
      }

      return (
        <circle
          id={r.id}
          cx={r.cx}
          cy={r.cy}
          r={r.radius}
          fill="none"
          stroke={inkColor}
          strokeWidth={r.strokeWidth}
          strokeDasharray={strokeDash !== 'none' ? strokeDash : undefined}
          className="cursor-move"
          onPointerDown={onPointerDown}
        />
      );
    }

    case 'serrated-ring': {
      const sr = element as SerratedRingElement;
      const isWreath = (sr as any).wreathStyle || (sr as any).wreath || false;
      const fillVal = isWreath && (isWreath === true || isWreath === 'wreath' || isWreath === 'checkered' || isWreath === 'diamond') ? inkColor : 'none';
      const pathData = generateSerratedPath(sr.cx, sr.cy, sr.outerRadius, sr.innerRadius, sr.teeth || 54, isWreath);

      if (shape === 'OVAL') {
        const maxDim = Math.max(widthMm || 40, heightMm || 40);
        const scaleX = (widthMm || 40) / maxDim;
        const scaleY = (heightMm || 40) / maxDim;

        return (
          <g transform={`translate(${sr.cx * (1 - scaleX)}, ${sr.cy * (1 - scaleY)}) scale(${scaleX}, ${scaleY})`}>
            <path
              id={sr.id}
              d={pathData}
              fill={fillVal}
              stroke={inkColor}
              strokeWidth={sr.strokeWidth / Math.min(scaleX, scaleY)}
              className="cursor-move"
              onPointerDown={onPointerDown}
            />
          </g>
        );
      }

      return (
        <path
          id={sr.id}
          d={pathData}
          fill={fillVal}
          stroke={inkColor}
          strokeWidth={sr.strokeWidth}
          className="cursor-move"
          onPointerDown={onPointerDown}
        />
      );
    }

    case 'rect': {
      const rc = element as RectElement;
      return (
        <rect
          id={rc.id}
          x={rc.x}
          y={rc.y}
          width={rc.width}
          height={rc.height}
          rx={rc.rx || 0}
          ry={rc.ry || 0}
          fill="none"
          stroke={inkColor}
          strokeWidth={rc.strokeWidth}
          className="cursor-move"
          onPointerDown={onPointerDown}
        />
      );
    }

    case 'oval': {
      const ov = element as OvalElement;
      return (
        <ellipse
          id={ov.id}
          cx={ov.cx}
          cy={ov.cy}
          rx={ov.rx}
          ry={ov.ry}
          fill="none"
          stroke={inkColor}
          strokeWidth={ov.strokeWidth}
          className="cursor-move"
          onPointerDown={onPointerDown}
        />
      );
    }

    case 'line': {
      const ln = element as LineElement;
      return (
        <line
          id={ln.id}
          x1={ln.x1}
          y1={ln.y1}
          x2={ln.x2}
          y2={ln.y2}
          stroke={inkColor}
          strokeWidth={ln.strokeWidth}
          className="cursor-move"
          onPointerDown={onPointerDown}
        />
      );
    }

    case 'clipart': {
      const cl = element as ClipartElement;
      const halfW = (cl.width || 8) / 2;
      const halfH = (cl.height || 8) / 2;
      const vb = (cl as any).viewBox || (cl.svgPath ? '0 0 100 100' : '0 0 24 24');
      const vbScale = vb === '0 0 100 100' ? 100 : 24;

      return (
        <g
          id={cl.id}
          transform={`translate(${cl.cx - halfW}, ${cl.cy - halfH}) scale(${(cl.width || 8) / vbScale}, ${(cl.height || 8) / vbScale})`}
          className="cursor-move"
          onPointerDown={onPointerDown}
          dangerouslySetInnerHTML={{ __html: cl.svgPath || '' }}
        />
      );
    }

    case 'qrcode': {
      const qr = element as QRCodeElement;
      const half = (qr.size || 14) / 2;
      return (
        <g
          id={qr.id}
          className="cursor-move"
          onPointerDown={onPointerDown}
          transform={`translate(${qr.cx - half}, ${qr.cy - half})`}
        >
          <rect x={0} y={0} width={qr.size} height={qr.size} fill="none" stroke={inkColor} strokeWidth="0.4" />
          <rect x={1} y={1} width={3} height={3} fill={inkColor} />
          <rect x={qr.size - 4} y={1} width={3} height={3} fill={inkColor} />
          <rect x={1} y={qr.size - 4} width={3} height={3} fill={inkColor} />
          <rect x={half - 1} y={half - 1} width={2} height={2} fill={inkColor} />
        </g>
      );
    }

    default:
      return null;
  }
};
