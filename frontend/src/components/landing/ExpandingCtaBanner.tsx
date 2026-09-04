'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { InteractiveGridCanvas } from './InteractiveGridCanvas';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const ExpandingCtaBanner: React.FC = () => {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const container = containerRef.current;
    const card = cardRef.current;

    if (!container || !card) return;

    // Small delay to ensure DOM dimensions on route change are ready
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        card,
        {
          width: '82%',
          borderRadius: '20px',
          scale: 0.92,
          y: 40,
        },
        {
          width: '98%',
          borderRadius: '70px',
          scale: 1.0,
          y: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: container,
            start: 'top bottom-=20',
            end: 'center center+=60',
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        }
      );
    }, containerRef);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, [pathname]);

  return (
    <section ref={containerRef} className="w-full py-16 sm:py-24 bg-white overflow-hidden flex items-center justify-center">
      <div
        ref={cardRef}
        className="relative py-32 lg:py-40 min-h-[480px] bg-gradient-to-tr from-[#020617] via-[#0b1b3d] to-[#1e3a8a] animate-moving-gradient text-white border border-blue-900/40 shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-100 ease-linear mx-auto"
        style={{ width: '80%', borderRadius: '16px' }}
      >
        {/* Smooth Floating Ambient Blue Glows */}
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-ambient-glow-1 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-ambient-glow-2 pointer-events-none" />

        {/* Dynamic Interactive Grid with Cursor Warp & Glow Physics */}
        <InteractiveGridCanvas />
        
        {/* Soft Radial Gradient Vignette for Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(2,6,23,0.45)_100%)] pointer-events-none" />

        {/* Foreground Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-6 select-none pointer-events-none">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-0.035em] text-white leading-[1.14]">
            Start Designing Your Stamps Today
          </h2>

          <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto font-normal leading-relaxed">
            Get instant access to all templates, full vector canvas studio, and high-resolution SVG/PDF exports.
          </p>

          <div className="pt-4 flex justify-center">
            <Link
              href="/editor"
              className="px-9 py-4 rounded-full font-bold text-[15px] bg-white hover:bg-slate-100 text-slate-900 shadow-2xl transition-all duration-200 hover:scale-105 flex items-center gap-2.5 cursor-pointer pointer-events-auto"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 text-slate-900" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
