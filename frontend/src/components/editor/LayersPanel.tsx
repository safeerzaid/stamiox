'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useEditor } from '../../context/EditorContext';
import { STAMP_TEMPLATES } from '../../../../backend/src/data/templates';
import {
  Layers,
  LayoutGrid,
  Search,
  Eye,
  EyeOff,
  Trash2,
  Type,
  RotateCw,
  Circle,
  Square,
  Sparkles,
  Star,
  X,
  GripVertical,
  PanelLeftClose,
} from 'lucide-react';

interface LayersPanelProps {
  onOpenClipartModal?: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({ onOpenClipartModal }) => {
  const {
    elements,
    selectedId,
    selectedIds,
    setSelectedId,
    setSelectedIds,
    updateElement,
    deleteElement,
    reorderElements,
    loadTemplate,
    isLeftSidebarOpen,
    toggleLeftSidebar,
  } = useEditor();

  const [activeTab, setActiveTab] = useState<'layers' | 'templates'>('layers');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Resizable Panel Width State (Figma / VS Code style)
  const [panelWidth, setPanelWidth] = useState<number>(260);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 440) {
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

  // Clean, minimal icon for each element
  const getIcon = (el: any) => {
    switch (el.type) {
      case 'arc-text':
        return el.isReversed ? (
          <RotateCw className="w-3.5 h-3.5" />
        ) : (
          <Type className="w-3.5 h-3.5" />
        );
      case 'text':
        return <Type className="w-3.5 h-3.5" />;
      case 'ring':
      case 'oval':
        return <Circle className="w-3.5 h-3.5" />;
      case 'serrated-ring':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'clipart':
        return <Star className="w-3.5 h-3.5" />;
      case 'rect':
      default:
        return <Square className="w-3.5 h-3.5" />;
    }
  };

  // Clean, simple label
  const getLabel = (el: any) => {
    if (el.type === 'arc-text' || el.type === 'text') {
      return el.text ? el.text : el.type === 'arc-text' ? (el.isReversed ? 'Bottom Arc' : 'Top Arc') : 'Text';
    }
    if (el.type === 'ring') return 'Ring';
    if (el.type === 'serrated-ring') return 'Starburst';
    if (el.type === 'clipart') return el.name ? `Clipart (${el.name})` : 'Clipart';
    if (el.type === 'rect') return 'Box Frame';
    if (el.type === 'oval') return 'Oval';
    return el.type;
  };

  const filteredElements = elements.filter((el: any) => {
    if (!searchQuery) return true;
    const label = getLabel(el).toLowerCase();
    return label.includes(searchQuery.toLowerCase());
  });

  // Drag and Drop Layer Reordering handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIndex) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    // Work with displayed list order (top-most layer at index 0)
    const newReversed = [...elements].reverse();
    const [movedItem] = newReversed.splice(draggedIdx, 1);
    newReversed.splice(targetIndex, 0, movedItem);

    // Canvas renders from back-to-front (index 0 is back, last index is front)
    const newElements = [...newReversed].reverse();
    reorderElements(newElements);

    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  return (
    <aside
      style={{
        width: isLeftSidebarOpen ? `${panelWidth}px` : '0px',
        opacity: isLeftSidebarOpen ? 1 : 0,
      }}
      className={`relative bg-white border-r border-slate-200 flex flex-col text-xs text-slate-700 select-none z-30 shrink-0 h-screen h-full min-h-screen shadow-2xs overflow-hidden ${
        isResizing ? 'transition-none select-none pointer-events-auto' : 'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
      } ${!isLeftSidebarOpen ? 'border-r-0 pointer-events-none' : ''}`}
    >
      <div style={{ width: `${panelWidth}px` }} className="flex flex-col h-full shrink-0">
        {/* Right Resizer Drag Handle */}
        {isLeftSidebarOpen && (
          <div
            onMouseDown={startResizing}
            className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-40 group flex items-center justify-center hover:bg-[#0d99ff]/20 transition-all ${
              isResizing ? 'bg-[#0d99ff] w-1' : ''
            }`}
            title="Drag left/right to resize layers panel"
          >
            <div className={`w-[2px] h-10 rounded-full bg-slate-300 group-hover:bg-[#0d99ff] transition-all ${isResizing ? 'bg-[#0d99ff] h-20' : ''}`} />
          </div>
        )}

        {/* Tab Switcher: Layers / Templates */}
        <div className="p-2 border-b border-slate-200 flex items-center gap-1.5 bg-white shrink-0">
          <button
            onClick={() => setActiveTab('layers')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'layers'
                ? 'bg-[#0d99ff] text-white font-bold shadow-xs'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Layers</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'layers' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {elements.length}
            </span>
          </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'templates'
              ? 'bg-[#0d99ff] text-white font-bold shadow-xs'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Templates</span>
        </button>

        {/* Collapse Button */}
        <button
          type="button"
          onClick={toggleLeftSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Collapse Layers Panel"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* --- TAB 1: DRAGGABLE CLEAN LAYERS --- */}
      {activeTab === 'layers' && (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Minimal Search Bar */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search layers..."
                className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 border border-slate-200/80 rounded-lg text-slate-800 outline-none focus:bg-white focus:border-[#0d99ff] font-medium transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Simple Draggable Layer Rows */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 min-h-0">
            {filteredElements.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-1">
                <Layers className="w-6 h-6 mx-auto text-slate-300" />
                <p className="text-xs font-medium text-slate-500">No layers</p>
              </div>
            ) : (
              [...filteredElements].reverse().map((el, index) => {
                const isSelected = selectedId === el.id || selectedIds.includes(el.id);
                const isHidden = el.visible === false;
                const isBeingDragged = draggedIdx === index;
                const isDragOver = dragOverIdx === index && draggedIdx !== index;

                return (
                  <div
                    key={el.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => {
                      if (e.shiftKey) {
                        if (selectedIds.includes(el.id)) {
                          setSelectedIds(selectedIds.filter((id) => id !== el.id));
                        } else {
                          setSelectedIds([...selectedIds, el.id]);
                        }
                      } else {
                        setSelectedId(el.id);
                        setSelectedIds([el.id]);
                      }
                    }}
                    className={`group relative flex items-center justify-between px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing transition-all text-xs border ${
                      isDragOver
                        ? 'border-t-2 border-t-[#0d99ff] bg-[#f0f7ff]'
                        : isBeingDragged
                        ? 'opacity-35 bg-slate-100 border-dashed border-slate-300'
                        : isSelected
                        ? 'bg-[#0d99ff] text-white font-semibold shadow-xs border-[#0d99ff]'
                        : isHidden
                        ? 'bg-transparent text-slate-400 opacity-60 hover:bg-slate-100 border-transparent'
                        : 'hover:bg-slate-100 text-slate-700 border-transparent'
                    }`}
                  >
                    {/* Left: Drag Grip Handle + Icon & Label */}
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
                      <GripVertical
                        className={`w-3 h-3 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity ${
                          isSelected ? 'text-white' : 'text-slate-400'
                        }`}
                      />

                      <span
                        className={`shrink-0 ${
                          isSelected ? 'text-white' : 'text-slate-500'
                        }`}
                      >
                        {getIcon(el)}
                      </span>

                      <span className="truncate text-xs font-medium leading-tight">
                        {getLabel(el)}
                      </span>
                    </div>

                    {/* Right: Only 2 essential hover actions (Eye & Delete) */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {/* Visibility Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateElement(el.id, { visible: isHidden ? true : false });
                        }}
                        className={`p-1 rounded transition-colors ${
                          isSelected
                            ? 'text-white hover:bg-white/20'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                        }`}
                        title={isHidden ? 'Show Layer' : 'Hide Layer'}
                      >
                        {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteElement(el.id);
                        }}
                        className={`p-1 rounded transition-colors ${
                          isSelected
                            ? 'text-white hover:bg-red-600'
                            : 'text-slate-400 hover:text-red-600 hover:bg-slate-200'
                        }`}
                        title="Delete Layer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: STAMP TEMPLATES CATALOG --- */}
      {activeTab === 'templates' && (
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2 min-h-0">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider px-1">
            Templates
          </div>
          <div className="space-y-1.5">
            {STAMP_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => {
                  loadTemplate(tmpl as any);
                  setActiveTab('layers');
                }}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-white border border-slate-200/80 hover:border-[#0d99ff] hover:shadow-xs cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-xs group-hover:text-[#0d99ff] transition-colors truncate">
                    {tmpl.title}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono bg-white px-1 py-0.2 rounded border border-slate-200 shrink-0 ml-1">
                    {tmpl.widthMm}mm
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {tmpl.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </aside>
  );
};
