'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Check,
  RotateCcw,
  RectangleHorizontal,
  Circle,
  Square,
  Building2,
  Image as ImageIcon,
  User,
  PenTool,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { generateStampSvg } from '../../lib/svg-generator';
import {
  DesignStyle,
  ShapeOption,
  ContentPreset,
  generateInteractiveStamp,
} from '../../lib/interactive-generator';

interface InteractiveDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DESIGN_STYLES: { id: DesignStyle; title: string; desc: string }[] = [
  { id: 'professional', title: 'Professional', desc: 'Formal business style' },
  { id: 'minimal', title: 'Minimal', desc: 'Clean and simple' },
  { id: 'bold', title: 'Bold', desc: 'Strong typography' },
  { id: 'classic', title: 'Classic', desc: 'Traditional stamp style' },
];

const SHAPE_OPTIONS: { id: ShapeOption; label: string; dimensions: string }[] = [
  { id: 'rectangle', label: 'Rectangle', dimensions: '50 × 20 mm' },
  { id: 'round', label: 'Round', dimensions: 'Ø 42 mm' },
  { id: 'square', label: 'Square', dimensions: '32 × 32 mm' },
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

export const InteractiveDesignModal: React.FC<InteractiveDesignModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { loadAiGeneratedStamp } = useEditor();

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

  // Animation status
  const [isApplying, setIsApplying] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Generate stamp in real-time
  const activeStamp = useMemo(() => {
    return generateInteractiveStamp({
      style: selectedStyle,
      shape: selectedShape,
      preset: selectedPreset,
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

  if (!isOpen) return null;

  const handleExploreDesign = () => {
    setIsApplying(true);
    loadAiGeneratedStamp({
      title: activeStamp.title,
      shape: activeStamp.shape,
      widthMm: activeStamp.widthMm,
      heightMm: activeStamp.heightMm,
      inkColor: activeStamp.inkColor,
      elements: JSON.parse(JSON.stringify(activeStamp.elements)),
    });

    setTimeout(() => {
      setIsApplying(false);
      onClose();
    }, 350);
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
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Interactive Stamp Builder"
        className="fx-menu relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 text-slate-800 dark:text-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Interactive Stamp Studio
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pick your style, shape & layout — instant real-time vector preview
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Simple & Catchy Controls (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* 1. Design Style */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Design Style
                  </h3>
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
                        className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {st.title}
                          </span>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-white stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {st.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Shape Selector (Segmented Pills) */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Stamp Shape
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {SHAPE_OPTIONS.map((sh) => {
                    const isSelected = selectedShape === sh.id;
                    return (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() => setSelectedShape(sh.id)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Layout Preset
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {CONTENT_PRESETS.map((pr) => {
                    const isSelected = selectedPreset === pr.id;
                    const Icon = pr.icon;
                    return (
                      <button
                        key={pr.id}
                        type="button"
                        onClick={() => setSelectedPreset(pr.id)}
                        className={`flex items-center gap-2 py-2 px-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
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

                  {isApplying && (
                    <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[1px] flex items-center justify-center z-20">
                      <div className="px-3.5 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 fx-pop-in">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        Loaded into Studio!
                      </div>
                    </div>
                  )}
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
};
