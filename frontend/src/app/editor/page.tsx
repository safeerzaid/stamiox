'use client';

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { Toolbar } from '../../components/editor/Toolbar';
import { Canvas } from '../../components/editor/Canvas';
import { A4ProductionSheet } from '../../components/editor/A4ProductionSheet';
import { PropertiesPanel } from '../../components/editor/PropertiesPanel';
import { LayersPanel } from '../../components/editor/LayersPanel';
import { ClipartModal } from '../../components/editor/ClipartModal';
import { ExportModal } from '../../components/editor/ExportModal';

export default function EditorPage() {
  const { viewMode, loadAiGeneratedStamp } = useEditor();
  const [activeView, setActiveView] = useState(viewMode);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isClipartModalOpen, setIsClipartModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [activeRightTab, setActiveRightTab] = useState<'SETUP' | 'AI'>('SETUP');

  // Futuristic View Transition Effect
  useEffect(() => {
    if (viewMode !== activeView) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setActiveView(viewMode);
        setIsTransitioning(false);
      }, 350); // Futuristic exit duration
      return () => clearTimeout(timer);
    }
  }, [viewMode, activeView]);

  // Auto-load AI stamp if generated from external modal
  useEffect(() => {
    try {
      const pending = localStorage.getItem('stamiox_ai_pending_stamp');
      if (pending) {
        localStorage.removeItem('stamiox_ai_pending_stamp');
        const parsed = JSON.parse(pending);
        if (parsed && parsed.elements) {
          loadAiGeneratedStamp({
            title: parsed.title,
            shape: parsed.shape,
            widthMm: parsed.widthMm,
            heightMm: parsed.heightMm,
            inkColor: parsed.inkColor,
            elements: parsed.elements,
          });
        }
      }
    } catch (e) {
      console.error('Failed to load pending AI stamp:', e);
    }
  }, [loadAiGeneratedStamp]);

  return (
    <div className="flex flex-row h-screen w-full overflow-hidden bg-[#f5f5f5]">
      {/* 1. Left: Full-Height Figma Rail & Layers / Pages Panel (Only in Single Stamp mode) */}
      <div className={`transition-all duration-300 ${activeView === 'SINGLE' && !isTransitioning ? 'w-64 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-10 overflow-hidden'}`}>
        <LayersPanel />
      </div>

      {/* 2. Main Workspace: Top Bar + (Canvas Stage & Right Properties Panel) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 relative">
        {/* Top Header Bar with Start with AI / Close AI button */}
        <Toolbar
          onOpenClipartModal={() => setIsClipartModalOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
        />

        {/* View Mode Switching with Futuristic Transition */}
        <div className="flex-1 relative overflow-hidden perspective-[1000px] bg-slate-100/50">
          <div 
            className={`absolute inset-0 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${isTransitioning ? 'opacity-0 scale-90 blur-[12px] rotate-x-6 -translate-y-4 pointer-events-none' : 'opacity-100 scale-100 blur-0 rotate-x-0 translate-y-0'}
            `}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="flex-1 flex flex-row overflow-hidden relative min-h-0">
              {/* Center Area: Vector Stamp Canvas or A4 Production Sheet */}
              <div className="flex-1 h-full relative overflow-hidden flex flex-col min-w-0">
                {activeView === 'A4_SHEET' ? (
                  <A4ProductionSheet />
                ) : (
                  <Canvas
                    onOpenClipartModal={() => setIsClipartModalOpen(true)}
                  />
                )}
              </div>

              {/* Right: Full-Height Design Properties Inspector with embedded AI */}
              <PropertiesPanel 
                activeRightTab={activeRightTab}
                setActiveRightTab={setActiveRightTab}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Clipart Picker Modal */}
      <ClipartModal
        isOpen={isClipartModalOpen}
        onClose={() => setIsClipartModalOpen(false)}
      />

      {/* Production Vector Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
