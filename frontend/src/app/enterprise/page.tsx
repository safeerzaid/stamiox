'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Cpu,
  Printer,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sliders,
  FileCheck2,
  Sparkles,
  Layers,
  Users,
  Server,
  Check,
  ChevronRight,
  Lock,
  Globe,
  Headphones,
  Award,
  Clock,
  Compass,
} from 'lucide-react';

const HARDWARE_PARTNERS = [
  { name: 'Trotec Laser', desc: 'JobControl & Speedy Series direct DXF/SVG' },
  { name: 'Epilog Laser', desc: 'Fusion Pro & Dashboard 1200 PPI profiles' },
  { name: 'Universal Laser', desc: 'PLS & VLS material database presets' },
  { name: 'LightBurn CNC', desc: 'Optimized vector layers & kerf offsets' },
  { name: 'Trodat Mounts', desc: 'Printy 4.0 & Professional 1:1 die footprints' },
  { name: 'Colop Mounts', desc: 'Printer Line, Pocket & Stamp Mouse specs' },
  { name: 'Shiny Mounts', desc: 'Heavy Duty S-Series & Self-Inking cassettes' },
  { name: 'Flash Stamp Foams', desc: '600 DPI microporous exposure matrices' },
];

export default function EnterprisePage() {
  // Consultation Form state
  const [formData, setFormData] = useState({
    name: '',
    workEmail: '',
    company: '',
    orgType: 'Stamp Manufacturer / Print Shop',
    monthlyVolume: '1,000 - 5,000 stamps/mo',
    laserMachine: 'Trotec / Speedy Series',
    notes: '',
  });
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.workEmail) return;
    setIsSubmitted(true);
  };

  return (
    <div className="flex-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen transition-colors">
      {/* =========================================================================
          HERO SECTION: ENTERPRISE RUBBER STAMP INFRASTRUCTURE
         ========================================================================= */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-950 pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1.5px,transparent_1.5px)] [background-size:28px_28px] opacity-10 pointer-events-none" />
        <div className="absolute -top-40 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-5xl space-y-8">
            {/* Enterprise Tagline Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide uppercase shadow-sm">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Enterprise Rubber Stamp Infrastructure</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[1.08] text-slate-900 dark:text-white">
              Industrial-Scale Stamp Generation &amp; <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                CNC Laser Automation Engine
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-slate-600 dark:text-slate-300 text-lg sm:text-2xl font-normal max-w-3xl leading-relaxed">
              Empower your global branch network, notary portals, and high-speed laser engraving facilities with automated vector rendering, sub-millisecond REST APIs, and strict cryptographic role security.
            </p>

            {/* Hero Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <a
                href="#enterprise-consultation"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-base transition-all shadow-xl hover:scale-105 shadow-slate-900/10 dark:shadow-blue-600/30"
              >
                <span>Request Enterprise Pilot</span>
                <ArrowRight className="w-5 h-5" />
              </a>
              <Link
                href="/editor"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-base transition-all border border-slate-200 dark:border-slate-700"
              >
                <Sliders className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                <span>Launch Studio Editor</span>
              </Link>
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-full text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-sm transition-colors"
              >
                <span>Browse All Templates</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ENTERPRISE CAPABILITIES: 6 INDUSTRIAL PILLARS
         ========================================================================= */}
      <section className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Layers className="w-3.5 h-3.5" />
            <span>Industrial Stamp Infrastructure</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Engineered for Industrial Stamp Manufacturers &amp; Enterprise Control
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
            Complete hardware, software, API, and cryptographic security suite for global stamp operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-2xl transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform">
              <Printer className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Laser Machine Direct CNC Post-Processor</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              Direct vector export compatibility for Trotec JobControl, Universal Laser Systems, Epilog Dashboard, and China Fiber Laser CNCs with automated Mirror X, Invert Fill, and dynamic 20° shoulder ramp depth compensation.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-500" />
                <span>Automated Kerf Offset (+0.06mm compensation)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-blue-500" />
                <span>100% Pure Monochrome K without anti-alias blur</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-2xl transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Headless High-Throughput REST API</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              Generate thousands of legal notary, medical Rx, corporate seal, or address stamps programmatically. Inject variable text payloads and retrieve ready-to-burn 1:1 vector SVGs or PDF/X-1a in under 40 milliseconds.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-indigo-500" />
                <span>Webhooks for ERP &amp; Shopify e-commerce order queues</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-indigo-500" />
                <span>Dynamic QR &amp; Barcode stamp embedding engine</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-2xl transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Encrypted Government &amp; Legal Seal Vault</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              Store sensitive official state crests, scales of justice, court seals, and proprietary corporate trademarks in an encrypted vector vault with strict role-based access control and watermarking.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>AES-256 asset encryption at rest &amp; in transit</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Notary commission number registry verification</span>
              </li>
            </ul>
          </div>

          {/* Pillar 4 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:shadow-2xl transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/30 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Multi-Branch Governance &amp; SSO</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              Manage multi-location print shop franchises, legal departments, and production operators with centralized SSO (Okta, Azure AD, SAML), approval workflows, and immutable audit logs.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-500" />
                <span>Role-based permissions (Designer, Approver, CNC Operator)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-amber-500" />
                <span>Complete revision history with 1-click rollbacks</span>
              </li>
            </ul>
          </div>

          {/* Pillar 5 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:shadow-2xl transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/30 group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">1:1 Physical Mount Calibration Matrix</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              Automatic bounding-box snapping to exact millimetric casing limits for Trodat Printy, Colop Printer, Shiny S-Series, and MaxStamp self-inking mounts to eliminate physical misalignments.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-sky-500" />
                <span>Pre-calibrated 10mm to 75mm round &amp; rectangular mount dies</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-sky-500" />
                <span>Index label sheet printing with 1:1 true scale crop marks</span>
              </li>
            </ul>
          </div>

          {/* Pillar 6 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 hover:shadow-2xl transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-110 transition-transform">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Dedicated Private Cloud &amp; On-Premises</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              Deploy Stamiox on isolated dedicated VPC clusters, AWS/Azure private regions, or air-gapped on-premises Docker containers with 24/7 dedicated solutions engineering support.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-500" />
                <span>Custom CNC driver integration &amp; post-processor scripting</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-purple-500" />
                <span>Guaranteed 15-minute response time enterprise SLA</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* =========================================================================
          HARDWARE & MOUNT COMPATIBILITY ECOSYSTEM
         ========================================================================= */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Pre-Calibrated Industrial Hardware Ecosystem
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Native zero-conversion integration with the world&apos;s leading laser engraving machines and self-inking mounts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HARDWARE_PARTNERS.map((partner) => (
              <div
                key={partner.name}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">{partner.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{partner.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ENTERPRISE VS STANDARD PRO COMPARISON MATRIX
         ========================================================================= */}
      <section className="py-24 max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Standard Pro vs Dedicated Enterprise Infrastructure
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base">
            Choose the deployment tier that matches your organization’s production volume and compliance needs.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                <th className="p-6 text-sm font-bold text-slate-900 dark:text-white">Feature &amp; Capability</th>
                <th className="p-6 text-sm font-bold text-slate-900 dark:text-white">Standard Pro Plan</th>
                <th className="p-6 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40">
                  Dedicated Enterprise
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              <tr>
                <td className="p-6 font-semibold text-slate-900 dark:text-white">Monthly Vector Exports</td>
                <td className="p-6 text-slate-600 dark:text-slate-400">Unlimited Studio UI Downloads</td>
                <td className="p-6 font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20">
                  Unlimited Studio UI + Headless API Batching
                </td>
              </tr>
              <tr>
                <td className="p-6 font-semibold text-slate-900 dark:text-white">Headless REST API Access</td>
                <td className="p-6 text-slate-400">Not Included</td>
                <td className="p-6 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/20">
                  Included (Up to 250 requests/second)
                </td>
              </tr>
              <tr>
                <td className="p-6 font-semibold text-slate-900 dark:text-white">Laser CNC Kerf &amp; Shoulder Ramps</td>
                <td className="p-6 text-slate-600 dark:text-slate-400">Manual Parameter Preset</td>
                <td className="p-6 font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20">
                  Automated CNC Post-Processors (Trotec/Epilog/LightBurn)
                </td>
              </tr>
              <tr>
                <td className="p-6 font-semibold text-slate-900 dark:text-white">SAML 2.0 / Okta / Azure SSO</td>
                <td className="p-6 text-slate-400">Password / Magic Link</td>
                <td className="p-6 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/20">
                  Enterprise SSO &amp; Multi-Branch SCIM Sync
                </td>
              </tr>
              <tr>
                <td className="p-6 font-semibold text-slate-900 dark:text-white">Custom Vector Crest Vault</td>
                <td className="p-6 text-slate-600 dark:text-slate-400">Up to 50 Custom SVGs</td>
                <td className="p-6 font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20">
                  Unlimited Encrypted Government/Corporate Vault
                </td>
              </tr>
              <tr>
                <td className="p-6 font-semibold text-slate-900 dark:text-white">Deployment Options</td>
                <td className="p-6 text-slate-600 dark:text-slate-400">Multi-tenant Cloud</td>
                <td className="p-6 font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20">
                  Dedicated Cloud, Custom VPC, or Air-Gapped On-Prem
                </td>
              </tr>
              <tr>
                <td className="p-6 font-semibold text-slate-900 dark:text-white">SLA &amp; Support Hotline</td>
                <td className="p-6 text-slate-600 dark:text-slate-400">Standard Email Support</td>
                <td className="p-6 font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20">
                  99.999% SLA Uptime + 24/7 Dedicated Solutions Engineer
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* =========================================================================
          ENTERPRISE CONSULTATION & CUSTOM PILOT FORM
         ========================================================================= */}
      <section id="enterprise-consultation" className="py-24 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl">
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                <Headphones className="w-3.5 h-3.5" />
                <span>Enterprise Consultation</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Schedule a Solution Architecture Review
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                Speak directly with a Stamiox laser fabrication engineer to review CNC machine parameters, API throughput requirements, and pilot deployment.
              </p>
            </div>

            {isSubmitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Pilot Request Received!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{formData.name}</strong>. A dedicated solutions engineer from Stamiox Enterprise will reach out to <strong>{formData.workEmail}</strong> within 4 business hours with custom API keys and setup documentation.
                </p>
                <div className="pt-4">
                  <Link
                    href="/editor"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all"
                  >
                    <span>Launch Studio Editor in Sandbox Mode</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitForm} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Marcus Vance"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. marcus@stampmfg.com"
                      value={formData.workEmail}
                      onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Company / Organization Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apex Stamp Technologies Ltd."
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Organization Type
                    </label>
                    <select
                      value={formData.orgType}
                      onChange={(e) => setFormData({ ...formData, orgType: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option>Stamp Manufacturer / Commercial Print Shop</option>
                      <option>Government Agency / Notary Authority</option>
                      <option>Enterprise Logistics / Retail Chain</option>
                      <option>Healthcare / Hospital Network</option>
                      <option>Software / E-Commerce Platform</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Estimated Monthly Volume
                    </label>
                    <select
                      value={formData.monthlyVolume}
                      onChange={(e) => setFormData({ ...formData, monthlyVolume: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option>500 - 1,000 stamps/month</option>
                      <option>1,000 - 5,000 stamps/month</option>
                      <option>5,000 - 20,000 stamps/month</option>
                      <option>20,000+ stamps/month (High Scale)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Primary Laser / Hardware Type
                    </label>
                    <select
                      value={formData.laserMachine}
                      onChange={(e) => setFormData({ ...formData, laserMachine: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option>Trotec Speedy Series / JobControl</option>
                      <option>Epilog Laser / Dashboard</option>
                      <option>Universal Laser Systems (ULS)</option>
                      <option>LightBurn CNC / Fiber Laser</option>
                      <option>Flash Stamp Exposure Machine</option>
                      <option>Other / Custom CNC Setup</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Integration Goals &amp; Specific Requirements
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe your current production workflow, ERP systems, or custom seal security needs..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-xl shadow-blue-600/25 transition-all"
                  >
                    Submit Request for Dedicated Enterprise Pilot
                  </button>
                  <p className="text-center text-xs text-slate-400 mt-3">
                    Guaranteed response within 4 business hours • Includes custom sandbox API credentials
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
