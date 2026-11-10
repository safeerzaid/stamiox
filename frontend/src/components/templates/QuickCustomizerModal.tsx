'use client';

import React, { useState, useEffect } from 'react';
import { StampTemplate, StampElement } from '../../types/stamp';
import { generateStampSvg } from '../../lib/svg-generator';
import { STAMP_INK_COLORS } from '../../lib/units';
import {
  X,
  Edit3,
  Layers,
  Download,
  Sparkles,
  ArrowRight,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEditor } from '../../context/EditorContext';

interface QuickCustomizerModalProps {
  template: StampTemplate | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickCustomizerModal: React.FC<QuickCustomizerModalProps> = ({
  template,
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const { loadTemplate } = useEditor();

  const [fields, setFields] = useState<{ [key: string]: string }>({});
  const [inkColor, setInkColor] = useState<string>('#1e3a8a');
  const [elements, setElements] = useState<StampElement[]>([]);

  useEffect(() => {
    if (template) {
      setFields({ ...template.defaultData.fields });
      setInkColor(template.defaultData.inkColor || '#1e3a8a');
      setElements(JSON.parse(JSON.stringify(template.defaultData.elements || [])));
    }
  }, [template]);

  if (!isOpen || !template) return null;

  // Real-time synchronization: when user edits a field, update matching element text
  const handleFieldChange = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));

    // Map field keys to element texts
    setElements((prev) =>
      prev.map((el) => {
        if (el.type === 'arc-text') {
          if (key === 'companyName' || key === 'notaryName' || key === 'doctorName' || key === 'topText' || key === 'topArch') {
            if ((el as any).isReversed === false) return { ...el, text: value };
          }
          if (key === 'location' || key === 'county' || key === 'specialty' || key === 'bottomText' || key === 'bottomArch') {
            if ((el as any).isReversed === true) return { ...el, text: value };
          }
        }
        if (el.type === 'text') {
          if (key === 'centerText' && (el as any).id?.includes('center-line-1')) return { ...el, text: value };
          if (key === 'registrationNo' && (el as any).id?.includes('center-line-2')) return { ...el, text: value };
          if (key === 'line1' && (el as any).id?.includes('addr-line-1')) return { ...el, text: value };
          if (key === 'line2' && (el as any).id?.includes('addr-line-2')) return { ...el, text: value };
          if (key === 'line3' && (el as any).id?.includes('addr-line-3')) return { ...el, text: value };
          if (key === 'line4' && (el as any).id?.includes('addr-line-4')) return { ...el, text: value };
          if (key === 'mainStatus' && (el as any).id?.includes('paid-header-box')) return { ...el, text: value };
          if (key === 'dateStr' && (el as any).id?.includes('date-center-val')) return { ...el, text: value };
          if (key === 'initials' && (el as any).id?.includes('mono-initials')) return { ...el, text: value };
        }
        return el;
      })
    );
  };

  const svgPreview = generateStampSvg({
    widthMm: template.widthMm,
    heightMm: template.heightMm,
    inkColor,
    elements,
    distressEffect: false,
  });

  const handleOpenInStudio = () => {
    // Construct active template with edited fields
    const activeTemplate: StampTemplate = {
      ...template,
      defaultData: {
        ...template.defaultData,
        inkColor,
        fields,
        elements,
      },
    };
    loadTemplate(activeTemplate);
    onClose();
    router.push('/editor');
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([svgPreview], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.title.replace(/\s+/g, '_')}_custom.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Quick Customize: {template.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Edit text fields below with live vector preview, then download or open in Studio.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two Column (Left: Form, Right: Live Stamp Preview) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Left Column: Form Fields */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Stamp Text & Information
            </h4>

            {Object.keys(fields).map((fieldKey) => {
              const label = fieldKey
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase());

              return (
                <div key={fieldKey} className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={fields[fieldKey]}
                    onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-750 transition-colors"
                  />
                </div>
              );
            })}

            {/* Ink Color Selector */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                Stamp Ink Color
              </label>
              <div className="flex items-center gap-2">
                {STAMP_INK_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setInkColor(c.hex)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                      inkColor === c.hex
                        ? 'border-slate-800 dark:border-white scale-110 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Vector Preview Stage */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-4 tracking-wider">
              Synchronous Live Preview ({template.widthMm}×{template.heightMm}mm)
            </span>

            <div
              className="ink-preview w-56 h-56 flex items-center justify-center drop-shadow-lg"
              dangerouslySetInnerHTML={{ __html: svgPreview }}
            />

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 text-center">
              100% Vector Output • Ready for laser engraving machines
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleDownloadSvg}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Vector SVG</span>
          </button>

          <button
            onClick={handleOpenInStudio}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Open in Full Studio Editor (CorelDRAW Pro)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
