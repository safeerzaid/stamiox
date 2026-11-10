'use client';

import { playOpenTransition } from '../../lib/open-transition';
import { generateStampSvg } from '../../lib/svg-generator';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Scale,
  Stethoscope,
  Mail,
  Printer,
  ArrowRight,
  Layers,
  Sliders,
  Award,
  ChevronRight,
} from 'lucide-react';
import { STAMP_TEMPLATES } from '../../../../backend/src/data/templates';
import { StampTemplate } from '../../types/stamp';
import { TemplateCard } from '../../components/templates/TemplateCard';
import { useEditor } from '../../context/EditorContext';

export default function UseCasesPage() {
  const router = useRouter();
  const { loadTemplate } = useEditor();
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');

  const industries = [
    {
      id: 'all',
      title: 'All Industries',
      href: '/use-cases',
      icon: Layers,
      count: STAMP_TEMPLATES.length,
      desc: 'Browse complete vector stamp design catalog',
    },
    {
      id: 'company',
      title: 'Corporate & Enterprise',
      href: '/use-cases/corporate',
      icon: Building2,
      count: STAMP_TEMPLATES.filter((t) => t.category === 'company').length,
      desc: 'Official company seals, MD signatures, and corporate emblems',
    },
    {
      id: 'notary',
      title: 'Notary & Legal Advocates',
      href: '/use-cases/notary',
      icon: Scale,
      count: STAMP_TEMPLATES.filter((t) => t.category === 'notary').length,
      desc: 'High Court advocate seals, state notary public commission stamps',
    },
    {
      id: 'medical',
      title: 'Medical & Healthcare Rx',
      href: '/use-cases/medical',
      icon: Stethoscope,
      count: STAMP_TEMPLATES.filter((t) => t.category === 'medical').length,
      desc: 'Physician prescription stamps, clinic & hospital doctor seals',
    },
    {
      id: 'office',
      title: 'Banking, CA & Office',
      href: '/use-cases/corporate',
      icon: Award,
      count: STAMP_TEMPLATES.filter((t) => t.category === 'office').length,
      desc: 'Chartered Accountant seals, cashier receipts, and audit stamps',
    },
    {
      id: 'address',
      title: 'Logistics & Packaging',
      href: '/use-cases/logistics',
      icon: Mail,
      count: STAMP_TEMPLATES.filter((t) => t.category === 'address').length,
      desc: 'Return address, FRAGILE warning, and customs cargo stamps',
    },
  ];

  const filteredTemplates = STAMP_TEMPLATES.filter((t) => {
    if (selectedIndustry === 'all') return true;
    return t.category.toLowerCase() === selectedIndustry.toLowerCase();
  }) as any[];

  const handleOpenInStudio = (template: StampTemplate) => {
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
    <div className="flex-1 bg-white text-slate-900 min-h-screen pb-20">
      {/* Clean White Hero Banner Section */}
      <div className="bg-white border-b border-slate-200/80 pt-12 pb-16">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            <span>Industry-Tailored Vector Rubber Stamps</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-[-0.035em] text-[#111827]">
            Stamp Solutions Built for Every Industry
          </h1>

          <p className="text-slate-500 text-sm sm:text-base max-w-3xl leading-relaxed">
            Explore dedicated stamp solutions designed for legal advocates, state notary publics, medical doctors, corporate executives, and print shop manufacturers.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Industry Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Select Industry / Use Case</h2>
            <span className="text-xs text-slate-400 font-medium">Click card to open dedicated page</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {industries.map((ind) => {
              const IconComponent = ind.icon;
              const isSelected = selectedIndustry === ind.id;

              return (
                <div
                  key={ind.id}
                  onClick={() => {
                    setSelectedIndustry(ind.id);
                    if (ind.href !== '/use-cases') router.push(ind.href);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div
                      className={`p-2 rounded-xl inline-block ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-snug">{ind.title}</h3>
                      <p className={`text-[11px] mt-1 line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {ind.desc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-slate-100/20 flex items-center justify-between text-xs font-semibold">
                    <span className={isSelected ? 'text-blue-300' : 'text-slate-400'}>{ind.count} Templates</span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filtered Template Catalog Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {selectedIndustry === 'all' ? 'All Templates' : industries.find((i) => i.id === selectedIndustry)?.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing {filteredTemplates.length} production vector templates with live customization.
              </p>
            </div>

            <Link
              href="/editor"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Create Custom Stamp</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredTemplates.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                onPreview={() => router.push('/templates')}
                onQuickCustomize={() => router.push('/templates')}
                onOpenInStudio={handleOpenInStudio}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
