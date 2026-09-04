'use client';

import React from 'react';

interface BlogIllustrationProps {
  slug: string;
  className?: string;
}

export const BlogIllustration: React.FC<BlogIllustrationProps> = ({ slug, className = 'w-full h-full' }) => {
  switch (slug) {
    case 'design-perfect-stamp':
      return (
        <div className={`relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 flex items-center justify-center p-6 ${className}`}>
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          
          <svg viewBox="0 0 400 240" className="w-full h-full max-h-56 select-none relative z-10" fill="none">
            {/* Outer concentric stamp rings */}
            <circle cx="200" cy="120" r="90" stroke="#3b82f6" strokeWidth="3" strokeDasharray="6 4" className="opacity-80" />
            <circle cx="200" cy="120" r="82" stroke="#60a5fa" strokeWidth="1.5" />
            <circle cx="200" cy="120" r="58" stroke="#93c5fd" strokeWidth="2" strokeDasharray="3 3" />
            <circle cx="200" cy="120" r="50" stroke="#bfdbfe" strokeWidth="1" />

            {/* Arc text guides & angle markers */}
            <path id="curveTop" d="M 130 120 A 70 70 0 0 1 270 120" fill="transparent" />
            <text fill="#60a5fa" fontSize="9" fontWeight="700" letterSpacing="3" fontFamily="sans-serif">
              <textPath href="#curveTop" startOffset="50%" textAnchor="middle">
                STAMIOX VECTOR STUDIO
              </textPath>
            </text>

            <path id="curveBot" d="M 270 120 A 70 70 0 0 1 130 120" fill="transparent" />
            <text fill="#93c5fd" fontSize="8" fontWeight="600" letterSpacing="2.5" fontFamily="sans-serif">
              <textPath href="#curveBot" startOffset="50%" textAnchor="middle">
                ★ PRECISION 1200 DPI ★
              </textPath>
            </text>

            {/* Center geometric crest */}
            <polygon points="200,88 224,102 224,138 200,152 176,138 176,102" stroke="#38bdf8" strokeWidth="2" fill="rgba(56, 189, 248, 0.12)" />
            <circle cx="200" cy="120" r="14" fill="#3b82f6" fillOpacity="0.3" stroke="#60a5fa" strokeWidth="1.5" />
            
            {/* Star icons */}
            <polygon points="200,113 203,118 209,118 204,122 206,127 200,124 194,127 196,122 191,118 197,118" fill="#fbbf24" />

            {/* Technical measurement calipers & guidelines */}
            <line x1="110" y1="120" x2="80" y2="120" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="2 2" />
            <text x="50" y="123" fill="#f43f5e" fontSize="9" fontWeight="700" fontFamily="monospace">R=40mm</text>

            <line x1="200" y1="30" x2="200" y2="210" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
            <line x1="90" y1="120" x2="310" y2="120" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />

            {/* Corner Badges */}
            <rect x="290" y="24" width="90" height="26" rx="6" fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="1" />
            <text x="335" y="41" fill="#93c5fd" fontSize="10" fontWeight="600" textAnchor="middle" fontFamily="monospace">KERF +0.06mm</text>
          </svg>
        </div>
      );

    case 'laser-engraving-tips':
      return (
        <div className={`relative overflow-hidden bg-gradient-to-br from-amber-950 via-slate-950 to-orange-950 flex items-center justify-center p-6 ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          
          <svg viewBox="0 0 400 240" className="w-full h-full max-h-56 select-none relative z-10" fill="none">
            {/* Laser Head Nozzle */}
            <polygon points="185,15 215,15 208,45 192,45" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
            <rect x="195" y="45" width="10" height="12" fill="#d97706" />
            
            {/* Laser Beam with Glow */}
            <line x1="200" y1="57" x2="200" y2="135" stroke="#fbbf24" strokeWidth="3" className="animate-pulse" />
            <line x1="200" y1="57" x2="200" y2="135" stroke="#ef4444" strokeWidth="1" />
            <circle cx="200" cy="135" r="7" fill="#fbbf24" fillOpacity="0.8" />
            <circle cx="200" cy="135" r="14" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" className="animate-ping" />

            {/* Rubber substrate layer (cross section) */}
            {/* Base carrier */}
            <rect x="50" y="165" width="300" height="45" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            <text x="65" y="192" fill="#64748b" fontSize="10" fontWeight="600" fontFamily="monospace">VULCANIZED RUBBER SUBSTRATE (Shore A 55)</text>

            {/* Relief ridges with shoulder ramps */}
            {/* Left ridge */}
            <path d="M 80 165 L 90 135 L 115 135 L 125 165 Z" fill="#b45309" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="102" y="130" fill="#fcd34d" fontSize="9" fontWeight="700" textAnchor="middle">20° RAMP</text>

            {/* Center active cut ridge */}
            <path d="M 175 165 L 190 135 L 210 135 L 225 165 Z" fill="#d97706" stroke="#fbbf24" strokeWidth="2" />
            
            {/* Right ridge */}
            <path d="M 270 165 L 280 135 L 305 135 L 315 165 Z" fill="#b45309" stroke="#f59e0b" strokeWidth="1.5" />

            {/* Technical parameter callouts */}
            <rect x="270" y="25" width="115" height="42" rx="6" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" strokeWidth="1" />
            <text x="280" y="42" fill="#fcd34d" fontSize="10" fontWeight="700" fontFamily="monospace">POWER: 80W CO2</text>
            <text x="280" y="58" fill="#fbbf24" fontSize="10" fontWeight="700" fontFamily="monospace">FREQ: 1200 PPI</text>

            {/* Depth marker */}
            <line x1="145" y1="135" x2="145" y2="165" stroke="#ef4444" strokeWidth="1.5" />
            <text x="150" y="152" fill="#ef4444" fontSize="9" fontWeight="700" fontFamily="monospace">1.2mm</text>
          </svg>
        </div>
      );

    case 'branding-with-stamps':
      return (
        <div className={`relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950 flex items-center justify-center p-6 ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          
          <svg viewBox="0 0 400 240" className="w-full h-full max-h-56 select-none relative z-10" fill="none">
            {/* Kraft mailer box outline */}
            <rect x="60" y="40" width="280" height="160" rx="8" fill="#1c2d27" stroke="#059669" strokeWidth="2" />
            <line x1="60" y1="90" x2="340" y2="90" stroke="#047857" strokeWidth="1.5" strokeDasharray="6 4" />

            {/* Stamped Seal Impression */}
            <circle cx="150" cy="135" r="42" stroke="#10b981" strokeWidth="3" strokeDasharray="5 3" />
            <circle cx="150" cy="135" r="36" stroke="#34d399" strokeWidth="1.5" />
            <polygon points="150,112 162,130 145,145 138,128" fill="#10b981" fillOpacity="0.3" stroke="#6ee7b7" strokeWidth="1.5" />
            <text x="150" y="154" fill="#a7f3d0" fontSize="7" fontWeight="700" textAnchor="middle" letterSpacing="1">ORIGINAL BOTANICALS</text>

            {/* Scannable Stamp QR Box */}
            <rect x="235" y="105" width="60" height="60" rx="6" fill="#064e3b" stroke="#34d399" strokeWidth="2" />
            <rect x="243" y="113" width="14" height="14" fill="#6ee7b7" />
            <rect x="246" y="116" width="8" height="8" fill="#064e3b" />
            <rect x="273" y="113" width="14" height="14" fill="#6ee7b7" />
            <rect x="276" y="116" width="8" height="8" fill="#064e3b" />
            <rect x="243" y="143" width="14" height="14" fill="#6ee7b7" />
            <rect x="246" y="146" width="8" height="8" fill="#064e3b" />
            <rect x="264" y="132" width="6" height="6" fill="#6ee7b7" />
            <rect x="274" y="142" width="12" height="6" fill="#6ee7b7" />
            <text x="265" y="180" fill="#a7f3d0" fontSize="8" fontWeight="600" textAnchor="middle">SCAN FOR 15% OFF</text>

            {/* Floating Brand Badge */}
            <rect x="80" y="18" width="130" height="26" rx="6" fill="#047857" />
            <text x="145" y="35" fill="#ecfdf5" fontSize="10" fontWeight="700" textAnchor="middle">74% PACKAGING SAVINGS</text>
          </svg>
        </div>
      );

    case 'new-stamping-materials':
      return (
        <div className={`relative overflow-hidden bg-gradient-to-br from-teal-950 via-slate-950 to-cyan-950 flex items-center justify-center p-6 ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          
          <svg viewBox="0 0 400 240" className="w-full h-full max-h-56 select-none relative z-10" fill="none">
            {/* Molecular Polymer Mesh Nodes */}
            <circle cx="90" cy="80" r="16" fill="#0f766e" stroke="#2dd4bf" strokeWidth="2" />
            <circle cx="170" cy="60" r="20" fill="#115e59" stroke="#14b8a6" strokeWidth="2.5" />
            <circle cx="150" cy="140" r="18" fill="#0f766e" stroke="#5eead4" strokeWidth="2" />
            <circle cx="230" cy="100" r="22" fill="#134e4a" stroke="#2dd4bf" strokeWidth="3" />
            <circle cx="310" cy="70" r="16" fill="#0f766e" stroke="#14b8a6" strokeWidth="2" />
            <circle cx="300" cy="150" r="20" fill="#115e59" stroke="#5eead4" strokeWidth="2.5" />

            {/* Connecting Polymer Bonds */}
            <line x1="90" y1="80" x2="170" y2="60" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="4 2" />
            <line x1="170" y1="60" x2="230" y2="100" stroke="#5eead4" strokeWidth="2.5" />
            <line x1="90" y1="80" x2="150" y2="140" stroke="#14b8a6" strokeWidth="2" />
            <line x1="150" y1="140" x2="230" y2="100" stroke="#2dd4bf" strokeWidth="2" />
            <line x1="230" y1="100" x2="310" y2="70" stroke="#5eead4" strokeWidth="2.5" />
            <line x1="230" y1="100" x2="300" y2="150" stroke="#2dd4bf" strokeWidth="2" />

            <text x="170" y="64" fill="#ccfbf1" fontSize="10" fontWeight="700" textAnchor="middle">BIO</text>
            <text x="230" y="105" fill="#ffffff" fontSize="11" fontWeight="800" textAnchor="middle">FLASH</text>
            <text x="150" y="144" fill="#ccfbf1" fontSize="9" fontWeight="700" textAnchor="middle">FOAM</text>

            {/* Bottom Spec comparison badge */}
            <rect x="70" y="185" width="260" height="32" rx="8" fill="rgba(20, 184, 166, 0.2)" stroke="#2dd4bf" strokeWidth="1.5" />
            <text x="200" y="205" fill="#a7f3d0" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="sans-serif">
              30,000+ IMPRESSIONS • ZERO TOXIC ODORS
            </text>
          </svg>
        </div>
      );

    case 'workflow-automation':
      return (
        <div className={`relative overflow-hidden bg-gradient-to-br from-purple-950 via-slate-950 to-indigo-950 flex items-center justify-center p-6 ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          
          <svg viewBox="0 0 400 240" className="w-full h-full max-h-56 select-none relative z-10" fill="none">
            {/* Input REST JSON Payload Node */}
            <rect x="35" y="70" width="100" height="90" rx="8" fill="#3b0764" stroke="#c084fc" strokeWidth="2" />
            <text x="85" y="92" fill="#e9d5ff" fontSize="10" fontWeight="700" textAnchor="middle">REST JSON</text>
            <text x="45" y="112" fill="#a855f7" fontSize="8" fontFamily="monospace">name: "Apex LLC"</text>
            <text x="45" y="126" fill="#a855f7" fontSize="8" fontFamily="monospace">shape: "ROUND"</text>
            <text x="45" y="140" fill="#a855f7" fontSize="8" fontFamily="monospace">exp: "2029"</text>

            {/* Pipeline Arrow 1 */}
            <line x1="135" y1="115" x2="175" y2="115" stroke="#c084fc" strokeWidth="2.5" strokeDasharray="4 3" />
            <polygon points="175,115 168,111 168,119" fill="#c084fc" />

            {/* Stamiox Core Render Engine Node */}
            <rect x="180" y="55" width="110" height="120" rx="10" fill="#581c87" stroke="#a855f7" strokeWidth="2.5" />
            <circle cx="235" cy="100" r="26" fill="#7e22ce" stroke="#d8b4fe" strokeWidth="2" />
            <polygon points="235,84 249,94 249,112 235,121 221,112 221,94" stroke="#f3e8ff" strokeWidth="1.5" />
            <text x="235" y="148" fill="#f3e8ff" fontSize="10" fontWeight="800" textAnchor="middle">STAMIOX CORE</text>
            <text x="235" y="162" fill="#d8b4fe" fontSize="8" fontWeight="600" textAnchor="middle">&lt;45ms Render</text>

            {/* Pipeline Arrow 2 */}
            <line x1="290" y1="115" x2="325" y2="115" stroke="#c084fc" strokeWidth="2.5" strokeDasharray="4 3" />
            <polygon points="325,115 318,111 318,119" fill="#c084fc" />

            {/* CNC Vector Queue Output Node */}
            <rect x="330" y="70" width="55" height="90" rx="8" fill="#3b0764" stroke="#c084fc" strokeWidth="2" />
            <text x="357" y="96" fill="#e9d5ff" fontSize="9" fontWeight="700" textAnchor="middle">CNC</text>
            <text x="357" y="112" fill="#d8b4fe" fontSize="8" textAnchor="middle">1:1 SVG</text>
            <text x="357" y="128" fill="#d8b4fe" fontSize="8" textAnchor="middle">PDF/X</text>
            <circle cx="357" cy="144" r="5" fill="#22c55e" />
          </svg>
        </div>
      );

    case 'creative-inspiration':
    default:
      return (
        <div className={`relative overflow-hidden bg-gradient-to-br from-rose-950 via-slate-950 to-amber-950 flex items-center justify-center p-6 ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          
          <svg viewBox="0 0 400 240" className="w-full h-full max-h-56 select-none relative z-10" fill="none">
            {/* Victorian Ornamental Oval Frame */}
            <ellipse cx="200" cy="120" rx="120" ry="75" stroke="#fb7185" strokeWidth="3" strokeDasharray="6 3" />
            <ellipse cx="200" cy="120" rx="110" ry="67" stroke="#fda4af" strokeWidth="1.5" />
            <ellipse cx="200" cy="120" rx="85" ry="48" stroke="#ffe4e6" strokeWidth="1" strokeDasharray="2 2" />

            {/* Botanical Laurels & Flourishes */}
            <path d="M 100 120 C 110 90, 140 85, 170 95" stroke="#f43f5e" strokeWidth="2" fill="transparent" />
            <path d="M 300 120 C 290 90, 260 85, 230 95" stroke="#f43f5e" strokeWidth="2" fill="transparent" />
            <path d="M 100 120 C 110 150, 140 155, 170 145" stroke="#f43f5e" strokeWidth="2" fill="transparent" />
            <path d="M 300 120 C 290 150, 260 155, 230 145" stroke="#f43f5e" strokeWidth="2" fill="transparent" />

            {/* Center Monogram Typography */}
            <text x="200" y="130" fill="#ffe4e6" fontSize="32" fontWeight="900" fontFamily="serif" textAnchor="middle">
              &amp;
            </text>
            <text x="200" y="152" fill="#fecdd3" fontSize="8" fontWeight="700" letterSpacing="4" textAnchor="middle">
              EX LIBRIS PARIS
            </text>

            {/* Top Emblem Star */}
            <polygon points="200,50 203,57 210,57 205,62 207,69 200,65 193,69 195,62 190,57 197,57" fill="#fbbf24" />
          </svg>
        </div>
      );
  }
};
