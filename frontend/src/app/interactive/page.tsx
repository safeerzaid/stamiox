'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  RotateCcw,
  ArrowLeft,
  RectangleHorizontal,
  Circle,
  Square,
  Building2,
  Image as ImageIcon,
  User,
  PenTool,
} from 'lucide-react';
import { generateStampSvg } from '../../lib/svg-generator';
import {
  DesignStyle,
  ShapeOption,
  ContentPreset,
  generateInteractiveStamp,
} from '../../lib/interactive-generator';

const DESIGN_STYLES: { id: DesignStyle; title: string; desc: string }[] = [
  { id: 'professional', title: 'Professional', desc: 'Formal business style' },
  { id: 'minimal', title: 'Minimal', desc: 'Clean and simple' },
  { id: 'bold', title: 'Bold', desc: 'Strong typography' },
  { id: 'classic', title: 'Classic', desc: 'Traditional stamp style' },
];

const SHAPE_OPTIONS: { id: ShapeOption; label: string }[] = [
  { id: 'rectangle', label: 'Rectangle' },
  { id: 'round', label: 'Round' },
  { id: 'square', label: 'Square' },
];

const CONTENT_PRESETS: { id: ContentPreset; label: string; icon: typeof Building2 }[] = [
  { id: 'company_address', label: 'Company + Address', icon: Building2 },
  { id: 'company_logo', label: 'Company + Logo', icon: ImageIcon },
  { id: 'name_designation', label: 'Name + Title', icon: User },
  { id: 'custom', label: 'Custom Content', icon: PenTool },
];

const INK_SWATCHES = [
  { id: 'blue', name: 'Stamp Blue', hex: '#1e3a8a' },
  { id: 'navy', name: 'Official Navy', hex: '#0f172a' },
  { id: 'red', name: 'Official Red', hex: '#dc2626' },
  { id: 'green', name: 'Desk Green', hex: '#15803d' },
  { id: 'violet', name: 'Violet', hex: '#6b21a8' },
  { id: 'black', name: 'Carbon Black', hex: '#111827' },
];

