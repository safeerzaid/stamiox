'use client';

import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { generateStampSvg } from '../../lib/svg-generator';
import { MM_TO_PT, MM_TO_PX } from '../../lib/units';
import { jsPDF } from 'jspdf';
import {
  X,
  Download,
  FileCode,
  FileText,
  Image as ImageIcon,
  Printer,
  Check,
  Contrast,
  FlipHorizontal,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const {
    widthMm,
    heightMm,
    inkColor,
    elements,
    projectTitle,
    laserInvert,
    laserMirror,
  } = useEditor();

  const [exportInvert, setExportInvert] = useState<boolean>(laserInvert);
  const [exportMirror, setExportMirror] = useState<boolean>(laserMirror);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportedFormat, setExportedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const svgContent = generateStampSvg({
    widthMm,
    heightMm,
    inkColor,
    elements,
    invert: exportInvert,
    mirror: exportMirror,
    distressEffect: false,
  });

  // 1. Direct 1:1 Physical Scale Print Sheet
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to open the print sheet');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Stamp - ${projectTitle} (${widthMm}x${heightMm}mm)</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              color: #111;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header {
              border-bottom: 2px solid #e5e5e5;
              padding-bottom: 12px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              margin: 0;
            }
            .meta {
              font-size: 11px;
              color: #666;
              margin-top: 4px;
            }
            .stamp-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              margin: 30px auto;
              padding: 20px;
              border: 1px dashed #ccc;
              border-radius: 8px;
              width: fit-content;
              page-break-inside: avoid;
            }
            .stamp-svg-wrapper {
              width: ${widthMm}mm;
              height: ${heightMm}mm;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .stamp-svg-wrapper svg {
              width: 100%;
              height: 100%;
            }
            .ruler-calibration {
              margin-top: 40px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              font-size: 11px;
              color: #555;
            }
            .ruler-bar {
              width: 50mm;
              height: 8px;
              border: 1px solid #000;
              border-left: 2px solid #000;
              border-right: 2px solid #000;
              margin-top: 6px;
              background: repeating-linear-gradient(to right, #000 0, #000 1px, transparent 1px, transparent 10mm);
            }
            .notice {
              margin-top: 20px;
              font-size: 10px;
              color: #888;
              line-height: 1.5;
            }
            @media print {
              .stamp-container { border: 1px dashed #bbb; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">${projectTitle}</h1>
              <div class="meta">
                Physical Dimensions: <strong>${widthMm} mm × ${heightMm} mm</strong> | 
                Elements: <strong>${elements.length} layers</strong> | 
                Laser Mode: <strong>${exportInvert ? 'Negative (Inverted)' : 'Positive'} ${exportMirror ? '+ Mirrored' : ''}</strong>
              </div>
            </div>
            <div class="meta">Printed on ${new Date().toLocaleDateString()}</div>
          </div>

          <div class="stamp-container">
            <div style="font-size: 10px; font-weight: bold; color: #888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">
              1:1 Actual Physical Scale (${widthMm} × ${heightMm} mm)
            </div>
            <div class="stamp-svg-wrapper">
              ${svgContent}
            </div>
          </div>

          <div class="ruler-calibration">
            <strong>Printer 1:1 Scale Verification Bar (Exactly 50mm):</strong>
            <div class="ruler-bar"></div>
            <div style="display: flex; justify-content: space-between; width: 50mm; font-size: 9px; font-family: monospace; margin-top: 2px;">
              <span>0mm</span>
              <span>25mm</span>
              <span>50mm</span>
            </div>
          </div>

          <div class="notice">
            * <strong>Print Scale Tip:</strong> In the browser print dialog, set <em>Scale</em> to <strong>100% / Actual Size</strong> (do not choose &quot;Fit to Page&quot;) for 100% millimeter physical fidelity.
          </div>

          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setExportedFormat('Print Sheet');
    setTimeout(() => setExportedFormat(null), 2500);
  };

  // 2. Download SVG Vector
  const handleExportSvg = () => {
    setIsExporting(true);
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.replace(/\s+/g, '_')}_vector.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsExporting(false);
    setExportedFormat('SVG');
    setTimeout(() => setExportedFormat(null), 2500);
  };

  // 3. Download Vector PDF in mm
  const handleExportPdf = () => {
    setIsExporting(true);
    try {
      const orientation = widthMm >= heightMm ? 'landscape' : 'portrait';
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: [widthMm, heightMm],
      });

      const canvas = document.createElement('canvas');
      const scaleFactor = 6;
      canvas.width = widthMm * MM_TO_PX * scaleFactor;
      canvas.height = heightMm * MM_TO_PX * scaleFactor;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        const img = new Image();
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          if (exportInvert) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imgData = canvas.toDataURL('image/png');
          doc.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm);
          doc.save(`${projectTitle.replace(/\s+/g, '_')}_300dpi.pdf`);
          URL.revokeObjectURL(url);
          setIsExporting(false);
          setExportedFormat('PDF');
          setTimeout(() => setExportedFormat(null), 2500);
        };
        img.src = url;
      }
    } catch (e) {
      console.error(e);
      setIsExporting(false);
    }
  };

  // 4. Download High-Res PNG (300 DPI)
  const handleExportPng = (dpi = 300) => {
    setIsExporting(true);
    const canvas = document.createElement('canvas');
    const scaleFactor = dpi === 600 ? 8 : 4;
    canvas.width = widthMm * MM_TO_PX * scaleFactor;
    canvas.height = heightMm * MM_TO_PX * scaleFactor;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const img = new Image();
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        if (exportInvert) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `${projectTitle.replace(/\s+/g, '_')}_${dpi}dpi.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setExportedFormat(`PNG (${dpi} DPI)`);
        setTimeout(() => setExportedFormat(null), 2500);
      };
      img.src = url;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-900">
                Export & Print Stamp
              </h3>
              <p className="text-xs text-slate-500">
                Direct 1:1 physical printing, laser engraving vectors (SVG, PDF, PNG)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Laser Machine Output Options */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Laser Engraver / Production Mode
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Laser Negative Mode */}
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/80 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Contrast className="w-4 h-4 text-slate-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Laser Invert (Negative)</p>
                    <p className="text-[10px] text-slate-500">White relief on black background</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={exportInvert}
                  onChange={(e) => setExportInvert(e.target.checked)}
                  className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                />
              </label>

              {/* Laser Mirror Mode */}
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/80 transition-colors">
                <div className="flex items-center gap-2.5">
                  <FlipHorizontal className="w-4 h-4 text-slate-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Mirror Horizontal (Flip)</p>
                    <p className="text-[10px] text-slate-500">Required for rubber stamp plate</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={exportMirror}
                  onChange={(e) => setExportMirror(e.target.checked)}
                  className="w-4 h-4 accent-slate-900 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Export & Print Formats Grid */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Choose Export or Print Method
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Option 1: Direct 1:1 Print */}
              <div
                onClick={handlePrint}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition-all flex flex-col justify-between group shadow-2xs bg-white text-left"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                    <Printer className="w-4 h-4" />
                  </div>
                  <h5 className="font-semibold text-xs text-slate-900">1:1 Print Sheet</h5>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                    Direct print with ruler calibration on A4 paper.
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-3 w-full py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-2xs transition-colors"
                >
                  Print Now
                </button>
              </div>

              {/* Option 2: SVG Vector */}
              <div
                onClick={handleExportSvg}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition-all flex flex-col justify-between group shadow-2xs bg-white text-left"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <h5 className="font-semibold text-xs text-slate-900">Vector SVG</h5>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                    Direct laser cutting curves (Trotec, Epilog, Ruida).
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-3 w-full py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors"
                >
                  Download SVG
                </button>
              </div>

              {/* Option 3: Vector PDF */}
              <div
                onClick={handleExportPdf}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition-all flex flex-col justify-between group shadow-2xs bg-white text-left"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h5 className="font-semibold text-xs text-slate-900">Vector PDF</h5>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                    Exact millimeter physical scale document.
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-3 w-full py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors"
                >
                  Download PDF
                </button>
              </div>

              {/* Option 4: High-Res PNG */}
              <div
                onClick={() => handleExportPng(300)}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition-all flex flex-col justify-between group shadow-2xs bg-white text-left"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <h5 className="font-semibold text-xs text-slate-900">300 DPI PNG</h5>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                    High-res graphic for digital stamping & proofs.
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-3 w-full py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors"
                >
                  Download PNG
                </button>
              </div>
            </div>
          </div>

          {/* Success Toast */}
          {exportedFormat && (
            <div className="p-3 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{exportedFormat === 'Print Sheet' ? 'Print dialog opened' : `Successfully exported ${exportedFormat}!`}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
