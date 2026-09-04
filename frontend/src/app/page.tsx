'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEditor } from '../context/EditorContext';
import { useSubscription } from '../context/SubscriptionContext';
import { STAMP_TEMPLATES } from '../../../backend/src/data/templates';
import { generateStampSvg } from '../lib/svg-generator';
import { STAMP_INK_COLORS } from '../lib/units';
import {
  Stamp,
  LayoutGrid,
  Layers,
  Check,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { InteractiveStampCursor } from '../components/landing/InteractiveStampCursor';
import { ExpandingCtaBanner } from '../components/landing/ExpandingCtaBanner';
import { HeroParallaxSection } from '../components/landing/HeroParallaxSection';

export default function LandingPage() {
  const router = useRouter();
  const { loadTemplate } = useEditor();
  const { openUpgradeModal } = useSubscription();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  // Interactive Live Stamp Simulator State
  const [heroText, setHeroText] = useState('STAMIOX GLOBAL ENTERPRISES');
  const [heroInk, setHeroInk] = useState('#1e3a8a');
  const [heroDistress, setHeroDistress] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const heroSvg = generateStampSvg({
    widthMm: 40,
    heightMm: 40,
    inkColor: heroInk,
    elements: [
      {
        id: 'hero-outer-ring',
        type: 'ring',
        cx: 20,
        cy: 20,
        radius: 19,
        strokeWidth: 0.8,
        strokeType: 'solid',
      },
      {
        id: 'hero-inner-ring',
        type: 'ring',
        cx: 20,
        cy: 20,
        radius: 13,
        strokeWidth: 0.4,
        strokeType: 'solid',
      },
      {
        id: 'hero-top-arc',
        type: 'arc-text',
        text: heroText,
        cx: 20,
        cy: 20,
        radius: 15.8,
        startAngle: -160,
        sweepAngle: 140,
        fontSize: 2.8,
        fontFamily: '"Product Sans", Arial, sans-serif',
        fontWeight: 'bold',
        letterSpacing: 0.2,
      },
      {
        id: 'hero-bottom-arc',
        type: 'arc-text',
        text: '★ OFFICIAL SEAL ★',
        cx: 20,
        cy: 20,
        radius: 15.8,
        startAngle: 150,
        sweepAngle: -120,
        fontSize: 2.4,
        fontFamily: '"Product Sans", Arial, sans-serif',
        fontWeight: 'bold',
        letterSpacing: 0.2,
        isReversed: true,
      },
      {
        id: 'hero-center-stars',
        type: 'clipart',
        name: 'stars-triple',
        cx: 20,
        cy: 16.5,
        width: 8,
        height: 2.5,
      },
      {
        id: 'hero-line-1',
        type: 'text',
        text: 'EST. 2026',
        x: 20,
        y: 20.5,
        fontSize: 2.3,
        fontWeight: 'bold',
        fontFamily: '"Product Sans", Arial, sans-serif',
        align: 'center',
      },
      {
        id: 'hero-line-2',
        type: 'text',
        text: 'VERIFIED',
        x: 20,
        y: 23.8,
        fontSize: 1.8,
        fontWeight: '600',
        fontFamily: '"Product Sans", Arial, sans-serif',
        align: 'center',
      },
    ],
    distressEffect: heroDistress,
  });

  const handlePressStamp = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 400);
  };

  const handleOpenHeroTemplateInEditor = () => {
    const tmpl = STAMP_TEMPLATES[0];
    loadTemplate(tmpl as any);
    router.push('/editor');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900">
      {/* --- SECTION 1: 100VH HERO SECTION WITH GSAP SCROLLPARALLAX & DARK OVERLAY --- */}
      <HeroParallaxSection />

      {/* --- SECTION 1: TWO POWERFUL DESIGN MODES --- */}
      <section className="py-20 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900">
              Two Ways to Create Your Perfect Stamp
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 max-w-6xl mx-auto">
            {/* Card 1 (Dark Matte Card - Variant 01 - 1:1 Aspect Ratio) */}
            <div className="bg-gradient-to-b from-[#22242b] via-[#17181d] to-[#101115] text-white p-8 sm:p-10 rounded-[32px] sm:rounded-[38px] border border-white/10 shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:border-white/20 transition-all duration-300 md:aspect-square">
              <div className="space-y-6 relative z-10">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  {/* Brand Double Circles Mark */}
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center font-black text-slate-950 text-xs shadow-md">
                      S
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md -ml-5 flex items-center justify-center font-bold text-white text-xs border border-white/10">
                      ⚡
                    </div>
                  </div>
                </div>

                {/* Sub-label */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-white/60 tracking-wider">
                    <span>Variant-01</span>
                    <span>•</span>
                    <span>Instant Form Mode</span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    Pre-built Stamp Templates
                  </h3>
                </div>

                {/* Badges / Tags */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-semibold text-white/90 border border-white/15 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                    35+ Ready Templates
                  </span>
                  <span className="text-xs font-semibold text-white/90 border border-white/15 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                    Auto-Fit Math
                  </span>
                  <span className="text-xs font-semibold text-white/90 border border-white/15 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                    Commercial Seals
                  </span>
                </div>

                <p className="text-white/70 text-sm leading-relaxed">
                  Select from ready-made commercial seals, fill in company details, and get production vector stamps in seconds.
                </p>
              </div>

              {/* Bottom Footer Section */}
              <div className="pt-6 relative z-10">
                <div className="w-full h-[1px] bg-white/15 mb-6" />
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight block">
                      35+ Designs
                    </span>
                    <span className="text-xs text-white/50 font-normal">
                      Commercial ready
                    </span>
                  </div>

                  <Link
                    href="/templates"
                    className="bg-white text-slate-950 font-bold text-xs sm:text-sm px-6 py-3 rounded-xl hover:bg-slate-100 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                  >
                    Explore Templates
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 2 (Vibrant Royal Blue Card - Variant 02 - 1:1 Aspect Ratio) */}
            <div className="bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#1e40af] text-white p-8 sm:p-10 rounded-[32px] sm:rounded-[38px] border border-blue-400/30 shadow-2xl shadow-blue-600/30 flex flex-col justify-between relative overflow-hidden group hover:border-blue-300 transition-all duration-300 md:aspect-square">
              <div className="space-y-6 relative z-10">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  {/* Brand Double Circles Mark */}
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center font-black text-blue-700 text-xs shadow-md">
                      V
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white/30 backdrop-blur-md -ml-5 flex items-center justify-center font-bold text-white text-xs border border-white/20">
                      🛠️
                    </div>
                  </div>
                </div>

                {/* Sub-label */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-white/70 tracking-wider">
                    <span>Variant-02</span>
                    <span>•</span>
                    <span>Pro Studio Engine</span>
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    Professional Vector Studio
                  </h3>
                </div>

                {/* Badges / Tags */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-semibold text-white border border-white/25 bg-white/15 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                    Arc Text Math
                  </span>
                  <span className="text-xs font-semibold text-white border border-white/25 bg-white/15 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                    Mirror X Invert
                  </span>
                  <span className="text-xs font-semibold text-white border border-white/25 bg-white/15 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                    600 DPI Vector
                  </span>
                </div>

                <p className="text-white/80 text-sm leading-relaxed">
                  Complete manual freedom to move, rotate, resize, align, and curve text along circular paths with sub-millimeter precision.
                </p>
              </div>

              {/* Bottom Footer Section */}
              <div className="pt-6 relative z-10">
                <div className="w-full h-[1px] bg-white/20 mb-6" />
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight block">
                      100% Vector
                    </span>
                    <span className="text-xs text-white/70 font-normal">
                      Laser machine ready
                    </span>
                  </div>

                  <Link
                    href="/editor"
                    className="bg-white text-blue-900 font-bold text-xs sm:text-sm px-6 py-3 rounded-xl hover:bg-slate-100 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
                  >
                    Launch Studio Canvas
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 2: PRE-BUILT TEMPLATES CATALOG PREVIEW (INFINITE AUTO-SCROLL WITH PAUSE ON HOVER) --- */}
      <section className="py-20 sm:py-24 bg-slate-50 border-b border-slate-200/80 overflow-hidden relative">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
              Popular Stamp Designs
            </h2>
            <Link
              href="/templates"
              className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>View all templates</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Marquee Track with Smooth Left/Right Edge Gradients - 2 Independent Rows */}
        <div className="relative w-full mt-8 overflow-hidden flex flex-col gap-6">
          {/* Left & Right Edge Fade Gradients */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent z-10" />

          {/* Row 1: Leftward Continuous Moving Marquee (Pauses only when Row 1 is hovered) */}
          <div className="w-full overflow-hidden">
            <div className="animate-marquee-scroll flex gap-6 px-4 py-1">
              {[...STAMP_TEMPLATES.filter((_, i) => i % 2 === 0), ...STAMP_TEMPLATES.filter((_, i) => i % 2 === 0)].map((template, idx) => {
                const svg = generateStampSvg({
                  widthMm: template.widthMm,
                  heightMm: template.heightMm,
                  inkColor: template.defaultData.inkColor || '#1e3a8a',
                  elements: template.defaultData.elements || [],
                  distressEffect: false,
                });

                return (
                  <div
                    key={`row1-${template.id}-${idx}`}
                    className="w-[280px] sm:w-[310px] flex-shrink-0 bg-white rounded-3xl border border-slate-200/90 p-5 flex flex-col justify-between hover:border-blue-400 hover:shadow-xl transition-all duration-300 shadow-xs group/card select-none"
                  >
                    <div>
                      {/* Stamp Preview Area */}
                      <div className="bg-[#f8f9fa] border border-slate-100 rounded-2xl p-4 flex items-center justify-center min-h-[160px] mb-3.5 relative overflow-hidden">
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 z-10">
                          <span className="px-2 py-0.5 rounded-md bg-white text-[10px] font-bold text-slate-700 border border-slate-200 shadow-2xs font-mono">
                            {template.widthMm}×{template.heightMm}mm
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-200/70 text-[9px] font-bold text-slate-600 uppercase">
                            {template.shape}
                          </span>
                        </div>
                        <div
                          className="w-28 h-28 flex items-center justify-center group-hover/card:scale-105 transition-transform duration-300 drop-shadow-2xs [&>svg]:w-auto [&>svg]:h-auto [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:mx-auto [&>svg]:my-auto"
                          dangerouslySetInnerHTML={{ __html: svg }}
                        />
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm group-hover/card:text-blue-600 transition-colors tracking-tight line-clamp-1">
                        {template.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed h-7">
                        {template.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-slate-100">
                      <button
                        onClick={() => {
                          loadTemplate(template as any);
                          router.push('/editor');
                        }}
                        className="w-full py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-full text-xs font-bold transition-all duration-200 text-center border border-blue-200/80 hover:border-transparent cursor-pointer shadow-2xs active:scale-95"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 2: Rightward Continuous Moving Marquee (Pauses only when Row 2 is hovered) */}
          <div className="w-full overflow-hidden">
            <div className="animate-marquee-scroll-reverse flex gap-6 px-4 py-1">
              {[...STAMP_TEMPLATES.filter((_, i) => i % 2 !== 0), ...STAMP_TEMPLATES.filter((_, i) => i % 2 !== 0)].map((template, idx) => {
                const svg = generateStampSvg({
                  widthMm: template.widthMm,
                  heightMm: template.heightMm,
                  inkColor: template.defaultData.inkColor || '#1e3a8a',
                  elements: template.defaultData.elements || [],
                  distressEffect: false,
                });

                return (
                  <div
                    key={`row2-${template.id}-${idx}`}
                    className="w-[280px] sm:w-[310px] flex-shrink-0 bg-white rounded-3xl border border-slate-200/90 p-5 flex flex-col justify-between hover:border-blue-400 hover:shadow-xl transition-all duration-300 shadow-xs group/card select-none"
                  >
                    <div>
                      {/* Stamp Preview Area */}
                      <div className="bg-[#f8f9fa] border border-slate-100 rounded-2xl p-4 flex items-center justify-center min-h-[160px] mb-3.5 relative overflow-hidden">
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 z-10">
                          <span className="px-2 py-0.5 rounded-md bg-white text-[10px] font-bold text-slate-700 border border-slate-200 shadow-2xs font-mono">
                            {template.widthMm}×{template.heightMm}mm
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-200/70 text-[9px] font-bold text-slate-600 uppercase">
                            {template.shape}
                          </span>
                        </div>
                        <div
                          className="w-28 h-28 flex items-center justify-center group-hover/card:scale-105 transition-transform duration-300 drop-shadow-2xs [&>svg]:w-auto [&>svg]:h-auto [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:mx-auto [&>svg]:my-auto"
                          dangerouslySetInnerHTML={{ __html: svg }}
                        />
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm group-hover/card:text-blue-600 transition-colors tracking-tight line-clamp-1">
                        {template.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed h-7">
                        {template.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-slate-100">
                      <button
                        onClick={() => {
                          loadTemplate(template as any);
                          router.push('/editor');
                        }}
                        className="w-full py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-full text-xs font-bold transition-all duration-200 text-center border border-blue-200/80 hover:border-transparent cursor-pointer shadow-2xs active:scale-95"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 3: LATEST BLOGS --- */}
      <section className="py-20 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
              Latest Blogs
            </h2>

            <Link
              href="/blogs"
              className="px-5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-all border border-slate-200/60"
            >
              View blog
            </Link>
          </div>

          {/* Clean Aligned 4-Column Responsive Grid (100% inside 1720px container) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Blog Card 1: Pattern 1 - Moving Mesh Grid & Glowing Radial Aura */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-xl transition-all duration-300 shadow-2xs group">
              <div className="space-y-4">
                <div className="w-full aspect-[4/3] bg-gradient-to-tr from-[#020617] via-[#09132d] to-[#1e3a8a] animate-card-gradient-1 rounded-2xl flex items-center justify-center p-6 text-center relative overflow-hidden group-hover:scale-[1.02] transition-transform border border-slate-800/80">
                  {/* Moving Glowing Blue Radial Aura */}
                  <div className="absolute -top-10 -left-10 w-44 h-44 bg-blue-500/35 rounded-full blur-2xl animate-pulse-glow" />
                  {/* Vector Grid Overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0c_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0c_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                  
                  <h3 className="text-white text-lg font-bold tracking-tight relative z-10 drop-shadow-md">
                    Feature Deep Dive
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                    <span>Aug 27, 2026</span>
                    <span>•</span>
                    <span>Research</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    Teamwork: When AI Becomes a Stamp Design Partner
                  </h3>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100">
                <Link href="/blogs" className="text-xs font-bold text-slate-900 group-hover:text-blue-600 flex items-center gap-1">
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Blog Card 2: Pattern 2 - Moving Diagonal Laser Sheen Beam */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-xl transition-all duration-300 shadow-2xs group">
              <div className="space-y-4">
                <div className="w-full aspect-[4/3] bg-gradient-to-br from-[#030712] via-[#0c1a30] to-[#0284c7] animate-card-gradient-1 rounded-2xl flex items-center justify-center p-6 text-center relative overflow-hidden group-hover:scale-[1.02] transition-transform border border-slate-800/80">
                  {/* Moving Laser Sheen Diagonal Beam */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-400/25 to-transparent w-[200%] animate-laser-sheen blur-md pointer-events-none" />
                  {/* Vector Circular Rings Overlay */}
                  <svg className="absolute inset-0 w-full h-full text-white/5 pointer-events-none" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
                    <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="1" />
                  </svg>

                  <h3 className="text-white text-lg font-bold tracking-tight relative z-10 drop-shadow-md">
                    Generative UI Vector Studio
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                    <span>Aug 26, 2026</span>
                    <span>•</span>
                    <span>Product</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    Visualizing Circular Text & Vector Math Precision
                  </h3>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100">
                <Link href="/blogs" className="text-xs font-bold text-slate-900 group-hover:text-blue-600 flex items-center gap-1">
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Blog Card 3: Pattern 3 - Rotating Gradient Vortex Orb */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-xl transition-all duration-300 shadow-2xs group">
              <div className="space-y-4">
                <div className="w-full aspect-[4/3] bg-gradient-to-bl from-[#050b14] via-[#101b35] to-[#1d4ed8] animate-card-gradient-1 rounded-2xl flex items-center justify-center p-6 text-center relative overflow-hidden group-hover:scale-[1.02] transition-transform border border-slate-800/80">
                  {/* Rotating Gradient Vortex Orb */}
                  <div className="absolute inset-0 m-auto w-36 h-36 bg-gradient-to-tr from-blue-600/40 via-cyan-400/30 to-transparent rounded-full blur-xl animate-vortex-rotate pointer-events-none" />
                  {/* Crosshatch Dot Matrix Overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

                  <h3 className="text-white text-lg font-bold tracking-tight relative z-10 drop-shadow-md">
                    Laser Machine Specs
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                    <span>Aug 24, 2026</span>
                    <span>•</span>
                    <span>Hardware</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    Improving Laser Engraving Rubber Machine Workflows
                  </h3>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100">
                <Link href="/blogs" className="text-xs font-bold text-slate-900 group-hover:text-blue-600 flex items-center gap-1">
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Blog Card 4: Pattern 4 - Sapphire Cyber Pulse Wave */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-xl transition-all duration-300 shadow-2xs group">
              <div className="space-y-4">
                <div className="w-full aspect-[4/3] bg-gradient-to-tl from-[#020617] via-[#08152c] to-[#2563eb] animate-card-gradient-1 rounded-2xl flex items-center justify-center p-6 text-center relative overflow-hidden group-hover:scale-[1.02] transition-transform border border-slate-800/80">
                  {/* Pulsing Bottom-Right Indigo Glow */}
                  <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-indigo-500/40 rounded-full blur-2xl animate-pulse-glow pointer-events-none" />
                  {/* Concentric Arc Watermark */}
                  <svg className="absolute -bottom-8 -right-8 w-40 h-40 text-blue-400/10 pointer-events-none" viewBox="0 0 100 100">
                    <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>

                  <h3 className="text-white text-lg font-bold tracking-tight relative z-10 drop-shadow-md">
                    Mount Sizing Guide
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                    <span>Aug 21, 2026</span>
                    <span>•</span>
                    <span>Manufacturing</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    Colop & Trodat Self-Inking Mount Sizing Matrix
                  </h3>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100">
                <Link href="/blogs" className="text-xs font-bold text-slate-900 group-hover:text-blue-600 flex items-center gap-1">
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
