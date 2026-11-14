'use client';

import { requireLogin } from '../../lib/require-login';
import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Zap,
  Printer,
  Layers,
  Check,
  Building2,
  MapPin,
  Phone,
  RotateCcw,
} from 'lucide-react';
import { useEditor } from '../../context/EditorContext';
import { generateStampSvg } from '../../lib/svg-generator';
import {
  generateOneClickStamps,
  GeneratedStampVariation,
} from '../../lib/one-click-generator';

interface OneClickStampModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INK_SWATCHES = [
  { id: 'blue', name: 'Stamp Blue', hex: '#1e3a8a' },
  { id: 'navy', name: 'Official Navy', hex: '#0f172a' },
  { id: 'red', name: 'Official Red', hex: '#dc2626' },
  { id: 'green', name: 'Desk Green', hex: '#15803d' },
  { id: 'violet', name: 'Violet', hex: '#6b21a8' },
  { id: 'black', name: 'Carbon Black', hex: '#111827' },
];

export const OneClickStampModal: React.FC<OneClickStampModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { loadAiGeneratedStamp } = useEditor();

  const [companyName, setCompanyName] = useState('APEX INFOTECH SOLUTIONS');
  const [address, setAddress] = useState('MG ROAD, KOCHI, KERALA');
  const [phone, setPhone] = useState('+91 98470 12345 · GST: 32AAAAA0000A1Z5');
  const [selectedInk, setSelectedInk] = useState('#1e3a8a');
  const [appliedId, setAppliedId] = useState<string | null>(null);

  // Esc key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Generate 6 variations in real-time
  const variations = useMemo(() => {
    return generateOneClickStamps({
      companyName,
      address,
      phone,
      inkColor: selectedInk,
    });
  }, [companyName, address, phone, selectedInk]);

  // Pre-generate SVGs for all variations
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

  if (!isOpen) return null;

  const handleApplyToCanvas = (variation: GeneratedStampVariation) => {
    setAppliedId(variation.id);
    loadAiGeneratedStamp({
      title: variation.title,
      shape: variation.shape,
      widthMm: variation.widthMm,
      heightMm: variation.heightMm,
      inkColor: variation.inkColor,
      elements: JSON.parse(JSON.stringify(variation.elements)),
    });

    setTimeout(() => {
      setAppliedId(null);
      onClose();
    }, 450);
  };

  const handlePrintOne = (variation: GeneratedStampVariation, e: React.MouseEvent) => {
    e.stopPropagation();
    // printing is an export — guests log in first
    let signedIn = false;
    try { signedIn = !!localStorage.getItem('stamiox_auth_token'); } catch { /* ignore */ }
    if (!requireLogin(signedIn, 'export')) return;
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
            <div><strong>${variation.title}</strong> — 1:1 Physical Scale</div>
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
    setCompanyName('TRIVANDRUM TRADERS CO.');
    setAddress('STATUE JUNCTION, TRIVANDRUM');
    setPhone('PH: 0471-2334455 · GSTIN: 32AABCT1234F1Z8');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="One-Click Stamp Design"
        className="fx-menu relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 text-slate-800 dark:text-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Sleek, Clean Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0d99ff] text-white flex items-center justify-center shadow-xs shrink-0">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                One-Click Stamp Design
              </h3>
              <p className="text-[11px] text-slate-400">
                Auto-generates 6 ready-to-use stamp layouts in real-time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSampleFill}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Sample</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Slim Input Bar + 6 Stamp Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Clean Input Controls Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-850/90 border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Field 1: Company Name */}
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
                    className="w-full h-9.5 pl-10 pr-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-[#0d99ff] focus:ring-2 focus:ring-[#0d99ff]/15 text-xs font-bold text-slate-900 dark:text-white outline-none transition-all placeholder:font-normal placeholder:text-slate-400"
                    style={{ height: '38px', paddingLeft: '38px' }}
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
                    className="w-full h-9.5 pl-10 pr-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-[#0d99ff] focus:ring-2 focus:ring-[#0d99ff]/15 text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                    style={{ height: '38px', paddingLeft: '38px' }}
                  />
                </div>
              </div>

              {/* Field 3: Phone / GST */}
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
                    className="w-full h-9.5 pl-10 pr-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-[#0d99ff] focus:ring-2 focus:ring-[#0d99ff]/15 text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
                    style={{ height: '38px', paddingLeft: '38px' }}
                  />
                </div>
              </div>
            </div>

            {/* Ink Swatches & Tip Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Ink Color:
                </span>
                <div className="flex items-center gap-2">
                  {INK_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.id}
                      type="button"
                      onClick={() => setSelectedInk(swatch.hex)}
                      title={swatch.name}
                      className={`w-6 h-6 rounded-full transition-all cursor-pointer relative flex items-center justify-center ${
                        selectedInk === swatch.hex
                          ? 'ring-2 ring-[#0d99ff] ring-offset-2 scale-110 shadow-xs'
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {selectedInk === swatch.hex && (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <span className="text-xs text-slate-400 font-medium">
                Click any stamp layout to load into Studio
              </span>
            </div>
          </div>

          {/* Simple, Catchy 6-Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {variations.map((v) => {
              const isApplied = appliedId === v.id;
              // Clean label without redundant company prefix
              const shortTitle = v.title.split('—')[1]?.trim() || v.title;

              return (
                <div
                  key={v.id}
                  onClick={() => handleApplyToCanvas(v)}
                  className={`group rounded-2xl border bg-white dark:bg-slate-900 transition-all duration-200 flex flex-col overflow-hidden cursor-pointer relative ${
                    isApplied
                      ? 'ring-2 ring-[#0d99ff] border-[#0d99ff]'
                      : 'border-slate-200/90 dark:border-slate-800 hover:border-[#0d99ff] dark:hover:border-[#0d99ff] hover:shadow-lg'
                  }`}
                >
                  {/* Card Header Strip: Shape & Exact Size */}
                  <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {v.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {v.widthMm} × {v.heightMm} mm
                    </span>
                  </div>

                  {/* Stamp Stage: Artwork Front & Center */}
                  <div className="h-38 p-3.5 bg-slate-50/40 dark:bg-slate-950/40 flex items-center justify-center relative group-hover:bg-blue-50/15 dark:group-hover:bg-slate-850/30 transition-colors">
                    <div
                      className={`w-full h-full flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200 drop-shadow-xs ${
                        v.shape === 'RECTANGULAR'
                          ? '[&>svg]:w-auto [&>svg]:h-auto [&>svg]:max-w-[92%] [&>svg]:max-h-[82%]'
                          : '[&>svg]:w-auto [&>svg]:h-auto [&>svg]:max-w-[80%] [&>svg]:max-h-[80%]'
                      } [&>svg]:mx-auto [&>svg]:my-auto`}
                      dangerouslySetInnerHTML={{ __html: svgMap[v.id] || '' }}
                    />

                    {/* Sleek Hover Action Pill */}
                    <div className="absolute inset-x-0 bottom-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#0d99ff] text-white text-[10px] font-bold shadow-md flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        Open in Canvas
                      </span>
                    </div>

                    {/* Applied Toast Overlay */}
                    {isApplied && (
                      <div className="absolute inset-0 bg-[#0d99ff]/20 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="px-3 py-1.5 rounded-full bg-[#0d99ff] text-white text-xs font-bold shadow-lg flex items-center gap-1.5 fx-pop-in">
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          Loaded into Canvas!
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Clean Title & Quick Print Icon */}
                  <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {shortTitle}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handlePrintOne(v, e)}
                      title="Direct 1:1 Scale Print"
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
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
};
