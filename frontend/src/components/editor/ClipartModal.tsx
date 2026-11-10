'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useEditor } from '../../context/EditorContext';
import { CLIPART_CATEGORIES, STAMP_CLIPART_CATALOG, ClipartItem } from '../../lib/clipart-library';
import { X, Search, Upload, Plus } from 'lucide-react';

interface ClipartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Library icons are drawn on a 24×24 grid. */
const LIBRARY_VIEWBOX = '0 0 24 24';

const SIZES = [
  { size: 6, label: 'S' },
  { size: 10, label: 'M' },
  { size: 14, label: 'L' },
  { size: 18, label: 'XL' },
];

// Tight viewBox per icon (measured once in the browser, then cached for the session)
const fittedViewBoxCache = new Map<string, string>();

/** Measure an SVG fragment and return a square viewBox hugging its artwork (with a little padding). */
function measureViewBox(inner: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  try {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', fallback);
    svg.setAttribute('width', '240');
    svg.setAttribute('height', '240');
    svg.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden';
    const g = document.createElementNS(NS, 'g');
    g.innerHTML = inner;
    svg.appendChild(g);
    document.body.appendChild(svg);
    const b = g.getBBox();
    document.body.removeChild(svg);
    if (!b.width || !b.height) return fallback;
    const side = Math.max(b.width, b.height);
    const pad = side * 0.08; // room for strokes, which getBBox does not include
    const s = side + pad * 2;
    const x = b.x + b.width / 2 - s / 2;
    const y = b.y + b.height / 2 - s / 2;
    return `${x.toFixed(2)} ${y.toFixed(2)} ${s.toFixed(2)} ${s.toFixed(2)}`;
  } catch {
    return fallback;
  }
}

const fittedViewBox = (item: ClipartItem) => {
  let vb = fittedViewBoxCache.get(item.id);
  if (!vb) {
    vb = measureViewBox(item.svg, LIBRARY_VIEWBOX);
    fittedViewBoxCache.set(item.id, vb);
  }
  return vb;
};

