'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { STAMP_TEMPLATES } from '../../../../backend/src/data/templates';
import { StampTemplate } from '../../types/stamp';
import { TemplateCard } from '../../components/templates/TemplateCard';
import { QuickCustomizerModal } from '../../components/templates/QuickCustomizerModal';
import { TemplateFullscreenModal } from '../../components/templates/TemplateFullscreenModal';
import { useEditor } from '../../context/EditorContext';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutGrid,
  Search,
  Building,
  Scale,
  Stethoscope,
  Mail,
  Calendar,
  Award,
  Sparkles,
  Layers,
} from 'lucide-react';

function TemplatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loadTemplate } = useEditor();

  const [templates] = useState<StampTemplate[]>(STAMP_TEMPLATES as any);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    () => searchParams.get('category')?.toLowerCase() || 'all'
  );
  const [selectedShape, setSelectedShape] = useState<string>(
    () => searchParams.get('shape')?.toUpperCase() || 'all'
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    () => searchParams.get('q') || ''
  );

  // Modals state
  const [activeTemplate, setActiveTemplate] = useState<StampTemplate | null>(null);
  const [isQuickCustomizerOpen, setIsQuickCustomizerOpen] = useState<boolean>(false);
  const [previewTemplate, setPreviewTemplate] = useState<StampTemplate | null>(null);
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState<boolean>(false);

  // Sync state from URL query parameters (from Header Dropdown or direct links)
  useEffect(() => {
    const catParam = searchParams.get('category');
    const shapeParam = searchParams.get('shape');
    const qParam = searchParams.get('q');

    if (catParam) {
      setSelectedCategory(catParam.toLowerCase());
    } else {
      setSelectedCategory('all');
    }

    if (shapeParam) {
      setSelectedShape(shapeParam.toUpperCase());
    } else {
      setSelectedShape('all');
    }

    if (qParam) {
      setSearchQuery(qParam);
    }
  }, [searchParams]);

  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'company', label: 'Corporate & Company Seals' },
    { id: 'notary', label: 'Notary & Legal Seals' },
    { id: 'medical', label: 'Medical & Doctor Stamps' },
    { id: 'office', label: 'Banking, CA & Office Stamps' },
    { id: 'address', label: 'Return Address & Logistics' },
    { id: 'monogram', label: 'Academic & University Seals' },
  ];

  const shapes = ['all', 'ROUND', 'RECTANGULAR', 'OVAL', 'SQUARE'];

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    const params = new URLSearchParams(searchParams.toString());
    if (catId === 'all') {
      params.delete('category');
    } else {
      params.set('category', catId);
    }
    router.replace(`/templates?${params.toString()}`);
  };

  const handleShapeChange = (shape: string) => {
    setSelectedShape(shape);
    const params = new URLSearchParams(searchParams.toString());
    if (shape === 'all') {
      params.delete('shape');
    } else {
      params.set('shape', shape);
    }
    router.replace(`/templates?${params.toString()}`);
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesCat =
      selectedCategory === 'all' ||
      t.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesShape =
      selectedShape === 'all' ||
      t.shape.toUpperCase() === selectedShape.toUpperCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q));

    return matchesCat && matchesShape && matchesSearch;
  });

  const handlePreviewTemplate = (template: StampTemplate) => {
    setPreviewTemplate(template);
    setIsFullscreenPreviewOpen(true);
  };

  const handleQuickCustomize = (template: StampTemplate) => {
    setActiveTemplate(template);
    setIsQuickCustomizerOpen(true);
  };

  const handleOpenInStudio = (template: StampTemplate) => {
    loadTemplate(template);
    router.push('/editor');
  };

  return (
    <div className="flex-1 bg-slate-50/70 min-h-screen py-10 text-slate-900">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold mb-2">
              <Layers className="w-3.5 h-3.5 text-slate-700" />
              <span>Production Vector Template Catalog</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-[-0.035em] text-[#111827]">
              Rubber Stamp Templates
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Select any pre-designed template for live fullscreen interactive preview or open in the Full Vector Studio.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 35+ templates, notary, doctor, CA..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 outline-none focus:border-slate-400 shadow-2xs transition-all font-medium"
            />
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 shadow-2xs'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Shape Filter Pills */}
        <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Mount Shape:</span>
            <div className="flex items-center gap-1.5">
              {shapes.map((s) => (
                <button
                  key={s}
                  onClick={() => handleShapeChange(s)}
                  className={`px-2.5 py-1 rounded-lg font-semibold uppercase text-[10px] transition-all cursor-pointer ${
                    selectedShape === s
                      ? 'bg-slate-900 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <span className="text-slate-400 font-medium text-xs">
            Showing <strong>{filteredTemplates.length}</strong> production templates
          </span>
        </div>

        {/* Template Cards Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-2xs">
            <LayoutGrid className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No matching templates found</h3>
            <p className="text-xs text-slate-400">
              Try adjusting your search query or shape filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredTemplates.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                onPreview={handlePreviewTemplate}
                onQuickCustomize={handleQuickCustomize}
                onOpenInStudio={handleOpenInStudio}
              />
            ))}
          </div>
        )}

        {/* 1. Fullscreen Interactive Live Preview Modal */}
        <TemplateFullscreenModal
          template={previewTemplate}
          isOpen={isFullscreenPreviewOpen}
          onClose={() => setIsFullscreenPreviewOpen(false)}
          onOpenInStudio={handleOpenInStudio}
          onQuickCustomize={handleQuickCustomize}
        />

        {/* 2. Quick Customizer Modal */}
        <QuickCustomizerModal
          template={activeTemplate}
          isOpen={isQuickCustomizerOpen}
          onClose={() => setIsQuickCustomizerOpen(false)}
        />
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50/70 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TemplatesContent />
    </Suspense>
  );
}
