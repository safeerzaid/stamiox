'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useTheme } from '../../context/ThemeContext';
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
  ImageElement,
} from '../../types/stamp';
import { calculateArcGlyphs, generateSerratedPath, getArcApexPoint } from '../../lib/arc-text';
import { getNamedClipart, getQrPath, getStrokeDash } from '../../lib/svg-generator';
import { readLogoFile, processLogo, fitLogo, DEFAULT_LOGO_THRESHOLD } from '../../lib/logo';
import { mmToPx, pxToMm, MM_TO_PX } from '../../lib/units';
import { Tooltip } from '../common/Tooltip';
import { ShapeSizeBadge } from '../common/ShapeSizeBadge';
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
  ClipboardPaste,
  Scissors,
  Trash2,
  FlipHorizontal,
  Plus,
  Star,
  PanelLeft,
  PanelRight,
  Orbit,
  ImagePlus,
  ChevronDown,
  Minus,
  QrCode,
  CalendarDays,
  RectangleHorizontal,
  Grid3x3,
  Magnet,
  Settings2,
  Group,
  Ungroup,
} from 'lucide-react';

interface CanvasProps {
  onOpenClipartModal?: () => void;
}


/** Tight bounds of the letters of an arc text (not the whole circle it follows). */
function arcTextBounds(arc: ArcTextElement, rx: number, ry: number) {
  const glyphs = calculateArcGlyphs(arc, arc.cx, arc.cy, arc.radius, undefined, undefined, arc.isReversed, arc.letterSpacing, rx, ry, arc.angleOffset);
  const f = arc.fontSize || 3;
  if (!glyphs.length) return { minX: arc.cx - f, minY: arc.cy - f, maxX: arc.cx + f, maxY: arc.cy + f };
  const e = f * 0.55; // each letter rotated in place: cover its square
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const g of glyphs) {
    minX = Math.min(minX, g.x - e); maxX = Math.max(maxX, g.x + e);
    minY = Math.min(minY, g.y - e); maxY = Math.max(maxY, g.y + e);
  }
  return { minX, minY, maxX, maxY };
}