export const ClipartModal: React.FC<ClipartModalProps> = ({ isOpen, onClose }) => {
  const { addElement, widthMm, heightMm } = useEditor();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [insertSizeMm, setInsertSizeMm] = useState<number>(10);
  const [viewBoxes, setViewBoxes] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Measure every icon once when the modal opens so previews and inserts are tightly framed
  useEffect(() => {
    if (!isOpen) return;
    const map: Record<string, string> = {};
    STAMP_CLIPART_CATALOG.forEach((item) => (map[item.id] = fittedViewBox(item)));
    setViewBoxes(map);
  }, [isOpen]);

  // Esc closes
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: STAMP_CLIPART_CATALOG.length };
    STAMP_CLIPART_CATALOG.forEach((i) => (c[i.category] = (c[i.category] || 0) + 1));
    return c;
  }, []);

  if (!isOpen) return null;

  const q = searchQuery.toLowerCase().trim();
  const filtered = STAMP_CLIPART_CATALOG.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const insert = (name: string, svgPath: string, viewBox: string) => {
    addElement({
      type: 'clipart',
      name,
      cx: widthMm / 2,
      cy: heightMm / 2,
      width: insertSizeMm,
      height: insertSizeMm,
      size: insertSizeMm,
      svgPath,
      viewBox,
    } as any);
    onClose();
  };

  const handleCustomSvgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      const open = content.match(/<svg[^>]*>/i)?.[0];
      if (!open) {
        setUploadError('That file is not a valid SVG.');
        return;
      }
      // keep the file's own coordinate system
      const vbAttr = open.match(/viewBox\s*=\s*["']([^"']+)["']/i)?.[1];
      const w = parseFloat(open.match(/\swidth\s*=\s*["']([\d.]+)/i)?.[1] || '');
      const h = parseFloat(open.match(/\sheight\s*=\s*["']([\d.]+)/i)?.[1] || '');
      const baseVb = vbAttr || (w && h ? `0 0 ${w} ${h}` : '0 0 100 100');
      const inner = content.replace(/^[\s\S]*?<svg[^>]*>/i, '').replace(/<\/svg>[\s\S]*$/i, '');
      insert(file.name.replace(/\.[^/.]+$/, ''), inner, measureViewBox(inner, baseVb));
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col h-[min(640px,85vh)] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Add clipart"
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between shrink-0 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-baseline gap-2">
            <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">Add clipart</h3>
            <span className="text-[12px] text-slate-400 tabular-nums">{STAMP_CLIPART_CATALOG.length} icons</span>
          </div>
          <button onClick={onClose} className="p-1.5 -mr-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search + upload */}
        <div className="px-5 pb-3 flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stars, scales, shield, crown…"
              className="w-full h-9 pl-9 pr-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[13px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-slate-750 focus:border-[#0d99ff] focus:ring-2 focus:ring-[#0d99ff]/15 transition-all"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label="Clear search">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-9 px-3 flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[13px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shrink-0"
            title="Upload your own SVG"
          >
            <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            Upload SVG
          </button>
          <input ref={fileInputRef} type="file" accept=".svg,image/svg+xml" onChange={handleCustomSvgUpload} className="hidden" />
        </div>
        {uploadError && <p className="px-5 -mt-1 pb-2 text-[12px] text-rose-600 dark:text-rose-400">{uploadError}</p>}

        {/* Category tabs — swipe / drag / wheel / arrows */}
        <CategoryTabs
          categories={CLIPART_CATEGORIES.filter((c) => counts[c.id])}
          counts={counts}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Icon grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/60 dark:bg-slate-950/40">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <Search className="w-7 h-7 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300">No icons match “{searchQuery}”</p>
              <p className="text-[12px] text-slate-400 mt-1">Try “star”, “scales”, “medical” or “crown”.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => insert(item.name, item.svg, viewBoxes[item.id] || LIBRARY_VIEWBOX)}
                  title={`${item.name} — click to add (${insertSizeMm} mm)`}
                  className="group relative flex flex-col items-center rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-2 pt-3 hover:border-[#0d99ff] dark:hover:border-[#0d99ff] hover:shadow-[0_6px_16px_-8px_rgba(13,153,255,0.45)] hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#0d99ff] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-3 h-3" strokeWidth={3} />
                  </span>
                  <span
                    className="w-12 h-12 flex items-center justify-center text-slate-700 dark:text-slate-200 group-hover:text-[#0d99ff] dark:group-hover:text-[#38bdf8] transition-colors"
                    dangerouslySetInnerHTML={{
                      __html: `<svg viewBox="${viewBoxes[item.id] || LIBRARY_VIEWBOX}" width="44" height="44" color="currentColor" style="overflow:visible">${item.svg}</svg>`,
                    }}
                  />
                  <span className="mt-1.5 w-full text-center text-[11px] leading-tight text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white truncate">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer: insert size */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[12px] text-slate-400 tabular-nums">
            {filtered.length} {filtered.length === 1 ? 'icon' : 'icons'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-500 dark:text-slate-400">Insert size</span>
            <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
              {SIZES.map((s) => (
                <button
                  key={s.size}
                  onClick={() => setInsertSizeMm(s.size)}
                  title={`${s.size} mm`}
                  className={`h-7 min-w-[44px] px-2 rounded-md text-[12px] tabular-nums transition-colors cursor-pointer ${
                    insertSizeMm === s.size ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-[0_1px_2px_rgba(15,23,42,0.08)]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {s.label} <span className="text-slate-400">{s.size}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Horizontally swipeable category tabs: mouse drag, touch swipe, mouse wheel and ‹ › buttons. */
const CategoryTabs: React.FC<{
  categories: { id: string; label: string }[];
  counts: Record<string, number>;
  selected: string;
  onSelect: (id: string) => void;
}> = ({ categories, counts, selected, onSelect }) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const drag = useRef({ down: false, startX: 0, startScroll: 0, moved: false });

  const updateEdges = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setEdges({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateEdges();
    // vertical mouse wheel scrolls the tabs sideways
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    return () => {
      el.removeEventListener('wheel', onWheel);
      ro.disconnect();
    };
  }, []);

  // keep the selected tab visible
  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
  }, [selected]);


  return (
    <div className="relative border-b border-slate-100 dark:border-slate-800 shrink-0">
      <div
        ref={scrollerRef}
        onScroll={updateEdges}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse' || e.button !== 0) return; // touch uses native swipe
          drag.current = { down: true, startX: e.clientX, startScroll: scrollerRef.current!.scrollLeft, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d.down) return;
          const dx = e.clientX - d.startX;
          if (!d.moved && Math.abs(dx) > 4) {
            d.moved = true;
            scrollerRef.current!.setPointerCapture(e.pointerId);
          }
          if (d.moved) scrollerRef.current!.scrollLeft = d.startScroll - dx;
        }}
        onPointerUp={(e) => {
          drag.current.down = false;
          if (scrollerRef.current?.hasPointerCapture(e.pointerId)) scrollerRef.current.releasePointerCapture(e.pointerId);
        }}
        onClickCapture={(e) => {
          // a drag should not also select the tab under the pointer
          if (drag.current.moved) {
            e.stopPropagation();
            e.preventDefault();
            drag.current.moved = false;
          }
        }}
        className={`px-5 flex gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden select-none ${
          drag.current.moved ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        role="tablist"
        aria-label="Clipart categories"
      >
        {categories.map((cat) => {
          const active = selected === cat.id;
          return (
            <button
              key={cat.id}
              ref={active ? activeRef : undefined}
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(cat.id)}
              className={`relative shrink-0 px-2.5 pb-2.5 pt-1 text-[12px] whitespace-nowrap transition-colors cursor-pointer ${
                active
                  ? 'text-slate-900 dark:text-white font-medium'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {cat.id === 'all' ? 'All' : cat.label}
              <span className="ml-1 text-[11px] text-slate-400 tabular-nums">{counts[cat.id]}</span>
              {active && <span className="absolute left-2 right-2 bottom-0 h-0.5 rounded-full bg-[#0d99ff]" />}
            </button>
          );
        })}
      </div>

      {/* soft edge fades hint that there is more to swipe */}
      {edges.left && <div aria-hidden className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-white dark:from-slate-900 to-transparent pointer-events-none" />}
      {edges.right && <div aria-hidden className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white dark:from-slate-900 to-transparent pointer-events-none" />}
    </div>
  );
};
