'use client';

import React from 'react';
import { StampTemplate } from '../../types/stamp';
import { generateStampSvg } from '../../lib/svg-generator';
import { Edit3, Layers, Sparkles, Maximize2, Compass } from 'lucide-react';

interface TemplateCardProps {
  template: StampTemplate;
  onPreview?: (template: StampTemplate) => void;
  onQuickCustomize: (template: StampTemplate) => void;
  onOpenInStudio: (template: StampTemplate) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onPreview,
  onQuickCustomize,
  onOpenInStudio,
}) => {
  const svgPreview = generateStampSvg({
    widthMm: template.widthMm,
    heightMm: template.heightMm,
    inkColor: template.defaultData.inkColor || '#1e3a8a',
    elements: template.defaultData.elements || [],
    distressEffect: false,
  });

  const handleCardClick = () => {
    if (onPreview) {
      onPreview(template);
    } else {
      onQuickCustomize(template);
    }
  };

  return (
    <div className="group rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-700 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden shadow-2xs">
      {/* Visual Stamp Preview Stage */}
      <div
        onClick={handleCardClick}
        className="relative bg-slate-50/90 dark:bg-slate-950/50 p-6 flex items-center justify-center min-h-[220px] cursor-pointer group-hover:bg-slate-100/70 dark:group-hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800"
        title="Click for Fullscreen Interactive Preview"
      >
        {/* Shape & Size Badges */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 z-10">
          <span className="px-2 py-0.5 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs text-[10px] font-bold text-slate-800 dark:text-slate-200 shadow-2xs border border-slate-200/80 dark:border-slate-700 font-mono">
            {template.widthMm} × {template.heightMm} mm
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300">
            {template.shape}
          </span>
        </div>

        {/* Fullscreen Preview Hover Button */}
        <div className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <span className="p-1.5 rounded-xl bg-slate-900 text-white shadow-md flex items-center gap-1 text-[10px] font-bold">
            <Maximize2 className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Vector SVG Output */}
        <div
          data-template-preview={template.id}
          className="w-full h-36 flex items-center justify-center p-2 transform group-hover:scale-105 transition-transform duration-300 drop-shadow-xs [&>svg]:w-auto [&>svg]:h-auto [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:mx-auto [&>svg]:my-auto"
          dangerouslySetInnerHTML={{ __html: svgPreview }}
        />
      </div>

      {/* Info & Action Buttons */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3
            onClick={handleCardClick}
            className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#0d99ff] dark:group-hover:text-[#38bdf8] transition-colors cursor-pointer"
          >
            {template.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {template.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Quick Customizer Button */}
          <button
            type="button"
            onClick={() => onQuickCustomize(template)}
            className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span>Quick Edit</span>
          </button>

          {/* Open in Full Studio Editor Button */}
          <button
            type="button"
            onClick={() => onOpenInStudio(template)}
            className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-[#0d99ff] hover:bg-slate-800 dark:hover:bg-[#0b87e0] text-white shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="Open in Vector Studio Canvas"
          >
            <Layers className="w-3.5 h-3.5 text-white" />
            <span>Studio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
