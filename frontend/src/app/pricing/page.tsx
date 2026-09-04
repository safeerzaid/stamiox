'use client';

import React from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import {
  Check,
  ArrowRight,
  Sliders,
  Building2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const { openUpgradeModal } = useSubscription();
  const { user } = useAuth();

  return (
    <div className="flex-1 bg-white py-16 text-slate-900 min-h-screen">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Page Header (Matching Image Title Style) */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-0.035em] text-[#111827]">
            Pricing plans
          </h1>
          <p className="text-slate-500 font-medium text-base sm:text-lg">
            Choose the right plan for your needs.
          </p>
        </div>

        {/* Pricing Cards Grid (Matching Reference Screenshot Design) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {/* Card 1: Starter ($0 / month) */}
          <div className="bg-white rounded-[32px] sm:rounded-[36px] border border-slate-200/90 p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-slate-200/40 hover:shadow-2xl transition-all duration-300 group">
            <div className="space-y-6">
              {/* Top Inset Header Stage */}
              <div className="bg-[#f3f4f6] rounded-2xl p-6 relative space-y-4">
                <div className="inline-block">
                  <span className="bg-white text-slate-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-2xs">
                    Starter
                  </span>
                </div>

                <div className="pt-2">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">$0</span>
                  <span className="text-sm font-semibold text-slate-500">/month</span>
                </div>
              </div>

              <p className="text-sm font-semibold text-slate-700 px-1">
                Perfect For Small Teams & Stamp Makers
              </p>

              {/* Action Button (Dark Pill) */}
              {user ? (
                <div className="w-full py-3.5 text-center bg-slate-100 rounded-full text-xs font-bold text-slate-700 border border-slate-200">
                  Active (90-Day Free Trial)
                </div>
              ) : (
                <Link
                  href="/login?tab=register"
                  className="w-full py-3.5 rounded-full bg-[#111111] hover:bg-[#282828] text-white font-bold text-sm shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>Start Designing Free</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </Link>
              )}

              {/* Feature Bullet List */}
              <ul className="space-y-3.5 pt-2 text-xs font-semibold text-slate-600 px-1">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-slate-400 shrink-0 stroke-[2.5]" />
                  <span>90 Days Unlimited Free Access</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-slate-400 shrink-0 stroke-[2.5]" />
                  <span>35+ Production Vector Templates</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-slate-400 shrink-0 stroke-[2.5]" />
                  <span>Full Studio Vector Canvas Studio</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-slate-400 shrink-0 stroke-[2.5]" />
                  <span>High-Res SVG & PDF Downloads</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Card 2: Professional ($9.99 / month) */}
          <div className="bg-white rounded-[32px] sm:rounded-[36px] border-2 border-blue-600/80 p-6 sm:p-8 flex flex-col justify-between shadow-2xl shadow-blue-500/20 hover:shadow-2xl transition-all duration-300 group relative">
            <div className="space-y-6">
              {/* Top Inset Header Stage */}
              <div className="bg-[#e0e7ff]/60 border border-blue-200/60 rounded-2xl p-6 relative space-y-4">
                <div className="inline-block">
                  <span className="bg-white text-blue-700 text-xs font-extrabold px-4 py-1.5 rounded-full shadow-2xs uppercase tracking-wider">
                    PROFESSIONAL
                  </span>
                </div>

                <div className="pt-2">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">$9.99</span>
                  <span className="text-sm font-semibold text-slate-500">/month</span>
                </div>
              </div>

              <p className="text-sm font-semibold text-slate-700 px-1">
                Perfect For Growing Stamp Businesses
              </p>

              {/* Action Button (Dark Pill) */}
              <button
                onClick={openUpgradeModal}
                className="w-full py-3.5 rounded-full bg-[#111111] hover:bg-[#282828] text-white font-bold text-sm shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Subscribe Pro Monthly</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>

              {/* Feature Bullet List */}
              <ul className="space-y-3.5 pt-2 text-xs font-semibold text-slate-600 px-1">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 stroke-[2.5]" />
                  <span>Everything in 3-Month Free Trial</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 stroke-[2.5]" />
                  <span>Unlimited Cloud Saved Projects</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 stroke-[2.5]" />
                  <span>Commercial Stamp Production License</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 stroke-[2.5]" />
                  <span>Laser Engraving Mirror X & Invert Output</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-blue-600 shrink-0 stroke-[2.5]" />
                  <span>Risk-Free 100% Satisfaction Guarantee</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Card 3: Enterprise (Custom / $89 Year) */}
          <div className="bg-white rounded-[32px] sm:rounded-[36px] border border-slate-200/90 p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-slate-200/40 hover:shadow-2xl transition-all duration-300 group">
            <div className="space-y-6">
              {/* Top Inset Header Stage */}
              <div className="bg-[#f3f4f6] rounded-2xl p-6 relative space-y-4">
                <div className="inline-block">
                  <span className="bg-white text-slate-900 text-xs font-extrabold px-4 py-1.5 rounded-full shadow-2xs uppercase tracking-wider">
                    ENTERPRISE
                  </span>
                </div>

                <div className="pt-2">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">Custom</span>
                </div>
              </div>

              <p className="text-sm font-semibold text-slate-700 px-1">
                For Large Organizations & Print Shops
              </p>

              {/* Action Button (Dark Pill) */}
              <Link
                href="/enterprise"
                className="w-full py-3.5 rounded-full bg-[#111111] hover:bg-[#282828] text-white font-bold text-sm shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>Contact Enterprise</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>

              {/* Feature Bullet List */}
              <ul className="space-y-3.5 pt-2 text-xs font-semibold text-slate-600 px-1">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-slate-400 shrink-0 stroke-[2.5]" />
                  <span>Unlimited Team & Branch Licenses</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-slate-400 shrink-0 stroke-[2.5]" />
                  <span>Automated REST API Batch Engine</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-slate-400 shrink-0 stroke-[2.5]" />
                  <span>Custom Legal Vault & Logo Vectorizer</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-slate-400 shrink-0 stroke-[2.5]" />
                  <span>Dedicated SLA & Support Engineer</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
