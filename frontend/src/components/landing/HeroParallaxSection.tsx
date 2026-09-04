'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Layers, LayoutGrid } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const HeroParallaxSection: React.FC = () => {
  const heroContainerRef = useRef<HTMLElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const darkOverlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const container = heroContainerRef.current;
    const content = heroContentRef.current;
    const overlay = darkOverlayRef.current;

    if (!container || !content || !overlay) return;

    const ctx = gsap.context(() => {
      // 1. Move Hero content downwards + scale/fade slightly as user scrolls down
      gsap.to(content, {
        y: 110,
        opacity: 0.35,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5,
        },
      });

      // 2. Dark Overlay Opacity increases on scroll
      gsap.to(overlay, {
        opacity: 0.75,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top top+=50',
          end: 'bottom top',
          scrub: 0.5,
        },
      });
    }, heroContainerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroContainerRef}
      className="relative overflow-hidden h-[calc(100vh-72px)] min-h-[620px] max-h-[850px] flex flex-col justify-between pt-16 sm:pt-20 lg:pt-24 pb-0 border-b border-slate-200/80 bg-white select-none"
    >
      {/* BACKGROUND MULTI-COLOR GRADIENT AURA (BLUE SIDES + LOWER SHIFTED YELLOW CENTER GLOW) */}
      <div className="absolute inset-x-0 bottom-0 top-[40%] bg-gradient-to-r from-[#3b82f6]/40 via-transparent to-[#0284c7]/50 blur-3xl pointer-events-none opacity-90 z-0" />
      <div className="absolute left-[15%] right-[15%] bottom-0 top-[60%] bg-gradient-to-r from-[#fde047]/70 via-[#fef08a]/85 to-[#fde047]/70 blur-3xl rounded-t-full pointer-events-none opacity-90 z-0" />

      {/* GSAP LIGHT WASH OVERLAY (FADES IN TO SUBTLE OPACITY ON SCROLL DOWN) */}
      <div
        ref={darkOverlayRef}
        className="absolute inset-0 bg-white/60 pointer-events-none opacity-0 z-30 transition-opacity duration-75"
      />

      {/* GSAP HERO CONTENT WRAPPER (TRANSLATES DOWNWARDS Y: 110PX ON SCROLL DOWN) */}
      <div ref={heroContentRef} className="relative z-10 w-full flex flex-col justify-between h-full">
        {/* CENTER CONTENT (EQUALIZED TOP & BOTTOM SPACING) */}
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 text-center pointer-events-none space-y-4 sm:space-y-5 my-auto">
          {/* Centered Large Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-normal tracking-[-0.035em] text-[#111827] leading-[1.12] max-w-4xl mx-auto pointer-events-auto select-none">
            Rubber Stamp Design. <br />
            <span className="font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 bg-clip-text text-transparent">
              Easier & Faster
            </span>{' '}
            Than CorelDRAW.
          </h1>

          {/* Centered Subtitle Paragraph */}
          <p className="text-base sm:text-lg text-[#5f6368] max-w-xl mx-auto font-normal leading-relaxed pointer-events-auto">
            Design custom rubber stamps, corporate seals, and address stamps in seconds. Pre-built templates with full vector editing freedom.
          </p>

          {/* Centered Two Pill Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 pointer-events-auto">
            {/* Primary Dark Pill Button */}
            <Link
              href="/editor"
              className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#111111] hover:bg-[#282828] text-white text-sm font-semibold shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4 text-white" />
              <span>Start Designing Free</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>

            {/* Secondary Light Pill Button */}
            <Link
              href="/templates"
              className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#f1f3f4] hover:bg-[#e8eaed] text-[#202124] text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <LayoutGrid className="w-4 h-4 text-slate-700" />
              <span>Browse Templates</span>
            </Link>
          </div>
        </div>

        {/* BOTTOM STUDIO STAGE WITH 3D GLASSMORPHISM CARD FRAME */}
        <div className="relative w-full max-w-6xl mx-auto mt-4 px-4 sm:px-6 lg:px-8 pointer-events-auto select-none">
          {/* 3D Floating Glassmorphism Stage Frame */}
          <div className="relative rounded-t-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-[0_30px_70px_-15px_rgba(37,99,235,0.15),0_10px_25px_-5px_rgba(0,0,0,0.06)] ring-1 ring-white/90 p-3.5 sm:p-4.5 overflow-hidden space-y-3">
            {/* Top Glossy Specular Highlight Line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block shadow-2xs" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block shadow-2xs" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block shadow-2xs" />
                <span className="text-[11px] font-medium text-slate-700 ml-2">
                  A product of <strong className="font-bold text-slate-900">Sun Stamper</strong>
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-600 bg-white/90 backdrop-blur-md px-3 py-0.5 rounded-full border border-slate-200/80 shadow-2xs">
                Vector Studio Engine
              </span>
            </div>

            {/* 3D GLASS STAGE INNER BOX */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-4.5 bg-gradient-to-b from-white/90 via-white/70 to-slate-50/60 rounded-2xl border border-white/80 backdrop-blur-xl shadow-[inset_0_1px_3px_rgba(255,255,255,0.8),0_4px_12px_-2px_rgba(0,0,0,0.03)]">
              {/* Clean 3D Stamp Impression (Left Box) */}
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-b from-white to-slate-50 p-1.5 border border-slate-200/80 shadow-md shadow-slate-900/5 flex items-center justify-center shrink-0">
                  {/* Minimal Clean SVG Rubber Stamp */}
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
                    <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path id="sunArcMin" d="M 18,50 A 32,32 0 1,1 82,50" fill="none" />
                    <text fontSize="6" fontWeight="normal" fill="currentColor" letterSpacing="0.6">
                      <textPath href="#sunArcMin" startOffset="50%" textAnchor="middle">
                        SUN STAMPER®
                      </textPath>
                    </text>
                    <polygon points="50,42 52,48 58,48 53,52 55,58 50,54 45,58 47,52 42,48 48,48" fill="currentColor" />
                  </svg>
                </div>

                <div className="text-left space-y-0.5">
                  <h4 className="font-medium text-slate-900 text-sm sm:text-base tracking-tight">
                    Sun Stamper Digital Studio Canvas
                  </h4>
                  <p className="text-xs text-[#5f6368] font-normal">
                    Pre-built stamp templates & full vector studio canvas
                  </p>
                </div>
              </div>

              {/* Minimal Clean Glass Pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 text-slate-800 font-semibold text-xs shadow-2xs">
                  Sun Stamper®
                </span>
                <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 text-slate-600 font-normal text-xs shadow-2xs">
                  Vector Studio Engine
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