export const Canvas: React.FC<CanvasProps> = ({ onOpenClipartModal }) => {
  const {
    widthMm,
    heightMm,
    shape,
    switchCanvasShape,
    autoCanvasShape,
    inkColor,
    elements: ctxElements,
    setElements,
    selectedId,
    selectedIds,
    selectedElement,
    setSelectedId,
    setSelectedIds,
    updateElement,
    deleteElement,
    duplicateElement,
    canCopy,
    canPaste,
    copySelected,
    cutSelected,
    pasteElement,
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
    alignSelected,
    designLoadKey,
    addElement,
    pushHistory,
    groupElements,
    ungroupElements,
    selectAll,
    isLeftSidebarOpen,
    isRightSidebarOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
  } = useEditor();

  // ── Live drag/resize layer ──
  // While a layer is dragged/resized, changes live only in the canvas (smooth, no app-wide
  // re-render per mouse event) and are committed to the editor once on pointer-up.
  const [liveEdits, setLiveEdits] = useState<Record<string, Record<string, any>>>({});
  const liveEditsRef = useRef<Record<string, Record<string, any>>>({});
  const liveUpdate = (id: string, patch: Record<string, any>) => {
    const next = { ...liveEditsRef.current, [id]: { ...liveEditsRef.current[id], ...patch } };
    liveEditsRef.current = next;
    setLiveEdits(next);
  };
  const commitLiveEdits = () => {
    const pending = liveEditsRef.current;
    const ids = Object.keys(pending);
    if (!ids.length) return;
    ids.forEach((id) => updateElement(id, pending[id] as any));
    liveEditsRef.current = {};
    setLiveEdits({});
  };
  const elements = useMemo(
    () =>
      Object.keys(liveEdits).length
        ? ctxElements.map((el) => (liveEdits[el.id] ? ({ ...el, ...liveEdits[el.id] } as StampElement) : el))
        : ctxElements,
    [ctxElements, liveEdits]
  );
  // Clear any pending live edits whenever a new template/design is loaded
  useEffect(() => {
    liveEditsRef.current = {};
    setLiveEdits({});
  }, [designLoadKey]);

  // Pointer moves are processed at most once per animation frame
  const moveRafRef = useRef<number | null>(null);
  const pendingMoveRef = useRef<{ clientX: number; clientY: number; altKey: boolean; shiftKey?: boolean } | null>(null);

  // ── Layout grid & snapping (remembered per browser) ──
  const readPref = <T,>(k: string, d: T): T => {
    try { const v = localStorage.getItem(k); return v === null ? d : (JSON.parse(v) as T); } catch { return d; }
  };
  const [gridOn, setGridOn] = useState<boolean>(true);
  const [gridSize, setGridSize] = useState<number>(1);
  const [gridMajorEvery, setGridMajorEvery] = useState<number>(5);
  const [gridStrength, setGridStrength] = useState<number>(1); // 0.4 (faint) … 2 (strong)
  const [isGridSettingsOpen, setIsGridSettingsOpen] = useState(false);
  const [snapOn, setSnapOn] = useState<boolean>(true);
  useEffect(() => {
    setGridOn(readPref('stamiox_grid_on', true));
    setGridSize(readPref('stamiox_grid_size', 1));
    setGridMajorEvery(readPref('stamiox_grid_major', 5));
    setGridStrength(readPref('stamiox_grid_strength', 1));

    // Ensure 'Snap while moving' is ON by default across all sessions
    const snapMigration = 'stamiox_snap_default_v2';
    try {
      if (!localStorage.getItem(snapMigration)) {
        setSnapOn(true);
        savePref('stamiox_snap_on', true);
        localStorage.setItem(snapMigration, '1');
      } else {
        setSnapOn(readPref('stamiox_snap_on', true));
      }
    } catch {
      setSnapOn(true);
    }
  }, []);
  const savePref = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };
  // smart-guide lines shown while a drag is snapped (mm)
  const [guides, setGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [initialElementData, setInitialElementData] = useState<any>(null);
  const [dragStart, setDragStart] = useState<{ xMm: number; yMm: number } | null>(null);
  const [initialElPos, setInitialElPos] = useState<{ x: number; y: number } | null>(null);
  const [mousePosMm, setMousePosMm] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeDockTool, setActiveDockTool] = useState<string>('select');
  const [activeClickedTool, setActiveClickedTool] = useState<string | null>(null);
  const clickToolTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToolClick = (key: string, callback?: () => void) => {
    setActiveClickedTool(key);
    if (clickToolTimeoutRef.current) clearTimeout(clickToolTimeoutRef.current);
    clickToolTimeoutRef.current = setTimeout(() => {
      setActiveClickedTool((prev) => (prev === key ? null : prev));
    }, 720);
    if (callback) callback();
  };

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

  // Desktop Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const handleClose = () => setContextMenu(null);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    window.addEventListener('click', handleClose);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('keydown', handleKey);
    };
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 190);
    const y = Math.min(e.clientY, window.innerHeight - 250);
    setContextMenu({ x, y });
  };

  // Spacebar Pan Navigation States (Figma / Illustrator Style)
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const isSpacePressedRef = useRef<boolean>(false);
  const isPanningRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Live zoom while a wheel/pinch gesture is in progress. Only the canvas re-renders during
  // the gesture; the shared editor zoom (toolbar %, panels) is committed once the gesture settles.
  const [liveZoom, setLiveZoom] = useState<number | null>(null);
  const viewZoom = liveZoom ?? zoom;
  const zoomRef = useRef(zoom);
  useEffect(() => {
    if (liveZoom === null) zoomRef.current = zoom;
  }, [zoom, liveZoom]);
  const wheelFactorRef = useRef(1);
  const wheelRafRef = useRef<number | null>(null);
  const wheelCommitRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      // Proportional to scroll distance (smooth on trackpads, ~8% per mouse-wheel notch),
      // accumulated and applied once per animation frame.
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY; // lines → pixels
      wheelFactorRef.current *= Math.exp(-Math.max(-60, Math.min(60, dy)) * 0.0014);
      if (wheelRafRef.current === null) {
        wheelRafRef.current = requestAnimationFrame(() => {
          wheelRafRef.current = null;
          const newZ = Math.min(8.0, Math.max(0.4, zoomRef.current * wheelFactorRef.current));
          wheelFactorRef.current = 1;
          zoomRef.current = newZ;
          setLiveZoom(newZ);
          if (wheelCommitRef.current) clearTimeout(wheelCommitRef.current);
          wheelCommitRef.current = setTimeout(() => {
            wheelCommitRef.current = null;
            setZoom(Number(zoomRef.current.toFixed(3)));
            setLiveZoom(null);
          }, 160);
        });
      }
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
      if (wheelRafRef.current !== null) cancelAnimationFrame(wheelRafRef.current);
      if (wheelCommitRef.current) clearTimeout(wheelCommitRef.current);
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

  const canvasWidthPx = mmToPx(widthMm, viewZoom);
  const canvasHeightPx = mmToPx(heightMm, viewZoom);

  // Dark theme: the stamp is shown as a dark plate with white ink (on screen only — exports stay black on white)
  const { resolvedTheme } = useTheme();
  const isDarkCanvas = resolvedTheme === 'dark';
  const DARK_PLATE = '#111827';
  const DARK_INK = '#f1f5f9';
  const actualInk = isDarkCanvas ? (laserInvert ? DARK_PLATE : DARK_INK) : laserInvert ? '#ffffff' : inkColor;
  const actualBg = isDarkCanvas ? (laserInvert ? DARK_INK : DARK_PLATE) : laserInvert ? '#000000' : '#ffffff';

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
      const left = txt.align === 'left' ? txt.x : txt.align === 'right' ? txt.x - w : txt.x - w / 2;
      minX = left; minY = txt.y - h / 2; maxX = left + w; maxY = txt.y + h / 2;
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
      const isOv = shape === 'OVAL';
      const md = Math.max(wMm || 40, hMm || 40);
      const arx = (arc as any).rx || (isOv ? arc.radius * ((wMm || 40) / md) : arc.radius);
      const ary = (arc as any).ry || (isOv ? arc.radius * ((hMm || 40) / md) : arc.radius);
      ({ minX, minY, maxX, maxY } = arcTextBounds(arc, arx, ary));
    } else if (el.type === 'line') {
      const ln = el as any;
      const half = Math.max(0.2, (ln.strokeWidth || 0.4) / 2);
      minX = Math.min(ln.x1, ln.x2) - half; maxX = Math.max(ln.x1, ln.x2) + half;
      minY = Math.min(ln.y1, ln.y2) - half; maxY = Math.max(ln.y1, ln.y2) + half;
    } else if (el.type === 'qrcode') {
      const qr = el as any;
      const half = (qr.size || 14) / 2;
      minX = qr.cx - half; minY = qr.cy - half; maxX = qr.cx + half; maxY = qr.cy + half;
    } else if (el.type === 'image') {
      const img = el as any;
      minX = img.x; minY = img.y; maxX = img.x + (img.width || 15); maxY = img.y + (img.height || 15);
    }
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
  };

  // Coordinate Conversion: Screen to MM
  // The canvas does not move during a drag, so its screen rect is measured once per gesture
  // (measuring every pointer move forces a synchronous layout).
  const canvasRectCacheRef = useRef<DOMRect | null>(null);
  const screenToCanvasMm = (clientX: number, clientY: number, useCache = false) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    let rect = useCache ? canvasRectCacheRef.current : null;
    if (!rect) {
      rect = containerRef.current.getBoundingClientRect();
      if (useCache) canvasRectCacheRef.current = rect;
    }
    const pxX = clientX - rect.left;
    const pxY = clientY - rect.top;
    const xMm = pxToMm(pxX, viewZoom);
    return {
      // Mirror view flips the drawing on screen, so flip the pointer too — the marquee, drags and
      // handles then follow the mouse exactly as in normal view.
      x: laserMirror ? widthMm - xMm : xMm,
      y: pxToMm(pxY, viewZoom),
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
    const posMm = screenToCanvasMm(e.clientX, e.clientY, isDragging || isResizing || isSlidingArc);
    setDragStart({ xMm: posMm.x, yMm: posMm.y });
    setInitialElementData(JSON.parse(JSON.stringify(selectedElement)));
  };

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (isSpacePressedRef.current || e.button === 1) return;

    setEditingTextId(null);
    const posMm = screenToCanvasMm(e.clientX, e.clientY, isDragging || isResizing || isSlidingArc);
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
      // If already in selectedIds, keep all selected for group drag; otherwise select just this one (or whole group if grouped)
      if (selectedIds.includes(el.id) && selectedIds.length > 1) {
        currentSelection = selectedIds;
      } else if (el.groupId) {
        // Clicking any element in a group selects the whole group!
        const groupMembers = elements.filter((x) => x.groupId === el.groupId && x.visible !== false);
        currentSelection = groupMembers.map((x) => x.id);
        setSelectedIds(currentSelection);
        setSelectedId(null);
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

    const posMm = screenToCanvasMm(e.clientX, e.clientY, isDragging || isResizing || isSlidingArc);
    setDragStart({ xMm: posMm.x, yMm: posMm.y });

    // Store initial positions of all currently selected elements for group drag
    const posMap: { [id: string]: { x: number; y: number } } = {};
    currentSelection.forEach((id) => {
      const target = elements.find((x) => x.id === id);
      if (target) {
        if (target.type === 'text' || target.type === 'rect' || target.type === 'image') {
          posMap[id] = { x: (target as any).x, y: (target as any).y };
        } else if (target.type === 'line') {
          const ln = target as any;
          posMap[id] = { x: (ln.x1 + ln.x2) / 2, y: (ln.y1 + ln.y2) / 2 };
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
    const posMm = screenToCanvasMm(e.clientX, e.clientY, isDragging || isResizing || isSlidingArc);
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
    const posMm = screenToCanvasMm(e.clientX, e.clientY, isDragging || isResizing || isSlidingArc);
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
        } else if (target.type === 'line') {
          const ln = target as any;
          posMap[id] = { x: (ln.x1 + ln.x2) / 2, y: (ln.y1 + ln.y2) / 2 };
        } else if ('cx' in target && 'cy' in target) {
          posMap[id] = { x: (target as any).cx, y: (target as any).cy };
        }
      }
    });
    setMultiInitialPos(posMap);
  };

  // Coalesce pointer moves: keep only the latest position and process it once per frame
  const handlePointerMove = (e: React.PointerEvent) => {
    pendingMoveRef.current = { clientX: e.clientX, clientY: e.clientY, altKey: e.altKey, shiftKey: e.shiftKey };
    if (moveRafRef.current !== null) return;
    moveRafRef.current = requestAnimationFrame(() => {
      moveRafRef.current = null;
      const ev = pendingMoveRef.current;
      pendingMoveRef.current = null;
      if (ev) processMoveRef.current(ev);
    });
  };

  const processPointerMove = (e: { clientX: number; clientY: number; altKey: boolean; shiftKey?: boolean }) => {
    if (isPanningRef.current) return;

    const posMm = screenToCanvasMm(e.clientX, e.clientY, isDragging || isResizing || isSlidingArc);
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
        liveUpdate(slidingArcData.id, {
          angleOffset: Number(newOffset.toFixed(1)),
          radius: newRadius,
          rx: newRx,
          ry: newRy,
        } as any);
      } else {
        liveUpdate(slidingArcData.id, {
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
      // Scale relative to where the handle was grabbed: corner handles sit ~1.4× the radius from
      // the centre, so using the raw distance made shapes jump outward on the first move.
      const scaleFrom = (cx: number, cy: number) => {
        const d0 = Math.hypot(dragStart.xMm - cx, dragStart.yMm - cy);
        const d1 = Math.hypot(posMm.x - cx, posMm.y - cy);
        return d0 > 0.01 ? d1 / d0 : 1;
      };

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

        liveUpdate(selectedId, {
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
        liveUpdate(selectedId, { fontSize: newFontSize } as any);
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

        liveUpdate(selectedId, {
          x: Number(newX.toFixed(1)),
          y: Number(newY.toFixed(1)),
          width: Number(newW.toFixed(1)),
          height: Number(newH.toFixed(1)),
        } as any);
        return;
      }

      if (init.type === 'ring') {
        const newR = Math.max(1, Math.min(Math.max(widthMm, heightMm) * 1.5, Number((init.radius * scaleFrom(init.cx, init.cy)).toFixed(2))));
        liveUpdate(selectedId, { radius: newR } as any);
        return;
      }

      if (init.type === 'oval') {
        // each axis scales by how far the pointer moved along it, relative to the grab point
        const ax = Math.abs(dragStart.xMm - init.cx);
        const ay = Math.abs(dragStart.yMm - init.cy);
        let newRx = init.rx;
        let newRy = init.ry;
        if ((resizeHandle.includes('e') || resizeHandle.includes('w')) && ax > 0.01) {
          newRx = Math.max(1, Number((init.rx * (Math.abs(posMm.x - init.cx) / ax)).toFixed(2)));
        }
        if ((resizeHandle.includes('n') || resizeHandle.includes('s')) && ay > 0.01) {
          newRy = Math.max(1, Number((init.ry * (Math.abs(posMm.y - init.cy) / ay)).toFixed(2)));
        }
        liveUpdate(selectedId, { rx: newRx, ry: newRy } as any);
        return;
      }

      if (init.type === 'serrated-ring') {
        const k = scaleFrom(init.cx, init.cy);
        const newOuter = Math.max(2, Number(((init.outerRadius || 15) * k).toFixed(2)));
        const newInner = Number(((init.innerRadius || 12) * (newOuter / (init.outerRadius || 15))).toFixed(2));
        liveUpdate(selectedId, { outerRadius: newOuter, innerRadius: newInner } as any);
        return;
      }

      if (init.type === 'arc-text') {
        const newR = Math.max(3, Number((init.radius * scaleFrom(init.cx, init.cy)).toFixed(2)));
        if (shape === 'OVAL') {
          const maxDim = Math.max(widthMm || 40, heightMm || 40);
          const newRx = Number((newR * ((widthMm || 40) / maxDim)).toFixed(1));
          const newRy = Number((newR * ((heightMm || 40) / maxDim)).toFixed(1));
          liveUpdate(selectedId, { radius: newR, rx: newRx, ry: newRy } as any);
        } else {
          liveUpdate(selectedId, { radius: newR } as any);
        }
        return;
      }

      if (init.type === 'line') {
        // drag an end; Shift keeps the line horizontal / vertical
        const moveP1 = resizeHandle === 'p1';
        const ox = moveP1 ? init.x2 : init.x1;
        const oy = moveP1 ? init.y2 : init.y1;
        let px = posMm.x;
        let py = posMm.y;
        if (e.shiftKey) {
          if (Math.abs(px - ox) >= Math.abs(py - oy)) py = oy; else px = ox;
        }
        px = Number(px.toFixed(2));
        py = Number(py.toFixed(2));
        liveUpdate(selectedId, (moveP1 ? { x1: px, y1: py } : { x2: px, y2: py }) as any);
        return;
      }

      if (init.type === 'qrcode') {
        liveUpdate(selectedId, { size: Math.max(4, Number(((init.size || 14) * scaleFrom(init.cx, init.cy)).toFixed(2))) } as any);
        return;
      }

      if (init.type === 'image') {
        // logo: keep proportions and its centre; any corner works the same way
        const icx = init.x + init.width / 2;
        const icy = init.y + init.height / 2;
        const k = Math.max(4 / Math.min(init.width, init.height), scaleFrom(icx, icy));
        const newW = Number((init.width * k).toFixed(2));
        const newH = Number((init.height * k).toFixed(2));
        liveUpdate(selectedId, { width: newW, height: newH, x: Number((icx - newW / 2).toFixed(2)), y: Number((icy - newH / 2).toFixed(2)) } as any);
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

      // ── Smart snapping on the selection's real outline ──
      let ddx = dxMm;
      let ddy = dyMm;
      let guideX: number | null = null;
      let guideY: number | null = null;
      if (snapOn) {
        const movingIds = Object.keys(multiInitialPos);
        let uMinX = Infinity, uMinY = Infinity, uMaxX = -Infinity, uMaxY = -Infinity;
        movingIds.forEach((id) => {
          const el = elements.find((e) => e.id === id);
          if (!el) return;
          const b = getElementBounds(el, widthMm, heightMm);
          const isLn = el.type === 'line';
          const refX = isLn ? ((el as any).x1 + (el as any).x2) / 2 : (el as any).cx ?? (el as any).x ?? 0;
          const refY = isLn ? ((el as any).y1 + (el as any).y2) / 2 : (el as any).cy ?? (el as any).y ?? 0;
          const sx = multiInitialPos[id].x + dxMm - refX;
          const sy = multiInitialPos[id].y + dyMm - refY;
          uMinX = Math.min(uMinX, b.minX + sx); uMaxX = Math.max(uMaxX, b.maxX + sx);
          uMinY = Math.min(uMinY, b.minY + sy); uMaxY = Math.max(uMaxY, b.maxY + sy);
        });
        if (uMinX !== Infinity) {
          const thr = Math.max(pxToMm(9, viewZoom), 1.2); // ~9 screen px or 1.2mm for crisp magnetic snap
          const candX = [widthMm / 2, 0, widthMm];
          const candY = [heightMm / 2, 0, heightMm];
          elements.forEach((e) => {
            if (movingIds.includes(e.id) || e.visible === false) return;
            // circular things (curved text, rings, starbursts, ovals) only offer their centre —
            // their outline edges are not useful alignment targets
            if (e.type === 'arc-text' || e.type === 'ring' || e.type === 'serrated-ring' || e.type === 'oval') {
              candX.push((e as any).cx);
              candY.push((e as any).cy);
              return;
            }
            const b = getElementBounds(e, widthMm, heightMm);
            candX.push(b.minX, (b.minX + b.maxX) / 2, b.maxX);
            candY.push(b.minY, (b.minY + b.maxY) / 2, b.maxY);
          });
          const snapAxis = (lo: number, hi: number, cands: number[], gridCenter: number) => {
            const mid = (lo + hi) / 2;
            let best: { d: number; at: number } | null = null;
            let bestScore = Infinity;
            for (const v of [mid, lo, hi]) {
              for (let i = 0; i < cands.length; i++) {
                const c = cands[i];
                const d = c - v;
                if (Math.abs(d) >= thr) continue;
                // centre-on-canvas-centre wins over any edge alignment
                const score = Math.abs(d) - (i === 0 && v === mid ? thr : 0);
                if (score < bestScore) { bestScore = score; best = { d, at: c }; }
              }
            }
            if (best) return { adjust: best.d, guide: best.at };
            if (gridOn) {
              const g = gridSize || 1;
              const target = gridCenter + Math.round((mid - gridCenter) / g) * g;
              return { adjust: target - mid, guide: null };
            }
            return { adjust: 0, guide: null };
          };
          const sxr = snapAxis(uMinX, uMaxX, candX, widthMm / 2);
          const syr = snapAxis(uMinY, uMaxY, candY, heightMm / 2);
          ddx += sxr.adjust; guideX = sxr.guide;
          ddy += syr.adjust; guideY = syr.guide;
        }
      }
      if (guides.x !== guideX || guides.y !== guideY) setGuides({ x: guideX, y: guideY });

      Object.entries(multiInitialPos).forEach(([id, init]) => {
        const target = elements.find((el) => el.id === id);
        if (!target) return;

        const targetX = init.x + ddx;
        const targetY = init.y + ddy;

        if (target.type === 'text' || target.type === 'rect' || target.type === 'image') {
          liveUpdate(id, { x: Number(targetX.toFixed(2)), y: Number(targetY.toFixed(2)) } as any);
        } else if (target.type === 'line') {
          const ln = target as any;
          const mx = targetX - (ln.x1 + ln.x2) / 2;
          const my = targetY - (ln.y1 + ln.y2) / 2;
          liveUpdate(id, {
            x1: Number((ln.x1 + mx).toFixed(2)), y1: Number((ln.y1 + my).toFixed(2)),
            x2: Number((ln.x2 + mx).toFixed(2)), y2: Number((ln.y2 + my).toFixed(2)),
          } as any);
        } else if ('cx' in target && 'cy' in target) {
          liveUpdate(id, { cx: Number(targetX.toFixed(2)), cy: Number(targetY.toFixed(2)) } as any);
        }
      });
    }
  };

  const processMoveRef = useRef(processPointerMove);
  processMoveRef.current = processPointerMove; // always call the latest closure from the frame callback
  const elementPointerDownRef = useRef(handlePointerDown);
  elementPointerDownRef.current = handlePointerDown; // memoized layers call the latest handler

  const handlePointerUp = () => {
    setGuides({ x: null, y: null });
    // Apply the last pending move, then commit the live drag/resize to the editor in one update
    if (moveRafRef.current !== null) {
      cancelAnimationFrame(moveRafRef.current);
      moveRafRef.current = null;
      const ev = pendingMoveRef.current;
      pendingMoveRef.current = null;
      if (ev) processMoveRef.current(ev);
    }
    commitLiveEdits();
    canvasRectCacheRef.current = null;

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

    // shared logic: centres every element type (text, rings, logo, QR, clipart, line, box)
    alignSelected('center-page');
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
    // A round border on a square/rect stamp makes the stamp round (its frame becomes the ring)
    if (autoCanvasShape && (shape === 'SQUARE' || shape === 'RECTANGULAR')) {
      switchCanvasShape('ROUND', { ensureBorder: true });
      return;
    }
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
    // A box border on a round/oval stamp makes the stamp square (its ring becomes the frame)
    if (autoCanvasShape && (shape === 'ROUND' || shape === 'OVAL')) {
      switchCanvasShape('SQUARE', { ensureBorder: true });
      return;
    }
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

  // ── More tools (secondary bar under the dock) ──
  const [isMoreToolsOpen, setIsMoreToolsOpen] = useState(false);

  // Rectangle frame: on a non-rectangular stamp (with Auto canvas shape on) the canvas becomes a rectangle
  const handleAddRectangle = () => {
    if (autoCanvasShape && shape !== 'RECTANGULAR') {
      switchCanvasShape('RECTANGULAR', { ensureBorder: true });
      return;
    }
    // inner rectangle frame, wider than tall
    const w = +(widthMm * 0.7).toFixed(2);
    const h = +(Math.min(heightMm * 0.6, w / 2)).toFixed(2);
    addElement({
      type: 'rect',
      x: +((widthMm - w) / 2).toFixed(2),
      y: +((heightMm - h) / 2).toFixed(2),
      width: w,
      height: h,
      strokeWidth: 0.6,
      rx: 1,
      ry: 1,
    } as any);
  };

  const handleAddOval = () => {
    // An oval on a round / square / rect stamp makes the stamp oval (its border becomes the oval)
    if (autoCanvasShape && shape !== 'OVAL') {
      switchCanvasShape('OVAL', { ensureBorder: true });
      return;
    }
    addElement({
      type: 'oval',
      cx: widthMm / 2,
      cy: heightMm / 2,
      rx: +(widthMm * 0.3).toFixed(2),
      ry: +(heightMm * 0.2).toFixed(2),
      strokeWidth: 0.6,
    } as any);
  };

  const handleAddLine = () => {
    const half = Math.min(widthMm, heightMm) * 0.3;
    addElement({
      type: 'line',
      x1: +(widthMm / 2 - half).toFixed(2),
      y1: heightMm / 2,
      x2: +(widthMm / 2 + half).toFixed(2),
      y2: heightMm / 2,
      strokeWidth: 0.4,
    } as any);
  };

  const handleAddDate = () => {
    const d = new Date();
    const text = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    const id = addElement({
      type: 'text',
      text,
      x: widthMm / 2,
      y: heightMm / 2,
      fontSize: Math.max(2, +(Math.min(widthMm, heightMm) * 0.07).toFixed(2)),
      fontFamily: "'Plus Jakarta Sans', Montserrat, sans-serif",
      fontWeight: 'bold',
      align: 'center',
    } as any);
    setEditingTextId(id);
  };

  // Logo upload → 1-bit ink silhouette, centered in the stamp
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  // A QR code is uploaded the same way, traced crisp (no smoothing) and named so it is easy to find
  const qrInputRef = useRef<HTMLInputElement>(null);
  const handleLogoFile = async (file?: File | null, kind: 'logo' | 'qr' = 'logo') => {
    if (!file) return;
    setLogoError(null);
    if (!/^image\/(png|jpe?g|webp|svg\+xml|gif|bmp)$/.test(file.type)) {
      setLogoError('Please choose a PNG, JPG, SVG or WEBP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setLogoError('That image is larger than 10 MB.');
      return;
    }
    try {
      const src = await readLogoFile(file);
      const threshold = kind === 'qr' ? 128 : DEFAULT_LOGO_THRESHOLD;
      const { maskSrc, aspect } = await processLogo(src, threshold, false);
      const box = fitLogo(aspect, widthMm, heightMm, kind === 'qr' ? 0.38 : 0.45);
      const id = addElement({ type: 'image', src, maskSrc, threshold, invert: false, ...(kind === 'qr' ? { name: 'QR code', isQr: true } : {}), ...box } as any);
      setSelectedId(id);
    } catch (err: any) {
      setLogoError(err?.message || 'Could not load that image.');
    }
  };

  return (
    <main
      className={`relative flex-1 flex flex-col items-center justify-center p-8 overflow-hidden select-none bg-[#f8fafc] dark:bg-[#080b11] transition-colors ${
        isPanning ? 'cursor-grabbing' : isSpacePressed ? 'cursor-grab' : ''
      }`}
      onPointerDown={handleCanvasPointerDown}
      onContextMenu={handleContextMenu}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onDragOver={(e) => { if (Array.from(e.dataTransfer.types).includes('Files')) e.preventDefault(); }}
      onDrop={(e) => { const file = e.dataTransfer.files?.[0]; if (file) { e.preventDefault(); handleLogoFile(file); } }}
    >
      {/* Top Precision Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-7 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between px-4 z-10 shadow-2xs font-medium">
        <div className="flex items-center gap-4">
          <span>X: <strong className="font-mono text-slate-900 dark:text-slate-100 font-semibold">{mousePosMm.x.toFixed(1)} mm</strong></span>
          <span>Y: <strong className="font-mono text-slate-900 dark:text-slate-100 font-semibold">{mousePosMm.y.toFixed(1)} mm</strong></span>
          <span className="flex items-center gap-1">Mount: <strong className="text-[#0d99ff] font-semibold"><ShapeSizeBadge shape={shape} widthMm={widthMm} heightMm={heightMm} /></strong></span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          {/* Quick Snap while moving Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !snapOn;
              setSnapOn(next);
              savePref('stamiox_snap_on', next);
            }}
            title={snapOn ? 'Snap while moving: ON (Click to turn off)' : 'Snap while moving: OFF (Click to turn on)'}
            className={`h-5 px-2 rounded flex items-center gap-1.5 tabular-nums transition-colors ${
              snapOn
                ? 'bg-[#e5f2ff] dark:bg-blue-950/60 text-[#0d99ff] font-semibold'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
            <span>Snap {snapOn ? 'ON' : 'OFF'}</span>
          </button>

          {/* Grid & snap settings */}
          <div className="relative" onPointerDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsGridSettingsOpen((v) => !v)}
              aria-expanded={isGridSettingsOpen}
              title="Grid & snapping settings"
              className={`h-5 px-2 rounded flex items-center gap-1.5 tabular-nums transition-colors ${
                gridOn ? 'bg-[#e5f2ff] dark:bg-blue-950/60 text-[#0d99ff]' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Grid3x3 className="w-3.5 h-3.5" />
              <span>Grid{gridOn ? ` · ${gridSize} mm` : ''}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isGridSettingsOpen ? 'rotate-180' : ''}`} />
            </button>

            {isGridSettingsOpen && (
              <div
                className="fx-menu absolute right-0 top-full mt-1.5 w-56 z-50 rounded-xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 shadow-xl p-1.5 text-slate-600 dark:text-slate-300"
                onMouseLeave={() => setIsGridSettingsOpen(false)}
              >
                {/* switches */}
                {([
                  { label: 'Show grid', on: gridOn, set: (v: boolean) => { setGridOn(v); savePref('stamiox_grid_on', v); }, Icon: Grid3x3 },
                  { label: 'Snap while moving', on: snapOn, set: (v: boolean) => { setSnapOn(v); savePref('stamiox_snap_on', v); }, Icon: Magnet },
                ]).map(({ label, on, set, Icon }) => (
                  <label key={label} className="flex items-center gap-2 h-8 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[12px] text-slate-700 dark:text-slate-200">{label}</span>
                    <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} className="sr-only" />
                    <span aria-hidden className={`ml-auto relative w-7 h-4 rounded-full shrink-0 transition-colors ${on ? 'bg-[#0d99ff]' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-3' : ''}`} />
                    </span>
                  </label>
                ))}

                {/* size */}
                <div className={`px-2 pt-2 pb-1.5 space-y-1.5 ${gridOn || snapOn ? '' : 'opacity-50'}`}>
                  <span className="text-[11px] text-slate-500 block">Size (mm)</span>
                  <div className="grid grid-cols-5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {[0.5, 1, 2, 5, 10].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => { setGridSize(g); savePref('stamiox_grid_size', g); }}
                        className={`h-6 rounded-md text-[11px] tabular-nums transition-colors ${
                          gridSize === g ? 'bg-white dark:bg-slate-700 text-[#0d99ff] font-semibold shadow-sm' : 'hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* advanced, folded away */}
                <details className="group px-2 pb-1.5">
                  <summary className="list-none flex items-center gap-1 h-7 text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer select-none">
                    <ChevronDown className="w-3 h-3 -rotate-90 group-open:rotate-0 transition-transform" />
                    More options
                  </summary>
                  <div className="space-y-2.5 pt-1">
                    <label className="flex items-center gap-2 h-7 px-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-transparent focus-within:border-[#0d99ff]">
                      <span className="text-[11px] text-slate-400">Custom</span>
                      <input
                        type="number"
                        min={0.25}
                        max={20}
                        step={0.25}
                        value={gridSize}
                        onChange={(e) => {
                          const v = Math.min(20, Math.max(0.25, parseFloat(e.target.value) || 1));
                          setGridSize(v); savePref('stamiox_grid_size', v);
                        }}
                        className="flex-1 min-w-0 bg-transparent text-[12px] font-medium text-slate-900 dark:text-white tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        aria-label="Custom grid size in mm"
                      />
                      <span className="text-[11px] text-slate-400">mm</span>
                    </label>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 whitespace-nowrap">Major every</span>
                      <div className="grid grid-cols-4 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                        {[2, 4, 5, 10].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => { setGridMajorEvery(n); savePref('stamiox_grid_major', n); }}
                            className={`h-6 px-1.5 rounded-md text-[11px] tabular-nums transition-colors ${
                              gridMajorEvery === n ? 'bg-white dark:bg-slate-700 text-[#0d99ff] font-semibold shadow-sm' : 'hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">Visibility</span>
                        <span className="text-[11px] text-slate-400 tabular-nums">{Math.round(gridStrength * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0.4}
                        max={2}
                        step={0.1}
                        value={gridStrength}
                        onChange={(e) => { const v = parseFloat(e.target.value); setGridStrength(v); savePref('stamiox_grid_strength', v); }}
                        className="w-full accent-[#0d99ff] h-1 cursor-pointer"
                        aria-label="Grid visibility"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setGridSize(1); setGridMajorEvery(5); setGridStrength(1);
                        savePref('stamiox_grid_size', 1); savePref('stamiox_grid_major', 5); savePref('stamiox_grid_strength', 1);
                      }}
                      className="text-[11px] text-slate-400 hover:text-[#0d99ff]"
                    >
                      Reset to default
                    </button>
                  </div>
                </details>
              </div>
            )}
          </div>
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
          <span>
            Drafting Scale: <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.round(viewZoom * 100)}%</span>
          </span>
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
        {/* Laser invert is a preview mode (white letters on black) — say so, with a one-click way back */}
        {laserInvert && (
          <div className="absolute -top-12 left-0 right-0 z-30 flex justify-center pointer-events-none"><div className="pointer-events-auto whitespace-nowrap fx-panel flex items-center gap-2 h-8 pl-3 pr-1 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[12px] shadow-lg">
            <Contrast className="w-3.5 h-3.5 opacity-80" />
            <span className="font-medium">Invert preview on</span>
            <button
              type="button"
              onClick={() => setLaserInvert(false)}
              className="h-6 px-2.5 rounded-full bg-white/15 dark:bg-slate-900/10 hover:bg-white/25 dark:hover:bg-slate-900/20 font-semibold transition-colors cursor-pointer"
            >
              Back to white
            </button>
          </div></div>
        )}

        {/* SVG Viewport Stage */}
        <div
          ref={containerRef}
          className={`relative transition-[width,height,border-radius,box-shadow,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
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
            boxShadow: isDarkCanvas
              ? '0 12px 32px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.12)'
              : '0 2px 8px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.06)',
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
            {/* Layout grid — real lines centred on the stamp, clipped to its shape, never exported */}
            {gridOn && (() => {
              const g = gridSize || 1;
              const every = gridMajorEvery || 5;
              const pxPerMm = mmToPx(1, viewZoom);
              const showMinor = g * pxPerMm >= 5; // hide fine lines only when they would be too dense
              const cx = widthMm / 2;
              const cy = heightMm / 2;
              const ink = laserInvert ? '255,255,255' : '13,153,255';
              const minorStroke = `rgba(${ink},${Math.min(0.6, 0.16 * gridStrength)})`;
              const majorStroke = `rgba(${ink},${Math.min(0.9, 0.34 * gridStrength)})`;
              // lines from the centre outwards, so the centre lines are always on the grid
              const lines: { k: string; x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];
              const nx = Math.ceil(cx / g);
              for (let i = -nx; i <= nx; i++) {
                const x = cx + i * g;
                if (x < 0 || x > widthMm) continue;
                const major = i % every === 0;
                if (major || showMinor) lines.push({ k: 'v' + i, x1: x, y1: 0, x2: x, y2: heightMm, major });
              }
              const ny = Math.ceil(cy / g);
              for (let j = -ny; j <= ny; j++) {
                const y = cy + j * g;
                if (y < 0 || y > heightMm) continue;
                const major = j % every === 0;
                if (major || showMinor) lines.push({ k: 'h' + j, x1: 0, y1: y, x2: widthMm, y2: y, major });
              }
              return (
                <g className="pointer-events-none" aria-hidden data-grid-lines={lines.length}>
                  <defs>
                    <clipPath id="canvas-grid-clip">
                      {shape === 'ROUND' || shape === 'OVAL' ? (
                        <ellipse cx={cx} cy={cy} rx={widthMm / 2} ry={heightMm / 2} />
                      ) : (
                        <rect x={0} y={0} width={widthMm} height={heightMm} />
                      )}
                    </clipPath>
                  </defs>
                  <g clipPath="url(#canvas-grid-clip)">
                    {lines.map((l) => (
                      <line
                        key={l.k}
                        x1={l.x1}
                        y1={l.y1}
                        x2={l.x2}
                        y2={l.y2}
                        stroke={l.major ? majorStroke : minorStroke}
                        strokeWidth={1}
                        vectorEffect="non-scaling-stroke"
                        shapeRendering="crispEdges"
                      />
                    ))}
                  </g>
                </g>
              );
            })()}

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
                .map((el, i) => (
                  <g
                    key={`${designLoadKey}-${el.id}`}
                    className="fx-design-in"
                    style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
                  >
                  <RenderCanvasElement
                    key={el.id}
                    element={el}
                    isSelected={selectedId === el.id || selectedIds.includes(el.id)}
                    isEditing={editingTextId === el.id}
                    inkColor={actualInk}
                    shape={shape}
                    widthMm={widthMm}
                    heightMm={heightMm}
                    onPointerDown={(e) => elementPointerDownRef.current(e, el)}
                    onDoubleClick={() => {
                      if (el.type === 'arc-text' || el.type === 'text') {
                        setSelectedId(el.id);
                        setEditingTextId(el.id);
                      }
                    }}
                  />
                  </g>
                ))}
            </g>

            {/* Smart-snap guide lines (while dragging) */}
            {(guides.x !== null || guides.y !== null) && (
              <g className="pointer-events-none" aria-hidden>
                {guides.x !== null && (
                  <line x1={guides.x} y1={-2} x2={guides.x} y2={heightMm + 2} stroke="#f43f5e" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                )}
                {guides.y !== null && (
                  <line x1={-2} y1={guides.y} x2={widthMm + 2} y2={guides.y} stroke="#f43f5e" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                )}
              </g>
            )}

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
                  const tb = arcTextBounds(arc, rx, ry);
                  minX = tb.minX - pad * 0.5;
                  minY = tb.minY - pad * 0.5;
                  boxW = tb.maxX - tb.minX + pad;
                  boxH = tb.maxY - tb.minY + pad;
                } else if (sel.type === 'text') {
                  const txt = sel as StraightTextElement;
                  const textLen = (txt.text || '').length || 1;
                  const w = textLen * (txt.fontSize || 3) * 0.58;
                  const h = (txt.fontSize || 3) * 1.2;
                  const left = txt.align === 'left' ? txt.x : txt.align === 'right' ? txt.x - w : txt.x - w / 2;
                  minX = left - pad;
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
                } else if (sel.type === 'line') {
                  const ln = sel as any;
                  const half = Math.max(0.2, (ln.strokeWidth || 0.4) / 2);
                  minX = Math.min(ln.x1, ln.x2) - half - pad;
                  minY = Math.min(ln.y1, ln.y2) - half - pad;
                  boxW = Math.abs(ln.x2 - ln.x1) + half * 2 + pad * 2;
                  boxH = Math.abs(ln.y2 - ln.y1) + half * 2 + pad * 2;
                } else if (sel.type === 'qrcode') {
                  const qr = sel as any;
                  const q = qr.size || 14;
                  minX = qr.cx - q / 2 - pad;
                  minY = qr.cy - q / 2 - pad;
                  boxW = q + pad * 2;
                  boxH = q + pad * 2;
                } else if (sel.type === 'image') {
                  const img = sel as any;
                  const w = img.width || 15;
                  const h = img.height || 15;
                  minX = img.x - pad;
                  minY = img.y - pad;
                  boxW = w + pad * 2;
                  boxH = h + pad * 2;
                }

                const hs = 1.1; // resize handle size (mm)
                const SEL = '#0d99ff';

                return (
                  <g id="interactive-selection-transform-box">
                    {/* Shape-aware highlight: rings glow along their stroke, arc text along its text band */}
                    {isCircular && sel.type === 'arc-text' && (() => {
                      // Highlight only the span this arc's text occupies (so top vs bottom text is obvious)
                      const arc = sel as ArcTextElement;
                      const glyphs = calculateArcGlyphs(arc, arc.cx, arc.cy, arc.radius, undefined, undefined, arc.isReversed, arc.letterSpacing, circleRx, circleRy, arc.angleOffset);
                      if (!glyphs.length) return null;
                      const dir = arc.isReversed ? -1 : 1;
                      const padT = ((arc.fontSize || 3) * 0.45) / Math.max(circleRx, circleRy);
                      const t0 = glyphs[0].angleRad - dir * padT;
                      const t1 = glyphs[glyphs.length - 1].angleRad + dir * padT;
                      const p = (t: number) => `${(circleCx + circleRx * Math.cos(t)).toFixed(3)} ${(circleCy + circleRy * Math.sin(t)).toFixed(3)}`;
                      const large = Math.abs(t1 - t0) > Math.PI ? 1 : 0;
                      const d = `M ${p(t0)} A ${circleRx} ${circleRy} 0 ${large} ${arc.isReversed ? 0 : 1} ${p(t1)}`;
                      return (
                        <g className="pointer-events-none select-none">
                          <path d={d} fill="none" stroke={SEL} strokeOpacity={0.16} strokeLinecap="round" strokeWidth={(arc.fontSize || 3) * 1.25} />
                          <path d={d} fill="none" stroke={SEL} strokeWidth={1.25} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
                        </g>
                      );
                    })()}
                    {isCircular && sel.type !== 'arc-text' && (
                      <g className="pointer-events-none select-none">
                        <ellipse cx={circleCx} cy={circleCy} rx={circleRx} ry={circleRy} fill="none" stroke={SEL} strokeOpacity={0.2} strokeWidth={1.6} />
                        <ellipse cx={circleCx} cy={circleCy} rx={circleRx} ry={circleRy} fill="none" stroke={SEL} strokeWidth={2} vectorEffect="non-scaling-stroke" />
                      </g>
                    )}

                    {/* Bounding Box — solid Figma blue, constant 1.25px at any zoom */}
                    <rect
                      x={minX}
                      y={minY}
                      width={boxW}
                      height={boxH}
                      fill={SEL}
                      fillOpacity={isCircular ? 0 : 0.06}
                      stroke={SEL}
                      strokeWidth={1.25}
                      vectorEffect="non-scaling-stroke"
                      className="pointer-events-none select-none"
                    />

                    {/* Corner Handles — white squares with blue border (not for curved text: its knob moves / resizes it) */}
                    {sel.type === 'line' && (() => {
                      const ln = sel as any;
                      return ([
                        { pos: 'p1', x: ln.x1, y: ln.y1 },
                        { pos: 'p2', x: ln.x2, y: ln.y2 },
                      ] as const).map(({ pos, x, y }) => (
                        <circle
                          key={pos}
                          cx={x}
                          cy={y}
                          r={hs * 0.6}
                          fill="#ffffff"
                          stroke={SEL}
                          strokeWidth={1.5}
                          vectorEffect="non-scaling-stroke"
                          className="cursor-crosshair select-none"
                          onPointerDown={(e) => handleResizeHandlePointerDown(e, pos)}
                        />
                      ));
                    })()}
                    {sel.type !== 'arc-text' && sel.type !== 'line' && ([
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
                        stroke={SEL}
                        strokeWidth={1.5}
                        vectorEffect="non-scaling-stroke"
                        rx="0.15"
                        ry="0.15"
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
                            r={0.7}
                            fill="#ffffff"
                            stroke={SEL}
                            strokeWidth={1.5}
                            vectorEffect="non-scaling-stroke"
                            className="pointer-events-none select-none"
                          />
                        </g>
                      );
                    })()}
                  </g>
                );
              })()}



              {/* Multi-Layer Selection Outline & Group Boundary (Clean, uncluttered Figma / Illustrator style) */}
              {selectedIds.length > 1 && (() => {
                let unionMinX = Infinity;
                let unionMinY = Infinity;
                let unionMaxX = -Infinity;
                let unionMaxY = -Infinity;

                selectedIds.forEach((id) => {
                  const sel = elements.find((e) => e.id === id);
                  if (!sel || sel.visible === false) return;
                  const b = getElementBounds(sel, widthMm, heightMm);
                  if (b.minX < unionMinX) unionMinX = b.minX;
                  if (b.minY < unionMinY) unionMinY = b.minY;
                  if (b.maxX > unionMaxX) unionMaxX = b.maxX;
                  if (b.maxY > unionMaxY) unionMaxY = b.maxY;
                });

                if (unionMinX === Infinity) return null;
                const pad = 1.0;
                const boxW = unionMaxX - unionMinX + pad * 2;
                const boxH = unionMaxY - unionMinY + pad * 2;
                const boxX = unionMinX - pad;
                const boxY = unionMinY - pad;

                const selectedElements = elements.filter((e) => selectedIds.includes(e.id));
                const firstGroupId = selectedElements[0]?.groupId;
                const isAllSameGroup = Boolean(firstGroupId && selectedElements.every((e) => e.groupId === firstGroupId));

                const hSize = 1.4; // 1.4mm handle size
                const halfH = hSize / 2;

                return (
                  <g id="multi-layer-group-selection">
                    {/* Clean unified selection bounding box — no congested interior outlines! */}
                    <rect
                      x={boxX}
                      y={boxY}
                      width={boxW}
                      height={boxH}
                      fill="none"
                      stroke="#0d99ff"
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                      className="pointer-events-none select-none"
                    />

                    {/* Corner & edge handles */}
                    <rect x={boxX - halfH} y={boxY - halfH} width={hSize} height={hSize} fill="#ffffff" stroke="#0d99ff" strokeWidth={0.8} vectorEffect="non-scaling-stroke" className="pointer-events-none" />
                    <rect x={boxX + boxW - halfH} y={boxY - halfH} width={hSize} height={hSize} fill="#ffffff" stroke="#0d99ff" strokeWidth={0.8} vectorEffect="non-scaling-stroke" className="pointer-events-none" />
                    <rect x={boxX - halfH} y={boxY + boxH - halfH} width={hSize} height={hSize} fill="#ffffff" stroke="#0d99ff" strokeWidth={0.8} vectorEffect="non-scaling-stroke" className="pointer-events-none" />
                    <rect x={boxX + boxW - halfH} y={boxY + boxH - halfH} width={hSize} height={hSize} fill="#ffffff" stroke="#0d99ff" strokeWidth={0.8} vectorEffect="non-scaling-stroke" className="pointer-events-none" />

                    <rect x={boxX + boxW / 2 - halfH} y={boxY - halfH} width={hSize} height={hSize} fill="#ffffff" stroke="#0d99ff" strokeWidth={0.8} vectorEffect="non-scaling-stroke" className="pointer-events-none" />
                    <rect x={boxX + boxW / 2 - halfH} y={boxY + boxH - halfH} width={hSize} height={hSize} fill="#ffffff" stroke="#0d99ff" strokeWidth={0.8} vectorEffect="non-scaling-stroke" className="pointer-events-none" />
                    <rect x={boxX - halfH} y={boxY + boxH / 2 - halfH} width={hSize} height={hSize} fill="#ffffff" stroke="#0d99ff" strokeWidth={0.8} vectorEffect="non-scaling-stroke" className="pointer-events-none" />
                    <rect x={boxX + boxW - halfH} y={boxY + boxH / 2 - halfH} width={hSize} height={hSize} fill="#ffffff" stroke="#0d99ff" strokeWidth={0.8} vectorEffect="non-scaling-stroke" className="pointer-events-none" />
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

          {/* Crisp HTML Floating Action Pill for Multi-Selection & Groups (Positioned cleanly above bounding box, outside artwork) */}
          {selectedIds.length > 1 && !isDragging && !isResizing && (() => {
            const selectedElements = elements.filter((e) => selectedIds.includes(e.id));
            if (selectedElements.length < 2) return null;
            const firstGroupId = selectedElements[0]?.groupId;
            const isAllSameGroup = Boolean(firstGroupId && selectedElements.every((e) => e.groupId === firstGroupId));

            let uMinX = Infinity, uMinY = Infinity, uMaxX = -Infinity, uMaxY = -Infinity;
            selectedElements.forEach((el) => {
              const b = getElementBounds(el, widthMm, heightMm);
              if (b.minX < uMinX) uMinX = b.minX;
              if (b.minY < uMinY) uMinY = b.minY;
              if (b.maxX > uMaxX) uMaxX = b.maxX;
              if (b.maxY > uMaxY) uMaxY = b.maxY;
            });

            if (uMinX === Infinity) return null;
            const cxPx = mmToPx((uMinX + uMaxX) / 2, viewZoom);
            const topPx = mmToPx(uMinY, viewZoom);

            return (
              <div
                className="absolute z-30 flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/90 shadow-xl rounded-full text-xs font-semibold text-slate-800 dark:text-slate-100 select-none pointer-events-auto transition-all animate-in fade-in zoom-in-95 duration-150"
                style={{
                  left: `${cxPx}px`,
                  top: `${Math.max(-44, topPx - 38)}px`,
                  transform: 'translateX(-50%)',
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {isAllSameGroup ? (
                  <>
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                      <Group className="w-3.5 h-3.5 text-[#0d99ff]" />
                      <span>Group ({selectedIds.length})</span>
                    </span>
                    <span className="w-px h-3.5 bg-slate-200 dark:bg-slate-700" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        ungroupElements();
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                      title="Ungroup elements (Ctrl+Shift+G)"
                    >
                      <Ungroup className="w-3 h-3 text-rose-500" />
                      <span>Ungroup</span>
                      <kbd className="text-[9px] px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-slate-500 dark:text-slate-400">Ctrl+Shift+G</kbd>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                      <span>{selectedIds.length} layers selected</span>
                    </span>
                    <span className="w-px h-3.5 bg-slate-200 dark:bg-slate-700" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        groupElements();
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0d99ff] hover:bg-[#0b87e0] text-white transition-colors text-[11px] font-semibold cursor-pointer shadow-xs whitespace-nowrap"
                      title="Group elements together (Ctrl+G)"
                    >
                      <Group className="w-3 h-3" />
                      <span>Group</span>
                      <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-white/20 font-mono text-white/90">Ctrl+G</kbd>
                    </button>
                  </>
                )}
              </div>
            );
          })()}

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
          {/* 0. Text tools — their own pill above the bar, so the bar below never resizes or jumps */}
          {selectedElement && (selectedElement.type === 'arc-text' || selectedElement.type === 'text') && (
            <div
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="pointer-events-auto flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-lg shadow-slate-900/5 text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap fx-panel"
            >
            {/* Quick Live Text Input & Size Stepper when Arc Text or Straight Text is selected */}
            {selectedElement && (selectedElement.type === 'arc-text' || selectedElement.type === 'text') ? (
              <div className="flex items-center gap-1.5 pl-1 pr-0.5">
                <input
                  type="text"
                  value={(selectedElement as any).text || ''}
                  onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                  placeholder="Type stamp text..."
                  className="h-8 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-[#0d99ff] focus:ring-2 focus:ring-[#0d99ff]/10 px-2.5 rounded-lg text-[12px] font-medium text-slate-900 dark:text-slate-100 outline-none w-36 sm:w-52 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                />
  
                {/* Instant Text Size Stepper */}
                <div className="h-8 flex items-center rounded-lg bg-slate-50 dark:bg-slate-800 p-0.5">
                  <button
                    onClick={() => triggerToolClick('font-decrease', () => {
                      const cur = (selectedElement as any).fontSize || 3.0;
                      updateElement(selectedElement.id, { fontSize: Math.max(1.0, Number((cur - 0.2).toFixed(1))) });
                    })}
                    className={`relative w-6 h-7 rounded-md flex items-center justify-center text-[13px] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-110 active:scale-90 cursor-pointer select-none overflow-hidden ${
                      activeClickedTool === 'font-decrease' ? 'bg-[#e5f2ff] dark:bg-blue-950/60 text-[#0d99ff] ring-2 ring-[#0d99ff]/20 animate-btn-slow-dip' : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-2xs'
                    }`}
                    title="Smaller Size (-0.2mm)"
                  >
                    {activeClickedTool === 'font-decrease' && (
                      <span className="absolute inset-0 rounded-md pointer-events-none animate-tool-click-ripple" />
                    )}
                    -
                  </button>
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200 tabular-nums min-w-[38px] text-center select-none">
                    {((selectedElement as any).fontSize || 3.0).toFixed(1)} mm
                  </span>
                  <button
                    onClick={() => triggerToolClick('font-increase', () => {
                      const cur = (selectedElement as any).fontSize || 3.0;
                      updateElement(selectedElement.id, { fontSize: Math.min(20.0, Number((cur + 0.2).toFixed(1))) });
                    })}
                    className={`relative w-6 h-7 rounded-md flex items-center justify-center text-[13px] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-110 active:scale-90 cursor-pointer select-none overflow-hidden ${
                      activeClickedTool === 'font-increase' ? 'bg-[#e5f2ff] dark:bg-blue-950/60 text-[#0d99ff] ring-2 ring-[#0d99ff]/20 animate-btn-slow-dip' : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-2xs'
                    }`}
                    title="Larger Size (+0.2mm)"
                  >
                    {activeClickedTool === 'font-increase' && (
                      <span className="absolute inset-0 rounded-md pointer-events-none animate-tool-click-ripple" />
                    )}
                    +
                  </button>
                </div>
  
                {/* Curve / Arc Text Toggle Button */}
                <button
                  onClick={() => {
                    triggerToolClick('toggle-curve');
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
                  className={`relative h-8 px-2.5 rounded-lg font-medium text-[12px] flex items-center gap-1.5 shrink-0 cursor-pointer select-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 active:scale-92 overflow-hidden ${
                    selectedElement.type === 'arc-text' || activeClickedTool === 'toggle-curve'
                      ? 'bg-[#e5f2ff] dark:bg-blue-950/60 text-[#0d99ff] shadow-xs ring-2 ring-[#0d99ff]/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  } ${activeClickedTool === 'toggle-curve' ? 'animate-btn-slow-dip' : ''}`}
                  title={selectedElement.type === 'arc-text' ? 'Click to convert back to Straight Line Text' : 'Convert Straight Text into Circular Curved Arc Text'}
                >
                  {activeClickedTool === 'toggle-curve' && (
                    <span className="absolute inset-0 rounded-lg pointer-events-none animate-tool-click-ripple" />
                  )}
                  <Orbit className={`w-4 h-4 shrink-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${activeClickedTool === 'toggle-curve' ? 'animate-icon-flex rotate-90 text-[#0d99ff]' : 'group-hover:rotate-45'}`} />
                  <span>{selectedElement.type === 'arc-text' ? 'Curved' : 'Curve'}</span>
                </button>
  
                {/* Curve side: Top (over the circle) or Bottom (under the circle, reading left→right) */}
                {selectedElement.type === 'arc-text' && (
                  <div className="h-8 flex items-center p-0.5 rounded-lg bg-slate-100 shrink-0" role="radiogroup" aria-label="Curve side">
                    {([
                      { bottom: false, label: 'Top', d: 'M2.5 10 Q8 2.5 13.5 10' },
                      { bottom: true, label: 'Bottom', d: 'M2.5 6 Q8 13.5 13.5 6' },
                    ] as const).map((opt) => {
                      const active = !!(selectedElement as any).isReversed === opt.bottom;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          title={opt.bottom ? 'Curve text along the bottom' : 'Curve text along the top'}
                          onClick={() => {
                            if (active) return;
                            pushHistory();
                            updateElement(selectedElement.id, { isReversed: opt.bottom, angleOffset: 0 } as any);
                          }}
                          className={`h-7 px-2 rounded-md flex items-center gap-1 text-[12px] font-medium transition-colors ${
                            active ? 'bg-white dark:bg-slate-700 text-[#0d99ff] shadow-[0_1px_2px_rgba(15,23,42,0.08)]' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d={opt.d} />
                          </svg>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
              </div>
          )}

          {/* 1. Canvas Quick Actions Bar */}
          <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="pointer-events-auto flex items-center gap-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-lg shadow-slate-900/5 text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] animate-in fade-in"
        >

          {(() => {
            const ICON_BTN = 'relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-110 active:scale-90 shrink-0 cursor-pointer select-none overflow-hidden';
            const IDLE = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';
            const ON = 'bg-[#e5f2ff] dark:bg-blue-950/60 text-[#0d99ff] shadow-xs ring-2 ring-[#0d99ff]/20';
            return (
              <>
                <Tooltip content="Center on canvas" side="top">
                  <button
                    onClick={() => triggerToolClick('align-center', handleAlignSelectedToCenter)}
                    className={`${ICON_BTN} ${activeClickedTool === 'align-center' ? ON + ' animate-btn-slow-dip' : IDLE}`}
                  >
                    {activeClickedTool === 'align-center' && (
                      <span className="absolute inset-0 rounded-lg pointer-events-none animate-tool-click-ripple" />
                    )}
                    <AlignCenter className={`w-4 h-4 transition-transform duration-500 ${activeClickedTool === 'align-center' ? 'animate-icon-flex text-[#0d99ff]' : 'group-hover:scale-110'}`} />
                  </button>
                </Tooltip>

                <div className="h-5 w-px bg-slate-200 mx-0.5 shrink-0" />

                <Tooltip content={laserInvert ? 'Laser invert: on' : 'Laser invert'} side="top">
                  <button
                    onClick={() => triggerToolClick('laser-invert', () => setLaserInvert(!laserInvert))}
                    className={`${ICON_BTN} ${laserInvert || activeClickedTool === 'laser-invert' ? ON : IDLE} ${activeClickedTool === 'laser-invert' ? 'animate-btn-slow-dip' : ''}`}
                  >
                    {activeClickedTool === 'laser-invert' && (
                      <span className="absolute inset-0 rounded-lg pointer-events-none animate-tool-click-ripple" />
                    )}
                    <Contrast className={`w-4 h-4 transition-transform duration-500 ${activeClickedTool === 'laser-invert' ? 'animate-icon-flex rotate-180' : ''}`} />
                  </button>
                </Tooltip>
                <Tooltip content={laserMirror ? 'Mirror: on' : 'Mirror for plate'} side="top">
                  <button
                    onClick={() => triggerToolClick('laser-mirror', () => setLaserMirror(!laserMirror))}
                    className={`${ICON_BTN} ${laserMirror || activeClickedTool === 'laser-mirror' ? ON : IDLE} ${activeClickedTool === 'laser-mirror' ? 'animate-btn-slow-dip' : ''}`}
                  >
                    {activeClickedTool === 'laser-mirror' && (
                      <span className="absolute inset-0 rounded-lg pointer-events-none animate-tool-click-ripple" />
                    )}
                    <FlipHorizontal className={`w-4 h-4 transition-transform duration-500 ${activeClickedTool === 'laser-mirror' ? 'animate-icon-flex scale-x-[-1]' : ''}`} />
                  </button>
                </Tooltip>

                {(
                  <>
                    <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 shrink-0" />
                    <Tooltip content="Duplicate" shortcut="Ctrl+D" side="top">
                      <button
                        onClick={() => selectedId && triggerToolClick('duplicate', () => duplicateElement(selectedId))}
                        disabled={!selectedId}
                        className={`${ICON_BTN} ${!selectedId ? 'opacity-40 cursor-not-allowed text-slate-300 dark:text-slate-600 pointer-events-none' : activeClickedTool === 'duplicate' ? ON + ' animate-btn-slow-dip' : IDLE}`}
                      >
                        {activeClickedTool === 'duplicate' && (
                          <span className="absolute inset-0 rounded-lg pointer-events-none animate-tool-click-ripple" />
                        )}
                        <Copy className={`w-4 h-4 transition-transform duration-500 ${activeClickedTool === 'duplicate' ? 'animate-icon-flex text-[#0d99ff]' : ''}`} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Delete" shortcut="Del" side="top">
                      <button
                        onClick={() => selectedId && triggerToolClick('delete', () => deleteElement(selectedId))}
                        disabled={!selectedId}
                        className={`${ICON_BTN} ${!selectedId ? 'opacity-40 cursor-not-allowed text-slate-300 dark:text-slate-600 pointer-events-none' : activeClickedTool === 'delete' ? 'bg-rose-100 text-rose-600 shadow-xs ring-2 ring-rose-400/30 animate-btn-slow-dip' : 'text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400'}`}
                      >
                        {activeClickedTool === 'delete' && (
                          <span className="absolute inset-0 rounded-lg pointer-events-none animate-tool-click-ripple" />
                        )}
                        <Trash2 className={`w-4 h-4 transition-transform duration-500 ${activeClickedTool === 'delete' ? 'animate-icon-flex text-rose-600' : ''}`} />
                      </button>
                    </Tooltip>
                  </>
                )}


              </>
            );
          })()}
        </div>

        {/* 2. Primary Stamp Design Bottom Dock */}
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="pointer-events-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-900/5 dark:shadow-black/40 rounded-xl p-1 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="relative flex items-center gap-0.5 whitespace-nowrap"
        >
          {(() => {
            const TOOL = 'fx-tool relative h-9 px-3 rounded-lg text-[12px] font-medium flex items-center gap-2 shrink-0 cursor-pointer select-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.04] active:scale-[0.92] hover:shadow-xs overflow-hidden';
            const IDLE = 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white';
            const CLICKED = 'bg-[#e5f2ff] dark:bg-blue-950/80 text-[#0d99ff] ring-2 ring-[#0d99ff]/25 shadow-xs animate-btn-slow-dip';
            const ArcIcon = ({ down }: { down?: boolean }) => (
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                {down ? <path d="M2.5 6.5 Q8 14 13.5 6.5" /> : <path d="M2.5 9.5 Q8 2 13.5 9.5" />}
                <path d={down ? 'M8 2.5v3.5' : 'M8 10v3.5'} />
              </svg>
            );
            const tools = [
              { key: 'top', label: 'Top arc', tip: 'Add top arc text', onClick: handleAddTopArc, icon: <ArcIcon /> },
              { key: 'bottom', label: 'Bottom arc', tip: 'Add bottom arc text', onClick: handleAddBottomArc, icon: <ArcIcon down /> },
              { key: 'text', label: 'Text', tip: 'Add straight text', shortcut: 'T', onClick: handleAddStraightText, icon: <Type className="w-4 h-4" /> },
              { key: 'sep1' },
              { key: 'ring', label: 'Ring', tip: 'Add ring', onClick: handleAddRing, icon: <Circle className="w-4 h-4" /> },
              { key: 'box', label: 'Box', tip: 'Add box frame', shortcut: 'R', onClick: handleAddRect, icon: <Square className="w-4 h-4" /> },
              { key: 'oval', label: 'Oval', tip: 'Add oval ring', onClick: handleAddOval, icon: <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6"><ellipse cx="8" cy="8" rx="6.5" ry="4.2" /></svg> },
              { key: 'logo', label: 'Logo', tip: 'Upload your logo (PNG, JPG, SVG)', onClick: () => logoInputRef.current?.click(), icon: <ImagePlus className="w-4 h-4" /> },
            ] as any[];
            return (
              <>
                <Tooltip content="Select & move" shortcut="V" side="top">
                  <button
                    onClick={() => triggerToolClick('select', () => setActiveDockTool('select'))}
                    className={`${TOOL} ${
                      activeDockTool === 'select' || activeClickedTool === 'select'
                        ? 'bg-[#e5f2ff] dark:bg-blue-950/60 text-[#0d99ff] shadow-xs ring-2 ring-[#0d99ff]/20'
                        : IDLE
                    } ${activeClickedTool === 'select' ? 'animate-btn-slow-dip' : ''}`}
                  >
                    {activeClickedTool === 'select' && (
                      <span className="absolute inset-0 rounded-lg pointer-events-none animate-tool-click-ripple" />
                    )}
                    <span className={`inline-flex items-center justify-center transition-transform duration-500 ${activeClickedTool === 'select' ? 'animate-icon-flex' : ''}`}>
                      <MousePointer className="w-4 h-4" />
                    </span>
                    <span>Select</span>
                  </button>
                </Tooltip>
                <div className="h-5 w-px bg-slate-200 mx-1 shrink-0" />
                {tools.map((t) =>
                  t.label ? (
                    <Tooltip key={t.key} content={t.tip} shortcut={t.shortcut} side="top">
                      <button
                        onClick={() => triggerToolClick(t.key, t.onClick)}
                        className={`${TOOL} ${activeClickedTool === t.key ? CLICKED : IDLE}`}
                      >
                        {activeClickedTool === t.key && (
                          <span className="absolute inset-0 rounded-lg pointer-events-none animate-tool-click-ripple" />
                        )}
                        <span className={`inline-flex items-center justify-center transition-transform duration-500 ${activeClickedTool === t.key ? 'animate-icon-flex text-[#0d99ff]' : ''}`}>
                          {t.icon}
                        </span>
                        <span className={`transition-colors duration-500 ${activeClickedTool === t.key ? 'text-[#0d99ff] font-semibold' : ''}`}>
                          {t.label}
                        </span>
                      </button>
                    </Tooltip>
                  ) : (
                    <div key={t.key} className="h-5 w-px bg-slate-200 mx-1 shrink-0" />
                  )
                )}
                <input
                  ref={qrInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  aria-label="Upload QR code image"
                  onChange={(e) => {
                    handleLogoFile(e.target.files?.[0], 'qr');
                    e.target.value = '';
                  }}
                />
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    handleLogoFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                {logoError && (
                  <div
                    role="alert"
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-rose-600 text-white text-[12px] px-3 py-1.5 shadow-lg flex items-center gap-2 animate-in fade-in zoom-in-95 duration-300"
                  >
                    {logoError}
                    <button onClick={() => setLogoError(null)} className="text-white/80 hover:text-white transition-colors">✕</button>
                  </div>
                )}
                <div className="h-5 w-px bg-slate-200 mx-1 shrink-0" />
                <Tooltip content={isMoreToolsOpen ? 'Hide more tools' : 'More tools'} side="top">
                  <button
                    type="button"
                    onClick={() => triggerToolClick('more', () => setIsMoreToolsOpen((v) => !v))}
                    aria-expanded={isMoreToolsOpen}
                    aria-controls="more-tools-bar"
                    className={`relative h-9 w-9 rounded-lg flex items-center justify-center shrink-0 cursor-pointer select-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.08] active:scale-[0.88] overflow-hidden ${
                      isMoreToolsOpen || activeClickedTool === 'more'
                        ? 'bg-[#e5f2ff] dark:bg-blue-950/60 text-[#0d99ff] shadow-xs ring-2 ring-[#0d99ff]/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    } ${activeClickedTool === 'more' ? 'animate-btn-slow-dip' : ''}`}
                  >
                    {activeClickedTool === 'more' && (
                      <span className="absolute inset-0 rounded-lg pointer-events-none animate-tool-click-ripple" />
                    )}
                    <ChevronDown className={`w-4 h-4 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMoreToolsOpen ? 'rotate-180' : ''}`} />
                  </button>
                </Tooltip>
              </>
            );
          })()}
        </div>

        {/* 3. More tools bar — smoothly expands/collapses below the dock */}
        <div
          id="more-tools-bar"
          className={`grid transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isMoreToolsOpen
              ? 'grid-rows-[1fr] opacity-100 mt-1.5 pt-1.5 border-t border-slate-100'
              : 'grid-rows-[0fr] opacity-0 mt-0 pt-0 border-t-0 pointer-events-none'
          }`}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-5 gap-1">
              {([
                { key: 'rectangle', label: 'Rectangle', tip: 'Add rectangle frame', onClick: handleAddRectangle, icon: <RectangleHorizontal className="w-4 h-4" /> },
                { key: 'clipart', label: 'Clipart', tip: 'Open clipart library', onClick: onOpenClipartModal, icon: <Star className="w-4 h-4" /> },
                { key: 'line', label: 'Line', tip: 'Add divider line', onClick: handleAddLine, icon: <Minus className="w-4 h-4" /> },
                { key: 'qr', label: 'QR code', tip: 'Upload your QR code image (PNG, JPG, SVG)', onClick: () => qrInputRef.current?.click(), icon: <QrCode className="w-4 h-4" /> },
                { key: 'date', label: 'Date', tip: "Add today's date", onClick: handleAddDate, icon: <CalendarDays className="w-4 h-4" /> },
              ]).map((t, idx) => (
                <Tooltip key={t.key} content={t.tip} side="top" className="w-full">
                  <button
                    onClick={() => triggerToolClick(t.key, t.onClick)}
                    style={{
                      transitionDelay: isMoreToolsOpen ? `${idx * 60}ms` : '0ms',
                    }}
                    className={`fx-tool relative w-full h-9 px-3 rounded-lg text-[12px] font-medium flex items-center justify-center gap-2 cursor-pointer select-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.03] active:scale-[0.92] overflow-hidden ${
                      activeClickedTool === t.key
                        ? 'bg-[#e5f2ff] dark:bg-blue-950/60 text-[#0d99ff] shadow-xs ring-2 ring-[#0d99ff]/20 animate-btn-slow-dip'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    } transform ${
                      isMoreToolsOpen ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                    }`}
                  >
                    {activeClickedTool === t.key && (
                      <span className="absolute inset-0 rounded-lg pointer-events-none animate-tool-click-ripple" />
                    )}
                    <span className={`inline-flex items-center justify-center transition-transform duration-500 ${activeClickedTool === t.key ? 'animate-icon-flex' : ''}`}>
                      {t.icon}
                    </span>
                    <span className={`transition-colors duration-500 ${activeClickedTool === t.key ? 'text-[#0d99ff] font-semibold' : ''}`}>
                      {t.label}
                    </span>
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Desktop Right-Click Context Menu */}
      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="fixed z-50 min-w-[190px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-slate-900/15 dark:shadow-black/60 p-1.5 text-xs select-none fx-pop-in animate-in fade-in zoom-in-95 duration-100"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            onClick={() => { copySelected(); setContextMenu(null); }}
            disabled={!canCopy}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium">Copy</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Ctrl+C</span>
          </button>

          <button
            type="button"
            onClick={() => { pasteElement({ x: mousePosMm.x, y: mousePosMm.y }); setContextMenu(null); }}
            disabled={!canPaste}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ClipboardPaste className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium">Paste</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Ctrl+V</span>
          </button>

          <button
            type="button"
            onClick={() => { cutSelected(); setContextMenu(null); }}
            disabled={!canCopy}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium">Cut</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Ctrl+X</span>
          </button>

          <button
            type="button"
            onClick={() => { if (selectedId) duplicateElement(selectedId); setContextMenu(null); }}
            disabled={!canCopy}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium">Duplicate</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Ctrl+D</span>
          </button>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

          {selectedId && (
            <>
              <button
                type="button"
                onClick={() => { bringForward(selectedId); setContextMenu(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span className="font-medium">Bring Forward</span>
              </button>
              <button
                type="button"
                onClick={() => { sendBackward(selectedId); setContextMenu(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span className="font-medium">Send Backward</span>
              </button>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

              <button
                type="button"
                onClick={() => { deleteElement(selectedId); setContextMenu(null); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span className="font-medium">Delete</span>
                </div>
                <span className="text-[10px] text-rose-400 font-mono">Del</span>
              </button>
            </>
          )}
        </div>
      )}
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

const RenderCanvasElementImpl: React.FC<RenderElementProps> = ({
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
      // Respect text alignment the same way the export SVG does (svg-generator.ts)
      const anchor = txt.align === 'left' ? 'start' : txt.align === 'right' ? 'end' : 'middle';
      const boxLeft = anchor === 'start' ? txt.x : anchor === 'end' ? txt.x - w : txt.x - w / 2;

      return (
        <g
          id={txt.id}
          className="cursor-grab active:cursor-grabbing group"
          onPointerDown={onPointerDown}
          onDoubleClick={onDoubleClick}
        >
          {/* 100% invisible hit box (zero black stroke/background) for effortless dragging */}
          <rect
            x={boxLeft - 2}
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
            letterSpacing={txt.letterSpacing || 0}
            fill={inkColor}
            stroke="none"
            textAnchor={anchor}
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
      const dash = getStrokeDash(r.strokeType, r.strokeWidth);

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
            strokeDasharray={dash.dasharray}
            strokeLinecap={dash.linecap}
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
          strokeDasharray={dash.dasharray}
          strokeLinecap={dash.linecap}
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
          strokeDasharray={getStrokeDash((rc as any).strokeType, rc.strokeWidth).dasharray}
          strokeLinecap={getStrokeDash((rc as any).strokeType, rc.strokeWidth).linecap}
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
          strokeDasharray={getStrokeDash((ov as any).strokeType, ov.strokeWidth).dasharray}
          strokeLinecap={getStrokeDash((ov as any).strokeType, ov.strokeWidth).linecap}
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
          strokeDasharray={getStrokeDash((ln as any).strokeType, ln.strokeWidth).dasharray}
          strokeLinecap={getStrokeDash((ln as any).strokeType, ln.strokeWidth).linecap}
          className="cursor-move"
          onPointerDown={onPointerDown}
        />
      );
    }

    case 'clipart': {
      const cl = element as ClipartElement;
      const w = cl.width || 8;
      const h = cl.height || 8;
      const named = cl.svgPath ? null : getNamedClipart(cl.name);
      const vb = (cl as any).viewBox || (named ? named.viewBox : '0 0 100 100');

      return (
        <g id={cl.id} className="cursor-move" onPointerDown={onPointerDown}>
          <rect x={cl.cx - w / 2} y={cl.cy - h / 2} width={w} height={h} fill="#000" opacity={0} style={{ pointerEvents: 'all' }} />
          <svg
            x={cl.cx - w / 2}
            y={cl.cy - h / 2}
            width={w}
            height={h}
            viewBox={vb}
            color={inkColor}
            overflow="visible"
            dangerouslySetInnerHTML={{ __html: cl.svgPath || named!.inner }}
          />
        </g>
      );
    }

    case 'image': {
      const img = element as ImageElement;
      const mid = `canvas-logo-mask-${img.id}`;
      return (
        <g id={img.id} className="cursor-move" onPointerDown={onPointerDown}>
          {img.maskSrc ? (
            <>
              <defs>
                <mask id={mid} maskUnits="userSpaceOnUse" x={img.x} y={img.y} width={img.width} height={img.height}>
                  <image href={img.maskSrc} x={img.x} y={img.y} width={img.width} height={img.height} preserveAspectRatio="none" />
                </mask>
              </defs>
              <rect x={img.x} y={img.y} width={img.width} height={img.height} fill={inkColor} mask={`url(#${mid})`} />
            </>
          ) : (
            <image href={img.src} x={img.x} y={img.y} width={img.width} height={img.height} preserveAspectRatio="none" />
          )}
          {/* full-area hit target so transparent parts of the logo are still draggable */}
          <rect x={img.x} y={img.y} width={img.width} height={img.height} fill="#000" opacity={0} style={{ pointerEvents: 'all' }} />
        </g>
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
          {/* hit target over the whole code */}
          <rect x={0} y={0} width={qr.size || 14} height={qr.size || 14} fill="#000" opacity={0} style={{ pointerEvents: 'all' }} />
          {(() => {
            const code = getQrPath(qr.content);
            if (!code) return <rect x={0} y={0} width={qr.size || 14} height={qr.size || 14} fill="none" stroke={inkColor} strokeWidth="0.3" />;
            return (
              <g transform={`scale(${(qr.size || 14) / code.size})`}>
                <path d={code.d} fill={inkColor} stroke="none" shapeRendering="crispEdges" />
              </g>
            );
          })()}
        </g>
      );
    }

    default:
      return null;
  }
};

/**
 * Memoized layer renderer: while one layer is dragged, every other layer keeps the same element
 * object and is skipped. Handler props are ignored on purpose — the canvas passes thin wrappers
 * that always call the latest handler through a ref, so they can never go stale.
 */
const RenderCanvasElement = React.memo(
  RenderCanvasElementImpl,
  (a, b) =>
    a.element === b.element &&
    a.isSelected === b.isSelected &&
    a.isEditing === b.isEditing &&
    a.inkColor === b.inkColor &&
    a.shape === b.shape &&
    a.widthMm === b.widthMm &&
    a.heightMm === b.heightMm
);
