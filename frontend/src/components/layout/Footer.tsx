'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ExpandingCtaBanner } from '../landing/ExpandingCtaBanner';

export const Footer: React.FC = () => {
  const pathname = usePathname();

  if (pathname === '/editor') {
    return null;
  }

  return (
    <>
      {/* EXPANDING CTA BANNER (SHOWN ON ALL PAGES RIGHT ABOVE FOOTER) */}
      <ExpandingCtaBanner />

      <footer className="w-full bg-white text-slate-900 pt-16 pb-10 overflow-hidden select-none">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* --- TOP ROW: HEADLINE + LINK COLUMNS --- */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-10 mb-16">
          {/* Left Headline */}
          <div className="max-w-md">
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Experience liftoff
            </h3>
          </div>

          {/* Right Navigation Columns */}
          <div className="grid grid-cols-2 gap-12 sm:gap-24 text-sm">
            {/* Product Column */}
            <div>
              <h4 className="font-semibold text-slate-500 mb-4 text-xs uppercase tracking-wider">Product</h4>
              <ul className="space-y-2.5 font-medium text-slate-800 text-xs sm:text-sm">
                <li>
                  <Link href="/editor" className="hover:text-slate-900 hover:underline transition-colors">
                    Download
                  </Link>
                </li>
                <li>
                  <Link href="/editor" className="hover:text-slate-900 hover:underline transition-colors">
                    Product
                  </Link>
                </li>
                <li>
                  <Link href="/templates" className="hover:text-slate-900 hover:underline transition-colors">
                    Docs
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-slate-900 hover:underline transition-colors">
                    Changelog
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-slate-900 hover:underline transition-colors">
                    Press
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-slate-900 hover:underline transition-colors">
                    Releases
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h4 className="font-semibold text-slate-500 mb-4 text-xs uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2.5 font-medium text-slate-800 text-xs sm:text-sm">
                <li>
                  <Link href="/blogs" className="hover:text-slate-900 hover:underline transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-slate-900 hover:underline transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* --- MASSIVE DISPLAY BRAND TYPOGRAPHY (ANTIGRAVITY FULL-WIDTH STYLE) --- */}
        <div className="w-full my-6 select-none overflow-hidden">
          <svg viewBox="0 0 1020 210" className="w-full h-auto block">
            <text
              x="0"
              y="180"
              fill="#0b0f19"
              fontSize="215"
              fontWeight="900"
              fontFamily="'Montserrat', 'Plus Jakarta Sans', 'Outfit', 'Inter', system-ui, sans-serif"
              letterSpacing="-3"
            >
              Stamiox
            </text>
          </svg>
        </div>

        {/* --- BOTTOM SUB-FOOTER BAR --- */}
        <div className="pt-8 mt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <a
              href="https://clixdot.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-slate-800 hover:text-blue-600 transition-all text-xs sm:text-sm tracking-tight"
            >
              Clixdot Technologies
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600 font-medium">
            <Link href="/pricing" className="hover:text-slate-900 transition-colors">
              About Stamiox
            </Link>
            <Link href="/templates" className="hover:text-slate-900 transition-colors">
              Products & Features
            </Link>
            <Link href="/pricing" className="hover:text-slate-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/pricing" className="hover:text-slate-900 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
};
