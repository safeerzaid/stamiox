'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shapes,
  Search,
  Sliders,
  ArrowRight,
  Printer,
  Compass,
  Layers,
  CheckCircle2,
  ChevronRight,
  Info,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  Zap,
  Maximize2,
  Check,
} from 'lucide-react';

interface MountItem {
  brand: string;
  model: string;
  shape: 'ROUND' | 'RECTANGULAR' | 'OVAL' | 'SQUARE' | 'DATER';
  widthMm: number;
  heightMm: number;
  maxLines: number;
  recommendedFontPt: string;
  popularUse: string;
}

const MOUNT_DATABASE: MountItem[] = [
  // Colop Round
  { brand: 'Colop', model: 'Printer R 12', shape: 'ROUND', widthMm: 12, heightMm: 12, maxLines: 2, recommendedFontPt: '6 - 8 pt', popularUse: 'Initials, Monograms, Loyalty Stamp' },
  { brand: 'Colop', model: 'Printer R 17', shape: 'ROUND', widthMm: 17, heightMm: 17, maxLines: 3, recommendedFontPt: '7 - 9 pt', popularUse: 'Small Inspection & QC Stamp' },
  { brand: 'Colop', model: 'Printer R 24', shape: 'ROUND', widthMm: 24, heightMm: 24, maxLines: 4, recommendedFontPt: '8 - 10 pt', popularUse: 'Doctor Small Seal, QC Pass' },
  { brand: 'Colop', model: 'Printer R 30', shape: 'ROUND', widthMm: 30, heightMm: 30, maxLines: 5, recommendedFontPt: '9 - 11 pt', popularUse: 'Company Logo & Branch Seal' },
  { brand: 'Colop', model: 'Printer R 40', shape: 'ROUND', widthMm: 40, heightMm: 40, maxLines: 6, recommendedFontPt: '10 - 13 pt', popularUse: 'Standard Notary & Official Seal' },
  { brand: 'Colop', model: 'Printer R 45', shape: 'ROUND', widthMm: 45, heightMm: 45, maxLines: 7, recommendedFontPt: '10 - 14 pt', popularUse: 'Government & Advocate Notary' },
  { brand: 'Colop', model: 'Printer R 50', shape: 'ROUND', widthMm: 50, heightMm: 50, maxLines: 8, recommendedFontPt: '11 - 15 pt', popularUse: 'Large Emblemed University Seal' },

  // Trodat Printy Round
  { brand: 'Trodat', model: 'Printy 4612', shape: 'ROUND', widthMm: 12, heightMm: 12, maxLines: 2, recommendedFontPt: '6 - 8 pt', popularUse: 'Mini Initial Stamp' },
  { brand: 'Trodat', model: 'Printy 46025', shape: 'ROUND', widthMm: 25, heightMm: 25, maxLines: 4, recommendedFontPt: '8 - 10 pt', popularUse: 'Small Circular Seal' },
  { brand: 'Trodat', model: 'Printy 4630', shape: 'ROUND', widthMm: 30, heightMm: 30, maxLines: 5, recommendedFontPt: '9 - 11 pt', popularUse: 'Corporate Emblem Seal' },
  { brand: 'Trodat', model: 'Printy 4642', shape: 'ROUND', widthMm: 42, heightMm: 42, maxLines: 6, recommendedFontPt: '10 - 13 pt', popularUse: 'Official Notary & Legal Seal' },
  { brand: 'Trodat', model: 'Printy 4645', shape: 'ROUND', widthMm: 45, heightMm: 45, maxLines: 7, recommendedFontPt: '10 - 14 pt', popularUse: 'High Court Commission Seal' },
  { brand: 'Trodat', model: 'Printy 4650', shape: 'ROUND', widthMm: 50, heightMm: 50, maxLines: 8, recommendedFontPt: '11 - 15 pt', popularUse: 'State Authority Large Seal' },

  // Trodat Rectangular
  { brand: 'Trodat', model: 'Printy 4910', shape: 'RECTANGULAR', widthMm: 26, heightMm: 9, maxLines: 2, recommendedFontPt: '7 - 9 pt', popularUse: 'Name & Single Line Signature' },
  { brand: 'Trodat', model: 'Printy 4911', shape: 'RECTANGULAR', widthMm: 38, heightMm: 14, maxLines: 3, recommendedFontPt: '8 - 10 pt', popularUse: 'Doctor Rx & Address 3 Lines' },
  { brand: 'Trodat', model: 'Printy 4912', shape: 'RECTANGULAR', widthMm: 47, heightMm: 18, maxLines: 4, recommendedFontPt: '9 - 11 pt', popularUse: 'Standard Address & GST Stamp' },
  { brand: 'Trodat', model: 'Printy 4913', shape: 'RECTANGULAR', widthMm: 58, heightMm: 22, maxLines: 5, recommendedFontPt: '9 - 12 pt', popularUse: 'Bank For Authorised Signatory' },
  { brand: 'Trodat', model: 'Printy 4915', shape: 'RECTANGULAR', widthMm: 70, heightMm: 25, maxLines: 6, recommendedFontPt: '10 - 13 pt', popularUse: 'Large Company Multi-Line Address' },
  { brand: 'Trodat', model: 'Printy 4926', shape: 'RECTANGULAR', widthMm: 75, heightMm: 38, maxLines: 8, recommendedFontPt: '10 - 14 pt', popularUse: 'Customs & Dispatch Table Stamp' },

  // Colop Rectangular
  { brand: 'Colop', model: 'Printer 10', shape: 'RECTANGULAR', widthMm: 27, heightMm: 10, maxLines: 2, recommendedFontPt: '7 - 9 pt', popularUse: 'Short 2-Line Text Stamp' },
  { brand: 'Colop', model: 'Printer 20', shape: 'RECTANGULAR', widthMm: 38, heightMm: 14, maxLines: 3, recommendedFontPt: '8 - 10 pt', popularUse: 'Signatory & Designation Stamp' },
  { brand: 'Colop', model: 'Printer 30', shape: 'RECTANGULAR', widthMm: 47, heightMm: 18, maxLines: 4, recommendedFontPt: '9 - 11 pt', popularUse: 'Address, Telephone & Email' },
  { brand: 'Colop', model: 'Printer 40', shape: 'RECTANGULAR', widthMm: 59, heightMm: 23, maxLines: 5, recommendedFontPt: '9 - 12 pt', popularUse: 'Corporate Return Address' },
  { brand: 'Colop', model: 'Printer 50', shape: 'RECTANGULAR', widthMm: 69, heightMm: 30, maxLines: 7, recommendedFontPt: '10 - 13 pt', popularUse: 'Billing & Account Paid Stamp' },
  { brand: 'Colop', model: 'Printer 60', shape: 'RECTANGULAR', widthMm: 76, heightMm: 37, maxLines: 8, recommendedFontPt: '10 - 14 pt', popularUse: 'Heavy-Duty Warehouse Box Stamp' },

  // Oval Mounts
  { brand: 'Shiny', model: 'Shiny O-3555', shape: 'OVAL', widthMm: 55, heightMm: 35, maxLines: 5, recommendedFontPt: '9 - 12 pt', popularUse: 'Classic Dual-Arch Oval Seal' },
  { brand: 'Colop', model: 'Printer Oval 44', shape: 'OVAL', widthMm: 44, heightMm: 28, maxLines: 4, recommendedFontPt: '8 - 11 pt', popularUse: 'Compact Oval Monogram Seal' },
  { brand: 'Colop', model: 'Printer Oval 55', shape: 'OVAL', widthMm: 55, heightMm: 35, maxLines: 5, recommendedFontPt: '9 - 12 pt', popularUse: 'Advocate & Notary Oval Seal' },

  // Square Mounts
  { brand: 'Colop', model: 'Printer Q 24', shape: 'SQUARE', widthMm: 24, heightMm: 24, maxLines: 4, recommendedFontPt: '8 - 10 pt', popularUse: 'Square Monogram, QR Code' },
  { brand: 'Colop', model: 'Printer Q 30', shape: 'SQUARE', widthMm: 30, heightMm: 30, maxLines: 5, recommendedFontPt: '9 - 11 pt', popularUse: 'QC Inspection & Quality Control' },
  { brand: 'Colop', model: 'Printer Q 43', shape: 'SQUARE', widthMm: 43, heightMm: 43, maxLines: 7, recommendedFontPt: '10 - 13 pt', popularUse: 'Large Square Crest & QR Verification' },
  { brand: 'Trodat', model: 'Printy 4922', shape: 'SQUARE', widthMm: 20, heightMm: 20, maxLines: 3, recommendedFontPt: '7 - 9 pt', popularUse: 'Compact QR Code & Icon Stamp' },
  { brand: 'Trodat', model: 'Printy 4923', shape: 'SQUARE', widthMm: 30, heightMm: 30, maxLines: 5, recommendedFontPt: '9 - 11 pt', popularUse: 'Certified Square Inspector Seal' },
  { brand: 'Trodat', model: 'Printy 4924', shape: 'SQUARE', widthMm: 40, heightMm: 40, maxLines: 7, recommendedFontPt: '10 - 13 pt', popularUse: 'Official Square Stamp' },

  // Sun Stamper Flash Mounts
  { brand: 'Sun Stamper', model: 'Sun S-20', shape: 'ROUND', widthMm: 20, heightMm: 20, maxLines: 3, recommendedFontPt: '8 - 10 pt', popularUse: 'Flash Pre-Inked Round Seal' },
  { brand: 'Sun Stamper', model: 'Sun S-32', shape: 'ROUND', widthMm: 32, heightMm: 32, maxLines: 5, recommendedFontPt: '9 - 11 pt', popularUse: 'Flash Pre-Inked Company Seal' },
  { brand: 'Sun Stamper', model: 'Sun S-42', shape: 'ROUND', widthMm: 42, heightMm: 42, maxLines: 6, recommendedFontPt: '10 - 13 pt', popularUse: 'Flash Notary Advocate Seal' },
  { brand: 'Sun Stamper', model: 'Sun R-5020', shape: 'RECTANGULAR', widthMm: 50, heightMm: 20, maxLines: 4, recommendedFontPt: '9 - 11 pt', popularUse: 'Flash Pre-Inked Signatory' },
  { brand: 'Sun Stamper', model: 'Sun R-6530', shape: 'RECTANGULAR', widthMm: 65, heightMm: 30, maxLines: 6, recommendedFontPt: '10 - 13 pt', popularUse: 'Flash Address & Bank Seal' },
];

