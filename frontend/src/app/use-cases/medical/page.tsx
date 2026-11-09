'use client';

import { playOpenTransition } from '../../../lib/open-transition';
import { generateStampSvg } from '../../../lib/svg-generator';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Award,
  ChevronRight,
} from 'lucide-react';
import { STAMP_TEMPLATES } from '../../../../../backend/src/data/templates';
import { StampTemplate } from '../../../types/stamp';
import { TemplateCard } from '../../../components/templates/TemplateCard';
import { useEditor } from '../../../context/EditorContext';

export default function MedicalUseCasesPage() {
  const router = useRouter();
  const { loadTemplate } = useEditor();

  const templates = STAMP_TEMPLATES.filter(
    (t) => t.category === 'medical' || t.tags.includes('doctor') || t.tags.includes('medical')
  ) as any[];

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
      {/* Clean White Hero Header */}
      <div className="bg-white border-b border-slate-200/80 pt-10 pb-12">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/use-cases" className="hover:text-slate-900 transition-colors">Use Cases</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-900 font-bold">Medical Doctors & Healthcare Rx</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold">
            <Stethoscope className="w-3.5 h-3.5 text-slate-700" />
            <span>Physician Rx Prescription & MCI Medical Seals</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-[-0.035em] text-[#111827]">
            Medical Doctors & Healthcare Prescription Stamps
          </h1>

          <p className="text-slate-500 text-sm sm:text-base max-w-3xl leading-relaxed">
            Medical practitioner stamps designed for doctors, surgeons, clinics, and hospitals. Compliant with Medical Council registration standards (MBBS, MD, MS qualifications).
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Medical Council Reg. No.</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Clean, legible layout for doctor registration numbers and medical qualifications.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Rx Medical Cross Clipart</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Vector medical emblems, red cross, and caduceus icons for clinic branding.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Compact Pocket Mount Sizing</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Fits 45x15mm and 55x25mm pocket self-inking stamp mounts (Trodat 4911, Shiny S-842).
            </p>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Medical Doctor Template Catalog</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing {templates.length} medical prescription doctor stamp templates.
              </p>
            </div>

            <Link
              href="/editor"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Customize in Studio</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
            {templates.map((tpl) => (
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
