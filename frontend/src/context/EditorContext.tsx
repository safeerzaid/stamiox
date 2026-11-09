'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  StampElement,
  StampElementInput,
  StampShapeType,
  StampMountPreset,
  StampTemplate,
  ArcTextElement,
  StraightTextElement,
  RingElement,
  RectElement,
  OvalElement,
  SerratedRingElement,
} from '../types/stamp';
import { A4StampInstance, A4SheetConfig, COMMON_A4_PRESET_SIZES } from '../types/a4-sheet';
import { autoNestStampsOnA4, cloneStampToSize } from '../lib/a4-export-engine';
import { STAMP_MOUNT_PRESETS } from '../lib/units';
import { morphBetweenShapeFamilies, hasEdgeBorder, makeEdgeBorder } from '../lib/shape-morph';
import { ApiService } from '../lib/api';
import { storeGet, storeSet } from '../lib/local-store';
import { ensureFontsFor } from '../lib/font-loader';
import { STAMP_TEMPLATES } from '../../../backend/src/data/templates';

interface EditorContextType {
  // Canvas State
  widthMm: number;
  heightMm: number;
  shape: StampShapeType;
  inkColor: string;
  mountPreset: StampMountPreset | null;
  projectId: string | null;
  projectTitle: string;
  isSaving: boolean;
  hasUnsavedChanges: boolean;

  // Elements & Selection
  elements: StampElement[];
  selectedId: string | null;
  selectedIds: string[];
  selectedElement: StampElement | null;

  // View & Render Controls
  zoom: number;
  pan: { x: number; y: number };
  laserInvert: boolean;
  laserMirror: boolean;
  distressEffect: boolean;
  showRulers: boolean;
  showGrid: boolean;
  snapToCenter: boolean;
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;

  // History
  canUndo: boolean;
  canRedo: boolean;

  // Setters & Actions
  setElements: React.Dispatch<React.SetStateAction<StampElement[]>>;
  setWidthMm: (w: number) => void;
  setHeightMm: (h: number) => void;
  setShape: (shape: StampShapeType) => void;
  setInkColor: (color: string) => void;
  setMountPreset: (preset: StampMountPreset) => void;
  /** Switch the canvas to a shape (ROUND / SQUARE / RECTANGULAR / OVAL) using the closest-size preset. */
  switchCanvasShape: (shape: StampShapeType, opts?: { ensureBorder?: boolean }) => void;
  setProjectTitle: (title: string) => void;
  setSelectedId: (id: string | null) => void;
  setSelectedIds: (ids: string[]) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setLaserInvert: (inv: boolean) => void;
  setLaserMirror: (mir: boolean) => void;
  setDistressEffect: (dist: boolean) => void;
  /** When on, adding a Box/Ring border switches the canvas to that shape. */
  autoCanvasShape: boolean;
  setAutoCanvasShape: (on: boolean) => void;
  setShowRulers: (show: boolean) => void;
  setShowGrid: (show: boolean) => void;
  /** Increments every time a whole design is loaded (template / project / blank / AI) — drives the entrance animation. */
  designLoadKey: number;
  setSnapToCenter: (snap: boolean) => void;
  setIsLeftSidebarOpen: (open: boolean) => void;
  setIsRightSidebarOpen: (open: boolean) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;

