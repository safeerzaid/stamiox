'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useEditor } from '../../context/EditorContext';
import { STAMP_TEMPLATES } from '../../../../backend/src/data/templates';
import { generateStampSvg } from '../../lib/svg-generator';
import { designInShape } from '../../lib/shape-morph';
import { STAMP_MOUNT_PRESETS } from '../../lib/units';
import { rankTemplates } from '../../lib/template-ranking';
import { importTemplateFile, loadMyTemplates, saveMyTemplates, type UserTemplate } from '../../lib/template-io';
import { ApiService } from '../../lib/api';
import { useFavouriteTemplates } from '../../lib/favourite-templates';
import { PagesSection } from './PagesSection';
import { AccountMenu } from './AccountMenu';
import {
  Layers,
  Files,
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
  ChevronRight,
  BoxSelect,
  Ungroup,
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
    ungroupElements,
    pages,
  } = useEditor();

  const [activeTab, setActiveTab] = useState<'layers' | 'templates'>('layers');
  const [searchQuery, setSearchQuery] = useState('');
  // drag & drop works on ids: a single layer, or a whole group ("g:<groupId>")
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set());
  const toggleGroupOpen = (gid: string) =>
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid);
      else next.add(gid);
      return next;
    });

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

  // Group names in the order the groups were made: Group 1, Group 2, …
  const groupNames = useMemo(() => {
    const m = new Map<string, string>();
    elements.forEach((e: any) => {
      if (e.groupId && !m.has(e.groupId)) m.set(e.groupId, `Group ${m.size + 1}`);
    });
    return m;
  }, [elements]);

  // Top-most layer first; a group shows once (where its top-most member is) with its members under it
  type LayerItem = { kind: 'el'; el: any } | { kind: 'group'; gid: string; members: any[] };
  const layerItems: LayerItem[] = (() => {
    if (searchQuery) return [...filteredElements].reverse().map((el) => ({ kind: 'el' as const, el }));
    const top = [...elements].reverse() as any[];
    const seen = new Set<string>();
    const items: LayerItem[] = [];
    for (const el of top) {
      if (!el.groupId) {
        items.push({ kind: 'el', el });
        continue;
      }
      if (seen.has(el.groupId)) continue;
      seen.add(el.groupId);
      const members = top.filter((x) => x.groupId === el.groupId);
      items.push(members.length > 1 ? { kind: 'group', gid: el.groupId, members } : { kind: 'el', el });
    }
    return items;
  })();

  const idsForKey = (key: string) =>
    key.startsWith('g:') ? elements.filter((e: any) => e.groupId === key.slice(2)).map((e) => e.id) : [key];

  // Move the dragged layer(s) to just above the target row
  const moveLayers = (fromKey: string, toKey: string) => {
    const ids = idsForKey(fromKey);
    const targetIds = idsForKey(toKey);
    if (!ids.length || !targetIds.length || targetIds.some((id) => ids.includes(id))) return;
    const top = [...elements].reverse();
    const moving = top.filter((e) => ids.includes(e.id));
    const rest = top.filter((e) => !ids.includes(e.id));
    const at = rest.findIndex((e) => targetIds.includes(e.id));
    if (at < 0) return;
    rest.splice(at, 0, ...moving);
    reorderElements([...rest].reverse());
  };

  const dragProps = (key: string) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.stopPropagation();
      setDragKey(key);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', key);
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverKey !== key) setDragOverKey(key);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (dragKey && dragKey !== key) moveLayers(dragKey, key);
      setDragKey(null);
      setDragOverKey(null);
    },
    onDragEnd: () => {
      setDragKey(null);
      setDragOverKey(null);
    },
  });

  const rowTone = (key: string, selected: boolean, hidden: boolean, tint = false) =>
    dragOverKey === key && dragKey !== key
      ? 'border-t-2 border-t-[#0d99ff] bg-[#f0f7ff] dark:bg-blue-950/40 border-transparent'
      : dragKey === key
      ? 'opacity-35 bg-slate-100 dark:bg-slate-800 border-dashed border-slate-300 dark:border-slate-700'
      : selected
      ? 'bg-[#0d99ff] text-white font-semibold shadow-xs border-[#0d99ff]'
      : tint
      ? 'bg-[#e5f2ff] dark:bg-blue-950/40 text-slate-800 dark:text-slate-100 border-transparent'
      : hidden
      ? 'bg-transparent text-slate-400 opacity-60 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent'
      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-transparent';

  const actionBtn = (selected: boolean, danger = false) =>
    `p-1 rounded transition-colors ${
      selected
        ? `text-white ${danger ? 'hover:bg-red-600' : 'hover:bg-white/20'}`
        : `text-slate-400 ${danger ? 'hover:text-red-600' : 'hover:text-slate-700 dark:hover:text-slate-200'} hover:bg-slate-200 dark:hover:bg-slate-700`
    }`;

  /** One layer row. `inGroup`: shown under its group (indented; clicking selects only this layer). */
  const renderLayerRow = (el: any, inGroup: boolean, groupSelected = false) => {
    const isSelected = !groupSelected && (selectedId === el.id || selectedIds.includes(el.id));
    const isHidden = el.visible === false;
    return (
      <div
        key={el.id}
        {...dragProps(el.id)}
        onClick={(e) => {
          if (e.shiftKey) {
            setSelectedIds(selectedIds.includes(el.id) ? selectedIds.filter((id) => id !== el.id) : [...selectedIds, el.id]);
          } else if (el.groupId && !inGroup) {
            const groupMembers = elements.filter((x) => x.groupId === el.groupId);
            setSelectedIds(groupMembers.map((x) => x.id));
          } else {
            setSelectedId(el.id);
            setSelectedIds([el.id]);
          }
        }}
        className={`group relative flex items-center justify-between px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing transition-all text-xs border ${rowTone(el.id, isSelected, isHidden, groupSelected)}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
          {!inGroup && (
            <GripVertical className={`w-3 h-3 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity ${isSelected ? 'text-white' : 'text-slate-400'}`} />
          )}
          <span className={`shrink-0 ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>{getIcon(el)}</span>
          <span className="truncate text-xs font-medium leading-tight">{getLabel(el)}</span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateElement(el.id, { visible: isHidden ? true : false });
            }}
            className={actionBtn(isSelected)}
            title={isHidden ? 'Show Layer' : 'Hide Layer'}
          >
            {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteElement(el.id);
            }}
            className={actionBtn(isSelected, true)}
            title="Delete Layer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  /** A group: header row (▸ Group N) and, when open, its layers indented under it. */
  const renderGroup = (gid: string, members: any[]) => {
    const key = `g:${gid}`;
    const memberIds = members.map((m) => m.id);
    const allSelected = memberIds.every((id) => selectedIds.includes(id)) && selectedIds.length === memberIds.length;
    const allHidden = members.every((m) => m.visible === false);
    const open = !collapsedGroups.has(gid);
    const name = groupNames.get(gid) || 'Group';
    return (
      <div key={key}>
        <div
          {...dragProps(key)}
          onClick={() => {
            setSelectedIds(memberIds);
          }}
          aria-expanded={open}
          className={`group relative flex items-center justify-between pl-1 pr-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing transition-all text-xs border ${rowTone(key, allSelected, allHidden)}`}
        >
          <div className="flex items-center gap-1 min-w-0 flex-1 pr-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleGroupOpen(gid);
              }}
              aria-label={open ? `Collapse ${name}` : `Expand ${name}`}
              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 cursor-pointer ${allSelected ? 'text-white hover:bg-white/20' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
            </button>
            <span className={`shrink-0 ${allSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
              <BoxSelect className="w-3.5 h-3.5" />
            </span>
            <span className="truncate text-xs font-medium leading-tight">{name}</span>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                members.forEach((m) => updateElement(m.id, { visible: allHidden }));
              }}
              className={actionBtn(allSelected)}
              title={allHidden ? 'Show group' : 'Hide group'}
            >
              {allHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                ungroupElements(memberIds);
              }}
              className={actionBtn(allSelected)}
              title="Ungroup (Ctrl+Shift+G)"
            >
              <Ungroup className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                memberIds.forEach((id) => deleteElement(id));
                setSelectedIds([]);
              }}
              className={actionBtn(allSelected, true)}
              title="Delete group"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {open && (
          <div className="ml-[11px] pl-1.5 border-l border-slate-200 dark:border-slate-700 space-y-0.5 mt-0.5">
            {members.map((m) => renderLayerRow(m, true, allSelected))}
          </div>
        )}
      </div>
    );
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
          <div role="tablist" aria-label="Left panel" className="relative flex-1 grid grid-cols-2 p-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
            {/* sliding highlight — same look as the Single / A4 sheet switch */}
            <span
              aria-hidden
              className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-[#0d99ff] shadow-[0_2px_8px_rgba(13,153,255,0.35)] pointer-events-none transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                activeTab === 'templates' ? 'translate-x-full' : ''
              }`}
            />
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'layers'}
              onClick={() => setActiveTab('layers')}
              className={`relative z-10 h-7 px-3 flex items-center justify-center gap-1.5 rounded-full text-[12px] whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'layers' ? 'text-white font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <Files className={`w-3.5 h-3.5 ${activeTab === 'layers' ? 'text-white' : ''}`} />
              <span>Pages</span>
              <span
                className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold tabular-nums flex items-center justify-center transition-colors ${
                  activeTab === 'layers' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                }`}
              >
                {pages.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'templates'}
              onClick={() => setActiveTab('templates')}
              className={`relative z-10 h-7 px-3 flex items-center justify-center gap-1.5 rounded-full text-[12px] whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'templates' ? 'text-white font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <LayoutGrid className={`w-3.5 h-3.5 ${activeTab === 'templates' ? 'text-white' : ''}`} />
              <span>Templates</span>
            </button>
          </div>

          {/* Collapse Button */}
          <button
            type="button"
            onClick={toggleLeftSidebar}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
            {/* Pages — each page has its own design and layers */}
            <PagesSection />
            <div className="h-8 px-3 pt-1 flex items-center text-[12px] font-semibold text-slate-800 dark:text-slate-100 shrink-0">Layers</div>
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
              layerItems.map((item) => (item.kind === 'group' ? renderGroup(item.gid, item.members) : renderLayerRow(item.el, false)))
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
        {/* Profile — pinned to the bottom of the panel */}
        <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 px-2 py-1.5 bg-white dark:bg-slate-900">
          <AccountMenu variant="sidebar" />
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

  // A shape chosen → EVERY template is offered in that shape: the ones already in it first, then the
  // others converted (borders, inner rings and curved text follow the new shape). "All" = originals.
  const shaped = useMemo(() => {
    if (shapeFilter === 'ALL') return null;
    const byId = new Map<string, any>();
    const html: Record<string, { __html: string }> = {};
    for (const t of ranked as any[]) {
      const s = t.shape === shapeFilter ? t : designInShape(t, shapeFilter, STAMP_MOUNT_PRESETS);
      byId.set(t.id, s);
      html[t.id] =
        s === t
          ? previews[t.id]
          : {
              __html: generateStampSvg({ widthMm: s.widthMm, heightMm: s.heightMm, inkColor: s.defaultData.inkColor || '#1e3a8a', elements: s.defaultData.elements, shape: s.shape })
                .replace(/width="[^"]*mm"/, 'width="100%"')
                .replace(/height="[^"]*mm"/, 'height="100%"'),
            };
    }
    return { byId, html };
  }, [shapeFilter, ranked, previews]);
  const inShape = (t: any) => (shaped && shaped.byId.get(t.id)) || t;
  const previewOf = (id: string) => (shaped && shaped.html[id]) || previews[id] || myPreviews[id];

  const q = query.trim().toLowerCase();
  const matches = (t: any) => !q || t.title.toLowerCase().includes(q) || t.tags?.some((tag: string) => tag.toLowerCase().includes(q));
  const list = (ranked as any[])
    .filter(matches)
    .sort((a, b) => (shapeFilter === 'ALL' ? 0 : Number(b.shape === shapeFilter) - Number(a.shape === shapeFilter)))
    .map(inShape);

  // Favourites: built-in and own templates, newest favourite first, same search; shown in the chosen shape
  const favourites = favouriteIds
    .map((id) => (ranked as any[]).find((t) => t.id === id) || allMine.find((t) => t.id === id))
    .filter((t: any) => t && (matches(t) && (shapeFilter === 'ALL' || shaped?.byId.has(t.id) || t.shape === shapeFilter)))
    .map(inShape) as any[];

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
              dangerouslySetInnerHTML={previewOf(t.id)}
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
