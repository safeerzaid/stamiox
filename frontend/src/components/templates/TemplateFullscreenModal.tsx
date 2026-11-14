'use client';

import React, { useState, useEffect } from 'react';
import { useSmoothClose } from '../../hooks/useSmoothClose';
import { StampTemplate } from '../../types/stamp';
import { generateStampSvg } from '../../lib/svg-generator';
import { STAMP_INK_COLORS } from '../../lib/units';
import {
  X,
  Layers,
  Edit3,
  Printer,
  Download,
  Contrast,
  FlipHorizontal,
  Sparkles,
  Check,
  Compass,
  FileText,
  Maximize2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface TemplateFullscreenModalProps {
  template: StampTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenInStudio: (template: StampTemplate) => void;
  onQuickCustomize: (template: StampTemplate) => void;
}

export const TemplateFullscreenModal: React.FC<TemplateFullscreenModalProps> = ({
  template,
  isOpen,
  onClose,
  onOpenInStudio,
  onQuickCustomize,
}) => {
  const [inkColor, setInkColor] = useState<string>(template?.defaultData?.inkColor || '#1e3a8a');
  const [invert, setInvert] = useState<boolean>(false);
  const [mirror, setMirror] = useState<boolean>(false);
  const [distress, setDistress] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1.8);
  const [downloadToast, setDownloadToast] = useState<boolean>(false);
  const { closing, close } = useSmoothClose(onClose, isOpen);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  // show each template in its own ink (the modal is created before any template is opened)
  useEffect(() => {
    if (template) setInkColor(template.defaultData?.inkColor || '#111827');
  }, [template?.id]);

  if (!isOpen || !template) return null;

  const effectiveInk = template.defaultData?.inkColor || inkColor;

  const svgPreview = generateStampSvg({
    widthMm: template.widthMm,
    heightMm: template.heightMm,
    inkColor: inkColor,
    elements: template.defaultData?.elements || [],
    invert,
    mirror,
    distressEffect: distress,
  });

  // Direct 1:1 Physical Scale Print Sheet
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the stamp sheet');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Stamp - ${template.title} (${template.widthMm}x${template.heightMm}mm)</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; color: #111; background: #fff; }
            .header { border-bottom: 2px solid #e5e5e5; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 18px; font-weight: bold; margin: 0; }
            .meta { font-size: 11px; color: #666; margin-top: 4px; }
            .stamp-container { display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 30px auto; padding: 20px; border: 1px dashed #ccc; border-radius: 8px; width: fit-content; }
            .stamp-svg-wrapper { width: ${template.widthMm}mm; height: ${template.heightMm}mm; display: flex; align-items: center; justify-content: center; }
            .stamp-svg-wrapper svg { width: 100%; height: 100%; }
            .ruler-calibration { margin-top: 40px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 11px; color: #555; }
            .ruler-bar { width: 50mm; height: 8px; border: 1px solid #000; border-left: 2px solid #000; border-right: 2px solid #000; margin-top: 6px; background: repeating-linear-gradient(to right, #000 0, #000 1px, transparent 1px, transparent 10mm); }
            .notice { margin-top: 20px; font-size: 10px; color: #888; line-height: 1.5; }
            @media print { .stamp-container { border: 1px dashed #bbb; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">${template.title}</h1>
              <div class="meta">Physical Dimensions: <strong>${template.widthMm} × ${template.heightMm} mm</strong> (${template.shape})</div>
            </div>
            <div class="meta">Printed on ${new Date().toLocaleDateString()}</div>
          </div>
          <div class="stamp-container">
            <div style="font-size: 10px; font-weight: bold; color: #888; margin-bottom: 8px;">1:1 ACTUAL PHYSICAL SIZE (${template.widthMm} × ${template.heightMm} mm)</div>
            <div class="stamp-svg-wrapper">${svgPreview}</div>
          </div>
          <div class="ruler-calibration">
            <strong>1:1 Verification Bar (50mm):</strong>
            <div class="ruler-bar"></div>
            <div style="display: flex; justify-content: space-between; width: 50mm; font-size: 9px; font-family: monospace; margin-top: 2px;"><span>0mm</span><span>25mm</span><span>50mm</span></div>
          </div>
          <div class="notice">* <strong>Print Tip:</strong> Select <strong>Scale: 100% (Actual Size)</strong> in print settings for millimeter accuracy.</div>
          <script>window.onload = () => { setTimeout(() => window.print(), 300); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([svgPreview], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.title.replace(/\s+/g, '_')}_template.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 2000);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md fx-modal-backdrop ${closing ? 'fx-modal-closing' : ''}`}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[92vh] fx-modal-open">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate max-w-md">
                  {template.title}
                </h2>
                <span className="text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                  {template.shape}
                </span>
                <span className="text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/60">
                  {template.widthMm} × {template.heightMm} mm
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {template.description}
              </p>
            </div>
          </div>

          <button
            onClick={close}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Content: Left Visual Stage & Right Inspector */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* Left: Interactive Stamp Canvas Stage */}
          <div className="flex-1 bg-slate-100/70 dark:bg-slate-950/60 p-6 flex flex-col items-center justify-between overflow-y-auto relative border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
            {/* Top Preview Status Bar */}
            <div className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 px-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                1:1 High-Precision Vector Rendering
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomScale((z) => Math.max(1.0, Number((z - 0.2).toFixed(1))))}
                  className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                  title="Zoom Out"
                >
                  -
                </button>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 min-w-[42px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  onClick={() => setZoomScale((z) => Math.min(3.5, Number((z + 0.2).toFixed(1))))}
                  className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                  title="Zoom In"
                >
                  +
                </button>
              </div>
            </div>

            {/* Stamp Stage Canvas */}
            <div className="flex-1 flex items-center justify-center my-auto py-4 fx-modal-stamp">
              <div
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                }}
                className={`p-6 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-center ${
                  invert ? 'bg-black dark:bg-black' : ''
                }`}
              >
                <div
                  className={`w-48 h-48 flex items-center justify-center ${invert ? '' : 'ink-preview'}`}
                  dangerouslySetInnerHTML={{ __html: svgPreview }}
                />
              </div>
            </div>

            {/* Bottom Real-time Filters & Options Bar */}
            <div className="w-full mt-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs text-xs">
              {/* Ink Color Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Ink Color:</span>
                <div className="flex items-center gap-1.5">
                  {STAMP_INK_COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setInkColor(c.hex)}
                      className={`w-6 h-6 rounded-full transition-all cursor-pointer ${
                        inkColor === c.hex
                          ? 'ring-2 ring-slate-900 dark:ring-white ring-offset-2 scale-110 shadow-xs'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* View Toggle Switches */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInvert(!invert)}
                  className={`px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all border cursor-pointer ${
                    invert
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                  title="Laser Negative Relief Mode"
                >
                  <Contrast className="w-3.5 h-3.5" />
                  <span>Negative</span>
                </button>

                <button
                  onClick={() => setMirror(!mirror)}
                  className={`px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all border cursor-pointer ${
                    mirror
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                  title="Mirror Flip Horizontal"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Mirror</span>
                </button>

                <button
                  onClick={() => setDistress(!distress)}
                  className={`px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all border cursor-pointer ${
                    distress
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                  title="Simulate Real Ink Stamping Texture"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Vintage Ink</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Template Specs, Details & Action Buttons */}
          <div className="w-full lg:w-96 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between overflow-y-auto space-y-6 shrink-0">
            {/* Top Specs */}
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Template Specifications
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                  {template.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {template.description}
                </p>
              </div>

              {/* Hardware Sizing Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Physical Dimensions</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {template.widthMm} × {template.heightMm} mm
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Stamp Casing Shape</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{template.shape.toLowerCase()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Compatible Hardware</span>
                  <span className="font-bold text-[#0d99ff] bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                    Colop / Trodat / Shiny
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Design Layers</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {template.defaultData?.elements?.length || 0} vector elements
                  </span>
                </div>
              </div>

              {/* Text Fields Summary */}
              {template.defaultData?.fields && Object.keys(template.defaultData.fields).length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Customizable Text Fields
                  </span>
                  <div className="space-y-1.5">
                    {Object.entries(template.defaultData.fields).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs"
                      >
                        <span className="text-slate-500 dark:text-slate-400 capitalize font-medium truncate mr-2">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              {/* 1. Primary: Open in Full Studio Vector Editor */}
              <button
                onClick={() => {
                  onOpenInStudio(template);
                  onClose();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 dark:bg-[#0d99ff] hover:bg-slate-800 dark:hover:bg-[#0b87e0] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Layers className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                <span>Open in Full Vector Studio</span>
              </button>

              {/* 2. Secondary: Quick Customize Modal */}
              <button
                onClick={() => {
                  onClose();
                  onQuickCustomize(template);
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>Quick Text Customizer</span>
              </button>

              {/* 3. Utility Row: Direct Print & SVG Download */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handlePrint}
                  className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Print 1:1 Actual Scale on A4 Paper"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  <span>1:1 Print Sheet</span>
                </button>

                <button
                  onClick={handleDownloadSvg}
                  className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Download Raw Vector SVG"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  <span>Download SVG</span>
                </button>
              </div>

              {/* Success Toast */}
              {downloadToast && (
                <div className="p-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>SVG downloaded successfully!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
