'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  CheckCircle2,
  ChevronRight,
  Sliders,
  ArrowRight,
  Download,
  Layers,
  Code,
  Printer,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function ExportFormatsPage() {
  const formats = [
    {
      ext: 'SVG',
      name: 'Scalable Vector Graphics (SVG 1.1)',
      desc: 'Pure vector paths, circular arcs, text-to-path outlines, and zero raster pixelation at any scale.',
      dpi: 'Infinite Vector Scale',
      idealFor: 'Direct Laser Engraving (LightBurn, RDWorks, LaserCAD, LaserWeb)',
      badge: 'Recommended for Laser',
      badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-400/30',
    },
    {
      ext: 'PDF',
      name: 'Print-Ready Vector PDF (1:1 Scale)',
      desc: 'Industry-standard vector PDF formatted with exact millimetric dimensions and crop marks for A4 imposition sheets.',
      dpi: 'Exact 1:1 Physical Scale',
      idealFor: 'Commercial Offset & Digital Print Shops, Client Approval Sheets',
      badge: 'Best for Production A4',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    },
    {
      ext: 'PNG',
      name: 'Transparent High-Res Raster (600 DPI)',
      desc: 'Crisp raster bitmap with alpha transparency channel and ultra-dense 600 pixels per inch resolution.',
      dpi: '600 DPI Ultra-Dense',
      idealFor: 'WhatsApp Client Mockup Previews, E-Invoices, Digital Document Watermarks',
      badge: 'Client Approval Previews',
      badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-400/30',
    },
    {
      ext: 'DXF',
      name: 'AutoCAD DXF Drawing Exchange',
      desc: '2D CAD geometry polyline contours optimized for CNC routing machines and mechanical laser plotters.',
      dpi: 'CAD Polyline Geometry',
      idealFor: 'AutoCAD, SolidWorks, CNC Engraving Spindles',
      badge: 'CAD & CNC Milling',
      badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    },
  ];

  return (
    <div className="flex-1 bg-slate-50/70 min-h-screen text-slate-900 pb-24">
      {/* Sleek Dark Hero Banner */}
      <div className="relative bg-gradient-to-tr from-[#020617] via-[#09152e] to-[#1e3a8a] text-white pt-12 sm:pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-xl">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="max-w-[1720px] mx-auto relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-xs font-semibold backdrop-blur-md">
            <Link href="/resources" className="hover:text-white transition-colors">
              Resources
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-blue-300" />
            <span className="text-white font-bold">Export Vector Formats</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-4xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.035em] text-white leading-tight">
                Vector Export Standards & <br className="hidden sm:inline" />
                <span className="text-blue-400 font-extrabold">
                  Driver Compatibility Manual
                </span>
              </h1>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                Comprehensive technical specifications for SVG 1.1 vector outlines, 1:1 scale print PDFs, 600DPI transparent PNG previews, and laser cutter integration.
              </p>
            </div>

            <Link
              href="/editor"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-blue-50 text-blue-950 font-bold text-sm shadow-[0_0_25px_rgba(59,130,246,0.35)] transition-all hover:scale-105 shrink-0"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Export Test File in Studio</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-20 space-y-10">
        {/* Format Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {formats.map((f) => (
            <div key={f.ext} className="bg-white rounded-3xl p-7 sm:p-8 border border-slate-200 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-extrabold text-sm tracking-wider font-mono shadow-sm">
                    .{f.ext}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">{f.name}</h3>
                    <p className="text-xs font-semibold text-blue-600 font-mono">{f.dpi}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${f.badgeColor}`}>
                  {f.badge}
                </span>
              </div>

              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{f.desc}</p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span><strong>Target Driver:</strong> {f.idealFor}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Software Compatibility Matrix */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-2xl font-bold text-slate-900">Software & Laser Driver Compatibility</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Tested and certified compatibility across leading graphics software and laser engraver controllers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <h4 className="font-bold text-sm text-slate-900">LightBurn & RDWorks</h4>
              <p className="text-slate-600 leading-relaxed">
                Direct 1:1 SVG import. Preserves stroke widths, fill colors, and layer cut hierarchy without scale distortion.
              </p>
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>100% Native Vector Fit</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <h4 className="font-bold text-sm text-slate-900">CorelDRAW (X7 to 2024)</h4>
              <p className="text-slate-600 leading-relaxed">
                Imports SVG and PDF with pure editable vector curves. Text paths remain razor sharp for hairline laser contours.
              </p>
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Fully Vector Editable</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <h4 className="font-bold text-sm text-slate-900">Adobe Illustrator CC</h4>
              <p className="text-slate-600 leading-relaxed">
                Seamless PDF and SVG geometry import with millimeter artboard coordinates and CMYK/RGB precision.
              </p>
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>1:1 Coordinate Precision</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
