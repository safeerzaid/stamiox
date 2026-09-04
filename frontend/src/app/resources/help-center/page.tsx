'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Mail,
  MessageSquare,
  ShieldCheck,
  Zap,
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function HelpCenterPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do I download vector files suitable for my CO2 laser machine?',
      a: 'After finishing your design in the Studio, click "Export" in the top bar and choose SVG or PDF format. If your laser software (such as RDWorks or LightBurn) requires reversed text, simply check the "Mirror (X-Flip)" option before downloading.',
    },
    {
      q: 'Are the fonts and templates licensed for commercial rubber stamp production?',
      a: 'Yes! All templates, fonts, borders, and cliparts included in Stamiox are 100% royalty-free for commercial use. You can manufacture, sell, and distribute physical stamps created with our platform with zero royalties.',
    },
    {
      q: 'How do I fit multiple different stamp designs onto an A4 rubber sheet?',
      a: 'Open the Studio, design your stamps or load templates, then click "A4 Production Sheet". You can add multiple stamp dies, specify spacing margins (e.g. 3mm), and export the entire gang-sheet as a single high-resolution vector PDF.',
    },
    {
      q: 'Which self-inking mount brands are supported by Stamiox?',
      a: 'Stamiox provides pre-calibrated canvas presets for Colop (Printer series), Trodat (Printy & Professional series), Shiny (O-Series), and Sun Stamper Flash mounts. You can also input custom physical dimensions in millimeters.',
    },
    {
      q: 'What if I need custom template design assistance for my organization?',
      a: 'Our technical support team assists enterprise print shops and corporate clients with custom vector template creation, bulk API integrations, and mount calibration. Contact us at support@stamiox.com.',
    },
  ];

  return (
    <div className="flex-1 bg-slate-50/70 min-h-screen text-slate-900 pb-24">
      {/* Sleek Dark Hero Banner */}
      <div className="relative bg-gradient-to-tr from-[#020617] via-[#09152e] to-[#1e3a8a] text-white pt-12 sm:pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-xl">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="max-w-[1720px] mx-auto relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-xs font-semibold backdrop-blur-md">
            <Link href="/resources" className="hover:text-white transition-colors">
              Resources
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-blue-300" />
            <span className="text-white font-bold">Help Center & Support</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-4xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.035em] text-white leading-tight">
                Help Center, FAQs & <br className="hidden sm:inline" />
                <span className="text-blue-400 font-extrabold">
                  Technical Support
                </span>
              </h1>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                Get answers regarding vector exports, laser engraving troubleshooting, commercial licensing, and subscription management.
              </p>
            </div>

            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-blue-50 text-blue-950 font-bold text-sm shadow-[0_0_25px_rgba(59,130,246,0.35)] transition-all hover:scale-105 shrink-0"
            >
              <Zap className="w-4 h-4 text-blue-600" />
              <span>View Pro Plans & Pricing</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-20 space-y-10">
        {/* FAQ Accordion */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/80 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 bg-slate-50/60 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-sm text-slate-900">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="p-5 bg-white border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Support Card */}
        <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">Need personalized assistance?</h3>
            <p className="text-slate-200 text-xs sm:text-sm max-w-md font-normal leading-relaxed">
              Our engineering team is ready to assist you with laser driver setup, template conversions, and custom integrations.
            </p>
          </div>

          <a
            href="mailto:support@stamiox.com"
            className="px-6 py-3.5 rounded-full bg-white hover:bg-blue-50 text-blue-950 font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(59,130,246,0.35)] transition-all hover:scale-105 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Contact Support</span>
          </a>
        </div>
      </div>
    </div>
  );
}