export default function MountMatrixPage() {
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedShape, setSelectedShape] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const brands = [
    { id: 'all', label: 'All Brands', count: MOUNT_DATABASE.length },
    { id: 'Colop', label: 'Colop', count: MOUNT_DATABASE.filter(m => m.brand === 'Colop').length },
    { id: 'Trodat', label: 'Trodat', count: MOUNT_DATABASE.filter(m => m.brand === 'Trodat').length },
    { id: 'Shiny', label: 'Shiny', count: MOUNT_DATABASE.filter(m => m.brand === 'Shiny').length },
    { id: 'Sun Stamper', label: 'Sun Stamper', count: MOUNT_DATABASE.filter(m => m.brand === 'Sun Stamper').length },
  ];

  const shapes = [
    { id: 'all', label: 'All Shapes' },
    { id: 'ROUND', label: '⭕ Round' },
    { id: 'RECTANGULAR', label: '▭ Rectangular' },
    { id: 'OVAL', label: '⬭ Oval' },
    { id: 'SQUARE', label: '▢ Square' },
  ];

  const filtered = MOUNT_DATABASE.filter((item) => {
    const matchesBrand = selectedBrand === 'all' || item.brand.toLowerCase() === selectedBrand.toLowerCase();
    const matchesShape = selectedShape === 'all' || item.shape === selectedShape;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.brand.toLowerCase().includes(q) ||
      item.model.toLowerCase().includes(q) ||
      item.popularUse.toLowerCase().includes(q) ||
      `${item.widthMm}x${item.heightMm}`.includes(q) ||
      `${item.widthMm} mm`.includes(q);

    return matchesBrand && matchesShape && matchesSearch;
  });

  return (
    <div className="flex-1 bg-slate-50/70 min-h-screen text-slate-900 pb-24">
      {/* --- SLEEK DARK HERO BANNER --- */}
      <div className="relative bg-gradient-to-tr from-[#020617] via-[#09152e] to-[#1e3a8a] text-white pt-12 sm:pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-xl">
        {/* Glowing Background Auras */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="max-w-[1720px] mx-auto relative z-10 space-y-6">
          {/* Breadcrumb Glass Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-xs font-semibold backdrop-blur-md">
            <Link href="/resources" className="hover:text-white transition-colors">
              Resources
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-blue-300" />
            <span className="text-white font-bold">Mount Sizing Matrix</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-4xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.035em] text-white leading-tight">
                Self-Inking Mount Sizing & <br className="hidden sm:inline" />
                <span className="text-blue-400 font-extrabold">
                  Hardware Specifications Database
                </span>
              </h1>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                Physical impression boundaries, line capacities, and recommended typography scales for Colop, Trodat, Shiny, and Sun Stamper commercial mounts.
              </p>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/editor"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-blue-50 text-blue-950 font-bold text-sm shadow-[0_0_25px_rgba(59,130,246,0.35)] transition-all hover:scale-105"
              >
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Open Vector Studio</span>
              </Link>
            </div>
          </div>

          {/* Quick Search in Hero */}
          <div className="pt-2 max-w-2xl relative">
            <Search className="w-5 h-5 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by model (e.g. R 40, 4912), size (e.g. 40mm), or use case..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 focus:bg-slate-900 border border-blue-400/40 text-white placeholder:text-blue-200/70 text-xs sm:text-sm outline-none focus:border-blue-400 backdrop-blur-xl transition-all shadow-lg font-medium"
            />
          </div>
        </div>
      </div>

      {/* --- FILTER BAR & CONTROLS --- */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-20 space-y-6">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Brand Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {brands.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBrand(b.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedBrand === b.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{b.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedBrand === b.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {b.count}
                </span>
              </button>
            ))}
          </div>

          {/* Shape Filters & View Mode */}
          <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            {/* Shape Select */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {shapes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedShape(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    selectedShape === s.id
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* View Mode Toggle: Grid vs Table */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                title="Grid Cards View"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Dense Table View"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* --- MAIN MOUNT DISPLAY --- */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center space-y-3 border border-slate-200 shadow-2xs">
            <Shapes className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No mount specifications found</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search query or selecting "All Brands" and "All Shapes".
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* --- VISUAL GRID CARDS VIEW --- */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filtered.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-blue-500/80 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group space-y-5"
              >
                {/* Card Top: Brand Badge & Shape Wireframe Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px]">
                      {item.brand}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 font-bold text-[10px] uppercase tracking-wide font-mono">
                      {item.shape}
                    </span>
                  </div>

                  {/* Visual Wireframe Preview Box */}
                  <div className="w-full h-32 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-center p-3 group-hover:bg-blue-50/40 transition-colors">
                    <div
                      className={`border-2 border-dashed border-slate-400 group-hover:border-blue-600 transition-colors flex flex-col items-center justify-center text-center p-1.5 ${
                        item.shape === 'ROUND'
                          ? 'w-24 h-24 rounded-full'
                          : item.shape === 'OVAL'
                          ? 'w-28 h-18 rounded-[50%]'
                          : item.shape === 'SQUARE'
                          ? 'w-20 h-20 rounded-lg'
                          : 'w-28 h-14 rounded-md'
                      }`}
                    >
                      <span className="text-[11px] font-extrabold text-slate-800 group-hover:text-blue-600 font-mono">
                        {item.widthMm} × {item.heightMm} mm
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                        {item.maxLines} Lines Max
                      </span>
                    </div>
                  </div>

                  {/* Model & Dimensions Title */}
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.model}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.popularUse}
                    </p>
                  </div>

                  {/* Specs Quick Pill */}
                  <div className="p-3 rounded-xl bg-slate-50 space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Recommended:</span>
                      <span className="font-bold text-slate-900 font-mono">{item.recommendedFontPt}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Max Density:</span>
                      <span className="font-bold text-emerald-600">{item.maxLines} Text Lines</span>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-3 border-t border-slate-100">
                  <Link
                    href="/editor"
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 group-hover:shadow-md"
                  >
                    <span>Design in Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* --- DENSE TABLE VIEW --- */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/80">
                    <th className="py-4 px-5">Brand & Manufacturer</th>
                    <th className="py-4 px-5">Mount Model</th>
                    <th className="py-4 px-5">Mount Shape</th>
                    <th className="py-4 px-5">Impression Area (mm)</th>
                    <th className="py-4 px-5">Max Text Lines</th>
                    <th className="py-4 px-5">Recommended Font</th>
                    <th className="py-4 px-5">Commercial Use Case</th>
                    <th className="py-4 px-5 text-right">Studio Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filtered.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-5 font-bold text-slate-900">{item.brand}</td>
                      <td className="py-4 px-5 font-mono font-semibold text-slate-700">{item.model}</td>
                      <td className="py-4 px-5">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wide">
                          {item.shape}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-mono font-bold text-blue-600">
                        {item.widthMm} × {item.heightMm} mm
                      </td>
                      <td className="py-4 px-5 font-semibold text-slate-700">{item.maxLines} lines</td>
                      <td className="py-4 px-5 font-mono text-slate-600">{item.recommendedFontPt}</td>
                      <td className="py-4 px-5 text-slate-600 max-w-xs truncate">{item.popularUse}</td>
                      <td className="py-4 px-5 text-right">
                        <Link
                          href="/editor"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-blue-600 text-white font-bold text-[11px] transition-colors"
                        >
                          <span>Open Studio</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Technical Calibration Note */}
        <div className="p-6 rounded-3xl bg-blue-50/80 border border-blue-100 flex items-start gap-4 text-xs leading-relaxed text-blue-900">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">Die-Cutting & Laser Kerf Clearance</p>
            <p className="text-blue-800">
              When cutting self-inking rubber dies on CO2 laser machines, ensure an offset tolerance of <strong>0.25mm to 0.40mm</strong> inside the mount boundary to prevent the rubber die from rubbing against the plastic casing walls during retraction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
