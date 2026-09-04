'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Printer,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Award,
  ChevronRight,
  Cpu,
} from 'lucide-react';
import { STAMP_TEMPLATES } from '../../../../../backend/src/data/templates';
import { StampTemplate } from '../../../types/stamp';
import { TemplateCard } from '../../../components/templates/TemplateCard';
import { useEditor } from '../../../context/EditorContext';

export default function StampMakersUseCasesPage() {
  const router = useRouter();
  const { loadTemplate } = useEditor();

  const templates = STAMP_TEMPLATES.slice(0, 15) as any[];

  const handleOpenInStudio = (template: StampTemplate) => {
    loadTemplate(template);
    router.push('/editor');
  };

  return (
    <div className="flex-1 bg-white text-slate-900 min-h-screen pb-20">
      {/* Clean White Hero Header */}
      <div className="bg-white border-b border-slate-200/80 pt-10 pb-12">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/use-cases" className="hover:text-slate-900 transition-colors">Use Cases</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-900 font-bold">Stamp Manufacturers & Print Shops</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold">
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>CO2 Laser Rubber Engraving & Vulcanization Solution</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-[-0.035em] text-[#111827]">
            Stamp Manufacturers & Print Shop Solutions
          </h1>

          <p className="text-slate-500 text-sm sm:text-base max-w-3xl leading-relaxed">
            Professional vector design studio tailored for rubber stamp manufacturers, laser engravers, and seal makers. Features 1:1 physical millimeter scale print sheets, Mirror X transformation, and Invert fill modes.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Mirror X & Invert Modes</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Instant 1-click vector transformation for laser engraving directly onto rubber sheets.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>1:1 Scale Print Proofing</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate exact millimetric size calibration proofing sheets for client approval.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Colop, Trodat & Shiny Support</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Compatible with all standard self-inking mount sizes (R12, R24, R30, R40, Printy 4911-4913).
            </p>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Print Shop Ready Vector Templates</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing {templates.length} production vector templates ready for laser machine engraving.
              </p>
            </div>

            <Link
              href="/editor"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Open Studio Engine</span>
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
