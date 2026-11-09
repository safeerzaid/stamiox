'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Building2,
  MapPin,
  Phone,
  Layers,
  Printer,
  Download,
  Sparkles,
  ArrowRight,
  Check,
  RotateCcw,
} from 'lucide-react';
import { generateStampSvg } from '../../lib/svg-generator';
import {
  generateOneClickStamps,
  GeneratedStampVariation,
} from '../../lib/one-click-generator';

const INK_SWATCHES = [
  { id: 'blue', name: 'Stamp Blue', hex: '#1e3a8a' },
  { id: 'navy', name: 'Official Navy', hex: '#0f172a' },
  { id: 'red', name: 'Official Red', hex: '#dc2626' },
  { id: 'green', name: 'Desk Green', hex: '#15803d' },
  { id: 'violet', name: 'Violet', hex: '#6b21a8' },
  { id: 'black', name: 'Carbon Black', hex: '#111827' },
];

export default function AiStampMakerPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState('TRIVANDRUM TRADERS CO.');
  const [address, setAddress] = useState('STATUE JUNCTION, TRIVANDRUM, KERALA');
  const [phone, setPhone] = useState('PH: 0471-2334455 · GSTIN: 32AABCT1234F1Z8');
  const [selectedInk, setSelectedInk] = useState('#1e3a8a');

  // Real-time generator
  const variations = useMemo(() => {
    return generateOneClickStamps({
      companyName,
      address,
      phone,
      inkColor: selectedInk,
    });
  }, [companyName, address, phone, selectedInk]);

  // Pre-rendered SVG previews
  const svgMap = useMemo(() => {
    const map: Record<string, string> = {};
    variations.forEach((v) => {
      map[v.id] = generateStampSvg({
        widthMm: v.widthMm,
        heightMm: v.heightMm,
        inkColor: v.inkColor,
        elements: v.elements,
        shape: v.shape,
      });
    });
    return map;
  }, [variations]);

  const handleOpenInEditor = (variation: GeneratedStampVariation) => {
    try {
      localStorage.setItem(
        'stamiox_ai_pending_stamp',
        JSON.stringify({
          title: variation.title,
          shape: variation.shape,
          widthMm: variation.widthMm,
          heightMm: variation.heightMm,
          inkColor: variation.inkColor,
          elements: variation.elements,
        })
      );
    } catch {}
    router.push('/editor');
  };

  const handleDownloadSvg = (variation: GeneratedStampVariation, e: React.MouseEvent) => {
    e.stopPropagation();
    const rawSvg = generateStampSvg({
      widthMm: variation.widthMm,
      heightMm: variation.heightMm,
      inkColor: variation.inkColor,
      elements: variation.elements,
      shape: variation.shape,
    });
    const blob = new Blob([rawSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${variation.title.replace(/[^a-z0-9]/gi, '_')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintOne = (variation: GeneratedStampVariation, e: React.MouseEvent) => {
    e.stopPropagation();
    const rawSvg = generateStampSvg({
      widthMm: variation.widthMm,
      heightMm: variation.heightMm,
      inkColor: variation.inkColor,
      elements: variation.elements,
      shape: variation.shape,
    });

    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${variation.title}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: -apple-system, sans-serif; margin: 0; padding: 20px; color: #111; }
            .header { border-bottom: 2px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            .stamp-box { border: 1px dashed #bbb; padding: 20px; width: fit-content; margin: 30px auto; text-align: center; }
            .stamp-inner { width: ${variation.widthMm}mm; height: ${variation.heightMm}mm; margin: 0 auto; display: flex; align-items: center; justify-content: center; }
            .ruler { width: 50mm; height: 3px; background: #000; margin: 8px auto; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><strong>${variation.title}</strong> — 1:1 Scale</div>
            <div>${variation.widthMm} × ${variation.heightMm} mm</div>
          </div>
          <div class="stamp-box">
            <div style="font-size: 10px; color: #666; margin-bottom: 6px;">1:1 SCALE VERIFICATION</div>
            <div class="stamp-inner">${rawSvg}</div>
          </div>
          <div style="text-align: center; font-size: 11px; color: #666;">
            <strong>Calibration Ruler (50mm):</strong>
            <div class="ruler"></div>
            <span>* Ensure browser print scale is 100% (Actual Size).</span>
          </div>
          <script>window.onload = () => { setTimeout(() => window.print(), 300); };</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleSampleFill = () => {
    setCompanyName('APEX INFOTECH SOLUTIONS');
    setAddress('MG ROAD, KOCHI, KERALA');
    setPhone('PH: +91 98470 12345 · GST: 32AAAAA0000A1Z5');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 py-10 transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 text-[#0d99ff] text-xs font-bold mb-2">
              <Zap className="w-3.5 h-3.5 fill-[#0d99ff]" />
              <span>Instant CAD Stamp Generator</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-[-0.035em] text-[#111827] dark:text-white">
              One-Click Stamp Design
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
              Enter your Company Name, Address, and Phone. All 6 official stamp formats generate simultaneously in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSampleFill}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Try Sample</span>
            </button>
            <Link
              href="/editor"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span>Open Blank Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Quick Details Input Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Field 1: Company */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                Company / Org Name <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Infotech Solutions"
                  className="w-full h-10 pl-10 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-[#0d99ff] focus:ring-1 focus:ring-[#0d99ff]/20 text-xs font-bold text-slate-900 dark:text-white outline-none transition-all placeholder:font-normal placeholder:text-slate-400"
                  style={{ height: '40px', paddingLeft: '38px' }}
                />
              </div>
            </div>

            {/* Field 2: Address */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                Address / Location
              </label>
              <div className="relative flex items-center">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. MG Road, Kochi, Kerala"
                  className="w-full h-10 pl-10 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-[#0d99ff] focus:ring-1 focus:ring-[#0d99ff]/20 text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                  style={{ height: '40px', paddingLeft: '38px' }}
                />
              </div>
            </div>

            {/* Field 3: Phone */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                Phone / GSTIN / Reg
              </label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98470 12345 · GST: ..."
                  className="w-full h-10 pl-10 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-[#0d99ff] focus:ring-1 focus:ring-[#0d99ff]/20 text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                  style={{ height: '40px', paddingLeft: '38px' }}
                />
              </div>
            </div>
          </div>

          {/* Color Swatches */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Ink Color:
              </span>
              <div className="flex items-center gap-1.5">
                {INK_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.id}
                    type="button"
                    onClick={() => setSelectedInk(swatch.hex)}
                    title={swatch.name}
                    className={`w-6 h-6 rounded-full transition-all cursor-pointer relative ${
                      selectedInk === swatch.hex
                        ? 'ring-2 ring-[#0d99ff] ring-offset-1 scale-110 shadow-xs'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                  >
                    {selectedInk === swatch.hex && (
                      <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-slate-400">
              Click any stamp to edit in studio or print 1:1
            </span>
          </div>
        </div>

        {/* Variations Output Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#0d99ff]" />
              <span>Available Stamp Layouts ({variations.length})</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              100% Vector Precision CAD
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {variations.map((v) => {
              const shortTitle = v.title.split('—')[1]?.trim() || v.title;

              return (
                <div
                  key={v.id}
                  onClick={() => handleOpenInEditor(v)}
                  className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#0d99ff] dark:hover:border-[#0d99ff] hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden cursor-pointer relative"
                >
                  {/* Card Header Strip: Category & Exact Dimensions */}
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {v.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {v.widthMm} × {v.heightMm} mm
                    </span>
                  </div>

                  {/* SVG Preview Stage with Proportional Scaling */}
                  <div
                    className="h-44 p-4 bg-slate-50/40 dark:bg-slate-950/40 flex items-center justify-center relative group-hover:bg-blue-50/15 dark:group-hover:bg-slate-850/30 transition-colors overflow-hidden"
                    title="Click to Open in Full Studio Editor"
                  >
                    <div
                      className={`w-full h-full flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200 drop-shadow-xs ${
                        v.shape === 'RECTANGULAR'
                          ? '[&>svg]:w-auto [&>svg]:h-auto [&>svg]:max-w-[92%] [&>svg]:max-h-[82%]'
                          : '[&>svg]:w-auto [&>svg]:h-auto [&>svg]:max-w-[80%] [&>svg]:max-h-[80%]'
                      } [&>svg]:mx-auto [&>svg]:my-auto`}
                      dangerouslySetInnerHTML={{ __html: svgMap[v.id] || '' }}
                    />

                    {/* Sleek Hover Action Pill */}
                    <div className="absolute inset-x-0 bottom-2.5 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                      <span className="px-3 py-1 rounded-full bg-[#0d99ff] text-white text-[11px] font-bold shadow-md flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        Open in Studio
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Clean Title & Quick Print Icon */}
                  <div className="px-3.5 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {shortTitle}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handlePrintOne(v, e)}
                      title="Direct 1:1 Scale Print"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