export default function InteractivePage() {
  const router = useRouter();

  // Selection states
  const [selectedStyle, setSelectedStyle] = useState<DesignStyle>('minimal');
  const [selectedShape, setSelectedShape] = useState<ShapeOption>('rectangle');
  const [selectedPreset, setSelectedPreset] = useState<ContentPreset>('company_address');

  // Content form fields
  const [companyName, setCompanyName] = useState<string>('APEX INFOTECH SOLUTIONS');
  const [address, setAddress] = useState<string>('MG ROAD, KOCHI, KERALA');
  const [personName, setPersonName] = useState<string>('DR. ARUN KUMAR');
  const [designation, setDesignation] = useState<string>('MANAGING DIRECTOR');
  const [phone, setPhone] = useState<string>('+91 98470 12345 · GST: 32AAAAA0000A1Z5');
  const [selectedInk, setSelectedInk] = useState<string>('#1e3a8a');

  // Generate stamp in real-time
  const activeStamp = useMemo(() => {
    return generateInteractiveStamp({
      style: selectedStyle,
      shape: selectedShape,
      contentPreset: selectedPreset,
      companyName,
      address,
      personName,
      designation,
      phone,
      inkColor: selectedInk,
    });
  }, [selectedStyle, selectedShape, selectedPreset, companyName, address, personName, designation, phone, selectedInk]);

  // Generate SVG string for live rendering
  const liveSvg = useMemo(() => {
    return generateStampSvg({
      widthMm: activeStamp.widthMm,
      heightMm: activeStamp.heightMm,
      inkColor: activeStamp.inkColor,
      elements: activeStamp.elements,
      shape: activeStamp.shape,
    });
  }, [activeStamp]);

  const handleExploreDesign = () => {
    try {
      localStorage.setItem(
        'stamiox_ai_pending_stamp',
        JSON.stringify({
          title: activeStamp.title,
          shape: activeStamp.shape,
          widthMm: activeStamp.widthMm,
          heightMm: activeStamp.heightMm,
          inkColor: activeStamp.inkColor,
          elements: activeStamp.elements,
        })
      );
    } catch {}
    router.push('/editor');
  };

  const handleReset = () => {
    setSelectedStyle('minimal');
    setSelectedShape('rectangle');
    setSelectedPreset('company_address');
    setCompanyName('APEX INFOTECH SOLUTIONS');
    setAddress('MG ROAD, KOCHI, KERALA');
    setPersonName('DR. ARUN KUMAR');
    setDesignation('MANAGING DIRECTOR');
    setPhone('+91 98470 12345 · GST: 32AAAAA0000A1Z5');
    setSelectedInk('#1e3a8a');
  };

  const styleLabel = selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1);
  const shapeLabel = selectedShape.charAt(0).toUpperCase() + selectedShape.slice(1);
  const presetLabel = CONTENT_PRESETS.find((p) => p.id === selectedPreset)?.label || '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/editor"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Studio Canvas</span>
          </Link>
          <span className="text-xs text-slate-400 font-mono">100% Vector CAD</span>
        </div>

        {/* Main Interactive Card */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                Interactive Stamp Studio
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Pick your style, shape & layout — instant real-time vector preview
              </p>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Left Controls Column (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* 1. Design Style */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Design Style
                  </h2>
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 capitalize">
                    {selectedStyle} selected
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {DESIGN_STYLES.map((st) => {
                    const isSelected = selectedStyle === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStyle(st.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {st.title}
                          </span>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-white stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                          {st.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Shape Selector (Segmented Pills) */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Stamp Shape
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {SHAPE_OPTIONS.map((sh) => {
                    const isSelected = selectedShape === sh.id;
                    return (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() => setSelectedShape(sh.id)}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {sh.id === 'rectangle' && <RectangleHorizontal className="w-3.5 h-3.5 shrink-0" />}
                        {sh.id === 'round' && <Circle className="w-3.5 h-3.5 shrink-0" />}
                        {sh.id === 'square' && <Square className="w-3.5 h-3.5 shrink-0" />}
                        <span>{sh.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Layout Preset (Grid Pills) */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Layout Preset
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {CONTENT_PRESETS.map((pr) => {
                    const isSelected = selectedPreset === pr.id;
                    const Icon = pr.icon;
                    return (
                      <button
                        key={pr.id}
                        type="button"
                        onClick={() => setSelectedPreset(pr.id)}
                        className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="truncate">{pr.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Stamp Content Details */}
              <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Content Details
                  </span>
                  {/* Inline Ink Swatches */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-slate-400 mr-0.5">Ink:</span>
                    {INK_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.id}
                        type="button"
                        onClick={() => setSelectedInk(swatch.hex)}
                        title={swatch.name}
                        className={`w-5 h-5 rounded-full transition-all cursor-pointer relative flex items-center justify-center ${
                          selectedInk === swatch.hex
                            ? 'ring-2 ring-emerald-500 ring-offset-1 scale-110 shadow-xs'
                            : 'opacity-70 hover:opacity-100 hover:scale-105'
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                      >
                        {selectedInk === swatch.hex && (
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedPreset !== 'name_designation' && (
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Company / Organization Name"
                        className="w-full h-9 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {(selectedPreset === 'company_address' || selectedPreset === 'custom' || selectedPreset === 'company_logo') && (
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Address / Location Details"
                        className="w-full h-9 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {selectedPreset === 'name_designation' && (
                    <>
                      <div>
                        <input
                          type="text"
                          value={personName}
                          onChange={(e) => setPersonName(e.target.value)}
                          placeholder="Person Name (e.g. Dr. Arun Kumar)"
                          className="w-full h-9 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          placeholder="Designation (e.g. Managing Director)"
                          className="w-full h-9 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Company / Institution Name"
                          className="w-full h-9 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </>
                  )}

                  {selectedPreset === 'custom' && (
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Phone / GSTIN / Reg"
                        className="w-full h-9 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Live Vector Preview & Catchy Action (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Vector Preview
                  </span>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                    {activeStamp.widthMm} × {activeStamp.heightMm} mm
                  </span>
                </div>

                {/* Vector Stage */}
                <div className="h-64 sm:h-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50/70 to-slate-100/40 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center p-4 relative overflow-hidden group shadow-inner">
                  {/* Subtle paper grid pattern */}
                  <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-40 dark:opacity-15 pointer-events-none" />

                  <div
                    className={`w-full h-full flex items-center justify-center drop-shadow-md transition-transform duration-200 group-hover:scale-105 ${
                      activeStamp.shape === 'RECTANGULAR'
                        ? '[&>svg]:w-auto [&>svg]:h-auto [&>svg]:max-w-[92%] [&>svg]:max-h-[82%]'
                        : '[&>svg]:w-auto [&>svg]:h-auto [&>svg]:max-w-[82%] [&>svg]:max-h-[82%]'
                    } [&>svg]:mx-auto [&>svg]:my-auto z-10`}
                    dangerouslySetInnerHTML={{ __html: liveSvg }}
                  />
                </div>
              </div>

              {/* Selection Summary & Catchy CTA */}
              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/70 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Selection
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                      {styleLabel} · {shapeLabel}
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    {presetLabel}
                  </span>
                </div>

                {/* Primary CTA Button */}
                <button
                  type="button"
                  onClick={handleExploreDesign}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-[0.98] text-white dark:text-slate-900 text-xs sm:text-sm font-bold flex items-center justify-center shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <span>Open in Studio Canvas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
