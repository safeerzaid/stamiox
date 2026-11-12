'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { STAMP_TEMPLATES } from '../../../../backend/src/data/templates';
import { StampTemplate } from '../../types/stamp';
import { playOpenTransition, playPreviewTransition } from '../../lib/open-transition';
import { generateStampSvg } from '../../lib/svg-generator';
import { FEATURED_TEMPLATE_IDS as FEATURED_IDS, designScore } from '../../lib/template-ranking';
import { TemplateCard } from '../../components/templates/TemplateCard';
import { useFavouriteTemplates } from '../../lib/favourite-templates';
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
  Star,
} from 'lucide-react';


function TemplatesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { favouriteIds, isFavourite, toggleFavourite } = useFavouriteTemplates();
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
    { id: 'company', label: 'Company & Brand' },
    { id: 'notary', label: 'Notary & Legal' },
    { id: 'medical', label: 'Medical & Doctor' },
    { id: 'office', label: 'Office & Banking' },
    { id: 'engineering', label: 'Engineer & Architect' },
    { id: 'monogram', label: 'Monogram & Wedding' },
    { id: 'date', label: 'Date & Received' },
    { id: 'address', label: 'Address & Shipping' },
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
      (selectedCategory === 'favourites' && isFavourite(t.id)) ||
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

  // Finished, eye-catching designs first; blank size templates last.
  const sortedTemplates = [...filteredTemplates].sort((a, b) => designScore(b) - designScore(a));

  const isDefaultView = selectedCategory === 'all' && selectedShape === 'all' && !searchQuery.trim();
  const featuredTemplates = FEATURED_IDS.map((id) => templates.find((t) => t.id === id)).filter(Boolean) as StampTemplate[];
  const gridTemplates = isDefaultView
    ? sortedTemplates.filter((t) => !FEATURED_IDS.includes(t.id))
    : sortedTemplates;

  const handlePreviewTemplate = (template: StampTemplate) => {
    // the stamp lifts out of its card and glides to the centre, then the window unfolds
    playPreviewTransition({
      templateId: template.id,
      svg: generateStampSvg({
        widthMm: template.widthMm,
        heightMm: template.heightMm,
        inkColor: template.defaultData.inkColor || '#1e3a8a',
        elements: template.defaultData.elements || [],
        shape: template.shape,
      }),
      onOpen: () => {
        setPreviewTemplate(template);
        setIsFullscreenPreviewOpen(true);
      },
    });
  };

  const handleQuickCustomize = (template: StampTemplate) => {
    setActiveTemplate(template);
    setIsQuickCustomizerOpen(true);
  };

  const handleOpenInStudio = (template: StampTemplate) => {
    // the preview zooms out of its card, then the editor opens
    playOpenTransition({
      templateId: template.id,
      title: template.title,
      svg: generateStampSvg({
        widthMm: template.widthMm,
        heightMm: template.heightMm,
        inkColor: template.defaultData.inkColor || '#1e3a8a',
        elements: template.defaultData.elements || [],
        shape: template.shape,
      }),
      onOpen: () => {
        loadTemplate(template);
        router.push('/editor');
      },
    });
  };

  return (
    <div className="flex-1 bg-slate-50/70 dark:bg-[#0b0f19] min-h-screen py-10 text-slate-900 dark:text-slate-100">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 space-y-7">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold mb-2">
              <Layers className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
              <span>Production Vector Template Catalog</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-[-0.035em] text-[#111827] dark:text-white">
              Rubber Stamp Templates
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
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
              placeholder={`Search ${templates.length} templates — notary, doctor, wedding…`}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs placeholder:text-slate-400 outline-none focus:border-[#0d99ff] dark:focus:border-[#0d99ff] shadow-2xs transition-all font-medium"
            />
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => handleCategoryChange('favourites')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'favourites'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-amber-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-2xs'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${selectedCategory === 'favourites' ? 'fill-white' : 'text-amber-500 fill-amber-400'}`} />
            <span>Favourites</span>
            {favouriteIds.length > 0 && <span className="tabular-nums opacity-70">{favouriteIds.length}</span>}
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-2xs'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Shape Filter Pills */}
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Mount Shape:</span>
            <div className="flex items-center gap-1.5">
              {shapes.map((s) => (
                <button
                  key={s}
                  onClick={() => handleShapeChange(s)}
                  className={`px-2.5 py-1 rounded-lg font-semibold uppercase text-[10px] transition-all cursor-pointer ${
                    selectedShape === s
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
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

        {/* Featured designs — the most eye-catching seals, shown first */}
        {isDefaultView && featuredTemplates.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Featured designs
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Ready-to-use seals our customers love — customize in seconds.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
              {featuredTemplates.map((tpl) => (
                <TemplateCard
                  key={`featured-${tpl.id}`}
                  template={tpl}
                  isFavourite={isFavourite(tpl.id)}
                  onToggleFavourite={(t) => toggleFavourite(t.id)}
                  onPreview={handlePreviewTemplate}
                  onQuickCustomize={handleQuickCustomize}
                  onOpenInStudio={handleOpenInStudio}
                />
              ))}
            </div>
            <div className="pt-4 border-t border-slate-200">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">All templates</h2>
            </div>
          </section>
        )}

        {/* Template Cards Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-2xs">
            <LayoutGrid className="w-10 h-10 text-slate-300 mx-auto" />
            {selectedCategory === 'favourites' && favouriteIds.length === 0 ? (
              <>
                <h3 className="text-base font-bold text-slate-800">No favourites yet</h3>
                <p className="text-xs text-slate-400">Tap the ☆ on any template to keep it here for quick access.</p>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-slate-800">No matching templates found</h3>
                <p className="text-xs text-slate-400">
                  Try adjusting your search query or shape filter.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
            {gridTemplates.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                isFavourite={isFavourite(tpl.id)}
                onToggleFavourite={(t) => toggleFavourite(t.id)}
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
