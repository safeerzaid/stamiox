'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Sliders,
  ArrowRight,
  Layers,
  Sparkles,
  Command,
  MousePointer,
  RotateCw,
  Type,
  Grid,
  Zap,
} from 'lucide-react';

export default function StudioGuidePage() {
  const keyboardShortcuts = [
    { key: 'Ctrl + Z', action: 'Undo last canvas element modification' },
    { key: 'Ctrl + Y / Ctrl + Shift + Z', action: 'Redo previously undone action' },
    { key: 'Delete / Backspace', action: 'Remove selected stamp layer/element' },
    { key: 'Ctrl + C / Ctrl + V', action: 'Duplicate selected vector element' },
    { key: 'Arrow Keys', action: 'Nudge element by 0.5 mm in any direction' },
    { key: 'Shift + Arrow Keys', action: 'Fast nudge element by 2.0 mm' },
    { key: 'Ctrl + Scroll', action: 'Zoom into canvas (up to 800% vector magnification)' },
    { key: 'Spacebar + Drag', action: 'Pan canvas workspace smoothly' },
  ];

  const studioFeatures = [
    {
      title: '1. True-Radius Curved Arc Text',
      desc: 'Create circular top and bottom arc text that curves symmetrically along any radius (from 5mm to 100mm) with customizable letter spacing, inside/outside orientation, and automatic vertical centering.',
      icon: Type,
    },
    {
      title: '2. Concentric Ring & Border Engine',
      desc: 'Add solid, dashed, beaded, or serrated circular and rectangular border rings with sub-millimeter stroke weight control for notary, government, and corporate seal standards.',
      icon: RotateCw,
    },
    {
      title: '3. Built-in Clipart & Emblem Library',
      desc: 'Browse 500+ production vector cliparts categorized by legal (Scales of Justice), medical (Caduceus/Rx), stars, wreaths, ribbons, heraldic shields, and corporate insignias.',
      icon: Sparkles,
    },
    {
      title: '4. A4 Gang-Sheet Batch Imposition',
      desc: 'Pack dozens of different stamp dies onto a single A4 production sheet with custom spacing, auto-nesting, cut-line indicators, and instant laser engraving export.',
      icon: Grid,
    },
  ];

  return (
    <div className="flex-1 bg-slate-50/70 min-h-screen text-slate-900 pb-24">
      {/* Sleek Dark Hero Banner */}
      <div className="relative bg-gradient-to-tr from-[#020617] via-[#09152e] to-[#1e3a8a] text-white pt-12 sm:pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-xl">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-violet-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="max-w-[1720px] mx-auto relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-xs font-semibold backdrop-blur-md">
            <Link href="/resources" className="hover:text-white transition-colors">
              Resources
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-blue-300" />
            <span className="text-white font-bold">Studio Design Guide</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-4xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.035em] text-white leading-tight">
                Vector Canvas Studio Manual & <br className="hidden sm:inline" />
                <span className="text-blue-400 font-extrabold">
                  Stamp Workflow Guide
                </span>
              </h1>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                Master circular arc text warping, concentric notary borders, vector clipart layers, hotkeys, and A4 imposition sheet production.
              </p>
            </div>

            <Link
              href="/editor"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-blue-50 text-blue-950 font-bold text-sm shadow-[0_0_25px_rgba(59,130,246,0.35)] transition-all hover:scale-105 shrink-0"
            >
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Open Vector Studio Canvas</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-20 space-y-10">
        {/* Core Studio Capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {studioFeatures.map((f, idx) => {
            const IconComponent = f.icon;
            return (
              <div key={idx} className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200 shadow-lg space-y-3.5">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">{f.title}</h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Keyboard Shortcuts Matrix */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Studio Hotkeys & Productivity Shortcuts</h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Accelerate your stamp designing workflow with pro keyboard shortcuts.
              </p>
            </div>
            <Command className="w-6 h-6 text-slate-400 hidden sm:block" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {keyboardShortcuts.map((s, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
                <span className="text-xs font-medium text-slate-700">{s.action}</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs shadow-2xs shrink-0">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
