'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Cpu,
  Printer,
  Shapes,
  CheckCircle2,
  HelpCircle,
  FileCheck2,
  Sliders,
  ArrowRight,
  Download,
  Layers,
  Sparkles,
  Command,
  Zap,
  Search,
  FlipHorizontal,
  Flame,
  Code,
  Gauge,
  Eye,
  Check,
  ChevronRight,
  Compass,
  Type,
} from 'lucide-react';

const RESOURCE_MODULES = [
  {
    id: 'mounts',
    title: 'Self-Inking Mount Sizing Matrix',
    category: 'Hardware & Mounts',
    desc: 'Complete physical impression dimensions, max text lines, and recommended typography font scales for Colop, Trodat, Shiny, and Sun Stamper commercial mounts.',
    href: '/resources/mount-matrix',
    icon: Shapes,
    badge: '30+ Models',
    accentColor: 'from-blue-600 to-indigo-600',
    tagBg: 'bg-blue-500/15 text-blue-300 border-blue-400/30',
    highlights: ['Colop & Trodat Precision Sizes', 'Round, Oval, Square & Rectangular', 'Line Capacity & Font Guides'],
  },
  {
    id: 'laser',
    title: 'Laser Machine Invert & Mirror Specs',
    category: 'Laser Calibration',
    desc: 'CO2 & Fiber laser engraving parameters, horizontal mirroring, kerf offset compensation (0.12mm), and shoulder ramp angle stabilization guide.',
    href: '/resources/laser-specs',
    icon: Cpu,
    badge: '600 / 1200 DPI',
    accentColor: 'from-indigo-600 to-purple-600',
    tagBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30',
    highlights: ['Zero-Loss Vector Mirror X', 'Negative Invert Relief (1.2mm)', '35°-45° Shoulder Ramp Angle'],
  },
  {
    id: 'vector',
    title: 'Export Vector Formats (SVG, PDF, PNG)',
    category: 'Vector Standards',
    desc: 'Technical breakdown of SVG 1.1 vector code, 1:1 scale print-ready PDFs, and 600DPI transparent PNG previews with laser driver compatibility.',
    href: '/resources/export-formats',
    icon: FileCheck2,
    badge: 'Pure Vector',
    accentColor: 'from-emerald-600 to-teal-600',
    tagBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    highlights: ['W3C SVG 1.1 Outlines', '1:1 Millimetric Scale PDF', 'LightBurn & CorelDRAW Fit'],
  },
  {
    id: 'studio',
    title: 'Stamp Design & Vector Studio Guide',
    category: 'Studio Manual',
    desc: 'Master curved circular arc text, multi-ring notary borders, vector clipart layers, hotkeys, and A4 imposition sheet batch production.',
    href: '/resources/studio-guide',
    icon: BookOpen,
    badge: 'Pro Workflow',
    accentColor: 'from-violet-600 to-pink-600',
    tagBg: 'bg-violet-500/15 text-violet-300 border-violet-400/30',
    highlights: ['Symmetrical Arc Text Warping', 'Concentric Notary Rings', 'A4 Batch Gang-Sheet Export'],
  },
  {
    id: 'help',
    title: 'Help Center & Support',
    category: 'Knowledgebase',
    desc: 'Frequently asked questions, commercial royalty-free licensing, laser troubleshooting, and direct technical support engineering contact.',
    href: '/resources/help-center',
    icon: HelpCircle,
    badge: '24/7 Support',
    accentColor: 'from-amber-600 to-orange-600',
    tagBg: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    highlights: ['100% Commercial Royalty-Free', 'Laser Engraving FAQs', 'Direct Engineering Support'],
  },
];

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Interactive Live Simulator State
  const [simulatorMode, setSimulatorMode] = useState<'normal' | 'mirror' | 'invert'>('invert');
  const [selectedMountDemo, setSelectedMountDemo] = useState<number>(0);

  const mountDemos = [
    { name: 'Colop R 40', shape: 'Round', size: '40 mm', lines: '6 Lines' },
    { name: 'Trodat 4912', shape: 'Rectangular', size: '47 × 18 mm', lines: '4 Lines' },
    { name: 'Shiny O-3555', shape: 'Oval', size: '55 × 35 mm', lines: '5 Lines' },
    { name: 'Colop Q 30', shape: 'Square', size: '30 × 30 mm', lines: '5 Lines' },
  ];

  const filteredModules = RESOURCE_MODULES.filter((m) => {
    const matchesTab = activeTab === 'all' || m.id === activeTab;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      m.title.toLowerCase().includes(q) ||
      m.desc.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.highlights.some((h) => h.toLowerCase().includes(q));

    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex-1 bg-slate-50/70 min-h-screen text-slate-900 pb-24">
      {/* --- HERO SECTION (DARK CYBER GRADIENT WITH DYNAMIC LIGHTING) --- */}
      <div className="relative bg-gradient-to-tr from-[#020617] via-[#09152e] to-[#1e3a8a] text-white pt-16 sm:pt-20 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-xl">
        {/* Ambient Radial Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* Subtle Cyber Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="max-w-[1720px] mx-auto relative z-10 space-y-8">
          {/* Top Pill Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-xs font-semibold backdrop-blur-md shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span className="text-white font-bold">Technical Documentation & Production Standards</span>
          </div>

          {/* Main Hero Header */}
          <div className="space-y-4 max-w-4xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.035em] text-white leading-[1.14] drop-shadow-md">
              Design Guides, Laser Specs, & <br className="hidden sm:inline" />
              <span className="text-blue-400 font-extrabold">
                Technical Knowledgebase
              </span>
            </h1>

            <p className="text-white/90 text-base sm:text-lg max-w-2xl leading-relaxed font-normal">
              Complete engineering references for self-inking mount calibration, CO2 laser pre-press engraving parameters, vector format standards, and studio manual.
            </p>
          </div>

          {/* Search & Quick Stat Cards Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
            {/* Live Search Input */}
            <div className="lg:col-span-6 relative">
              <Search className="w-5 h-5 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search laser parameters, mount models, vector formats..."
                className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 focus:bg-slate-900 border border-blue-400/40 text-white placeholder:text-blue-200/70 text-sm outline-none focus:border-blue-400 backdrop-blur-xl transition-all shadow-lg font-medium"
              />
            </div>

            {/* Quick Feature Stats */}
            <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-blue-400/30 backdrop-blur-md text-center">
                <p className="text-xl font-bold text-white font-mono">35+</p>
                <p className="text-[11px] text-blue-200 font-medium">Mount Models</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-blue-400/30 backdrop-blur-md text-center">
                <p className="text-xl font-bold text-white font-mono">600 DPI</p>
                <p className="text-[11px] text-blue-200 font-medium">Laser Vector</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-blue-400/30 backdrop-blur-md text-center">
                <p className="text-xl font-bold text-white font-mono">1:1</p>
                <p className="text-[11px] text-blue-200 font-medium">PDF Scale</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-blue-400/30 backdrop-blur-md text-center">
                <p className="text-xl font-bold text-white font-mono">100%</p>
                <p className="text-[11px] text-blue-200 font-medium">Royalty-Free</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- QUICK-FILTER CATEGORY PILLS BAR --- */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-20">
        <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-lg flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Documentation (5)
          </button>
          <button
            onClick={() => setActiveTab('mounts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'mounts'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Mount Sizing Matrix
          </button>
          <button
            onClick={() => setActiveTab('laser')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'laser'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Laser Invert & Mirror
          </button>
          <button
            onClick={() => setActiveTab('vector')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'vector'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Vector Export Formats
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'studio'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Studio Design Guide
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'help'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Help & FAQs
          </button>
        </div>
      </div>

      {/* --- INTERACTIVE PREVIEW WIDGETS STAGE --- */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Widget 1: Interactive Laser Pre-Press Engrave Simulator */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
                <Flame className="w-4 h-4" />
                <span>Interactive Laser Pre-Press Simulator</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Live Laser Invert & Vector Mirror X Simulation
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Toggle laser rendering modes to see how Stamiox automatically flips coordinates and vaporizes relief channels for high-contrast rubber engraving.
              </p>
            </div>

            {/* Mode Switcher Buttons */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
              <button
                onClick={() => setSimulatorMode('normal')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  simulatorMode === 'normal'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Standard Positive
              </button>
              <button
                onClick={() => setSimulatorMode('mirror')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  simulatorMode === 'mirror'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span>2. Mirror (X-Flip)</span>
              </button>
              <button
                onClick={() => setSimulatorMode('invert')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  simulatorMode === 'invert'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>3. Laser Negative Invert</span>
              </button>
            </div>

            {/* Simulator Live Visual Canvas Stage */}
            <div
              className={`w-full min-h-[220px] rounded-2xl border flex items-center justify-center p-6 transition-all duration-300 ${
                simulatorMode === 'invert'
                  ? 'bg-slate-950 border-slate-800 text-white'
                  : 'bg-slate-50/80 border-slate-200 text-blue-900'
              }`}
            >
              <div
                className={`w-48 h-48 rounded-full border-4 flex flex-col items-center justify-center p-3 text-center transition-all duration-300 select-none ${
                  simulatorMode === 'invert'
                    ? 'border-white bg-slate-900 shadow-[0_0_30px_rgba(255,255,255,0.15)]'
                    : 'border-blue-700 bg-white shadow-md'
                } ${simulatorMode === 'mirror' ? '-scale-x-100' : ''}`}
              >
                <p
                  className={`text-[10px] font-bold tracking-widest uppercase ${
                    simulatorMode === 'invert' ? 'text-amber-400' : 'text-blue-800'
                  }`}
                >
                  ★ NOTARY PUBLIC ★
                </p>
                <p
                  className={`text-sm font-extrabold my-1 ${
                    simulatorMode === 'invert' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  STAMIOX SEAL
                </p>
                <p
                  className={`text-[9px] font-semibold ${
                    simulatorMode === 'invert' ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  REG. NO. 8842
                </p>
                <p
                  className={`text-[8px] font-bold tracking-wider mt-1 ${
                    simulatorMode === 'invert' ? 'text-amber-300' : 'text-blue-700'
                  }`}
                >
                  GOVT. OF INDIA
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                <strong>Status:</strong> {simulatorMode === 'invert' ? 'Vaporizing negative channel depth to 1.2mm' : simulatorMode === 'mirror' ? 'Reversed for true horizontal paper imprint' : 'Ready for screen proof approval'}
              </span>
              <Link
                href="/resources/laser-specs"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                <span>Full Laser Specs Guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Widget 2: Live Mount Sizing Quick Sizer */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
                <Shapes className="w-4 h-4" />
                <span>Self-Inking Mount Visualizer</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Instant Mount Sizing Benchmark
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Inspect casing impression areas and line limits for Colop & Trodat production mounts.
              </p>
            </div>

            {/* Mount Selection Pills */}
            <div className="grid grid-cols-2 gap-2">
              {mountDemos.map((demo, idx) => (
                <button
                  key={demo.name}
                  onClick={() => setSelectedMountDemo(idx)}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    selectedMountDemo === idx
                      ? 'bg-blue-50/80 border-blue-500 text-blue-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-xs">{demo.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{demo.size}</p>
                </button>
              ))}
            </div>

            {/* Visual Dimension Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Impression Boundary:</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-400/30 text-blue-300 font-bold text-xs font-mono">
                  {mountDemos[selectedMountDemo].size}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Shape Geometry:</span>
                <span className="text-xs font-bold text-white font-mono">
                  {mountDemos[selectedMountDemo].shape}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Max Line Density:</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {mountDemos[selectedMountDemo].lines}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Link
                href="/editor"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
              >
                <span>Open in Studio</span>
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
              </Link>
              <Link
                href="/resources/mount-matrix"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                <span>View All 30+ Mounts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* --- MAIN DOCUMENTATION MODULES (5 RICH KNOWLEDGE CARDS) --- */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Knowledge Hub & Technical Documentation Guides
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              Showing {filteredModules.length} comprehensive guides
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredModules.map((module) => {
              const IconComponent = module.icon;

              return (
                <Link
                  key={module.title}
                  href={module.href}
                  className="bg-white rounded-3xl p-8 border border-slate-200/90 hover:border-blue-500 shadow-2xs hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:-translate-y-1"
                >
                  <div className="space-y-5">
                    {/* Card Header Icon & Badge */}
                    <div className="flex items-center justify-between">
                      <div className="w-13 h-13 rounded-2xl bg-slate-100 group-hover:bg-slate-900 text-slate-800 group-hover:text-white transition-all duration-200 flex items-center justify-center font-bold shadow-xs">
                        <IconComponent className="w-6 h-6" strokeWidth={2} />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${module.tagBg}`}>
                        {module.badge}
                      </span>
                    </div>

                    {/* Titles */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {module.category}
                      </p>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                        {module.title}
                      </h3>
                    </div>

                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      {module.desc}
                    </p>

                    {/* Bullet Highlights */}
                    <ul className="space-y-2 pt-2 border-t border-slate-100">
                      {module.highlights.map((h, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700 group-hover:translate-x-1 transition-all">
                    <span>Read Complete Inner Guide</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* --- PRO PRODUCTION CTA BANNER --- */}
        <div className="bg-gradient-to-tr from-slate-950 via-[#070e20] to-[#1e3a8a] text-white rounded-3xl p-8 sm:p-12 border border-blue-900/40 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Full Vector Production Engine</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold">
              Experience the Full Vector Stamp Studio
            </h3>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl">
              Design stamps live, calibrate mount dimensions, and export laser-ready production files with automated A4 imposition.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/templates"
              className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-md transition-all"
            >
              Browse 35+ Templates
            </Link>
            <Link
              href="/editor"
              className="px-8 py-3.5 rounded-full bg-white hover:bg-blue-50 text-slate-950 font-bold text-sm shadow-[0_0_35px_rgba(59,130,246,0.4)] transition-all hover:scale-105"
            >
              Launch Studio Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
