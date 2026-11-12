'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useEditor } from '../../context/EditorContext';
import { STAMP_TEMPLATES } from '../../../../backend/src/data/templates';
import { generateStampSvg } from '../../lib/svg-generator';
import { rankTemplates } from '../../lib/template-ranking';
import { importTemplateFile, loadMyTemplates, saveMyTemplates, type UserTemplate } from '../../lib/template-io';
import { ApiService } from '../../lib/api';
import { useFavouriteTemplates } from '../../lib/favourite-templates';
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
  Image as ImageIcon,
  QrCode,
  Minus,
  Check,
  Zap,
  Upload as UploadIcon,
  BookmarkPlus,
  X as XIcon,
} from 'lucide-react';

interface LayersPanelProps {
  onOpenClipartModal?: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  onOpenClipartModal,
}) => {
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
      case 'qrcode':
        return <QrCode className="w-3.5 h-3.5" />;
      case 'line':
        return <Minus className="w-3.5 h-3.5" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5" />;
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
    if (el.type === 'clipart') return el.name === 'Vector logo' ? 'Vector logo' : el.name ? `Clipart (${el.name})` : 'Clipart';
    if (el.type === 'rect') return 'Box Frame';
    if (el.type === 'oval') return 'Oval';
    if (el.type === 'image') return el.isQr ? 'QR code' : 'Logo';
    if (el.type === 'qrcode') return 'QR code';
    if (el.type === 'line') return 'Line';
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
      className={`relative bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col text-xs text-slate-700 dark:text-slate-300 select-none z-30 shrink-0 h-screen h-full min-h-screen shadow-2xs overflow-hidden transition-colors ${
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
            <div className={`w-[2px] h-10 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-[#0d99ff] transition-all ${isResizing ? 'bg-[#0d99ff] h-20' : ''}`} />
          </div>
        )}

        {/* Animated Tab Switcher: Layers / Templates */}
        <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 bg-white dark:bg-slate-900 shrink-0">
          <div className="relative flex-1 flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-hidden">
            {/* Smooth Sliding Active Pill Background (Hardware-accelerated) */}
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-[#0d99ff] shadow-sm pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                left: '4px',
                width: 'calc(50% - 4px)',
                transform: activeTab === 'layers' ? 'translateX(0%)' : 'translateX(100%)',
              }}
            />

            <button
              type="button"
              onClick={() => setActiveTab('layers')}
              className={`relative z-10 flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 ${
                activeTab === 'layers'
                  ? 'text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Layers</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold transition-colors ${
                  activeTab === 'layers' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {elements.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`relative z-10 flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 ${
                activeTab === 'templates'
                  ? 'text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Templates</span>
            </button>
          </div>

          {/* Collapse Button */}
          <button
            type="button"
            onClick={toggleLeftSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Collapse Layers Panel"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

      {/* 2-Page Horizontal Slide Carousel (Layers <-> Templates) */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
        <div
          className="flex w-[200%] h-full transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            transform: activeTab === 'layers' ? 'translateX(0%)' : 'translateX(-50%)',
          }}
        >
          {/* PAGE 1: LAYERS */}
          <div className="w-1/2 h-full flex flex-col overflow-hidden min-h-0">
            {/* Minimal Search Bar */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search layers..."
                className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-750 focus:border-[#0d99ff] font-medium transition-all"
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
                      } else if (el.groupId) {
                        const groupMembers = elements.filter((x) => x.groupId === el.groupId);
                        setSelectedIds(groupMembers.map((x) => x.id));
                        setSelectedId(null);
                      } else {
                        setSelectedId(el.id);
                        setSelectedIds([el.id]);
                      }
                    }}
                    className={`group relative flex items-center justify-between px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing transition-all text-xs border ${
                      isDragOver
                        ? 'border-t-2 border-t-[#0d99ff] bg-[#f0f7ff] dark:bg-blue-950/40'
                        : isBeingDragged
                        ? 'opacity-35 bg-slate-100 dark:bg-slate-800 border-dashed border-slate-300 dark:border-slate-700'
                        : isSelected
                        ? 'bg-[#0d99ff] text-white font-semibold shadow-xs border-[#0d99ff]'
                        : isHidden
                        ? 'bg-transparent text-slate-400 opacity-60 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-transparent'
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
                      {el.groupId && (
                        <span className={`px-1 py-0.5 text-[9px] rounded font-semibold shrink-0 uppercase tracking-wider ${
                          isSelected ? 'bg-white/25 text-white' : 'bg-blue-100 dark:bg-blue-950 text-[#0d99ff]'
                        }`}>
                          Group
                        </span>
                      )}
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

        {/* PAGE 2: TEMPLATES */}
        <div className="w-1/2 h-full flex flex-col overflow-hidden min-h-0 border-l border-slate-100 dark:border-slate-800">
          <TemplatePicker
            onPick={(tmpl) => {
              loadTemplate(tmpl as any);
            }}
          />
        </div>
      </div>
    </div>
      </div>
    </aside>
  );
};

/** Star on a template card: filled amber when it is a favourite, shown on hover otherwise. */
const FavStar: React.FC<{ active: boolean; title: string; onToggle: () => void; className?: string }> = ({ active, title, onToggle, className = 'top-1 right-1' }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
    aria-pressed={active}
    aria-label={active ? `Remove ${title} from favourites` : `Add ${title} to favourites`}
    title={active ? 'Remove from favourites' : 'Add to favourites'}
    className={`absolute ${className} z-10 w-6 h-6 rounded-full bg-white/90 dark:bg-slate-900/90 shadow flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 ${
      active ? 'opacity-100 text-amber-500' : 'opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-amber-500'
    }`}
  >
    <Star className={`w-3.5 h-3.5 ${active ? 'fill-amber-400' : ''}`} />
  </button>
);

/** Left-panel template picker: searchable 2-column grid of live stamp previews. */
const TEMPLATE_SHAPES = [
  { id: 'ALL', label: 'All' },
  { id: 'ROUND', label: 'Round' },
  { id: 'RECTANGULAR', label: 'Rect' },
  { id: 'SQUARE', label: 'Square' },
  { id: 'OVAL', label: 'Oval' },
];

const TemplatePicker: React.FC<{
  onPick: (tmpl: any) => void;
}> = ({ onPick }) => {
  const [query, setQuery] = useState('');
  const [shapeFilter, setShapeFilter] = useState('ALL');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const { favouriteIds, isFavourite, toggleFavourite } = useFavouriteTemplates();
  const { switchCanvasShape, projectTitle, elements, widthMm, heightMm, shape, saveAsTemplate } = useEditor();

  // ── Templates saved to the account (server) — shown with the imported ones under "My templates" ──
  const [accountTemplates, setAccountTemplates] = useState<(UserTemplate & { cloud?: boolean })[]>([]);
  const loadAccountTemplates = useCallback(async () => {
    try {
      const res = await ApiService.getProjects();
      setAccountTemplates(
        (res.projects || [])
          .filter((p: any) => p.isTemplate)
          .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description || '',
            category: 'my-templates',
            shape: p.shape,
            widthMm: p.widthMm,
            heightMm: p.heightMm,
            tags: [],
            defaultData: { inkColor: p.inkColor || '#111827', fields: {}, elements: p.elementsJson || [] },
            importedAt: new Date(p.updatedAt).getTime(),
            cloud: true,
          }))
      );
    } catch {
      /* not signed in / offline — just show the imported ones */
    }
  }, []);
  useEffect(() => {
    loadAccountTemplates();
  }, [loadAccountTemplates]);
  const [naming, setNaming] = useState(false);
  const [tplName, setTplName] = useState('');
  const [savingTpl, setSavingTpl] = useState(false);
  const doSaveTemplate = async () => {
    if (!elements.length) {
      setIoMsg({ tone: 'err', text: 'Add something to the stamp first.' });
      return;
    }
    setSavingTpl(true);
    const name = (tplName || projectTitle).trim();
    const ok = await saveAsTemplate(name);
    setSavingTpl(false);
    if (ok) {
      setNaming(false);
      await loadAccountTemplates();
      setIoMsg({ tone: 'ok', text: `Saved “${name}” to My templates` });
    } else {
      setIoMsg({ tone: 'err', text: 'Could not save — please log in again.' });
    }
  };

  // ── My templates: imported files + saved designs (kept in this browser) ──
  const [myTemplates, setMyTemplates] = useState<UserTemplate[]>([]);
  const [ioMsg, setIoMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [importing, setImporting] = useState(false);
  const importRef = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    loadMyTemplates().then(setMyTemplates);
  }, []);
  useEffect(() => {
    if (!ioMsg) return;
    const t = window.setTimeout(() => setIoMsg(null), 3500);
    return () => window.clearTimeout(t);
  }, [ioMsg]);
  const storeMine = (next: UserTemplate[]) => {
    setMyTemplates(next);
    saveMyTemplates(next);
  };
  const handleImport = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setImporting(true);
    const added: UserTemplate[] = [];
    let error = '';
    for (const file of Array.from(files)) {
      try {
        added.push(...(await importTemplateFile(file, { shape, widthMm, heightMm })));
      } catch (e: any) {
        error = `${file.name}: ${e?.message || 'could not import'}`;
      }
    }
    setImporting(false);
    if (added.length) {
      storeMine([...added, ...myTemplates]);
      onPick(added[0]); // open the first one right away
      setIoMsg({ tone: error ? 'err' : 'ok', text: error || `Imported ${added.length} template${added.length > 1 ? 's' : ''} — opened ${added[0].title}` });
    } else if (error) {
      setIoMsg({ tone: 'err', text: error });
    }
  };
  const allMine = useMemo(() => [...accountTemplates, ...myTemplates], [accountTemplates, myTemplates]);
  const myPreviews = useMemo(() => {
    const map: Record<string, { __html: string }> = {};
    for (const t of allMine) {
      map[t.id] = {
        __html: generateStampSvg({ widthMm: t.widthMm, heightMm: t.heightMm, inkColor: t.defaultData.inkColor, elements: t.defaultData.elements, shape: t.shape })
          .replace(/width="[^"]*mm"/, 'width="100%"')
          .replace(/height="[^"]*mm"/, 'height="100%"'),
      };
    }
    return map;
  }, [allMine]);
  const removeMine = async (t: UserTemplate & { cloud?: boolean }) => {
    if (t.cloud) {
      try {
        await ApiService.deleteProject(t.id);
        setAccountTemplates((prev) => prev.filter((x) => x.id !== t.id));
      } catch {
        setIoMsg({ tone: 'err', text: 'Could not remove this template.' });
      }
    } else {
      storeMine(myTemplates.filter((x) => x.id !== t.id));
    }
  };
  // Picking a shape also switches the canvas to that shape
  const chooseShape = (id: string) => {
    setShapeFilter(id);
    if (id !== 'ALL') switchCanvasShape(id as any);
  };

  const handlePick = (tmpl: any) => {
    setApplyingId(tmpl.id);
    onPick(tmpl);
    // Reset applyingId so user can freely click another template at any time
    setTimeout(() => {
      setApplyingId(null);
    }, 500);
  };

  // Rank once and pre-render every preview once (templates are static)
  const ranked = useMemo(() => rankTemplates(STAMP_TEMPLATES as any[]), []);
  const previews = useMemo(() => {
    // stable { __html } objects: this React version re-inserts the HTML whenever the object changes
    const map: Record<string, { __html: string }> = {};
    for (const t of ranked as any[]) {
      const html = generateStampSvg({
        widthMm: t.widthMm,
        heightMm: t.heightMm,
        inkColor: t.defaultData.inkColor || '#1e3a8a',
        elements: t.defaultData.elements,
        shape: t.shape,
      })
        .replace(/width="[^"]*mm"/, 'width="100%"')
        .replace(/height="[^"]*mm"/, 'height="100%"');
      map[t.id] = { __html: html };
    }
    return map;
  }, [ranked]);

  const q = query.trim().toLowerCase();
  const list = (ranked as any[]).filter(
    (t) =>
      (shapeFilter === 'ALL' || t.shape === shapeFilter) &&
      (!q || t.title.toLowerCase().includes(q) || t.tags?.some((tag: string) => tag.toLowerCase().includes(q)))
  );

  // Favourites: built-in and own templates, newest favourite first, same search / shape filter
  const favourites = favouriteIds
    .map((id) => (ranked as any[]).find((t) => t.id === id) || allMine.find((t) => t.id === id))
    .filter(
      (t: any) =>
        t &&
        (shapeFilter === 'ALL' || t.shape === shapeFilter) &&
        (!q || t.title.toLowerCase().includes(q) || t.tags?.some((tag: string) => tag.toLowerCase().includes(q)))
    ) as any[];

  const renderCard = (t: any) => {
    const isApplying = applyingId === t.id;
    const isCurrent = projectTitle === t.title;
    return (
      <div key={t.id} className="group relative">
        <button
          onClick={() => handlePick(t)}
          disabled={applyingId === t.id}
          title={`${t.title} — ${t.widthMm}×${t.heightMm} mm`}
          className={`w-full relative text-left rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer ${
            isApplying || isCurrent
              ? 'ring-2 ring-[#0d99ff] border-[#0d99ff] bg-[#f0f7ff] dark:bg-blue-950/40 shadow-sm'
              : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#0d99ff] dark:hover:border-[#0d99ff] hover:shadow-md active:scale-[0.96]'
          }`}
        >
          <div className="aspect-square bg-slate-50 dark:bg-slate-950/50 group-hover:bg-[#f0f7ff] dark:group-hover:bg-slate-800/70 flex items-center justify-center p-2.5 transition-colors relative">
            <div
              className="ink-preview w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full transition-transform duration-300 group-hover:scale-105"
              dangerouslySetInnerHTML={previews[t.id] || myPreviews[t.id]}
            />
            {isApplying && (
              <div className="absolute inset-0 bg-[#0d99ff]/15 backdrop-blur-[1px] flex items-center justify-center">
                <div className="px-2.5 py-1 rounded-full bg-[#0d99ff] text-white text-[11px] font-bold shadow-lg flex items-center gap-1 fx-pop-in">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  Applied!
                </div>
              </div>
            )}
          </div>
          <div className="px-2 py-1.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div
              className={`text-[11px] font-semibold truncate transition-colors ${
                isCurrent
                  ? 'text-[#0d99ff] dark:text-[#38bdf8]'
                  : 'text-slate-800 dark:text-slate-100 group-hover:text-[#0d99ff] dark:group-hover:text-[#38bdf8]'
              }`}
            >
              {t.title}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-400 tabular-nums">
              {t.shape === 'ROUND' ? `Ø ${t.widthMm} mm` : `${t.widthMm} × ${t.heightMm} mm`}
            </div>
          </div>
        </button>
        <FavStar active={isFavourite(t.id)} title={t.title} onToggle={() => toggleFavourite(t.id)} />
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-2.5 space-y-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            disabled={importing}
            title="Import a template file (.json) or a stamp image (PNG, JPG, SVG)"
            className="w-full h-8 flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[12px] font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-60 transition-colors cursor-pointer"
          >
            <UploadIcon className="w-3.5 h-3.5 shrink-0" />
            {importing ? 'Importing…' : 'Import'}
          </button>
          <input
            ref={importRef}
            type="file"
            multiple
            accept=".json,application/json,image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            aria-label="Import templates"
            onChange={(e) => {
              handleImport(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
        {ioMsg && (
          <p role="status" className={`text-[11px] leading-snug px-0.5 ${ioMsg.tone === 'ok' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {ioMsg.text}
          </p>
        )}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${STAMP_TEMPLATES.length} templates...`}
            className="w-full h-8 pl-8 pr-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[12px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-slate-750 focus:border-[#0d99ff] transition-all"
          />
        </div>
        <div className="grid grid-cols-5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
          {TEMPLATE_SHAPES.map((s) => (
            <button
              key={s.id}
              onClick={() => chooseShape(s.id)}
              className={`h-6 rounded-md text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                shapeFilter === s.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 min-h-0">
        {favourites.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between px-0.5 mb-1.5">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                Favourites
              </span>
              <span className="text-[10.5px] text-slate-400 dark:text-slate-500 tabular-nums">{favourites.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">{favourites.map(renderCard)}</div>
            <div className="h-px bg-slate-100 dark:bg-slate-800 mt-3" />
          </div>
        )}
        {allMine.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between px-0.5 mb-1.5">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">My templates</span>
              <span className="text-[10.5px] text-slate-400 dark:text-slate-500 tabular-nums">{allMine.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {allMine.map((t) => (
                <div key={t.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => handlePick(t)}
                    title={`${t.title} — ${t.widthMm}×${t.heightMm} mm`}
                    className={`w-full text-left rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer ${
                      applyingId === t.id ? 'ring-2 ring-[#0d99ff] border-[#0d99ff]' : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#0d99ff] hover:shadow-md'
                    }`}
                  >
                    <div className="aspect-square bg-slate-50 dark:bg-slate-950/50 flex items-center justify-center p-2.5">
                      <div className="ink-preview w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full" dangerouslySetInnerHTML={myPreviews[t.id]} />
                    </div>
                    <div className="px-2 py-1.5 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[11px] font-medium text-slate-800 dark:text-slate-100 truncate">{t.title}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">{t.widthMm}×{t.heightMm} mm</p>
                    </div>
                  </button>
                  <FavStar active={isFavourite(t.id)} title={t.title} onToggle={() => toggleFavourite(t.id)} className="top-1 right-8" />
                  <button
                    type="button"
                    onClick={() => removeMine(t)}
                    title="Remove from My templates"
                    aria-label={`Remove ${t.title}`}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 dark:bg-slate-900/90 shadow text-slate-500 hover:text-rose-600 flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="h-px bg-slate-100 dark:bg-slate-800 mt-3" />
          </div>
        )}
        {list.length === 0 ? (
          <p className="text-[12px] text-slate-400 text-center py-8">No templates match “{query}”.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {list.map(renderCard)}
          </div>
        )}
      </div>
    </div>
  );
};
