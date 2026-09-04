'use client';

import React from 'react';
import Link from 'next/link';
import {
  Cpu,
  CheckCircle2,
  ChevronRight,
  Sliders,
  ArrowRight,
  Flame,
  Zap,
  Gauge,
  Layers,
  AlertTriangle,
  Info,
  Sparkles,
} from 'lucide-react';

export default function LaserSpecsPage() {
  const laserMachines = [
    { type: 'CO2 Laser (40W - 60W)', speed: '250 - 400 mm/s', power: '60% - 85%', frequency: '5,000 - 10,000 Hz', passes: '1 Pass Engrave + 1 Cut', recommendedRubber: 'Natural Odorless Rubber 2.3mm' },
    { type: 'CO2 Laser (80W - 100W)', speed: '400 - 650 mm/s', power: '45% - 70%', frequency: '10,000 - 15,000 Hz', passes: '1 Pass Engrave + 1 Cut', recommendedRubber: 'Synthetic Laser Rubber 2.3mm' },
    { type: 'CO2 Laser (130W+ High Power)', speed: '600 - 900 mm/s', power: '35% - 55%', frequency: '15,000 - 20,000 Hz', passes: '1 Fast Pass Engrave', recommendedRubber: 'Heavy Duty Oil-Resistant Rubber' },
    { type: 'Fiber Laser (MOPA 30W - 60W)', speed: '1200 - 2000 mm/s', power: '80% - 100%', frequency: '20,000 - 45,000 Hz', passes: 'Multi-Pass High Precision', recommendedRubber: 'Pre-Inked Micro-Porous Foam' },
  ];

  return (
    <div className="flex-1 bg-slate-50/70 min-h-screen text-slate-900 pb-24">
      {/* Sleek Dark Hero Banner */}
      <div className="relative bg-gradient-to-tr from-[#020617] via-[#09152e] to-[#1e3a8a] text-white pt-12 sm:pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-xl">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="max-w-[1720px] mx-auto relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-xs font-semibold backdrop-blur-md">
            <Link href="/resources" className="hover:text-white transition-colors">
              Resources
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-blue-300" />
            <span className="text-white font-bold">Laser Machine Specs</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-4xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.035em] text-white leading-tight">
                Laser Machine Invert & <br className="hidden sm:inline" />
                <span className="text-blue-400 font-extrabold">
                  Mirror Engraving Calibration
                </span>
              </h1>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
                Technical parameters for CO2 laser engraving, negative relief depth carving, zero-loss horizontal vector mirroring, and shoulder ramp stabilization.
              </p>
            </div>

            <Link
              href="/editor"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-blue-50 text-blue-950 font-bold text-sm shadow-[0_0_25px_rgba(59,130,246,0.35)] transition-all hover:scale-105 shrink-0"
            >
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Test Laser Invert in Studio</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-20 space-y-10">
        {/* 3 Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-lg space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">1. Horizontal Mirror (X-Flip)</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Rubber stamps must be engraved in reverse (Mirror X) so that when stamped onto paper, the imprint reads correctly from left to right. Stamiox exports apply instantaneous vector mirroring with one click.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-lg space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">2. Invert Negative Engraving</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Laser beams vaporize black/fill pixels and leave white pixels raised. For raised text stamps, Stamiox inverts black text into raised relief and vaporizes the surrounding background to a depth of <strong>1.1mm - 1.4mm</strong>.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-lg space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Gauge className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">3. Shoulder Ramp Angle (35° - 45°)</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Thin serif letters require trapezoidal shoulder ramps to prevent fine rubber lines from collapsing under stamping pressure. Our vector engine outputs smooth greyscale gradient borders for shoulder stabilization.
            </p>
          </div>
        </div>

        {/* Machine Calibration Table */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-2xl font-bold text-slate-900">Laser Wattage & Speed Benchmark Matrix</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Standard recommendations for Trotec Speedy, Epilog Helix, Universal Laser, and RDWorks/Ruida Chinese CO2 machines.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/80">
                  <th className="py-4 px-5">Laser Tube Type</th>
                  <th className="py-4 px-5">Engraving Speed</th>
                  <th className="py-4 px-5">Power Output</th>
                  <th className="py-4 px-5">Pulse Frequency (PPI/Hz)</th>
                  <th className="py-4 px-5">Passes</th>
                  <th className="py-4 px-5">Optimal Rubber Substrate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {laserMachines.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-900">{m.type}</td>
                    <td className="py-4 px-5 font-mono font-semibold text-blue-600">{m.speed}</td>
                    <td className="py-4 px-5 font-mono font-bold text-indigo-600">{m.power}</td>
                    <td className="py-4 px-5 font-mono text-slate-700">{m.frequency}</td>
                    <td className="py-4 px-5 font-semibold text-slate-800">{m.passes}</td>
                    <td className="py-4 px-5 text-slate-600">{m.recommendedRubber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best Practice Tips */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Laser Engraving Guidelines</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Production Best Practices for Stamp Makers
              </h3>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-xs font-bold w-fit">
              Pro Stamp Quality Standards
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h4 className="text-white font-bold text-sm sm:text-base">1. Minimum Line Weight (0.4mm)</h4>
              </div>
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed pl-9.5">
                Ensure outer concentric rings have at least <strong>0.4mm (1.13 pt)</strong> thickness to prevent fragile rubber edges from tearing during repeated stamping.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h4 className="text-white font-bold text-sm sm:text-base">2. Laser Kerf Compensation (+0.12mm)</h4>
              </div>
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed pl-9.5">
                Add <strong>+0.12mm</strong> boundary expansion when exporting vector cutting paths so the rubber die fits snugly inside Colop & Trodat mount casings.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h4 className="text-white font-bold text-sm sm:text-base">3. High Air Assist Pressure (2.5 - 3.0 Bar)</h4>
              </div>
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed pl-9.5">
                Maintain strong compressor air assist to instantly blow away vaporized rubber fumes, preventing charred soot deposits on fine text characters.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h4 className="text-white font-bold text-sm sm:text-base">4. Ultrasonic Bath Cleaning</h4>
              </div>
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed pl-9.5">
                After laser engraving, soak rubber dies in mild soapy water or an ultrasonic bath for 60 seconds to completely flush out remaining carbon dust.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
