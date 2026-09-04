'use client';

import React, { useState, useRef } from 'react';
import { useEditor } from '../../context/EditorContext';
import { CLIPART_CATEGORIES, STAMP_CLIPART_CATALOG, ClipartItem } from '../../lib/clipart-library';
import {
  X,
  Sparkles,
  Search,
  UploadCloud,
} from 'lucide-react';

interface ClipartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClipartModal: React.FC<ClipartModalProps> = ({ isOpen, onClose }) => {
  const { addElement, widthMm, heightMm } = useEditor();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [insertSizeMm, setInsertSizeMm] = useState<number>(10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const filtered = STAMP_CLIPART_CATALOG.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const handleSelectClipart = (item: ClipartItem) => {
    addElement({
      type: 'clipart',
      name: item.name,
      cx: widthMm / 2,
      cy: heightMm / 2,
      width: insertSizeMm,
      height: insertSizeMm,
      size: insertSizeMm,
      svgPath: item.svg,
    } as any);
    onClose();
  };

  const handleCustomSvgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        // Extract inner SVG or use directly
        const cleanSvg = content.includes('<svg')
          ? content.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')
          : content;

        addElement({
          type: 'clipart',
          name: file.name.replace(/\.[^/.]+$/, ''),
          cx: widthMm / 2,
          cy: heightMm / 2,
          width: insertSizeMm,
          height: insertSizeMm,
          size: insertSizeMm,
          svgPath: cleanSvg,
        } as any);
        onClose();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-slate-900">
                  Vector Stamp Clipart & Icons
                </h3>
                <span className="text-[10px] font-semibold font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  {STAMP_CLIPART_CATALOG.length}+ Items
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official seals, heraldic crests, stars, legal scales, caduceus & industry motifs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls Bar: Search & Insert Size */}
        <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          {/* Search Input */}
          <div className="flex-1 w-full flex items-center bg-white border border-slate-200 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-300 rounded-xl px-3 py-1.5 transition-all shadow-2xs">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${STAMP_CLIPART_CATALOG.length}+ icons (e.g. Star, Seal, Notary, Caduceus, Shield, Eagle, Crown)...`}
              className="w-full bg-transparent text-xs text-slate-900 outline-none font-medium placeholder:text-slate-400"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 text-xs mr-1">
                ✕
              </button>
            )}
          </div>

          {/* Insertion Size Selector */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 text-xs">
            <span className="text-slate-500 font-medium text-[11px]">Size:</span>
            <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              {[
                { size: 6, label: '6mm' },
                { size: 10, label: '10mm' },
                { size: 14, label: '14mm' },
                { size: 18, label: '18mm' },
              ].map((s) => (
                <button
                  key={s.size}
                  onClick={() => setInsertSizeMm(s.size)}
                  className={`px-2 py-0.5 rounded font-medium text-[11px] transition-all ${
                    insertSizeMm === s.size
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom SVG Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-400 text-slate-700 hover:text-slate-900 text-xs font-medium transition-all shadow-2xs shrink-0 cursor-pointer"
            title="Upload Custom SVG or Logo"
          >
            <UploadCloud className="w-4 h-4 text-slate-500" />
            <span>Upload SVG</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg"
            onChange={handleCustomSvgUpload}
            className="hidden"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="px-3 py-2 flex gap-1 border-b border-slate-100 overflow-x-auto text-xs shrink-0 bg-white">
          {CLIPART_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap text-xs flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Clipart Items Grid */}
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 bg-slate-50/50 min-h-[300px]">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
              <Sparkles className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No clipart matches &quot;{searchQuery}&quot;</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for &quot;star&quot;, &quot;legal&quot;, &quot;medical&quot;, or &quot;crest&quot;</p>
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectClipart(item)}
                className="p-3 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-white cursor-pointer flex flex-col items-center justify-center gap-2 transition-all hover:scale-102 group bg-white shadow-2xs text-left"
                title={`Click to insert ${item.name} (${insertSizeMm}mm)`}
              >
                <div
                  className="w-10 h-10 flex items-center justify-center text-slate-700 group-hover:text-slate-900 transition-colors"
                  dangerouslySetInnerHTML={{
                    __html: `<svg viewBox="0 0 24 24" width="32" height="32" color="currentColor">${item.svg}</svg>`,
                  }}
                />
                <span className="text-[11px] font-medium text-slate-700 group-hover:text-slate-900 text-center truncate w-full transition-colors">
                  {item.name}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Showing <strong>{filtered.length}</strong> vector motifs
          </span>
          <span className="text-[11px] text-slate-400">
            All vectors are scalable SVG paths formatted for high-resolution laser stamp engraving
          </span>
        </div>
      </div>
    </div>
  );
};
