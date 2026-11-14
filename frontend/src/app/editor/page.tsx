'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Toolbar } from '../../components/editor/Toolbar';
import { Canvas } from '../../components/editor/Canvas';
import { A4ProductionSheet } from '../../components/editor/A4ProductionSheet';
import { PropertiesPanel } from '../../components/editor/PropertiesPanel';
import { LayersPanel } from '../../components/editor/LayersPanel';
import { ClipartModal } from '../../components/editor/ClipartModal';
import { ExportModal } from '../../components/editor/ExportModal';
import { SupportModal } from '../../components/common/SupportModal';
import { ARRealWorldModal } from '../../components/editor/ARRealWorldModal';
import { InteractiveDesignModal } from '../../components/editor/InteractiveDesignModal';
import { RecentDesignsModal } from '../../components/editor/RecentDesignsModal';
import { LoginPromptModal } from '../../components/editor/LoginPromptModal';
import { requireLogin } from '../../lib/require-login';

function EditorPage() {
  const { viewMode, viewRestored, loadAiGeneratedStamp } = useEditor();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState(viewMode);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isClipartModalOpen, setIsClipartModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  const [isARModalOpen, setIsARModalOpen] = useState<boolean>(false);
  const [isInteractiveModalOpen, setIsInteractiveModalOpen] = useState<boolean>(false);
  const [activeRightTab, setActiveRightTab] = useState<'SETUP' | 'AI'>('SETUP');

  // On load, jump straight to the saved view (Single / A4) — no flash, no switch animation
  const initialViewSetRef = useRef(false);
  const shownViewRef = useRef(viewMode); // the view on screen (updated synchronously)
  useLayoutEffect(() => {
    if (!viewRestored || initialViewSetRef.current) return;
    initialViewSetRef.current = true;
    shownViewRef.current = viewMode;
    setActiveView(viewMode);
  }, [viewRestored, viewMode]);

  // Futuristic View Transition Effect (only for switches the user makes)
  useEffect(() => {
    if (!initialViewSetRef.current) return;
    if (viewMode !== shownViewRef.current) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        shownViewRef.current = viewMode;
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
    <div className="flex flex-row h-screen w-full overflow-hidden bg-[#f5f5f5] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. Left: Full-Height Figma Rail & Layers / Pages Panel (Only in Single Stamp mode) */}
      <div className={`${viewRestored ? 'transition-all duration-300' : ''} ${viewRestored && activeView === 'SINGLE' && !isTransitioning ? 'w-64 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-10 overflow-hidden'}`}>
        <LayersPanel />
      </div>

      {/* 2. Main Workspace: Top Bar + (Canvas Stage & Right Properties Panel) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 relative">
        {/* Top Header Bar with Start with AI / Close AI button */}
        <Toolbar
          onOpenClipartModal={() => setIsClipartModalOpen(true)}
          onOpenExportModal={() => {
            // guests can design freely; exporting needs an account
            if (requireLogin(user, 'export')) setIsExportModalOpen(true);
          }}
        />

        {/* View Mode Switching with Futuristic Transition */}
        <div className="flex-1 relative overflow-hidden perspective-[1000px] bg-slate-100/50 dark:bg-[#0b0f19]">
          <div 
            className={`absolute inset-0 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${!viewRestored ? 'invisible' : isTransitioning ? 'opacity-0 scale-90 blur-[12px] rotate-x-6 -translate-y-4 pointer-events-none' : 'opacity-100 scale-100 blur-0 rotate-x-0 translate-y-0'}
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
                onOpenSupportModal={() => setIsSupportModalOpen(true)}
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
        onOpenARModal={() => setIsARModalOpen(true)}
      />

      {/* Support, Requirements & Suggestions Modal */}
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />

      {/* Real-World AR Camera & Document Impression Preview */}
      <ARRealWorldModal
        isOpen={isARModalOpen}
        onClose={() => setIsARModalOpen(false)}
      />

      {/* Recent designs — shown when the Studio is opened, to continue a previous design */}
      {user && <RecentDesignsModal />}
      {/* "Log in to continue" for guests (export, save, more designs) */}
      <LoginPromptModal />

      {/* Interactive Design Selector (Style, Shape, Content Preset) */}
      <InteractiveDesignModal
        isOpen={isInteractiveModalOpen}
        onClose={() => setIsInteractiveModalOpen(false)}
      />
    </div>
  );
}

/**
 * The Studio is open to everyone: guests get a free trial of a few designs, and logging in is
 * asked for when they export, save to an account, or want more designs.
 */
export default function EditorGate() {
  const { isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-3 bg-[#f5f5f5] dark:bg-[#0b0f19]">
        <span className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-[#0d99ff] animate-spin" />
        <span className="text-[13px] text-slate-500 dark:text-slate-400">Opening the Studio…</span>
      </div>
    );
  }
  return <EditorPage />;
}
