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
import { ApiService } from '../lib/api';
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
  setProjectTitle: (title: string) => void;
  setSelectedId: (id: string | null) => void;
  setSelectedIds: (ids: string[]) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setLaserInvert: (inv: boolean) => void;
  setLaserMirror: (mir: boolean) => void;
  setDistressEffect: (dist: boolean) => void;
  setShowRulers: (show: boolean) => void;
  setShowGrid: (show: boolean) => void;
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
  const [showRulers, setShowRulers] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
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
    const variants: A4StampInstance[] = [
      cloneStampToSize(elements, widthMm, heightMm, 45, 45, 'ROUND', `${projectTitle} (Ø45mm)`, inkColor, 'Colop Printer R45'),
      cloneStampToSize(elements, widthMm, heightMm, 40, 40, 'ROUND', `${projectTitle} (Ø40mm)`, inkColor, 'Colop Printer R40'),
      cloneStampToSize(elements, widthMm, heightMm, 35, 35, 'ROUND', `${projectTitle} (Ø35mm)`, inkColor, 'Colop Printer R35'),
      cloneStampToSize(elements, widthMm, heightMm, 30, 30, 'ROUND', `${projectTitle} (Ø30mm)`, inkColor, 'Colop Printer R30'),
      cloneStampToSize(elements, widthMm, heightMm, 25, 25, 'ROUND', `${projectTitle} (Ø25mm)`, inkColor, 'Trodat Printy 46025'),
    ];

    setA4Instances((prev) => {
      const updated = [...prev, ...variants];
      return autoNestStampsOnA4(updated, a4Config);
    });
  }, [elements, widthMm, heightMm, projectTitle, inkColor, a4Config]);

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

  // Synchronize edits made in Single Stamp Editor back to that specific A4 instance in real-time
  useEffect(() => {
    if (!editingA4InstanceId) return;
    setA4Instances((prev) =>
      prev.map((inst) =>
        inst.instanceId === editingA4InstanceId
          ? {
              ...inst,
              elements: JSON.parse(JSON.stringify(elements)),
              widthMm,
              heightMm,
              shape,
              inkColor,
            }
          : inst
      )
    );
  }, [elements, widthMm, heightMm, shape, inkColor, editingA4InstanceId]);

  // Proportional Auto-Adaptation Engine when Casing Size / Shape Changes
  const setMountPreset = (preset: StampMountPreset) => {
    if (elements.length > 0 && widthMm > 0 && heightMm > 0) {
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
    }

    setMountPresetState(preset);
    setWidthMm(preset.widthMm);
    setHeightMm(preset.heightMm);
    setShape(preset.shape);
    setHasUnsavedChanges(true);
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
    setProjectId(null);
    setProjectTitle(template.title);
    setWidthMm(template.widthMm);
    setHeightMm(template.heightMm);
    setShape(template.shape);
    setInkColor(template.defaultData.inkColor || '#1e3a8a');
    setElements(JSON.parse(JSON.stringify(template.defaultData.elements || [])));
    setSelectedId(null);
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
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedId) {
        e.preventDefault();
        duplicateElement(selectedId);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          pushHistory(elements);
          setElements((prev) => prev.filter((el) => !selectedIds.includes(el.id)));
          setSelectedId(null);
          setSelectedIds([]);
        } else if (selectedId) {
          e.preventDefault();
          deleteElement(selectedId);
        }
      } else if ((selectedId || selectedIds.length > 0) && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const step = e.shiftKey ? 2.0 : 0.5; // 2mm with shift, 0.5mm precision fine nudge
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        const targets = selectedIds.length > 0 ? selectedIds : [selectedId!];
        targets.forEach((id) => nudgeElement(id, dx, dy));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, undo, redo, deleteElement, duplicateElement, nudgeElement]);

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
        setWidthMm,
        setHeightMm,
        setShape,
        setInkColor,
        setMountPreset,
        setProjectTitle,
        setSelectedId,
        setSelectedIds,
        setZoom,
        setPan,
        setLaserInvert,
        setLaserMirror,
        setDistressEffect,
        setShowRulers,
        setShowGrid,
        setSnapToCenter,
        setIsLeftSidebarOpen,
        setIsRightSidebarOpen,
        toggleLeftSidebar,
        toggleRightSidebar,
        addElement,
        updateElement,
        deleteElement,
        duplicateElement,
        bringForward,
        sendBackward,
        bringToFront,
        sendToBack,
        reorderElements,
        nudgeElement,
        alignSelected,
        distributeSelected,
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
