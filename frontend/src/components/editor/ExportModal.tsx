'use client';

import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { generateStampSvg } from '../../lib/svg-generator';
import { MM_TO_PX } from '../../lib/units';
import { jsPDF } from 'jspdf';
import {
  X,
  Download,
  FileCode,
  FileText,
  Image as ImageIcon,
  Printer,
  Copy,
  Check,
  MessageCircle,
  Camera,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenARModal?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onOpenARModal }) => {
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
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('svg'); // SVG is default
  const [copiedImage, setCopiedImage] = useState<boolean>(false);

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

  // Helper: Generate high-resolution PNG Blob (300 DPI)
  const generatePngBlob = async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const scaleFactor = 4; // ~300 DPI high-res
      canvas.width = widthMm * MM_TO_PX * scaleFactor;
      canvas.height = heightMm * MM_TO_PX * scaleFactor;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      const img = new Image();
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        if (exportInvert) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    });
  };

  // 1. Direct 1:1 Physical Scale Print Sheet
  const handlePrint = () => {
    setExportingKey('print');
    const printHtml = `
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
              align-items: flex-start;
              margin: 30px 0;
            }
            .stamp-svg-wrapper {
              width: ${widthMm}mm;
              height: ${heightMm}mm;
              display: flex;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
            }
            .stamp-svg-wrapper svg {
              width: 100%;
              height: 100%;
            }
            .ruler-calibration {
              margin-top: 40px;
              padding-top: 15px;
              border-top: 1px dashed #ccc;
              font-size: 11px;
              color: #555;
            }
            .ruler-bar {
              width: 50mm;
              height: 4mm;
              background: repeating-linear-gradient(
                to right,
                #000,
                #000 1mm,
                #fff 1mm,
                #fff 2mm
              );
              border: 1px solid #000;
              margin-top: 5px;
            }
            .notice {
              margin-top: 25px;
              font-size: 10px;
              color: #777;
              background: #f8f8f8;
              padding: 10px;
              border-radius: 4px;
              border-left: 3px solid #000;
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
            * <strong>Print Scale Tip:</strong> In the browser print dialog, set <em>Scale</em> to <strong>100% / Actual Size</strong> for 100% millimeter physical fidelity.
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
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
      setTimeout(() => setExportingKey(null), 1000);
    } else {
      // Fallback: Invisible iframe to bypass popup blocker
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(printHtml);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            setExportingKey(null);
          }, 2000);
        }, 500);
      } else {
        setExportingKey(null);
      }
    }
  };

  // 2. Download SVG Vector
  const handleExportSvg = () => {
    setExportingKey('svg');
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle.replace(/\s+/g, '_')}_vector.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setTimeout(() => setExportingKey(null), 1000);
  };

  // 3. Download Vector PDF in mm
  const handleExportPdf = () => {
    setExportingKey('pdf');
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
          setTimeout(() => setExportingKey(null), 1000);
        };
        img.src = url;
      }
    } catch (e) {
      console.error(e);
      setExportingKey(null);
    }
  };

  // 4. Download High-Res PNG (300 DPI)
  const handleExportPng = async () => {
    setExportingKey('png');
    const blob = await generatePngBlob();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectTitle.replace(/\s+/g, '_')}_300dpi.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    setTimeout(() => setExportingKey(null), 1000);
  };

  // 5. Copy 300 DPI PNG Image to Clipboard (Paste into WhatsApp Web, Word, Slack, etc.)
  const handleCopyImage = async () => {
    try {
      const blob = await generatePngBlob();
      if (!blob) throw new Error('Could not generate PNG blob');

      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2000);
      } else {
        handleExportPng();
      }
    } catch (err) {
      console.error('Failed to copy image:', err);
      handleExportPng();
    }
  };

  // 6. WhatsApp Share
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Stamp Design Proof: *${projectTitle}*\n` +
      `Physical Size: ${widthMm} mm × ${heightMm} mm\n` +
      `Ink Color: ${inkColor}\n` +
      `Laser Mode: ${exportInvert ? 'Negative (Invert)' : 'Positive'}${exportMirror ? ' + Mirrored' : ''}\n\n` +
      `Designed with Stamiox Rubber Stamp Studio`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const formats = [
    { key: 'svg', title: 'Vector SVG', hint: 'Laser engraving — Trotec, Epilog, Ruida, LightBurn', Icon: FileCode, run: handleExportSvg, cta: 'Download SVG', best: true },
    { key: 'pdf', title: 'Vector PDF', hint: 'Exact 1:1 mm scale document for high-res printing', Icon: FileText, run: handleExportPdf, cta: 'Download PDF' },
    { key: 'png', title: 'PNG Image', hint: '300 DPI high-res proof for digital use & preview', Icon: ImageIcon, run: handleExportPng, cta: 'Download PNG' },
  ];
  const chosen = formats.find((f) => f.key === selectedFormat) || formats[0];
  const busy = exportingKey === chosen.key;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Export stamp"
        className="fx-menu relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ring-1 ring-slate-200/90 dark:ring-slate-800 p-5 text-slate-800 dark:text-slate-100 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3.5">
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Export & Share</h3>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {projectTitle} · <strong className="font-semibold text-slate-700 dark:text-slate-200">{widthMm} × {heightMm} mm</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selection List */}
        <div className="space-y-1.5" role="radiogroup" aria-label="Export format">
          {formats.map((f) => {
            const active = f.key === chosen.key;
            return (
              <button
                key={f.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelectedFormat(f.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#e5f2ff] dark:bg-blue-950/50 ring-1 ring-[#0d99ff]/50'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 ring-1 ring-transparent'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? 'border-[#0d99ff]' : 'border-slate-300 dark:border-slate-600'}`}>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-[#0d99ff]" />}
                </span>
                <f.Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#0d99ff]' : 'text-slate-400'}`} />
                <span className="flex-1 min-w-0 leading-tight">
                  <span className="flex items-center gap-1.5">
                    <span className={`text-[12px] font-medium ${active ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>{f.title}</span>
                    {f.best && <span className="px-1.5 py-px rounded text-[9px] font-semibold bg-[#0d99ff] text-white">Laser</span>}
                  </span>
                  <span className="block text-[11px] text-slate-400 truncate mt-0.5">{f.hint}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Laser Invert / Mirror Options */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[11px] font-medium text-slate-400">Laser:</span>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              <input
                type="checkbox"
                checked={exportInvert}
                onChange={(e) => setExportInvert(e.target.checked)}
                className="rounded text-[#0d99ff] cursor-pointer"
              />
              <span>Negative</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              <input
                type="checkbox"
                checked={exportMirror}
                onChange={(e) => setExportMirror(e.target.checked)}
                className="rounded text-[#0d99ff] cursor-pointer"
              />
              <span>Mirror</span>
            </label>
          </div>
        </div>

        {/* Primary Download Button */}
        <button
          type="button"
          onClick={chosen.run}
          disabled={busy}
          className="mt-3.5 w-full h-10 rounded-xl bg-[#0d99ff] hover:bg-[#0b87e0] active:scale-[0.99] disabled:opacity-70 text-white text-[13px] font-semibold flex items-center justify-center gap-2 shadow-[0_6px_16px_-4px_rgba(13,153,255,0.7)] transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{busy ? 'Preparing…' : chosen.cta}</span>
        </button>

        {/* Direct Print & Quick Share Actions */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {/* Direct Print 1:1 Button */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={exportingKey === 'print'}
            className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#0d99ff] hover:bg-[#f0f8ff] dark:hover:bg-blue-950/30 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#0d99ff]" />
            <span>{exportingKey === 'print' ? 'Opening Print…' : 'Direct Print (1:1 Scale)'}</span>
          </button>

          {/* Quick Share Row: Copy Image & WhatsApp */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyImage}
              className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                copiedImage
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
              title="Copy 300 DPI stamp image to clipboard (Paste in WhatsApp Web, Word, Slack)"
            >
              {copiedImage ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedImage ? 'Copied Image!' : 'Copy Image'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500/60 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Share stamp proof with client via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Real-World AR Preview Launch */}
          {onOpenARModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenARModal();
              }}
              className="w-full h-8.5 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100/70 text-[#0d99ff] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Real-World AR Camera Preview</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