  // Element CRUD & Manipulation
  addElement: (element: StampElementInput) => string;
  updateElement: (id: string, updates: Partial<StampElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  canCopy: boolean;
  canPaste: boolean;
  copySelected: () => void;
  cutSelected: () => void;
  pasteElement: (targetPos?: { x: number; y: number }) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  reorderElements: (newOrder: StampElement[]) => void;
  nudgeElement: (id: string, dxMm: number, dyMm: number) => void;

  // Precision Alignment & Distribution
  alignSelected: (alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom' | 'center-page') => void;
  distributeSelected: (axis: 'horizontal' | 'vertical') => void;

  // History Actions
  pushHistory: (customSnapshot?: StampElement[]) => void;
  undo: () => void;
  redo: () => void;

  // Grouping & Selection
  selectAll: () => void;
  groupElements: (ids?: string[]) => string | null;
  ungroupElements: (ids?: string[]) => void;

  // Project & Template Loading
  loadProject: (project: any) => void;
  loadTemplate: (template: StampTemplate) => void;
  loadAiGeneratedStamp: (aiData: {
    title?: string;
    shape: StampShapeType;
    widthMm: number;
    heightMm: number;
    inkColor: string;
    elements: StampElement[];
  }) => void;
  applyAiRefinement: (updates: {
    elements?: StampElement[];
    inkColor?: string;
    shape?: StampShapeType;
    widthMm?: number;
    heightMm?: number;
  }) => void;
  saveProjectToCloud: () => Promise<string | null>;
  resetToBlank: (shape?: StampShapeType, width?: number, height?: number) => void;

  // A4 Multi-Stamp Gang-Sheet Imposition
  viewMode: 'SINGLE' | 'A4_SHEET';
  setViewMode: (mode: 'SINGLE' | 'A4_SHEET') => void;
  /** True once the saved view (Single / A4) has been read — the editor waits for it so it never flashes the wrong view. */
  viewRestored: boolean;
  a4Instances: A4StampInstance[];
  setA4Instances: React.Dispatch<React.SetStateAction<A4StampInstance[]>>;
  selectedA4InstanceId: string | null;
  setSelectedA4InstanceId: (id: string | null) => void;
  editingA4InstanceId: string | null;
  editA4InstanceInSingleEditor: (instanceId: string) => void;
  stopEditingA4Instance: () => void;
  a4Config: A4SheetConfig;
  setA4Config: React.Dispatch<React.SetStateAction<A4SheetConfig>>;
  addCurrentToA4: () => void;
  addMultipleToA4: (count: number) => void;
  generateA4SizeVariants: () => void;
  autoNestA4: () => void;
  updateA4Instance: (id: string, updates: Partial<A4StampInstance>) => void;
  duplicateA4Instance: (id: string) => void;
  deleteA4Instance: (id: string) => void;
  clearA4Instances: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Canvas Settings
  const [widthMm, setWidthMm] = useState<number>(40);
  const [heightMm, setHeightMm] = useState<number>(40);
  const [shape, setShape] = useState<StampShapeType>('ROUND');
  const [inkColor, setInkColor] = useState<string>('#111827');
  const [mountPreset, setMountPresetState] = useState<StampMountPreset | null>(STAMP_MOUNT_PRESETS[0]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>('Untitled Stamp Design');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Elements & Selection (Default to empty canvas to prevent rogue elements)
  const [elements, setElements] = useState<StampElement[]>([]);
  const [selectedId, setSelectedIdState] = useState<string | null>('top-arc-text');
  const [selectedIds, setSelectedIdsState] = useState<string[]>(['top-arc-text']);

  const setSelectedId = useCallback((id: string | null) => {
    setSelectedIdState(id);
    setSelectedIdsState(id ? [id] : []);
  }, []);

  const setSelectedIds = useCallback((ids: string[]) => {
    setSelectedIdsState(ids);
    setSelectedIdState(ids.length > 0 ? ids[0] : null);
  }, []);

  // View Settings (Comfortable large 2.2x size)
  const [zoom, setZoom] = useState<number>(2.2);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [laserInvert, setLaserInvert] = useState<boolean>(false);
  const [laserMirror, setLaserMirror] = useState<boolean>(false);
  const [distressEffect, setDistressEffect] = useState<boolean>(false);

  // "Auto canvas shape": the background follows the border (Box → square, Ring → round).
  // On by default; the user's choice is remembered in this browser.
  const AUTO_SHAPE_KEY = 'stamiox_auto_canvas_shape';
  const [autoCanvasShape, setAutoCanvasShapeState] = useState<boolean>(true);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTO_SHAPE_KEY);
      if (saved === 'false') setAutoCanvasShapeState(false);
    } catch {
      /* storage unavailable — keep default (on) */
    }
  }, []);
  const setAutoCanvasShape = (on: boolean) => {
    setAutoCanvasShapeState(on);
    try {
      localStorage.setItem(AUTO_SHAPE_KEY, String(on));
    } catch {
      /* ignore */
    }
  };
  const [showRulers, setShowRulers] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [designLoadKey, setDesignLoadKey] = useState<number>(0);
  const designLoadKeyRef = useRef(0); // read by the restore step (a newly opened design wins)
  const bumpDesignLoad = () => {
    designLoadKeyRef.current += 1;
    setDesignLoadKey((k) => k + 1);
  };
  const [snapToCenter, setSnapToCenter] = useState<boolean>(true);

  // Sidebar Visibility State (Figma / Canva style collapsible rails)
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(true);

  const toggleLeftSidebar = useCallback(() => setIsLeftSidebarOpen((prev) => !prev), []);
  const toggleRightSidebar = useCallback(() => setIsRightSidebarOpen((prev) => !prev), []);

  // A4 Gang-Sheet Imposition State
  const [viewMode, setViewMode] = useState<'SINGLE' | 'A4_SHEET'>('SINGLE');
  const [a4Instances, setA4Instances] = useState<A4StampInstance[]>([]);
  const [selectedA4InstanceId, setSelectedA4InstanceId] = useState<string | null>(null);
  const [a4Config, setA4Config] = useState<A4SheetConfig>({
    orientation: 'portrait',
    marginMm: 10,
    spacingMm: 4,
    showCropMarks: true,
    showCutLines: true,
    showDimensions: true,
    laserInvert: false,
    laserMirror: false,
  });

  // Undo / Redo History Stacks (Synchronized with Refs for 100% reliable multi-step Ctrl+Z)
  const [history, setHistory] = useState<StampElement[][]>([]);
  const [redoStack, setRedoStack] = useState<StampElement[][]>([]);

  const elementsRef = useRef<StampElement[]>(elements);
  elementsRef.current = elements;
  const selectedIdRef = useRef<string | null>(selectedId);
  selectedIdRef.current = selectedId;
  const selectedIdsRef = useRef<string[]>(selectedIds);
  selectedIdsRef.current = selectedIds;

  const historyRef = useRef<StampElement[][]>([]);
  const redoStackRef = useRef<StampElement[][]>([]);

  const pushHistory = useCallback((customSnapshot?: StampElement[]) => {
    const snapshotToSave = customSnapshot
      ? JSON.parse(JSON.stringify(customSnapshot))
      : JSON.parse(JSON.stringify(elementsRef.current));

    const prevHistory = historyRef.current;
    if (prevHistory.length > 0) {
      const lastStateStr = JSON.stringify(prevHistory[prevHistory.length - 1]);
      const newStateStr = JSON.stringify(snapshotToSave);
      if (lastStateStr === newStateStr) {
        return; // Avoid duplicate consecutive states
      }
    }

    const nextHistory = [...prevHistory.slice(-50), snapshotToSave];
    historyRef.current = nextHistory;
    setHistory(nextHistory);

    redoStackRef.current = [];
    setRedoStack([]);
    setHasUnsavedChanges(true);
  }, []);

  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  // A4 Helpers
  const addCurrentToA4 = useCallback(() => {
    const newInst: A4StampInstance = {
      instanceId: `inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${projectTitle || 'Stamp'} (${Math.round(widthMm)}mm)`,
      xMm: 15,
      yMm: 25,
      widthMm,
      heightMm,
      shape,
      elements: JSON.parse(JSON.stringify(elements)),
      inkColor,
      mountName: mountPreset?.name,
    };

    setA4Instances((prev) => {
      const updated = [...prev, newInst];
      return autoNestStampsOnA4(updated, a4Config);
    });
    setSelectedA4InstanceId(newInst.instanceId);
  }, [projectTitle, widthMm, heightMm, shape, elements, inkColor, mountPreset, a4Config]);

  const addMultipleToA4 = useCallback((count: number) => {
    const newInstances: A4StampInstance[] = Array.from({ length: count }).map((_, i) => ({
      instanceId: `inst-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${projectTitle || 'Stamp'} (${Math.round(widthMm)}mm)`,
      xMm: 15,
      yMm: 25,
      widthMm,
      heightMm,
      shape,
      elements: JSON.parse(JSON.stringify(elements)),
      inkColor,
      mountName: mountPreset?.name,
    }));

    setA4Instances((prev) => {
      const updated = [...prev, ...newInstances];
      return autoNestStampsOnA4(updated, a4Config);
    });
  }, [projectTitle, widthMm, heightMm, shape, elements, inkColor, mountPreset, a4Config]);

  const generateA4SizeVariants = useCallback(() => {
    // 5 sizes of THIS stamp: real mounts of the same shape & proportions first, then evenly
    // scaled sizes. Borders are redrawn at the new size and the rest is scaled evenly to fit
    // inside them — never stretched, never turned into another shape.
    const aspect = widthMm / heightMm;
    const r05 = (v: number) => Math.round(v * 2) / 2;
    const fmt = (w: number, h: number) => (shape === 'ROUND' ? `Ø${w}mm` : `${w}×${h}mm`);
    const candidates: { w: number; h: number; mount: string }[] = STAMP_MOUNT_PRESETS
      .filter((p) => p.shape === shape && Math.abs(p.widthMm / p.heightMm - aspect) / aspect < 0.12)
      .map((p) => ({ w: p.widthMm, h: p.heightMm, mount: p.name }));
    for (const k of [1.25, 1.1, 0.9, 0.8, 0.65]) {
      candidates.push({ w: r05(widthMm * k), h: r05(heightMm * k), mount: 'Custom size' });
    }
    const seen = new Set<string>([`${widthMm}x${heightMm}`]);
    const picked = candidates
      .filter((c) => {
        const key = `${c.w}x${c.h}`;
        if (seen.has(key) || c.w < 8 || c.h < 8) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => Math.abs(a.w * a.h - widthMm * heightMm) - Math.abs(b.w * b.h - widthMm * heightMm))
      .slice(0, 5)
      .sort((a, b) => b.w * b.h - a.w * a.h);

    const variants: A4StampInstance[] = picked.map(({ w, h, mount }) => {
      const inst = cloneStampToSize(elements, widthMm, heightMm, w, h, shape, `${projectTitle} (${fmt(w, h)})`, inkColor, mount);
      const tag = Math.random().toString(36).slice(2, 6);
      inst.elements = morphBetweenShapeFamilies(elements, widthMm, heightMm, w, h, shape).map((el: any) => ({
        ...el,
        id: `${el.id}-${tag}`, // unique per copy (logo masks are keyed by id)
      }));
      return inst;
    });

    setA4Instances((prev) => {
      const updated = [...prev, ...variants];
      return autoNestStampsOnA4(updated, a4Config);
    });
  }, [elements, widthMm, heightMm, shape, projectTitle, inkColor, a4Config]);

  const autoNestA4 = useCallback(() => {
    setA4Instances((prev) => autoNestStampsOnA4(prev, a4Config));
  }, [a4Config]);

  const updateA4Instance = useCallback((id: string, updates: Partial<A4StampInstance>) => {
    setA4Instances((prev) =>
      prev.map((inst) => (inst.instanceId === id ? { ...inst, ...updates } : inst))
    );
  }, []);

  const duplicateA4Instance = useCallback((id: string) => {
    setA4Instances((prev) => {
      const target = prev.find((x) => x.instanceId === id);
      if (!target) return prev;
      const copy: A4StampInstance = {
        ...target,
        instanceId: `inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `${target.name} (Copy)`,
        xMm: target.xMm + 4,
        yMm: target.yMm + 4,
        elements: JSON.parse(JSON.stringify(target.elements)),
      };
      return [...prev, copy];
    });
  }, []);

  const deleteA4Instance = useCallback((id: string) => {
    setA4Instances((prev) => prev.filter((x) => x.instanceId !== id));
    setSelectedA4InstanceId((prev) => (prev === id ? null : prev));
  }, []);

  const clearA4Instances = useCallback(() => {
    setA4Instances([]);
    setSelectedA4InstanceId(null);
    setEditingA4InstanceId(null);
  }, []);

  // Seamless 1-Click: Edit Specific A4 Stamp Instance in Full Single Stamp Studio
  const [editingA4InstanceId, setEditingA4InstanceId] = useState<string | null>(null);

  // ── Work-in-progress survives a refresh (this browser only) ──
  // The current design and the A4 sheet are kept in IndexedDB (room for logo images);
  // the view (Single / A4) on its own tiny localStorage key. Everything is restored once
  // on load, and saving only starts after that, so empty defaults never overwrite saved work.
  const VIEW_MODE_KEY = 'stamiox_view_mode';
  const [a4Restored, setA4Restored] = useState(false); // "work restored" — the editor waits for it
  useEffect(() => {
    let cancelled = false;
    const designBefore = designLoadKeyRef.current;
    (async () => {
      try {
        if (localStorage.getItem(VIEW_MODE_KEY) === 'A4_SHEET') setViewMode('A4_SHEET');
      } catch {
        /* storage unavailable */
      }
      const [design, rawSheet] = await Promise.all([
        storeGet<any>('current-design'),
        storeGet<any>('a4-sheet'),
      ]);
      if (cancelled) return;

      let sheet = rawSheet;
      // Purge legacy auto-populated A4 stamps from previous sessions so A4 sheet starts clean
      try {
        const purgedKey = 'stamiox_a4_auto_clean_v3';
        if (!localStorage.getItem(purgedKey)) {
          localStorage.setItem(purgedKey, 'true');
          localStorage.removeItem('stamiox_a4_sheet');
          await storeSet('a4-sheet', { instances: [], config: a4Config });
          sheet = { instances: [], config: a4Config };
        }
      } catch {
        /* ignore */
      }

      // A4 sheet (fall back to the older localStorage copy once)
      let a4 = sheet;
      if (!a4) {
        try {
          const raw = localStorage.getItem('stamiox_a4_sheet');
          if (raw) a4 = JSON.parse(raw);
        } catch {
          /* ignore */
        }
      }
      if (a4) {
        if (Array.isArray(a4.instances)) setA4Instances(a4.instances);
        if (a4.config && typeof a4.config === 'object') setA4Config((prev) => ({ ...prev, ...a4.config }));
      }

      // Current design — unless a template / project was opened while we were loading
      if (design && Array.isArray(design.elements) && designLoadKeyRef.current === designBefore) {
        setElements(design.elements);
        if (design.widthMm) setWidthMm(design.widthMm);
        if (design.heightMm) setHeightMm(design.heightMm);
        if (design.shape) setShape(design.shape);
        if (design.inkColor) setInkColor(design.inkColor);
        setMountPresetState(STAMP_MOUNT_PRESETS.find((p) => p.id === design.mountPresetId) || null);
        if (typeof design.projectTitle === 'string') setProjectTitle(design.projectTitle);
        setProjectId(design.projectId ?? null);
        setLaserMirror(!!design.laserMirror);
        setDistressEffect(!!design.distressEffect);
        setEditingA4InstanceId(null);
        setHasUnsavedChanges(!!design.hasUnsavedChanges);
        setSelectedIdState(null);
        setSelectedIdsState([]);
      }
      setA4Restored(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!a4Restored) return;
    try {
      localStorage.setItem(VIEW_MODE_KEY, viewMode);
    } catch {
      /* private mode — ignore */
    }
  }, [a4Restored, viewMode]);

  // save shortly after the last change (a drag doesn't write on every frame)
  useEffect(() => {
    if (!a4Restored) return;
    const t = window.setTimeout(() => {
      storeSet('current-design', {
        elements,
        widthMm,
        heightMm,
        shape,
        inkColor,
        mountPresetId: mountPreset?.id ?? null,
        projectTitle,
        projectId,
        laserMirror,
        distressEffect,
        editingA4InstanceId: null,
        hasUnsavedChanges,
        savedAt: Date.now(),
      });
    }, 300);
    return () => window.clearTimeout(t);
  }, [a4Restored, elements, widthMm, heightMm, shape, inkColor, mountPreset, projectTitle, projectId, laserMirror, distressEffect, hasUnsavedChanges]);

  useEffect(() => {
    if (!a4Restored) return;
    const t = window.setTimeout(() => {
      storeSet('a4-sheet', { instances: a4Instances, config: a4Config });
    }, 300);
    return () => window.clearTimeout(t);
  }, [a4Restored, a4Instances, a4Config]);

  // fonts used by the design / A4 sheet are fetched on demand (extra fonts are not preloaded)
  useEffect(() => {
    ensureFontsFor(elements as any);
  }, [elements]);
  useEffect(() => {
    for (const inst of a4Instances) ensureFontsFor(inst.elements as any);
  }, [a4Instances]);

  // a pending save must not be lost when the tab is closed / refreshed right after a change
  const latestWorkRef = useRef<() => void>(() => {});
  latestWorkRef.current = () => {
    if (!a4Restored) return;
    storeSet('current-design', {
      elements, widthMm, heightMm, shape, inkColor, mountPresetId: mountPreset?.id ?? null, projectTitle, projectId,
      laserMirror, distressEffect, editingA4InstanceId: null, hasUnsavedChanges, savedAt: Date.now(),
    });
    storeSet('a4-sheet', { instances: a4Instances, config: a4Config });
  };
  useEffect(() => {
    const flush = () => latestWorkRef.current();
    window.addEventListener('pagehide', flush);
    const onHidden = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, []);

  const editA4InstanceInSingleEditor = useCallback(
    (instanceId: string) => {
      const target = a4Instances.find((x) => x.instanceId === instanceId);
      if (!target) return;

      setEditingA4InstanceId(instanceId);
      setElements(JSON.parse(JSON.stringify(target.elements)));
      setWidthMm(target.widthMm);
      setHeightMm(target.heightMm);
      setShape(target.shape || 'ROUND');
      if (target.inkColor) setInkColor(target.inkColor);
      setSelectedId(null);
      setSelectedIds([]);
      setViewMode('SINGLE');
    },
    [a4Instances, setSelectedId, setSelectedIds]
  );

  const stopEditingA4Instance = useCallback(() => {
    setEditingA4InstanceId(null);
    setViewMode('A4_SHEET');
  }, []);

  // Proportional Auto-Adaptation Engine when Casing Size / Shape Changes
  const setMountPreset = (preset: StampMountPreset): StampElement[] => {
    let result: StampElement[] = elements;
    // shape families: round, oval, box (square / rectangular)
    const family = (s: string) => (s === 'SQUARE' || s === 'RECTANGULAR' ? 'box' : s === 'OVAL' ? 'oval' : 'round');
    const familyChange = family(shape) !== family(preset.shape);

    if (familyChange && elements.length > 0 && widthMm > 0 && heightMm > 0) {
      // Round ↔ Square/Rect: edge borders become the new shape, the rest is scaled to fit inside.
      const adapted = morphBetweenShapeFamilies(elements, widthMm, heightMm, preset.widthMm, preset.heightMm, preset.shape);
      result = adapted;
      pushHistory(elements);
      setElements(adapted);
    } else if (elements.length > 0 && widthMm > 0 && heightMm > 0) {
      const scaleX = preset.widthMm / widthMm;
      const scaleY = preset.heightMm / heightMm;
      const scaleMin = Math.min(preset.widthMm, preset.heightMm) / Math.min(widthMm, heightMm);

      const oldCenterX = widthMm / 2;
      const oldCenterY = heightMm / 2;
      const newCenterX = preset.widthMm / 2;
      const newCenterY = preset.heightMm / 2;

      const adaptedElements = elements.map((el) => {
        switch (el.type) {
          case 'arc-text': {
            const arc = el as ArcTextElement;
            const newFontSize = Math.max(1, Number((arc.fontSize * scaleMin).toFixed(2)));
            const newSpacing = (arc.letterSpacing || 0) * scaleMin;
            const newCx = newCenterX + (arc.cx - oldCenterX) * scaleMin;
            const newCy = newCenterY + (arc.cy - oldCenterY) * scaleMin;

            if (preset.shape === 'OVAL') {
              const baseR = (arc as any).radius || 15;
              const newRx = Math.max(2, Number((((arc as any).rx || baseR) * scaleX).toFixed(2)));
              const newRy = Math.max(2, Number((((arc as any).ry || baseR) * scaleY).toFixed(2)));
              return {
                ...arc,
                cx: Number(newCx.toFixed(2)),
                cy: Number(newCy.toFixed(2)),
                rx: Number(newRx),
                ry: Number(newRy),
                radius: Math.min(Number(newRx), Number(newRy)),
                fontSize: newFontSize,
                letterSpacing: Number(newSpacing.toFixed(2)),
              };
            }

            // In Square or Rectangular, keep arc radius constrained inside mount bounds
            const maxSafeR = (Math.min(preset.widthMm, preset.heightMm) / 2) - 2;
            const newRadius = Math.min(maxSafeR, Math.max(2, Number((arc.radius * scaleMin).toFixed(2))));
            const { rx, ry, ...cleanArc } = arc as any;
            return {
              ...cleanArc,
              cx: Number(newCx.toFixed(2)),
              cy: Number(newCy.toFixed(2)),
              radius: newRadius,
              fontSize: newFontSize,
              letterSpacing: Number(newSpacing.toFixed(2)),
            };
          }

          case 'text': {
            const txt = el as StraightTextElement;
            const newX = newCenterX + (txt.x - oldCenterX) * scaleX;
            const newY = newCenterY + (txt.y - oldCenterY) * scaleY;
            const newFontSize = Math.max(1, Number((txt.fontSize * scaleMin).toFixed(2)));

            return {
              ...txt,
              x: Number(newX.toFixed(2)),
              y: Number(newY.toFixed(2)),
              fontSize: newFontSize,
            };
          }

          case 'ring': {
            const r = el as RingElement;
            const newStroke = Math.max(0.2, Number((r.strokeWidth * Math.sqrt(scaleMin)).toFixed(2)));
            const newCx = newCenterX + (r.cx - oldCenterX) * scaleX;
            const newCy = newCenterY + (r.cy - oldCenterY) * scaleY;

            // When switching to OVAL casing, morph circular rings into true ovals!
            if (preset.shape === 'OVAL') {
              const newRx = Math.max(1, Number((r.radius * scaleX).toFixed(2)));
              const newRy = Math.max(1, Number((r.radius * scaleY).toFixed(2)));
              return {
                ...r,
                type: 'oval',
                cx: Number(newCx.toFixed(2)),
                cy: Number(newCy.toFixed(2)),
                rx: newRx,
                ry: newRy,
                strokeWidth: newStroke,
              } as any;
            }

            // When switching to SQUARE or RECTANGULAR casing, morph outer circular border into matching square box frame!
            if (preset.shape === 'SQUARE' || preset.shape === 'RECTANGULAR') {
              const isOuterBorder = r.radius >= (Math.min(widthMm, heightMm) / 2) * 0.7;
              if (isOuterBorder) {
                const margin = Math.max(0.8, Number(((1 - (r.radius / (Math.min(widthMm, heightMm) / 2))) * Math.min(preset.widthMm, preset.heightMm)).toFixed(2)));
                const rectW = Math.max(2, Number((preset.widthMm - margin * 2).toFixed(2)));
                const rectH = Math.max(2, Number((preset.heightMm - margin * 2).toFixed(2)));
                return {
                  id: r.id,
                  name: r.name || 'Border Frame',
                  type: 'rect',
                  x: Number(margin.toFixed(2)),
                  y: Number(margin.toFixed(2)),
                  width: rectW,
                  height: rectH,
                  borderRadius: 1.5,
                  strokeWidth: newStroke,
                  strokeType: r.strokeType || 'solid',
                } as any;
              }

              // Inner ring stays circular inside square but scaled safely
              const maxSafeR = (Math.min(preset.widthMm, preset.heightMm) / 2) - 1.5;
              const newRadius = Math.min(maxSafeR, Math.max(1, Number((r.radius * scaleMin).toFixed(2))));
              return {
                ...r,
                cx: Number(newCx.toFixed(2)),
                cy: Number(newCy.toFixed(2)),
                radius: newRadius,
                strokeWidth: newStroke,
              };
            }

            const maxSafeR = (Math.min(preset.widthMm, preset.heightMm) / 2) - 0.5;
            const newRadius = Math.min(maxSafeR, Math.max(1, Number((r.radius * scaleMin).toFixed(2))));
            return {
              ...r,
              cx: Number(newCx.toFixed(2)),
              cy: Number(newCy.toFixed(2)),
              radius: newRadius,
              strokeWidth: newStroke,
            };
          }

          case 'oval': {
            const ov = el as OvalElement;
            const newStroke = Math.max(0.2, Number((ov.strokeWidth * Math.sqrt(scaleMin)).toFixed(2)));
            const newCx = newCenterX + (ov.cx - oldCenterX) * scaleX;
            const newCy = newCenterY + (ov.cy - oldCenterY) * scaleY;

            // When switching to ROUND casing, morph ovals back into concentric circular rings!
            if (preset.shape === 'ROUND') {
              const maxSafeR = (preset.widthMm / 2) - 0.5;
              const newRadius = Math.min(maxSafeR, Math.max(1, Number((Math.min(ov.rx, ov.ry) * scaleMin).toFixed(2))));
              return {
                id: ov.id,
                name: ov.name,
                type: 'ring',
                cx: Number(newCx.toFixed(2)),
                cy: Number(newCy.toFixed(2)),
                radius: newRadius,
                strokeWidth: newStroke,
                strokeType: ov.strokeType || 'solid',
              } as any;
            }

            // When switching to SQUARE or RECTANGULAR casing, morph oval borders into square/rectangular box frames!
            if (preset.shape === 'SQUARE' || preset.shape === 'RECTANGULAR') {
              const margin = 1.0;
              const rectW = Math.max(2, Number((preset.widthMm - margin * 2).toFixed(2)));
              const rectH = Math.max(2, Number((preset.heightMm - margin * 2).toFixed(2)));
              return {
                id: ov.id,
                name: ov.name || 'Border Frame',
                type: 'rect',
                x: Number(margin.toFixed(2)),
                y: Number(margin.toFixed(2)),
                width: rectW,
                height: rectH,
                borderRadius: 1.5,
                strokeWidth: newStroke,
                strokeType: ov.strokeType || 'solid',
              } as any;
            }

            const newRx = Math.max(1, Number((ov.rx * scaleX).toFixed(2)));
            const newRy = Math.max(1, Number((ov.ry * scaleY).toFixed(2)));
            return {
              ...ov,
              cx: Number(newCx.toFixed(2)),
              cy: Number(newCy.toFixed(2)),
              rx: newRx,
              ry: newRy,
              strokeWidth: newStroke,
            };
          }

          case 'rect': {
            const rc = el as RectElement;
            const newStroke = Math.max(0.2, Number((rc.strokeWidth * Math.sqrt(scaleMin)).toFixed(2)));

            // When switching from SQUARE/RECT to ROUND, morph outer border back into ring!
            if (preset.shape === 'ROUND') {
              const maxSafeR = (preset.widthMm / 2) - 1.0;
              const newRadius = Math.min(maxSafeR, Math.max(1, Number((Math.min(rc.width, rc.height) / 2).toFixed(2))));
              return {
                id: rc.id,
                name: rc.name || 'Ring',
                type: 'ring',
                cx: newCenterX,
                cy: newCenterY,
                radius: newRadius,
                strokeWidth: newStroke,
                strokeType: rc.strokeType || 'solid',
              } as any;
            }

            // When switching to OVAL, morph rect back into oval!
            if (preset.shape === 'OVAL') {
              const rx = Math.max(1, Number(((preset.widthMm / 2) - 1.5).toFixed(2)));
              const ry = Math.max(1, Number(((preset.heightMm / 2) - 1.5).toFixed(2)));
              return {
                id: rc.id,
                name: rc.name || 'Oval Ring',
                type: 'oval',
                cx: newCenterX,
                cy: newCenterY,
                rx,
                ry,
                strokeWidth: newStroke,
                strokeType: rc.strokeType || 'solid',
              } as any;
            }

            const newX = (rc.x / widthMm) * preset.widthMm;
            const newY = (rc.y / heightMm) * preset.heightMm;
            const newWidth = (rc.width / widthMm) * preset.widthMm;
            const newHeight = (rc.height / heightMm) * preset.heightMm;

            return {
              ...rc,
              x: Number(newX.toFixed(2)),
              y: Number(newY.toFixed(2)),
              width: Number(newWidth.toFixed(2)),
              height: Number(newHeight.toFixed(2)),
              strokeWidth: newStroke,
            };
          }

          case 'serrated-ring': {
            const sr = el as SerratedRingElement;
            const newOuter = Math.max(2, Number((sr.outerRadius * scaleMin).toFixed(2)));
            const newInner = Math.max(1, Number((sr.innerRadius * scaleMin).toFixed(2)));
            const newCx = newCenterX + (sr.cx - oldCenterX) * scaleMin;
            const newCy = newCenterY + (sr.cy - oldCenterY) * scaleMin;

            return {
              ...sr,
              cx: Number(newCx.toFixed(2)),
              cy: Number(newCy.toFixed(2)),
              outerRadius: newOuter,
              innerRadius: newInner,
            };
          }

          case 'clipart': {
            const cp = el as any;
            const newCx = newCenterX + (cp.cx - oldCenterX) * scaleMin;
            const newCy = newCenterY + (cp.cy - oldCenterY) * scaleMin;
            const newSize = Math.max(2, Number(((cp.size || 10) * scaleMin).toFixed(2)));

            return {
              ...cp,
              cx: Number(newCx.toFixed(2)),
              cy: Number(newCy.toFixed(2)),
              size: newSize,
            };
          }

          default:
            return el;
        }
      });

      pushHistory(elements);
      setElements(adaptedElements);
      result = adaptedElements as StampElement[];
    }

    setMountPresetState(preset);
    setWidthMm(preset.widthMm);
    setHeightMm(preset.heightMm);
    setShape(preset.shape);
    setHasUnsavedChanges(true);
    return result;
  };

  // Switch the canvas to a shape using the preset closest in area (borders are morphed by setMountPreset)
  const switchCanvasShape = (target: StampShapeType, opts?: { ensureBorder?: boolean }) => {
    if (!target || target === shape) return;
    const area = widthMm * heightMm;
    const candidates = STAMP_MOUNT_PRESETS.filter((p) => p.shape === target);
    if (!candidates.length) return;
    const best = candidates.reduce((a, b) =>
      Math.abs(b.widthMm * b.heightMm - area) < Math.abs(a.widthMm * a.heightMm - area) ? b : a
    );
    const next = setMountPreset(best);
    // e.g. adding a Box to an empty round stamp: give the new shape its own border
    if (opts?.ensureBorder && !hasEdgeBorder(next, best.widthMm, best.heightMm)) {
      setElements([...next, makeEdgeBorder(best.shape, best.widthMm, best.heightMm) as StampElement]);
    }
  };

  // Add Element
  const addElement = useCallback(
    (el: StampElementInput): string => {
      const id = 'el_' + Math.random().toString(36).substring(2, 9);
      const newEl = { ...el, id } as StampElement;
      pushHistory(elements);
      setElements((prev) => [...prev, newEl]);
      setSelectedId(id);
      return id;
    },
    [elements, pushHistory]
  );

  // Update Element
  const updateElement = useCallback(
    (id: string, updates: Partial<StampElement>) => {
      setElements((prev) => {
        const next = prev.map((el) => (el.id === id ? ({ ...el, ...updates } as StampElement) : el));
        return next;
      });
      setHasUnsavedChanges(true);
    },
    []
  );

  // Delete Element
  const deleteElement = useCallback(
    (id: string) => {
      pushHistory(elements);
      setElements((prev) => prev.filter((el) => el.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
    },
    [elements, selectedId, pushHistory]
  );

  // Duplicate Element
  const duplicateElement = useCallback(
    (id: string) => {
      const target = elements.find((el) => el.id === id);
      if (!target) return;

      const newId = 'el_' + Math.random().toString(36).substring(2, 9);
      const offset = 2; // 2mm offset
      let duplicated: StampElement;

      if (target.type === 'text' || target.type === 'rect' || target.type === 'image') {
        duplicated = {
          ...target,
          id: newId,
          x: (target as any).x + offset,
          y: (target as any).y + offset,
        } as StampElement;
      } else if (target.type === 'arc-text' || target.type === 'ring' || target.type === 'clipart' || target.type === 'oval') {
        duplicated = {
          ...target,
          id: newId,
          cx: (target as any).cx + offset,
          cy: (target as any).cy + offset,
        } as StampElement;
      } else {
        duplicated = { ...target, id: newId };
      }

      pushHistory(elements);
      setElements((prev) => [...prev, duplicated]);
      setSelectedId(newId);
    },
    [elements, pushHistory]
  );

  // Clipboard (Copy / Cut / Paste)
  const [clipboard, setClipboard] = useState<StampElement[]>([]);
  const clipboardRef = useRef<StampElement[]>([]);
  clipboardRef.current = clipboard;
  const pasteOffsetCountRef = useRef<number>(1);

  // Initialize from sessionStorage if present
  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? sessionStorage.getItem('stamiox_clipboard') : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setClipboard(parsed);
        }
      }
    } catch {}
  }, []);

  const copySelected = useCallback(() => {
    const liveSelectedIds = selectedIdsRef.current;
    const liveSelectedId = selectedIdRef.current;
    let targets: StampElement[] = [];

    if (liveSelectedIds && liveSelectedIds.length > 0) {
      targets = elementsRef.current.filter((el) => liveSelectedIds.includes(el.id));
    } else if (liveSelectedId) {
      const found = elementsRef.current.find((el) => el.id === liveSelectedId);
      if (found) targets = [found];
    }

    if (targets.length === 0) return;

    const cloned: StampElement[] = JSON.parse(JSON.stringify(targets));
    setClipboard(cloned);
    pasteOffsetCountRef.current = 1;
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('stamiox_clipboard', JSON.stringify(cloned));
      }
    } catch {}
  }, []);

  const cutSelected = useCallback(() => {
    copySelected();
    const liveSelectedIds = selectedIdsRef.current;
    const liveSelectedId = selectedIdRef.current;

    if (liveSelectedIds && liveSelectedIds.length > 0) {
      pushHistory(elementsRef.current);
      setElements((prev) => prev.filter((el) => !liveSelectedIds.includes(el.id)));
      setSelectedId(null);
      setSelectedIds([]);
    } else if (liveSelectedId) {
      deleteElement(liveSelectedId);
    }
  }, [copySelected, deleteElement, pushHistory]);

  const pasteElement = useCallback(
    (targetPos?: { x: number; y: number }) => {
      const items = clipboardRef.current;
      if (!items || items.length === 0) return;

      pushHistory(elementsRef.current);

      const stepOffset = 2.5 * pasteOffsetCountRef.current;
      pasteOffsetCountRef.current += 1;

      let deltaX = stepOffset;
      let deltaY = stepOffset;

      if (targetPos) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        items.forEach((item) => {
          const x = (item as any).x ?? (item as any).cx ?? 0;
          const y = (item as any).y ?? (item as any).cy ?? 0;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        });
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        deltaX = targetPos.x - centerX;
        deltaY = targetPos.y - centerY;
      }

      const newPastedElements: StampElement[] = [];
      const newIds: string[] = [];
      const groupMap = new Map<string, string>();

      items.forEach((original) => {
        const newId = 'el_' + Math.random().toString(36).substring(2, 9);
        newIds.push(newId);

        let newGroupId = original.groupId;
        if (original.groupId) {
          if (!groupMap.has(original.groupId)) {
            groupMap.set(original.groupId, 'grp_' + Math.random().toString(36).substring(2, 9));
          }
          newGroupId = groupMap.get(original.groupId);
        }

        let pasted: StampElement;
        if (original.type === 'text' || original.type === 'rect' || original.type === 'image') {
          pasted = {
            ...original,
            id: newId,
            groupId: newGroupId,
            x: Math.round(((original as any).x + deltaX) * 10) / 10,
            y: Math.round(((original as any).y + deltaY) * 10) / 10,
          } as StampElement;
        } else if (
          original.type === 'arc-text' ||
          original.type === 'ring' ||
          original.type === 'clipart' ||
          original.type === 'oval'
        ) {
          pasted = {
            ...original,
            id: newId,
            groupId: newGroupId,
            cx: Math.round(((original as any).cx + deltaX) * 10) / 10,
            cy: Math.round(((original as any).cy + deltaY) * 10) / 10,
          } as StampElement;
        } else {
          pasted = { ...original, id: newId, groupId: newGroupId };
        }

        newPastedElements.push(pasted);
      });

      setElements((prev) => [...prev, ...newPastedElements]);

      if (newIds.length === 1) {
        setSelectedId(newIds[0]);
        setSelectedIds([]);
      } else {
        setSelectedId(newIds[newIds.length - 1]);
        setSelectedIds(newIds);
      }
    },
    [pushHistory]
  );

  const canCopy = !!selectedId || selectedIds.length > 0;
  const canPaste = clipboard.length > 0;

  // Layer Ordering
  const bringForward = useCallback((id: string) => {
    pushHistory(elements);
    setElements((prev) => {
      const idx = prev.findIndex((el) => el.id === id);
      if (idx < 0 || idx === prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx + 1];
      next[idx + 1] = temp;
      return next;
    });
  }, [elements, pushHistory]);

  const sendBackward = useCallback((id: string) => {
    pushHistory(elements);
    setElements((prev) => {
      const idx = prev.findIndex((el) => el.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[idx - 1];
      next[idx - 1] = temp;
      return next;
    });
  }, [elements, pushHistory]);

  const bringToFront = useCallback((id: string) => {
    pushHistory(elements);
    setElements((prev) => {
      const target = prev.find((el) => el.id === id);
      if (!target) return prev;
      return [...prev.filter((el) => el.id !== id), target];
    });
  }, [elements, pushHistory]);

  const sendToBack = useCallback((id: string) => {
    pushHistory(elements);
    setElements((prev) => {
      const target = prev.find((el) => el.id === id);
      if (!target) return prev;
      return [target, ...prev.filter((el) => el.id !== id)];
    });
  }, [elements, pushHistory]);

  const reorderElements = useCallback((newOrder: StampElement[]) => {
    pushHistory(elements);
    setElements(newOrder);
  }, [elements, pushHistory]);

  // Keyboard Nudge (mm precision)
  const nudgeElement = useCallback(
    (id: string, dxMm: number, dyMm: number) => {
      pushHistory(elements);
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== id) return el;
          if (el.type === 'arc-text') {
            const currentOffset = el.angleOffset || 0;
            const dAngle = dxMm * 2; // e.g. 0.5mm nudge -> 1 deg, 2mm Shift nudge -> 4 deg
            let newOffset = Number(((currentOffset + dAngle) % 360).toFixed(1));
            while (newOffset > 180) newOffset -= 360;
            while (newOffset < -180) newOffset += 360;

            const currentR = el.radius || 15;
            const newR = dyMm !== 0 ? Math.max(4, Math.min(60, Number((currentR - dyMm).toFixed(1)))) : currentR;
            return { ...el, angleOffset: newOffset, radius: newR };
          }
          if (el.type === 'text' || el.type === 'rect' || el.type === 'image') {
            return { ...el, x: (el as any).x + dxMm, y: (el as any).y + dyMm };
          }
          if (el.type === 'ring' || el.type === 'clipart' || el.type === 'oval' || el.type === 'serrated-ring' || el.type === 'qrcode') {
            return { ...el, cx: (el as any).cx + dxMm, cy: (el as any).cy + dyMm };
          }
          if (el.type === 'line') {
            return { ...el, x1: el.x1 + dxMm, y1: el.y1 + dyMm, x2: el.x2 + dxMm, y2: el.y2 + dyMm };
          }
          return el;
        })
      );
    },
    [elements, pushHistory]
  );

  // Precision Alignment
  const alignSelected = useCallback(
    (alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom' | 'center-page') => {
      if (!selectedId) return;
      pushHistory(elements);
      const centerX = widthMm / 2;
      const centerY = heightMm / 2;

      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== selectedId) return el;

          // logo / QR code / clipart move by their centre point (same spots as text)
          const kind = el.type as string; // plain string so the checks below keep their types
          if (kind === 'image' || kind === 'qrcode' || kind === 'clipart') {
            const b = el as any;
            const isImg = kind === 'image';
            const mx = isImg ? b.x + (b.width || 0) / 2 : b.cx;
            const my = isImg ? b.y + (b.height || 0) / 2 : b.cy;
            const tx: Record<string, number> = { 'center-page': centerX, 'center-h': centerX, left: widthMm * 0.28, right: widthMm * 0.72 };
            const ty: Record<string, number> = { 'center-page': centerY, 'center-v': centerY, top: heightMm * 0.32, bottom: heightMm * 0.68 };
            const nx = alignment in tx ? tx[alignment] : mx;
            const ny = alignment in ty ? ty[alignment] : my;
            const r = (v: number) => Number(v.toFixed(2));
            return isImg
              ? { ...b, x: r(nx - (b.width || 0) / 2), y: r(ny - (b.height || 0) / 2) }
              : { ...b, cx: r(nx), cy: r(ny) };
          }

          // a line moves by its centre point (same spots as text)
          if (el.type === 'line') {
            const ln = el as any;
            const mx = (ln.x1 + ln.x2) / 2;
            const my = (ln.y1 + ln.y2) / 2;
            const tx: Record<string, number> = { 'center-page': centerX, 'center-h': centerX, left: widthMm * 0.28, right: widthMm * 0.72 };
            const ty: Record<string, number> = { 'center-page': centerY, 'center-v': centerY, top: heightMm * 0.32, bottom: heightMm * 0.68 };
            const dx = alignment in tx ? tx[alignment] - mx : 0;
            const dy = alignment in ty ? ty[alignment] - my : 0;
            const r = (v: number) => Number(v.toFixed(2));
            return { ...ln, x1: r(ln.x1 + dx), x2: r(ln.x2 + dx), y1: r(ln.y1 + dy), y2: r(ln.y2 + dy) };
          }

          if (alignment === 'center-page') {
            if (el.type === 'text') return { ...el, x: centerX, y: centerY };
            if (el.type === 'arc-text') return { ...el, cx: centerX, cy: centerY, angleOffset: 0 };
            if (el.type === 'ring' || el.type === 'clipart' || el.type === 'oval' || el.type === 'serrated-ring' || el.type === 'qrcode') {
              return { ...el, cx: centerX, cy: centerY };
            }
            if (el.type === 'rect') return { ...el, x: (widthMm - el.width) / 2, y: (heightMm - el.height) / 2 };
          } else if (alignment === 'center-h') {
            if (el.type === 'text') return { ...el, x: centerX };
            if (el.type === 'arc-text') return { ...el, cx: centerX, angleOffset: 0 };
            if (el.type === 'ring' || el.type === 'clipart' || el.type === 'oval' || el.type === 'serrated-ring' || el.type === 'qrcode') {
              return { ...el, cx: centerX };
            }
            if (el.type === 'rect') return { ...el, x: (widthMm - el.width) / 2 };
          } else if (alignment === 'center-v') {
            if (el.type === 'text') return { ...el, y: centerY };
            if (el.type === 'arc-text') return { ...el, cy: centerY, angleOffset: 0 };
            if (el.type === 'ring' || el.type === 'clipart' || el.type === 'oval' || el.type === 'serrated-ring' || el.type === 'qrcode') {
              return { ...el, cy: centerY };
            }
            if (el.type === 'rect') return { ...el, y: (heightMm - el.height) / 2 };
          } else if (alignment === 'left') {
            if (el.type === 'arc-text') return { ...el, cx: centerX, cy: centerY, angleOffset: -90 };
            if (el.type === 'text') return { ...el, x: Math.max(5, Number((widthMm * 0.28).toFixed(1))) };
            if (el.type === 'rect') return { ...el, x: 2 };
            if (el.type === 'clipart') return { ...el, cx: Math.max(5, Number((widthMm * 0.28).toFixed(1))) };
          } else if (alignment === 'right') {
            if (el.type === 'arc-text') return { ...el, cx: centerX, cy: centerY, angleOffset: 90 };
            if (el.type === 'text') return { ...el, x: Math.min(widthMm - 5, Number((widthMm * 0.72).toFixed(1))) };
            if (el.type === 'rect') return { ...el, x: widthMm - el.width - 2 };
            if (el.type === 'clipart') return { ...el, cx: Math.min(widthMm - 5, Number((widthMm * 0.72).toFixed(1))) };
          } else if (alignment === 'top') {
            if (el.type === 'arc-text') return { ...el, isReversed: false, cx: centerX, cy: centerY, angleOffset: 0 };
            if (el.type === 'text') return { ...el, y: Math.max(4, Number((heightMm * 0.32).toFixed(1))) };
            if (el.type === 'clipart') return { ...el, cy: Math.max(4, Number((heightMm * 0.32).toFixed(1))) };
            if (el.type === 'rect') return { ...el, y: 2 };
          } else if (alignment === 'bottom') {
            if (el.type === 'arc-text') return { ...el, isReversed: true, cx: centerX, cy: centerY, angleOffset: 0 };
            if (el.type === 'text') return { ...el, y: Math.min(heightMm - 4, Number((heightMm * 0.68).toFixed(1))) };
            if (el.type === 'clipart') return { ...el, cy: Math.min(heightMm - 4, Number((heightMm * 0.68).toFixed(1))) };
            if (el.type === 'rect') return { ...el, y: heightMm - el.height - 2 };
          }
          return el;
        })
      );
      setHasUnsavedChanges(true);
    },
    [selectedId, widthMm, heightMm, elements, pushHistory]
  );

  const distributeSelected = useCallback((axis: 'horizontal' | 'vertical') => {
    // Distribute logic across elements
  }, []);

  // Selection & Grouping (Ctrl+A to select all, Ctrl+G to group, Ctrl+Shift+G / Ctrl+U to ungroup)
  const selectAll = useCallback(() => {
    const allIds = elementsRef.current.filter((el) => el.visible !== false && !el.locked).map((el) => el.id);
    setSelectedIds(allIds);
    setSelectedId(null);
  }, []);

  const groupElements = useCallback((ids?: string[]) => {
    const targetIds = ids && ids.length > 0 ? ids : selectedIdsRef.current;
    if (targetIds.length < 2) return null;

    pushHistory(elementsRef.current);
    const newGroupId = `grp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setElements((prev) =>
      prev.map((el) => (targetIds.includes(el.id) ? { ...el, groupId: newGroupId } : el))
    );
    setSelectedIds(targetIds);
    setSelectedId(null);
    setHasUnsavedChanges(true);
    return newGroupId;
  }, [pushHistory]);

  const ungroupElements = useCallback((ids?: string[]) => {
    const targetIds = ids && ids.length > 0
      ? ids
      : (selectedIdsRef.current.length > 0
          ? selectedIdsRef.current
          : (selectedIdRef.current ? [selectedIdRef.current] : []));
    if (targetIds.length === 0) return;

    // Find all groupIds present in target elements
    const groupIdsToUngroup = new Set<string>();
    elementsRef.current.forEach((el) => {
      if (targetIds.includes(el.id) && el.groupId) {
        groupIdsToUngroup.add(el.groupId);
      }
    });

    if (groupIdsToUngroup.size === 0) return;

    pushHistory(elementsRef.current);
    setElements((prev) =>
      prev.map((el) => (el.groupId && groupIdsToUngroup.has(el.groupId) ? { ...el, groupId: undefined } : el))
    );
    setHasUnsavedChanges(true);
  }, [pushHistory]);

  // History: Undo / Redo (Supports multi-step consecutive Ctrl+Z undos)
  const undo = useCallback(() => {
    const currentHist = historyRef.current;
    if (currentHist.length === 0) return;

    const previous = currentHist[currentHist.length - 1];
    const nextHist = currentHist.slice(0, -1);
    historyRef.current = nextHist;
    setHistory(nextHist);

    const currentElements = JSON.parse(JSON.stringify(elementsRef.current));
    const nextRedo = [...redoStackRef.current, currentElements];
    redoStackRef.current = nextRedo;
    setRedoStack(nextRedo);

    const restored = JSON.parse(JSON.stringify(previous));
    elementsRef.current = restored;
    setElements(restored);
  }, []);

  const redo = useCallback(() => {
    const currentRedo = redoStackRef.current;
    if (currentRedo.length === 0) return;

    const next = currentRedo[currentRedo.length - 1];
    const nextRedoStack = currentRedo.slice(0, -1);
    redoStackRef.current = nextRedoStack;
    setRedoStack(nextRedoStack);

    const currentElements = JSON.parse(JSON.stringify(elementsRef.current));
    const nextHist = [...historyRef.current.slice(-50), currentElements];
    historyRef.current = nextHist;
    setHistory(nextHist);

    const restored = JSON.parse(JSON.stringify(next));
    elementsRef.current = restored;
    setElements(restored);
  }, []);

  // Loaders
  const loadProject = (project: any) => {
    bumpDesignLoad();
    setViewMode('SINGLE'); // a newly opened design always starts in the single-stamp editor
    setEditingA4InstanceId(null);
    setProjectId(project.id);
    setProjectTitle(project.title);
    setWidthMm(project.widthMm);
    setHeightMm(project.heightMm);
    setShape(project.shape);
    setInkColor(project.inkColor || '#1e3a8a');
    setElements(project.elementsJson || []);
    setSelectedId(null);
    historyRef.current = [];
    redoStackRef.current = [];
    setHistory([]);
    setRedoStack([]);
    setHasUnsavedChanges(false);
  };

  const loadTemplate = (template: StampTemplate) => {
    bumpDesignLoad();
    setViewMode('SINGLE'); // a newly opened design always starts in the single-stamp editor
    setEditingA4InstanceId(null);
    setProjectId(null);
    setProjectTitle(template.title);
    setWidthMm(template.widthMm);
    setHeightMm(template.heightMm);
    setShape(template.shape);
    setInkColor(template.defaultData.inkColor || '#1e3a8a');
    setElements(JSON.parse(JSON.stringify(template.defaultData.elements || [])));
    setSelectedId(null);
    setSelectedIds([]);
    historyRef.current = [];
    redoStackRef.current = [];
    setHistory([]);
    setRedoStack([]);
    setHasUnsavedChanges(true);
  };

  const loadAiGeneratedStamp = (aiData: {
    title?: string;
    shape: StampShapeType;
    widthMm: number;
    heightMm: number;
    inkColor: string;
    elements: StampElement[];
  }) => {
    bumpDesignLoad();
    setEditingA4InstanceId(null);
    // Push current state to undo history before overwriting
    if (elements.length > 0) {
      pushHistory();
    }
    setProjectId(null);
    if (aiData.title) setProjectTitle(aiData.title);
    setWidthMm(aiData.widthMm || 42);
    setHeightMm(aiData.heightMm || 42);
    setShape(aiData.shape || 'ROUND');
    setInkColor(aiData.inkColor || '#003399');
    setElements(JSON.parse(JSON.stringify(aiData.elements || [])));
    setSelectedId(null);
    setHasUnsavedChanges(true);
  };

  const applyAiRefinement = (updates: {
    elements?: StampElement[];
    inkColor?: string;
    shape?: StampShapeType;
    widthMm?: number;
    heightMm?: number;
  }) => {
    // Push snapshot to undo stack
    pushHistory();
    if (updates.shape) setShape(updates.shape);
    if (updates.widthMm) setWidthMm(updates.widthMm);
    if (updates.heightMm) setHeightMm(updates.heightMm);
    if (updates.inkColor) setInkColor(updates.inkColor);
    if (updates.elements) {
      setElements(JSON.parse(JSON.stringify(updates.elements)));
    }
    setHasUnsavedChanges(true);
  };

  const resetToBlank = (newShape: StampShapeType = 'ROUND', w = 40, h = 40) => {
    bumpDesignLoad();
    setEditingA4InstanceId(null);
    setProjectId(null);
    setProjectTitle('New Custom Stamp');
    setShape(newShape);
    setWidthMm(w);
    setHeightMm(h);
    setElements([
      {
        id: 'ring-outer-01',
        type: 'ring',
        cx: w / 2,
        cy: h / 2,
        radius: Math.min(w, h) / 2 - 1,
        strokeWidth: 0.8,
        strokeType: 'solid',
      },
      {
        id: 'top-arc-01',
        type: 'arc-text',
        text: 'YOUR COMPANY NAME HERE',
        cx: w / 2,
        cy: h / 2,
        radius: Math.min(w, h) / 2 - 4.5,
        startAngle: -150,
        sweepAngle: 300,
        fontSize: 3.2,
        fontFamily: 'Montserrat, Arial, sans-serif',
        fontWeight: 'bold',
        letterSpacing: 0.2,
        isReversed: false,
      },
    ]);
    setSelectedId('top-arc-01');
    historyRef.current = [];
    redoStackRef.current = [];
    setHistory([]);
    setRedoStack([]);
    setHasUnsavedChanges(false);
  };

  const saveProjectToCloud = async (): Promise<string | null> => {
    setIsSaving(true);
    try {
      if (projectId) {
        await ApiService.updateProject(projectId, {
          title: projectTitle,
          shape,
          widthMm,
          heightMm,
          inkColor,
          elementsJson: elements,
        });
        setHasUnsavedChanges(false);
        return projectId;
      } else {
        const res = await ApiService.createProject({
          title: projectTitle,
          shape,
          widthMm,
          heightMm,
          inkColor,
          elementsJson: elements,
        });
        if (res.success && res.project) {
          setProjectId(res.project.id);
          setHasUnsavedChanges(false);
          return res.project.id;
        }
      }
      return null;
    } catch (err) {
      console.error('Save project error:', err);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard Shortcuts (Arrow keys for 0.5mm nudges, Shift+Arrows for 2mm nudges, Delete, Undo/Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing inside input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAll();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          ungroupElements();
        } else {
          groupElements();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        ungroupElements();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && (selectedIdRef.current || selectedIdsRef.current.length > 0)) {
        e.preventDefault();
        copySelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x' && (selectedIdRef.current || selectedIdsRef.current.length > 0)) {
        e.preventDefault();
        cutSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && clipboardRef.current.length > 0) {
        e.preventDefault();
        pasteElement();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && (selectedIdRef.current || selectedIdsRef.current.length > 0)) {
        e.preventDefault();
        if (selectedIdRef.current) duplicateElement(selectedIdRef.current);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const liveSelectedIds = selectedIdsRef.current;
        const liveSelectedId = selectedIdRef.current;
        if (liveSelectedIds.length > 0) {
          e.preventDefault();
          pushHistory(elementsRef.current);
          setElements((prev) => prev.filter((el) => !liveSelectedIds.includes(el.id)));
          setSelectedId(null);
          setSelectedIds([]);
        } else if (liveSelectedId) {
          e.preventDefault();
          deleteElement(liveSelectedId);
        }
      } else if ((selectedIdRef.current || selectedIdsRef.current.length > 0) && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const step = e.shiftKey ? 2.0 : 0.5; // 2mm with shift, 0.5mm precision fine nudge
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        const targets = selectedIdsRef.current.length > 0 ? selectedIdsRef.current : [selectedIdRef.current!];
        targets.forEach((id) => nudgeElement(id, dx, dy));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectAll, groupElements, ungroupElements, deleteElement, duplicateElement, copySelected, cutSelected, pasteElement, nudgeElement, pushHistory]);

  return (
    <EditorContext.Provider
      value={{
        widthMm,
        heightMm,
        shape,
        inkColor,
        mountPreset,
        projectId,
        projectTitle,
        isSaving,
        hasUnsavedChanges,
        elements,
        setElements,
        selectedId,
        selectedIds,
        selectedElement,
        zoom,
        pan,
        laserInvert,
        laserMirror,
        distressEffect,
        showRulers,
        showGrid,
        snapToCenter,
        isLeftSidebarOpen,
        isRightSidebarOpen,
        canUndo: history.length > 0,
        canRedo: redoStack.length > 0,
        canCopy,
        canPaste,
        setWidthMm,
        setHeightMm,
        setShape,
        setInkColor,
        setMountPreset,
        switchCanvasShape,
        setProjectTitle,
        setSelectedId,
        setSelectedIds,
        setZoom,
        setPan,
        setLaserInvert,
        setLaserMirror,
        autoCanvasShape,
        setAutoCanvasShape,
        setDistressEffect,
        setShowRulers,
        setShowGrid,
        designLoadKey,
        setSnapToCenter,
        setIsLeftSidebarOpen,
        setIsRightSidebarOpen,
        toggleLeftSidebar,
        toggleRightSidebar,
        addElement,
        updateElement,
        deleteElement,
        duplicateElement,
        copySelected,
        cutSelected,
        pasteElement,
        bringForward,
        sendBackward,
        bringToFront,
        sendToBack,
        reorderElements,
        nudgeElement,
        alignSelected,
        distributeSelected,
        selectAll,
        groupElements,
        ungroupElements,
        undo,
        redo,
        pushHistory,
        loadProject,
        loadTemplate,
        loadAiGeneratedStamp,
        applyAiRefinement,
        saveProjectToCloud,
        resetToBlank,
        // A4 Gang-Sheet Imposition
        viewMode,
        setViewMode,
        viewRestored: a4Restored,
        a4Instances,
        setA4Instances,
        selectedA4InstanceId,
        setSelectedA4InstanceId,
        editingA4InstanceId,
        editA4InstanceInSingleEditor,
        stopEditingA4Instance,
        a4Config,
        setA4Config,
        addCurrentToA4,
        addMultipleToA4,
        generateA4SizeVariants,
        autoNestA4,
        updateA4Instance,
        duplicateA4Instance,
        deleteA4Instance,
        clearA4Instances,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};
