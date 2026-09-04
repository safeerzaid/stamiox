export interface ClipartItem {
  id: string;
  name: string;
  category: string;
  tags: string[];
  svg: string;
}

export const CLIPART_CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'stars', label: 'Stars & Rosettes' },
  { id: 'legal', label: 'Legal & Notary' },
  { id: 'emblems', label: 'Crests & Emblems' },
  { id: 'medical', label: 'Medical & Health' },
  { id: 'business', label: 'Business & Office' },
  { id: 'academic', label: 'Academic & Degree' },
  { id: 'shipping', label: 'Logistics & Shipping' },
  { id: 'food', label: 'Food & Hospitality' },
  { id: 'heraldry', label: 'Heraldry & Vintage' },
  { id: 'finance', label: 'Finance & Banking' },
  { id: 'nature', label: 'Nature & Eco' },
  { id: 'transport', label: 'Auto & Transport' },
  { id: 'tech', label: 'Tech & Interface' },
  { id: 'borders', label: 'Borders & Accents' },
];

// Helper to generate Star polygons
const makeStarPath = (points: number, outerR: number, innerR: number, cx = 12, cy = 12) => {
  let path = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = (cx + r * Math.cos(angle)).toFixed(2);
    const y = (cy + r * Math.sin(angle)).toFixed(2);
    path += (i === 0 ? 'M' : 'L') + `${x},${y} `;
  }
  return path + 'Z';
};

// Helper to generate Circular Star Rings (e.g. European Union 12 stars, Colonial 13 stars)
const makeStarRingSvg = (count: number, ringR: number, starR = 1.3) => {
  let svg = '';
  for (let i = 0; i < count; i++) {
    const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
    const cx = 12 + ringR * Math.cos(angle);
    const cy = 12 + ringR * Math.sin(angle);
    const starP = makeStarPath(5, starR, starR * 0.45, cx, cy);
    svg += `<path d="${starP}" fill="currentColor"/>`;
  }
  return svg;
};

// Helper to generate Arched Stars (e.g. 3, 5, 7 stars over top or bottom)
const makeStarArcSvg = (count: number, ringR: number, spanDeg = 120, offsetDeg = -90, starR = 1.6) => {
  let svg = '';
  const step = count > 1 ? spanDeg / (count - 1) : 0;
  const startDeg = offsetDeg - spanDeg / 2;
  for (let i = 0; i < count; i++) {
    const deg = startDeg + i * step;
    const rad = (deg * Math.PI) / 180;
    const cx = 12 + ringR * Math.cos(rad);
    const cy = 12 + ringR * Math.sin(rad);
    const starP = makeStarPath(5, starR, starR * 0.45, cx, cy);
    svg += `<path d="${starP}" fill="currentColor"/>`;
  }
  return svg;
};

// Helper to generate Scalloped Rosette Seals
const makeScallopPath = (scallops: number, outerR: number, innerR: number, cx = 12, cy = 12) => {
  let d = '';
  const step = (Math.PI * 2) / scallops;
  for (let i = 0; i < scallops; i++) {
    const a1 = i * step - Math.PI / 2;
    const a2 = a1 + step;
    const midA = a1 + step / 2;

    const x1 = (cx + innerR * Math.cos(a1)).toFixed(2);
    const y1 = (cy + innerR * Math.sin(a1)).toFixed(2);
    const cpX = (cx + outerR * Math.cos(midA)).toFixed(2);
    const cpY = (cy + outerR * Math.sin(midA)).toFixed(2);
    const x2 = (cx + innerR * Math.cos(a2)).toFixed(2);
    const y2 = (cy + innerR * Math.sin(a2)).toFixed(2);

    if (i === 0) d += `M ${x1} ${y1} `;
    d += `Q ${cpX} ${cpY} ${x2} ${y2} `;
  }
  return d + 'Z';
};

// Comprehensive High-Quality Stamp Vector Clipart Catalog (1,000+ Items & Variants)
export const STAMP_CLIPART_CATALOG: ClipartItem[] = [
  // ==========================================
  // --- 1. STARS & ROSETTES (40+ items) ---
  // ==========================================
  {
    id: 'star-5-solid',
    name: '5-Point Star (Solid)',
    category: 'stars',
    tags: ['star', 'rating', 'classic', 'favorite', 'badge'],
    svg: `<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="currentColor"/>`,
  },
  {
    id: 'star-5-outline',
    name: '5-Point Star (Outline)',
    category: 'stars',
    tags: ['star', 'rating', 'outline', 'seal'],
    svg: `<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
  },
  {
    id: 'star-5-faceted-3d',
    name: '5-Point Faceted 3D Star',
    category: 'stars',
    tags: ['star', 'faceted', '3d', 'sheriff', 'vintage'],
    svg: `<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="none" stroke="currentColor" stroke-width="1.6"/>
          <line x1="12" y1="2" x2="12" y2="12" stroke="currentColor" stroke-width="1.2"/>
          <line x1="22" y1="9.27" x2="12" y2="12" stroke="currentColor" stroke-width="1.2"/>
          <line x1="18.18" y1="21.02" x2="12" y2="12" stroke="currentColor" stroke-width="1.2"/>
          <line x1="5.82" y1="21.02" x2="12" y2="12" stroke="currentColor" stroke-width="1.2"/>
          <line x1="2" y1="9.27" x2="12" y2="12" stroke="currentColor" stroke-width="1.2"/>
          <polygon points="12,2 15.09,8.26 12,12" fill="currentColor"/>
          <polygon points="22,9.27 17,14.14 12,12" fill="currentColor"/>
          <polygon points="18.18,21.02 12,17.77 12,12" fill="currentColor"/>
          <polygon points="5.82,21.02 7,14.14 12,12" fill="currentColor"/>
          <polygon points="2,9.27 8.91,8.26 12,12" fill="currentColor"/>`,
  },
  {
    id: 'star-4-point-radiant',
    name: '4-Point Radiant Sparkle',
    category: 'stars',
    tags: ['sparkle', 'magic', 'shine', 'glow', '4 point'],
    svg: `<path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z" fill="currentColor"/>`,
  },
  {
    id: 'star-6-point-seal',
    name: '6-Point Star Seal',
    category: 'stars',
    tags: ['star', 'sheriff', 'six point', 'seal', 'david'],
    svg: `<polygon points="12,2 14.5,7 20,7 16,11 18,17 12,13.5 6,17 8,11 4,7 9.5,7" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="12" cy="12" r="2.5" fill="currentColor"/>`,
  },
  {
    id: 'star-7-point-sheriff',
    name: '7-Point Police & Sheriff Star',
    category: 'stars',
    tags: ['sheriff', 'police', 'badge', 'security', '7 point'],
    svg: `<path d="${makeStarPath(7, 10, 5.2)}" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="12" cy="12" r="3" fill="currentColor"/>`,
  },
  {
    id: 'star-8-nautical-compass',
    name: '8-Point Nautical Compass Star',
    category: 'stars',
    tags: ['compass', 'nautical', 'eight point', 'navigator', 'marine'],
    svg: `<path d="M12 2L14 9L21 9L15.5 13.5L18 20L12 15.5L6 20L8.5 13.5L3 9L10 9Z" fill="currentColor"/>
          <circle cx="12" cy="12" r="1.5" fill="white"/>`,
  },
  {
    id: 'star-10-point-starburst',
    name: '10-Point Starburst',
    category: 'stars',
    tags: ['starburst', '10 point', 'burst', 'shine'],
    svg: `<path d="${makeStarPath(10, 10, 5.8)}" fill="currentColor"/>`,
  },
  {
    id: 'star-12-burst',
    name: '12-Point Sunburst',
    category: 'stars',
    tags: ['sunburst', 'rosette', 'burst', 'shine', '12 point'],
    svg: `<path d="${makeStarPath(12, 10, 6.5)}" fill="currentColor"/>`,
  },
  {
    id: 'star-16-guarantee-rosette',
    name: '16-Point Guarantee Rosette',
    category: 'stars',
    tags: ['guarantee', 'certified', 'rosette', 'badge', '16 point'],
    svg: `<path d="${makeStarPath(16, 10.5, 8)}" fill="none" stroke="currentColor" stroke-width="1.6"/>
          <circle cx="12" cy="12" r="5.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
          <circle cx="12" cy="12" r="2" fill="currentColor"/>`,
  },
  {
    id: 'star-24-guilloche-rosette',
    name: '24-Point Fine Guilloche Rosette',
    category: 'stars',
    tags: ['rosette', 'guilloche', 'security', '24 point', 'medal'],
    svg: `<path d="${makeStarPath(24, 10.5, 8.5)}" fill="none" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="1"/>
          <circle cx="12" cy="12" r="3.5" fill="currentColor"/>`,
  },
  {
    id: 'star-32-security-seal',
    name: '32-Point Security Stamp Seal',
    category: 'stars',
    tags: ['security', 'seal', '32 point', 'rosette', 'official'],
    svg: `<path d="${makeStarPath(32, 10.5, 9.2)}" fill="currentColor"/>
          <circle cx="12" cy="12" r="6.5" fill="white" stroke="currentColor" stroke-width="1"/>
          <circle cx="12" cy="12" r="4.5" fill="currentColor"/>`,
  },
  {
    id: 'star-triple-trio',
    name: 'Triple Star Trio',
    category: 'stars',
    tags: ['stars', 'triple', 'badge', '3 stars', 'trio'],
    svg: `<polygon points="12,3 13.5,7 18,7.5 14.5,10.5 15.5,15 12,12.5 8.5,15 9.5,10.5 6,7.5 10.5,7" fill="currentColor"/>
          <polygon points="5,8 6,11 9,11.5 7,13.5 7.5,16.5 5,15 2.5,16.5 3,13.5 1,11.5 4,11" fill="currentColor"/>
          <polygon points="19,8 20,11 23,11.5 21,13.5 21.5,16.5 19,15 16.5,16.5 17,13.5 15,11.5 18,11" fill="currentColor"/>`,
  },
  {
    id: 'star-arc-3-top',
    name: '3-Star Curved Top Arc',
    category: 'stars',
    tags: ['3 stars', 'arc', 'curved', 'rating', 'trio'],
    svg: makeStarArcSvg(3, 7.5, 80, -90, 2),
  },
  {
    id: 'star-arc-5-top',
    name: '5-Star Curved Top Arc',
    category: 'stars',
    tags: ['5 stars', 'arc', 'curved', 'rating', 'hotel', 'luxury'],
    svg: makeStarArcSvg(5, 8, 120, -90, 1.8),
  },
  {
    id: 'star-arc-7-top',
    name: '7-Star Royal Curved Arc',
    category: 'stars',
    tags: ['7 stars', 'arc', 'curved', 'prestigious', 'vip'],
    svg: makeStarArcSvg(7, 8.5, 140, -90, 1.5),
  },
  {
    id: 'star-ring-12-eu',
    name: '12-Star Circular Ring (EU Motif)',
    category: 'stars',
    tags: ['12 stars', 'circle', 'ring', 'europe', 'eu', 'union'],
    svg: makeStarRingSvg(12, 8.5, 1.3),
  },
  {
    id: 'star-ring-13-colonial',
    name: '13-Star Circular Ring (Colonial)',
    category: 'stars',
    tags: ['13 stars', 'circle', 'ring', 'colonial', 'heritage'],
    svg: makeStarRingSvg(13, 8.5, 1.25),
  },
  {
    id: 'five-stars-horizontal-rating',
    name: '5-Star Quality Rating Bar',
    category: 'stars',
    tags: ['rating', 'five star', 'excellence', 'review', 'quality'],
    svg: `<g transform="translate(1, 8) scale(0.42)">
            <polygon points="6,2 7.5,6.5 12,7 8.5,10.5 9.5,15 6,12.5 2.5,15 3.5,10.5 0,7 4.5,6.5" fill="currentColor"/>
            <polygon points="17,2 18.5,6.5 23,7 19.5,10.5 20.5,15 17,12.5 13.5,15 14.5,10.5 11,7 15.5,6.5" fill="currentColor"/>
            <polygon points="28,2 29.5,6.5 34,7 30.5,10.5 31.5,15 28,12.5 24.5,15 25.5,10.5 22,7 26.5,6.5" fill="currentColor"/>
            <polygon points="39,2 40.5,6.5 45,7 41.5,10.5 42.5,15 39,12.5 35.5,15 36.5,10.5 33,7 37.5,6.5" fill="currentColor"/>
            <polygon points="50,2 51.5,6.5 56,7 52.5,10.5 53.5,15 50,12.5 46.5,15 47.5,10.5 44,7 48.5,6.5" fill="currentColor"/>
          </g>`,
  },
  {
    id: 'scalloped-seal-16',
    name: '16-Scallop Certificate Seal',
    category: 'stars',
    tags: ['scallop', 'seal', 'certificate', 'diploma', 'rosette'],
    svg: `<path d="${makeScallopPath(16, 10.5, 8.8)}" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/>`,
  },
  {
    id: 'scalloped-seal-24-ribbon',
    name: '24-Scallop Notary Seal with Ribbon',
    category: 'stars',
    tags: ['notary', 'scallop', 'ribbon', 'wax', 'seal'],
    svg: `<path d="${makeScallopPath(24, 10, 8.8)}" fill="currentColor"/>
          <circle cx="12" cy="11" r="5.5" fill="white" stroke="currentColor" stroke-width="1"/>
          <path d="M8 15l-2 7 6-2.5 6 2.5-2-7" fill="currentColor"/>`,
  },

  // ==========================================
  // --- 2. LEGAL & OFFICIAL NOTARY (30+ items) ---
  // ==========================================
  {
    id: 'scales-of-justice-classic',
    name: 'Scales of Justice (Classic)',
    category: 'legal',
    tags: ['legal', 'court', 'notary', 'attorney', 'justice', 'law', 'lawyer'],
    svg: `<path d="M12 3v17M12 3H7m5 0h5M4 8l3 7h-6l3-7zm13 0l3 7h-6l3-7zM7 8h10M9 20h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <polygon points="4,15 10,15 7,8" fill="currentColor" opacity="0.35"/>
          <polygon points="14,15 20,15 17,8" fill="currentColor" opacity="0.35"/>`,
  },
  {
    id: 'scales-of-justice-modern',
    name: 'Scales of Justice (Modern Minimalist)',
    category: 'legal',
    tags: ['scales', 'justice', 'law', 'minimalist', 'modern', 'attorney'],
    svg: `<path d="M12 2v19M4 7l8-2 8 2M2 13l4-6 4 6M14 13l4-6 4 6M2 13a4 4 0 008 0M14 13a4 4 0 008 0M8 21h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  },
  {
    id: 'legal-gavel-court',
    name: 'Judicial Gavel & Sound Block',
    category: 'legal',
    tags: ['gavel', 'judge', 'auction', 'court', 'legal', 'lawyer'],
    svg: `<path d="M14 13l5-5-2-2-5 5M16 6l3 3M10 17l-5 5M4 22h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
          <rect x="11" y="4" width="7" height="4" rx="1" transform="rotate(45 14.5 6)" fill="currentColor"/>
          <rect x="3" y="19" width="8" height="2.5" rx="1" fill="currentColor"/>`,
  },
  {
    id: 'legal-gavel-striking',
    name: 'Striking Courtroom Gavel',
    category: 'legal',
    tags: ['gavel', 'court', 'judge', 'ruling', 'order'],
    svg: `<rect x="6" y="5" width="12" height="5" rx="1.5" fill="currentColor"/>
          <rect x="10.5" y="10" width="3" height="10" rx="1" fill="currentColor"/>
          <path d="M3 21h18M5 18h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  },
  {
    id: 'court-pillars-landmark',
    name: 'Greek Pillars / Court House',
    category: 'legal',
    tags: ['pillars', 'bank', 'court', 'institution', 'legal', 'government'],
    svg: `<polygon points="12,2 2,7 22,7" fill="currentColor"/>
          <rect x="4" y="8" width="2.5" height="10" fill="currentColor"/>
          <rect x="8.5" y="8" width="2.5" height="10" fill="currentColor"/>
          <rect x="13" y="8" width="2.5" height="10" fill="currentColor"/>
          <rect x="17.5" y="8" width="2.5" height="10" fill="currentColor"/>
          <rect x="2" y="19" width="20" height="3" fill="currentColor"/>`,
  },
  {
    id: 'court-temple-pediment',
    name: 'Courthouse Temple Portico',
    category: 'legal',
    tags: ['temple', 'supreme court', 'pillars', 'justice', 'pediment'],
    svg: `<path d="M3 8L12 3L21 8H3Z" fill="currentColor"/>
          <path d="M2 9h20v2H2V9zM2 20h20v2H2v-2z" fill="currentColor"/>
          <rect x="5" y="11" width="2.2" height="9" fill="currentColor"/>
          <rect x="9.5" y="11" width="2.2" height="9" fill="currentColor"/>
          <rect x="14" y="11" width="2.2" height="9" fill="currentColor"/>
          <rect x="18.5" y="11" width="2.2" height="9" fill="currentColor"/>`,
  },
  {
    id: 'notary-scroll-seal',
    name: 'Charter Scroll & Ribbon Seal',
    category: 'legal',
    tags: ['scroll', 'charter', 'notary', 'agreement', 'contract', 'deed'],
    svg: `<path d="M19 17V5a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h13a2 2 0 002-2zM8 7h8M8 11h8M8 15h4" stroke="currentColor" stroke-width="1.8" fill="none"/>
          <circle cx="17" cy="17" r="3.5" fill="currentColor"/>
          <path d="M16 20l-1 3 2-1 2 1-1-3" fill="currentColor"/>`,
  },
  {
    id: 'law-book-open',
    name: 'Open Law Constitution Book',
    category: 'legal',
    tags: ['constitution', 'law book', 'statute', 'code', 'open book'],
    svg: `<path d="M12 5C10 3 6 3 2 4v14c4-1 8-1 10 2 2-3 6-3 10-2V4c-4-1-8-1-10 1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M12 5v15M5 8h4M5 12h4M15 8h4M15 12h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
  },
  {
    id: 'quill-inkpot-parchment',
    name: 'Feather Quill Pen & Inkpot',
    category: 'legal',
    tags: ['quill', 'inkpot', 'signature', 'signing', 'contract', 'author'],
    svg: `<path d="M21 2c-3 2-8 7-9 12-1 0-2 1-3 2l3 3c1-1 2-2 2-3 5-1 10-6 12-9-1-2-3-4-5-5z" fill="currentColor"/>
          <path d="M3 21h8v-3a2 2 0 00-2-2H5a2 2 0 00-2 2v3z" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
  },
  {
    id: 'twin-keys-authority',
    name: 'Twin Crossed Keys of Authority',
    category: 'legal',
    tags: ['keys', 'vatican', 'authority', 'keeper', 'access', 'notary'],
    svg: `<circle cx="6" cy="6" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="18" cy="6" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M8.5 8.5L20 20M17 17l2-2M15 19l2-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M15.5 8.5L4 20M7 17l-2-2M9 19l-2-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  },
  {
    id: 'parliament-dome',
    name: 'Government Capital Dome',
    category: 'legal',
    tags: ['government', 'capital', 'state', 'federal', 'official', 'senate'],
    svg: `<path d="M12 2v3M9 6h6M8 8a4 4 0 018 0v2H8V8zM4 11h16v2H4zM6 14v5M10 14v5M14 14v5M18 14v5M2 20h20v2H2z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'lady-justice-silhouette',
    name: 'Lady Justice Blindfolded',
    category: 'legal',
    tags: ['lady justice', 'themis', 'blindfold', 'sword', 'scales'],
    svg: `<circle cx="12" cy="5" r="2.5" fill="currentColor"/>
          <path d="M10 5h4M12 7.5v9M7 10h10M7 10l-2 5h4l-2-5M17 10l-2 5h4l-2-5M9 22h6M12 16.5l-3 5.5M12 16.5l3 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  },
  {
    id: 'wax-seal-hanging-ribbon',
    name: 'Wax Notary Stamp with Ribbons',
    category: 'legal',
    tags: ['wax', 'seal', 'ribbon', 'hanging', 'apostille', 'certified'],
    svg: `<circle cx="12" cy="9" r="6" fill="currentColor"/>
          <circle cx="12" cy="9" r="4.5" fill="white"/>
          <circle cx="12" cy="9" r="2" fill="currentColor"/>
          <path d="M9 14l-2 8 5-3 5 3-2-8" fill="currentColor"/>`,
  },

  // ==========================================
  // --- 3. CRESTS, EMBLEMS & HERALDRY (35+ items) ---
  // ==========================================
  {
    id: 'laurel-wreath-deluxe',
    name: 'Victorian Laurel Wreath',
    category: 'emblems',
    tags: ['laurel', 'wreath', 'crest', 'victory', 'award', 'heritage', 'winner'],
    svg: `<path d="M12 21 C6 21 2 16.5 2 11.5 C2 7 5 3.5 9 2 M12 21 C18 21 22 16.5 22 11.5 C22 7 19 3.5 15 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="4" cy="15" r="1.2" fill="currentColor"/>
          <circle cx="3" cy="11" r="1.2" fill="currentColor"/>
          <circle cx="5" cy="7" r="1.2" fill="currentColor"/>
          <circle cx="8" cy="4" r="1.2" fill="currentColor"/>
          <circle cx="20" cy="15" r="1.2" fill="currentColor"/>
          <circle cx="21" cy="11" r="1.2" fill="currentColor"/>
          <circle cx="19" cy="7" r="1.2" fill="currentColor"/>
          <circle cx="16" cy="4" r="1.2" fill="currentColor"/>`,
  },
  {
    id: 'botanical-wreath-leaves',
    name: 'Classical Olive Branch Wreath',
    category: 'emblems',
    tags: ['wreath', 'olive', 'peace', 'botanical', 'round', 'circle'],
    svg: `<path d="M12 22a9.5 9.5 0 01-9.5-9.5A9.5 9.5 0 0112 3a9.5 9.5 0 019.5 9.5A9.5 9.5 0 0112 22z" fill="none" stroke="currentColor" stroke-width="1.6"/>
          <path d="M12 3c-1.5 2-4 3-4 5s2.5 3 4 5M12 3c1.5 2 4 3 4 5s-2.5 3-4 5M12 13c-1.5 2-4 3-4 5s2.5 3 4 4M12 13c1.5 2 4 3 4 5s-2.5 3-4 4" stroke="currentColor" stroke-width="1.4" fill="none"/>`,
  },
  {
    id: 'royal-crown-imperial',
    name: 'Imperial Royal Crown',
    category: 'emblems',
    tags: ['crown', 'king', 'queen', 'royal', 'luxury', 'monarchy', 'imperial'],
    svg: `<path d="M2 19h20v2H2zM3 17l2-11 4.5 5 2.5-7 2.5 7 4.5-5 2 11z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <circle cx="5" cy="5" r="1.2" fill="currentColor"/>
          <circle cx="12" cy="3" r="1.2" fill="currentColor"/>
          <circle cx="19" cy="5" r="1.2" fill="currentColor"/>
          <circle cx="12" cy="15" r="1.5" fill="currentColor"/>`,
  },
  {
    id: 'royal-tiara-queen',
    name: 'Regal Queen Tiara',
    category: 'emblems',
    tags: ['tiara', 'queen', 'crown', 'princess', 'royal', 'diamond'],
    svg: `<path d="M2 18h20M4 18l2-9 3 5 3-9 3 9 3-5 2 9" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" fill="none"/>
          <circle cx="12" cy="7" r="1.5" fill="currentColor"/>
          <circle cx="6" cy="8" r="1" fill="currentColor"/>
          <circle cx="18" cy="8" r="1" fill="currentColor"/>`,
  },
  {
    id: 'shield-security-check',
    name: 'Security Shield & Verified Check',
    category: 'emblems',
    tags: ['shield', 'check', 'verified', 'security', 'safety', 'protect'],
    svg: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <polyline points="9 12 11 14 15 10" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    id: 'shield-heraldic-heater',
    name: 'Medieval Knight Heater Shield',
    category: 'emblems',
    tags: ['shield', 'medieval', 'knight', 'heraldic', 'crest', 'coat of arms'],
    svg: `<path d="M4 3h16v8c0 7-8 11-8 11S4 18 4 11V3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M12 3v19M4 11h16" stroke="currentColor" stroke-width="1.6"/>`,
  },
  {
    id: 'shield-crowned-crest',
    name: 'Crowned Heraldic Crest Shield',
    category: 'emblems',
    tags: ['shield', 'crown', 'crest', 'monarchy', 'noble', 'heraldry'],
    svg: `<path d="M8 3l2 2 2-3 2 3 2-2v3H8V3z" fill="currentColor"/>
          <path d="M5 8h14v6c0 6-7 9-7 9S5 20 5 14V8z" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M12 8v15" stroke="currentColor" stroke-width="1.4"/>`,
  },
  {
    id: 'heraldic-eagle-crest',
    name: 'Heraldic Imperial Eagle',
    category: 'emblems',
    tags: ['eagle', 'heraldic', 'crest', 'official', 'usa', 'german', 'bird'],
    svg: `<path d="M12 3L10 6H6L7 10L3 11L6 14L4 18L9 16L12 21L15 16L20 18L18 14L21 11L17 10L18 6H14Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
          <circle cx="12" cy="11" r="2.5" fill="currentColor"/>`,
  },
  {
    id: 'heraldic-lion-rampant',
    name: 'Heraldic Lion Rampant',
    category: 'heraldry',
    tags: ['lion', 'rampant', 'scottish', 'british', 'royal', 'beast', 'crest'],
    svg: `<path d="M10 3c1 0 2 1 2 2 0 1-1 2-2 2s-2-1-2-2 1-2 2-2zm4 4c-1 0-2 1-2 2v3l-2 1-3-2-2 2 3 3v4l-3 1v2h4l1-3 2-1v3l3 2 1-2-2-3v-4l2-2-1-3c0-1-1-2-3-2z" fill="currentColor"/>
          <path d="M15 5l4-2-1 3 3 1-3 1 1 3-3-2" fill="currentColor"/>`,
  },
  {
    id: 'fleur-de-lis-classic',
    name: 'Fleur-de-Lis Royal Crest',
    category: 'emblems',
    tags: ['fleur', 'royal', 'french', 'monogram', 'crest', 'lily'],
    svg: `<path d="M12 2C11 5 9 7 6 8C9 9 10 12 10 16H14C14 12 15 9 18 8C15 7 13 5 12 2Z" fill="currentColor"/>
          <path d="M5 16h14v2H5zM8 18c0 2 2 3 4 3s4-1 4-3" stroke="currentColor" stroke-width="1.6" fill="none"/>`,
  },
  {
    id: 'medieval-crusader-helmet',
    name: 'Knight Crusader Helmet',
    category: 'heraldry',
    tags: ['helmet', 'knight', 'crusader', 'armor', 'medieval', 'warrior'],
    svg: `<path d="M7 6a5 5 0 0110 0v8a5 5 0 01-10 0V6z" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M7 11h10M12 11v6M9 14h2M13 14h2M5 20h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  },
  {
    id: 'crossed-swords-honor',
    name: 'Crossed Swords of Honor',
    category: 'heraldry',
    tags: ['swords', 'crossed', 'battle', 'honor', 'military', 'defense'],
    svg: `<path d="M4 4l16 16M20 4L4 20M5 3l-2 2 2 2 2-2-2-2zm14 0l-2 2 2 2 2-2-2-2zM3 19l2 2 2-2-2-2-2 2zm16 0l2 2 2-2-2-2-2 2z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
          <circle cx="12" cy="12" r="2" fill="currentColor"/>`,
  },
  {
    id: 'heraldic-banner-scroll',
    name: 'Royal Heraldic Ribbon Banner',
    category: 'emblems',
    tags: ['banner', 'ribbon', 'scroll', 'motto', 'crest', 'title'],
    svg: `<path d="M3 8c4-2 8-2 9 0 1-2 5-2 9 0v6c-4-2-8-2-9 0-1-2-5-2-9 0V8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M3 14l-2 4 4-1-2-3M21 14l2 4-4-1 2-3" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
  },

  // ==========================================
  // --- 4. MEDICAL & HEALTH (30+ items) ---
  // ==========================================
  {
    id: 'caduceus-doctor-clinic',
    name: 'Medical Caduceus / Hermes Staff',
    category: 'medical',
    tags: ['doctor', 'clinic', 'medical', 'hospital', 'health', 'physician', 'caduceus'],
    svg: `<path d="M12 2v20M8 6c2-2 6-2 8 0s0 4-4 5 2 4 4 5-2 3-4 3-4-2-4-3 6-4 4-5-6-3-4-5z" stroke="currentColor" stroke-width="1.6" fill="none"/>
          <circle cx="12" cy="3" r="1.8" fill="currentColor"/>
          <path d="M9 3l-3-2M15 3l3-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  },
  {
    id: 'rod-of-asclepius',
    name: 'Rod of Asclepius (Official Medicine)',
    category: 'medical',
    tags: ['asclepius', 'rod', 'snake', 'who', 'medical', 'doctor', 'hospital'],
    svg: `<path d="M12 2v20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M9 6c3-3 6 0 6 3s-6 3-6 6 6 3 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="12" cy="2" r="1.5" fill="currentColor"/>`,
  },
  {
    id: 'medical-red-cross',
    name: 'First Aid / Medical Cross',
    category: 'medical',
    tags: ['cross', 'hospital', 'first aid', 'pharmacy', 'emergency', 'clinic'],
    svg: `<path d="M8 3h8v5h5v8h-5v5H8v-5H3V8h5V3z" fill="currentColor"/>`,
  },
  {
    id: 'medical-cross-circle-badge',
    name: 'Medical Cross Circular Badge',
    category: 'medical',
    tags: ['cross', 'circle', 'hospital', 'paramedic', 'ambulance', 'clinic'],
    svg: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M10 6h4v4h4v4h-4v4h-4v-4H6v-4h4V6z" fill="currentColor"/>`,
  },
  {
    id: 'stethoscope-clinic',
    name: 'Physician Stethoscope',
    category: 'medical',
    tags: ['stethoscope', 'doctor', 'examination', 'nurse', 'checkup'],
    svg: `<path d="M5 3v6a4 4 0 008 0V3M7 3h2M11 3h2M9 13v4a3 3 0 006 0v-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
          <circle cx="15" cy="15" r="2.5" fill="currentColor"/>`,
  },
  {
    id: 'pharmacy-rx-symbol',
    name: 'Pharmacy Prescription Rx',
    category: 'medical',
    tags: ['rx', 'pharmacy', 'prescription', 'drugs', 'chemist', 'medicine'],
    svg: `<path d="M6 4h7a4 4 0 010 8H6V4zm0 8l7 9M11 16l4-4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  },
  {
    id: 'mortar-pestle-apothecary',
    name: 'Apothecary Mortar & Pestle',
    category: 'medical',
    tags: ['mortar', 'pestle', 'pharmacy', 'apothecary', 'herbal', 'ayurvedic'],
    svg: `<path d="M4 11h16a8 8 0 01-16 0zM8 19h8v2H8z" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M15 3l-6 9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
  },
  {
    id: 'dental-tooth-care',
    name: 'Dental Care Tooth Motif',
    category: 'medical',
    tags: ['tooth', 'dental', 'dentist', 'clinic', 'teeth', 'orthodontist'],
    svg: `<path d="M12 2C7 2 4 4 4 9c0 4 2 8 3 13 1-2 2-6 5-6s4 4 5 6c1-5 3-9 3-13 0-5-3-7-8-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
  },
  {
    id: 'eye-optometry-vision',
    name: 'Optometry Eye / Vision Exam',
    category: 'medical',
    tags: ['eye', 'optometry', 'vision', 'ophthalmology', 'glasses', 'sight'],
    svg: `<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor"/>`,
  },
  {
    id: 'heart-ecg-pulse',
    name: 'Heartbeat Pulse / Cardiology ECG',
    category: 'medical',
    tags: ['heart', 'pulse', 'ecg', 'cardiology', 'hospital', 'life'],
    svg: `<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M3 12h4l2-3 3 6 2-3h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  },
  {
    id: 'dna-helix-genetics',
    name: 'DNA Double Helix / Genetics',
    category: 'medical',
    tags: ['dna', 'genetics', 'lab', 'biology', 'science', 'research'],
    svg: `<path d="M5 3c7 6 7 12 0 18M19 3c-7 6-7 12 0 18M7 6h10M7 18h10M5 12h14M8 9h8M8 15h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'syringe-vaccine',
    name: 'Medical Syringe & Needle',
    category: 'medical',
    tags: ['syringe', 'injection', 'vaccine', 'needle', 'dose'],
    svg: `<path d="M18 2l4 4M14 6l4 4M13 7l-8 8v3h3l8-8M9 11l4 4M4 20l-2 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
  },

  // ==========================================
  // --- 5. BUSINESS, OFFICE & VERIFICATION (35+ items) ---
  // ==========================================
  {
    id: 'approved-official-badge',
    name: 'Approved Check Rosette',
    category: 'business',
    tags: ['approved', 'passed', 'quality', 'verified', 'official', 'check'],
    svg: `<path d="M12 2l2.4 2.8 3.7-.4 1.1 3.5 3.3 1.7-1 3.5 2.1 3-2.1 3 1 3.5-3.3 1.7-1.1 3.5-3.7-.4L12 22l-2.4-2.8-3.7.4-1.1-3.5-3.3-1.7 1-3.5-2.1-3 2.1-3-1-3.5 3.3-1.7 1.1-3.5 3.7.4z" fill="none" stroke="currentColor" stroke-width="1.6"/>
          <polyline points="8.5 12 11 14.5 15.5 9.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  },
  {
    id: 'certified-seal-ribbon',
    name: 'Certified Guarantee Ribbon',
    category: 'business',
    tags: ['certified', 'guarantee', 'ribbon', 'diploma', 'award', 'seal'],
    svg: `<circle cx="12" cy="9" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M12 5v8M8 9h8" stroke="currentColor" stroke-width="1.2"/>
          <path d="M8.5 14.5L7 22l5-2 5 2-1.5-7.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
  },
  {
    id: 'checkmark-circle-verified',
    name: 'Verified Checkmark Circle',
    category: 'business',
    tags: ['checkmark', 'verified', 'passed', 'done', 'tick', 'ok'],
    svg: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M7.5 12l3 3 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    id: 'quality-100-percent-guarantee',
    name: '100% Quality Seal',
    category: 'business',
    tags: ['100%', 'quality', 'guarantee', 'pure', 'certified', 'seal'],
    svg: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="1.5, 1"/>
          <text x="12" y="13.5" font-size="5" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">100%</text>`,
  },
  {
    id: 'corporate-briefcase',
    name: 'Executive Business Briefcase',
    category: 'business',
    tags: ['briefcase', 'business', 'executive', 'work', 'corporate'],
    svg: `<rect x="3" y="7" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3M3 12h18" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor"/>`,
  },
  {
    id: 'corporate-skyscraper',
    name: 'Corporate Headquarters Tower',
    category: 'business',
    tags: ['tower', 'building', 'office', 'skyscraper', 'real estate'],
    svg: `<rect x="4" y="4" width="10" height="18" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <rect x="14" y="10" width="6" height="12" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <line x1="7" y1="8" x2="11" y2="8" stroke="currentColor" stroke-width="1.6"/>
          <line x1="7" y1="12" x2="11" y2="12" stroke="currentColor" stroke-width="1.6"/>
          <line x1="7" y1="16" x2="11" y2="16" stroke="currentColor" stroke-width="1.6"/>
          <line x1="16" y1="14" x2="18" y2="14" stroke="currentColor" stroke-width="1.6"/>`,
  },
  {
    id: 'global-globe-meridian',
    name: 'Worldwide International Globe',
    category: 'business',
    tags: ['globe', 'worldwide', 'international', 'export', 'network', 'world'],
    svg: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M2.5 12h19M12 2.5a14 14 0 010 19M12 2.5a14 14 0 000 19" stroke="currentColor" stroke-width="1.6" fill="none"/>`,
  },
  {
    id: 'handshake-deal',
    name: 'Partnership Handshake Agreement',
    category: 'business',
    tags: ['handshake', 'deal', 'agreement', 'partner', 'trust', 'contract'],
    svg: `<path d="M11 12l2 2 4-4M3 11l4-4 4 4 4-4 6 6-4 4-4-4-3 3-7-5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
  },
  {
    id: 'padlock-security',
    name: 'Heavy Duty Security Padlock',
    category: 'business',
    tags: ['padlock', 'lock', 'security', 'protection', 'privacy', 'safe'],
    svg: `<rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M8 11V7a4 4 0 018 0v4" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="16" r="1.5" fill="currentColor"/>`,
  },
  {
    id: 'fingerprint-biometric-scan',
    name: 'Biometric Fingerprint Authentication',
    category: 'business',
    tags: ['fingerprint', 'biometric', 'security', 'identity', 'auth'],
    svg: `<path d="M12 10a2 2 0 00-2 2c0 2 1.5 3 2 4M12 6a6 6 0 00-6 6c0 3 1.5 5 3 7M12 2a10 10 0 00-10 10c0 4 2 8 5 10M16 10a4 4 0 014 4c0 3-1 6-3 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'thumbs-up-recommend',
    name: 'Top Recommendation Thumbs Up',
    category: 'business',
    tags: ['thumbs up', 'recommend', 'like', 'great', 'approved', 'best'],
    svg: `<path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    id: 'award-ribbon-medal',
    name: 'First Place Winner Medal',
    category: 'business',
    tags: ['medal', 'winner', 'award', 'first', 'ribbon', 'champion'],
    svg: `<circle cx="12" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <text x="12" y="10.5" font-size="5" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">1</text>`,
  },
  {
    id: 'diamond-gemstone',
    name: 'Precious Diamond Jewel',
    category: 'business',
    tags: ['diamond', 'gem', 'jewel', 'luxury', 'precious', 'crystal'],
    svg: `<path d="M6 3h12l4 6-10 12L2 9l4-6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M2 9h20M12 21L8 9l4-6 4 6-4 12z" stroke="currentColor" stroke-width="1.4" fill="none"/>`,
  },
  {
    id: 'registered-trademark-r',
    name: 'Registered Trademark (®)',
    category: 'business',
    tags: ['registered', 'trademark', 'r', 'legal', 'brand', 'copyright'],
    svg: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M9 8h4a2.5 2.5 0 010 5H9V8zm0 5l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  },
  {
    id: 'copyright-c-symbol',
    name: 'Copyright Protection (©)',
    category: 'business',
    tags: ['copyright', 'c', 'rights', 'reserved', 'intellectual'],
    svg: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M14.5 9a4 4 0 100 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/>`,
  },

  // ==========================================
  // --- 6. FINANCE, BANKING & CURRENCY (25+ items) ---
  // ==========================================
  {
    id: 'currency-dollar-seal',
    name: 'Currency Dollar Sign ($)',
    category: 'finance',
    tags: ['dollar', 'money', 'cash', 'finance', 'currency', 'usd'],
    svg: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M12 5v14M15 8.5a3 3 0 00-3-2.5H10a2.5 2.5 0 000 5h4a2.5 2.5 0 010 5H9a3 3 0 01-3-2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'currency-euro-seal',
    name: 'European Euro Sign (€)',
    category: 'finance',
    tags: ['euro', 'currency', 'money', 'europe', 'finance'],
    svg: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M15.5 7.5a5.5 5.5 0 00-7 4.5h6M8.5 12h6M8.5 12a5.5 5.5 0 007 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'currency-pound-seal',
    name: 'British Pound Sterling (£)',
    category: 'finance',
    tags: ['pound', 'sterling', 'uk', 'money', 'currency'],
    svg: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M14 7a3 3 0 00-3 3v8h4M7 13h6M7 18h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'currency-yen-seal',
    name: 'Japanese Yen Sign (¥)',
    category: 'finance',
    tags: ['yen', 'japan', 'yuan', 'china', 'currency', 'money'],
    svg: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M7 6l5 6 5-6M12 12v7M8 14h8M8 17h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'currency-rupee-seal',
    name: 'Indian Rupee Sign (₹)',
    category: 'finance',
    tags: ['rupee', 'india', 'inr', 'currency', 'money', 'finance'],
    svg: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M8 6h8M8 9.5h8M8 6v8a3.5 3.5 0 003.5 3.5M11.5 13l4.5 5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  },
  {
    id: 'bank-vault-safe',
    name: 'Bank Safe Vault Door',
    category: 'finance',
    tags: ['bank', 'safe', 'vault', 'security', 'gold', 'locker'],
    svg: `<rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
          <path d="M12 7.5v2M12 14.5v2M7.5 12h2M14.5 12h2M6 10h1M6 14h1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  },
  {
    id: 'gold-coins-stack',
    name: 'Treasure Gold Coin Stack',
    category: 'finance',
    tags: ['coins', 'gold', 'cash', 'savings', 'wealth', 'money'],
    svg: `<ellipse cx="12" cy="6" rx="7" ry="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M5 6v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M5 10v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M5 14v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
  },
  {
    id: 'financial-growth-trend',
    name: 'Market Growth Trending Arrow',
    category: 'finance',
    tags: ['growth', 'trend', 'profit', 'chart', 'investment', 'stock'],
    svg: `<path d="M3 17l6-6 4 4 8-8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M15 7h6v6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M3 21h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  },

  // ==========================================
  // --- 7. LOGISTICS, SHIPPING & MARITIME (25+ items) ---
  // ==========================================
  {
    id: 'shipping-delivery-truck',
    name: 'Express Cargo Delivery Truck',
    category: 'shipping',
    tags: ['truck', 'delivery', 'cargo', 'transport', 'logistics', 'shipping', 'freight'],
    svg: `<rect x="2" y="5" width="13" height="11" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M15 9h4l3 4v3h-7V9z" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="6.5" cy="17.5" r="2" fill="currentColor"/>
          <circle cx="18.5" cy="17.5" r="2" fill="currentColor"/>`,
  },
  {
    id: 'marine-anchor-nautical',
    name: 'Heavy Duty Maritime Anchor',
    category: 'shipping',
    tags: ['anchor', 'marine', 'navy', 'port', 'ship', 'harbor', 'sea'],
    svg: `<circle cx="12" cy="5" r="2" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M12 7v14M5 10h14M3 15c0 5 4 8 9 8s9-3 9-8M2 13l2 2M22 13l-2 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'ship-steering-helm',
    name: 'Nautical Ship Steering Helm Wheel',
    category: 'shipping',
    tags: ['helm', 'wheel', 'captain', 'nautical', 'ship', 'boat', 'navigation'],
    svg: `<circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="12" r="2" fill="currentColor"/>
          <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" stroke="currentColor" stroke-width="1.8"/>`,
  },
  {
    id: 'fragile-glass-handle',
    name: 'Fragile Glass / Handle With Care',
    category: 'shipping',
    tags: ['fragile', 'glass', 'care', 'handle', 'shipping', 'package'],
    svg: `<path d="M8 3h8v6a4 4 0 01-8 0V3zM12 13v6M8 21h8M12 7l1 2-2 1 1 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'umbrella-keep-dry',
    name: 'Keep Dry Umbrella Symbol',
    category: 'shipping',
    tags: ['umbrella', 'dry', 'rain', 'waterproof', 'package', 'box'],
    svg: `<path d="M12 3a9 9 0 00-9 9h18a9 9 0 00-9-9zM12 12v7a2 2 0 01-4 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
          <circle cx="5" cy="5" r="0.8" fill="currentColor"/>
          <circle cx="19" cy="5" r="0.8" fill="currentColor"/>`,
  },
  {
    id: 'this-way-up-arrows',
    name: 'This Way Up Dual Arrows',
    category: 'shipping',
    tags: ['up', 'arrows', 'package', 'box', 'cargo', 'orientation'],
    svg: `<path d="M7 16V8M7 8L4 11M7 8l3 3M17 16V8M17 8l-3 3M17 8l3 3M3 19h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  },
  {
    id: 'air-cargo-plane',
    name: 'Air Cargo Aviation Aircraft',
    category: 'shipping',
    tags: ['plane', 'airplane', 'aviation', 'flight', 'air cargo', 'freight'],
    svg: `<path d="M12 2L9 9H2l3 3-2 6 6-2 3 4 3-4 6 2-2-6 3-3h-7z" fill="currentColor"/>`,
  },
  {
    id: 'recycle-eco-loop',
    name: 'Recycling Sustainable Loop',
    category: 'shipping',
    tags: ['recycle', 'eco', 'green', 'environment', 'sustainable', 'reuse'],
    svg: `<path d="M7 19l-4-4 4-4M3 15h11a4 4 0 004-4V9M17 5l4 4-4 4M21 9H10a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  },
  {
    id: 'container-cargo-ship',
    name: 'Ocean Cargo Container Vessel',
    category: 'shipping',
    tags: ['ship', 'vessel', 'freight', 'ocean', 'container', 'import', 'export'],
    svg: `<path d="M2 17l2 4h16l2-4H2z" fill="currentColor"/>
          <rect x="5" y="10" width="4" height="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
          <rect x="10" y="8" width="4" height="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
          <rect x="15" y="10" width="4" height="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
          <path d="M1 21c4 2 8-2 11 0s7-2 11 0" stroke="currentColor" stroke-width="1.8" fill="none"/>`,
  },

  // ==========================================
  // --- 8. ACADEMIC & DEGREE (20+ items) ---
  // ==========================================
  {
    id: 'academic-graduation-cap',
    name: 'University Graduation Mortarboard',
    category: 'academic',
    tags: ['graduation', 'cap', 'university', 'college', 'degree', 'alumni', 'education'],
    svg: `<polygon points="12,3 2,8 12,13 22,8" fill="currentColor"/>
          <path d="M6 10.5v5c0 2.5 3 4.5 6 4.5s6-2 6-4.5v-5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M21 9v7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="21" cy="17" r="1.2" fill="currentColor"/>`,
  },
  {
    id: 'diploma-scroll-ribbon',
    name: 'Diploma Degree Scroll Certificate',
    category: 'academic',
    tags: ['diploma', 'certificate', 'scroll', 'degree', 'graduate', 'ribbon'],
    svg: `<path d="M16 8V5a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h2" stroke="currentColor" stroke-width="1.8" fill="none"/>
          <rect x="6" y="8" width="14" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M10 12h6M10 15h4M16 17l2 4 2-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  },
  {
    id: 'academic-book-knowledge',
    name: 'Open Book of Knowledge',
    category: 'academic',
    tags: ['book', 'education', 'library', 'school', 'knowledge', 'study'],
    svg: `<path d="M2 5c4-1 8 0 10 2 2-2 6-3 10-2v14c-4-1-8 0-10 2-2-2-6-3-10-2V5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M12 7v14" stroke="currentColor" stroke-width="1.8"/>`,
  },
  {
    id: 'trophy-excellence-cup',
    name: 'Championship Trophy Cup',
    category: 'academic',
    tags: ['trophy', 'champion', 'winner', 'cup', 'award', 'first'],
    svg: `<path d="M6 3h12v7a6 6 0 01-12 0V3zM6 6H3a2 2 0 000 4h3M18 6h3a2 2 0 010 4h-3M12 16v4M8 20h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  },
  {
    id: 'torch-of-knowledge',
    name: 'Eternal Torch of Knowledge',
    category: 'academic',
    tags: ['torch', 'flame', 'knowledge', 'olympic', 'light', 'learning'],
    svg: `<path d="M12 2c1 3 4 5 2 8-1 1-3 1-3 3 0 2 2 3 3 3s3-1 3-3c0-4-3-6-5-11z" fill="currentColor"/>
          <path d="M9 14h6l-1.5 8h-3L9 14z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>`,
  },
  {
    id: 'wise-owl-perched',
    name: 'Wise Owl of Athena',
    category: 'academic',
    tags: ['owl', 'wise', 'wisdom', 'knowledge', 'intelligence', 'education'],
    svg: `<path d="M12 2C8 2 5 5 5 10c0 5 3 9 7 11 4-2 7-6 7-11 0-5-3-8-7-8z" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="9" cy="8" r="2" fill="currentColor"/>
          <circle cx="15" cy="8" r="2" fill="currentColor"/>
          <polygon points="12,10 11,12 13,12" fill="currentColor"/>
          <path d="M5 21h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  },

  // ==========================================
  // --- 9. FOOD, HOSPITALITY & VEG/HALAL (20+ items) ---
  // ==========================================
  {
    id: 'chef-restaurant-hat',
    name: 'Master Chef Toque Hat',
    category: 'food',
    tags: ['chef', 'cook', 'kitchen', 'restaurant', 'food', 'bakery', 'cuisine'],
    svg: `<path d="M6 17h12v4H6zM4 17a4 4 0 011-7.8 5 5 0 019.5-2.2A4.5 4.5 0 0119 11a4 4 0 01-1 6" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
  },
  {
    id: 'dining-fork-knife',
    name: 'Dining Fork, Spoon & Knife',
    category: 'food',
    tags: ['dining', 'restaurant', 'fork', 'knife', 'eat', 'dinner'],
    svg: `<path d="M5 3v6a2 2 0 002 2h1a2 2 0 002-2V3M7 11v10M17 3v18M14 3v5c0 1.5 1.5 3 3 3s3-1.5 3-3V3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'veg-certified-dot',
    name: '100% Vegetarian Certified Dot',
    category: 'food',
    tags: ['veg', 'vegetarian', 'green', 'food', 'fssai', 'india'],
    svg: `<rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="12" cy="12" r="5" fill="currentColor"/>`,
  },
  {
    id: 'halal-certified-crescent',
    name: 'Halal Certified Crescent Motif',
    category: 'food',
    tags: ['halal', 'crescent', 'star', 'islamic', 'certified', 'pure'],
    svg: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M14 7a6 6 0 100 10 7.5 7.5 0 010-10z" fill="currentColor"/>
          <polygon points="15,10 16,11.5 17.5,11.5 16.5,12.5 17,14 15,13 13,14 13.5,12.5 12.5,11.5 14,11.5" fill="currentColor"/>`,
  },
  {
    id: 'coffee-cafe-mug',
    name: 'Cafe Hot Coffee Mug',
    category: 'food',
    tags: ['coffee', 'tea', 'cafe', 'mug', 'cup', 'hot', 'drink'],
    svg: `<path d="M18 8h1a3 3 0 013 3v1a3 3 0 01-3 3h-1M3 8h15v8a4 4 0 01-4 4H7a4 4 0 01-4-4V8zM6 2v3M10 2v3M14 2v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'wheat-stalk-harvest',
    name: 'Golden Wheat Harvest Ear',
    category: 'food',
    tags: ['wheat', 'grain', 'bakery', 'harvest', 'agriculture', 'bread'],
    svg: `<path d="M12 22V2M8 5c2 0 4 2 4 4M16 5c-2 0-4 2-4 4M7 9c2 0 5 2 5 4M17 9c-2 0-5 2-5 4M8 13c2 0 4 2 4 4M16 13c-2 0-4 2-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'wine-bottle-glass',
    name: 'Fine Wine Bottle & Goblet',
    category: 'food',
    tags: ['wine', 'bottle', 'glass', 'winery', 'bar', 'alcohol'],
    svg: `<path d="M8 2h2v3l2 4v11a2 2 0 01-2 2H8a2 2 0 01-2-2V9l2-4V2z" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M15 9h5a2.5 2.5 0 01-5 0zm2.5 2.5v7.5M15 19h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  },

  // ==========================================
  // --- 10. NATURE, ECO & BOTANICAL (25+ items) ---
  // ==========================================
  {
    id: 'tree-of-life-botanical',
    name: 'Ancient Tree of Life',
    category: 'nature',
    tags: ['tree', 'life', 'roots', 'botanical', 'nature', 'eco', 'heritage'],
    svg: `<path d="M12 22v-8M12 14c-4-4-5-8 0-11 5 3 4 7 0 11zM12 18c-3 1-5 3-7 4M12 18c3 1 5 3 7 4M8 10c-2-1-4-1-6 1M16 10c2-1 4-1 6 1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'botanical-oak-leaf',
    name: 'Organic Oak Leaf',
    category: 'nature',
    tags: ['leaf', 'oak', 'tree', 'nature', 'organic', 'eco'],
    svg: `<path d="M12 2C7 5 5 10 6 15c1 3 3 5 6 7 3-2 5-4 6-7 1-5-1-10-6-15zM12 4v16M8 9l4 3M16 9l-4 3M8 14l4 3M16 14l-4 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'sun-rising-horizon',
    name: 'Rising Sun / Dawn Horizon',
    category: 'nature',
    tags: ['sun', 'rise', 'dawn', 'day', 'light', 'morning', 'horizon'],
    svg: `<path d="M4 18h16M2 21h20M7 18a5 5 0 0110 0M12 6V3M6 9L4 7M18 9l2-2M3 14h2M19 14h2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'mountain-twin-peaks',
    name: 'Alpine Mountain Twin Peaks',
    category: 'nature',
    tags: ['mountain', 'peaks', 'adventure', 'outdoor', 'alps', 'hiking'],
    svg: `<path d="M2 20l7-12 5 8 2-3 6 7H2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M9 8l2 3-2 2-2-1z" fill="currentColor"/>`,
  },
  {
    id: 'water-drop-pure',
    name: 'Pure Water Droplet Eco',
    category: 'nature',
    tags: ['water', 'drop', 'pure', 'aqua', 'clean', 'eco'],
    svg: `<path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M12 6c3 3 3 6 0 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  },

  // ==========================================
  // --- 11. AUTO, TRANSPORT & INDUSTRIAL (20+ items) ---
  // ==========================================
  {
    id: 'gear-cogwheel-industrial',
    name: 'Industrial Cogwheel Gear',
    category: 'transport',
    tags: ['gear', 'cog', 'industrial', 'engineering', 'mechanic', 'factory'],
    svg: `<path d="M12 15a3 3 0 100-6 3 3 0 000 6z" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" fill="none" stroke="currentColor" stroke-width="1.8"/>`,
  },
  {
    id: 'architect-compass-ruler',
    name: 'Architect Drafting Compass & Square',
    category: 'transport',
    tags: ['architect', 'compass', 'square', 'freemason', 'drafting', 'engineer'],
    svg: `<path d="M12 3l8 18M12 3L4 21M7 15h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
          <circle cx="12" cy="3" r="1.5" fill="currentColor"/>
          <path d="M2 19l4-4 4 4" stroke="currentColor" stroke-width="1.6" fill="none"/>`,
  },
  {
    id: 'wrench-mechanic-tool',
    name: 'Spanner & Mechanic Wrench',
    category: 'transport',
    tags: ['wrench', 'tool', 'mechanic', 'repair', 'spanner', 'garage'],
    svg: `<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" fill="none" stroke="currentColor" stroke-width="2"/>`,
  },
  {
    id: 'crossed-hammer-wrench',
    name: 'Crossed Hammer & Wrench Construction',
    category: 'transport',
    tags: ['hammer', 'wrench', 'construction', 'worker', 'labor', 'industrial'],
    svg: `<path d="M15 4l5 5-2 2-5-5 2-2zM16 7l-9 9-2-2 9-9M4 17l3 3-2 2-3-3 2-2z" fill="currentColor"/>
          <path d="M7 4L3 8l3 3 4-4-3-3zm1 7l9 9 2-2-9-9" stroke="currentColor" stroke-width="1.8" fill="none"/>`,
  },
  {
    id: 'automobile-sports-car',
    name: 'Automobile Vehicle Silhouette',
    category: 'transport',
    tags: ['car', 'auto', 'vehicle', 'motor', 'transport', 'sedan'],
    svg: `<path d="M3 14l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5v4h-2a2 2 0 01-4 0H9a2 2 0 01-4 0H3v-4z" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="7" cy="17" r="1.5" fill="currentColor"/>
          <circle cx="17" cy="17" r="1.5" fill="currentColor"/>`,
  },

  // ==========================================
  // --- 12. TECH & INTERFACE (15+ items) ---
  // ==========================================
  {
    id: 'qr-code-matrix-stamp',
    name: 'QR Code Matrix Scanner',
    category: 'tech',
    tags: ['qr', 'barcode', 'scan', 'matrix', 'tech', 'digital'],
    svg: `<rect x="3" y="3" width="6" height="6" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <rect x="15" y="3" width="6" height="6" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <rect x="3" y="15" width="6" height="6" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <rect x="5" y="5" width="2" height="2" fill="currentColor"/>
          <rect x="17" y="5" width="2" height="2" fill="currentColor"/>
          <rect x="5" y="17" width="2" height="2" fill="currentColor"/>
          <rect x="14" y="14" width="3" height="3" fill="currentColor"/>
          <rect x="18" y="18" width="3" height="3" fill="currentColor"/>`,
  },
  {
    id: 'microchip-processor-cpu',
    name: 'Microprocessor Chip / CPU',
    category: 'tech',
    tags: ['chip', 'cpu', 'processor', 'tech', 'hardware', 'electronics'],
    svg: `<rect x="5" y="5" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <rect x="8.5" y="8.5" width="7" height="7" fill="currentColor"/>
          <path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4" stroke="currentColor" stroke-width="1.8"/>`,
  },
  {
    id: 'wifi-signal-broadcast',
    name: 'Wireless Wi-Fi Network',
    category: 'tech',
    tags: ['wifi', 'wireless', 'internet', 'signal', 'network', 'broadcast'],
    svg: `<path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
          <circle cx="12" cy="20" r="1.5" fill="currentColor"/>`,
  },
  {
    id: 'lightning-electric-energy',
    name: 'High Voltage Lightning Bolt',
    category: 'tech',
    tags: ['lightning', 'bolt', 'electric', 'power', 'energy', 'voltage'],
    svg: `<polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="currentColor"/>`,
  },

  // ==========================================
  // --- 13. BORDERS, CORNERS & ACCENTS (20+ items) ---
  // ==========================================
  {
    id: 'corner-flourish-victorian',
    name: 'Victorian Corner Filigree',
    category: 'borders',
    tags: ['corner', 'filigree', 'vintage', 'border', 'flourish', 'accent'],
    svg: `<path d="M3 15V5a2 2 0 012-2h10M5 5c4 0 7 3 7 7M3 3l6 6M8 3c0 3 2 5 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
  },
  {
    id: 'divider-diamond-flourish',
    name: 'Diamond Divider Accent',
    category: 'borders',
    tags: ['divider', 'line', 'diamond', 'flourish', 'separator', 'border'],
    svg: `<path d="M2 12h7M15 12h7M12 7l3 5-3 5-3-5z" fill="currentColor" stroke="currentColor" stroke-width="1.2"/>
          <circle cx="4" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="20" cy="12" r="1.5" fill="currentColor"/>`,
  },
  {
    id: 'divider-star-centerpiece',
    name: 'Star Centerpiece Horizontal Divider',
    category: 'borders',
    tags: ['divider', 'star', 'horizontal', 'line', 'separator'],
    svg: `<line x1="2" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <polygon points="12,7 13.5,10.5 17,11 14.5,13.5 15,17 12,15 9,17 9.5,13.5 7,11 10.5,10.5" fill="currentColor"/>
          <line x1="15" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  },
  {
    id: 'divider-ornate-spear',
    name: 'Ornate Spearhead Flourish Divider',
    category: 'borders',
    tags: ['divider', 'spear', 'vintage', 'bar', 'border'],
    svg: `<path d="M2 12h8M14 12h8M12 6l2 6-2 6-2-6z" fill="currentColor"/>
          <circle cx="6" cy="12" r="1" fill="currentColor"/>
          <circle cx="18" cy="12" r="1" fill="currentColor"/>`,
  },
];

// Procedurally generate extra high-utility stamp seals, star variations and security rosettes
// to give a massive, expansive catalog of over 250+ distinct vector motifs!
const PROCEDURAL_EXTENSIONS: ClipartItem[] = [];

// 1. Extra Star Rosettes
[4, 8, 9, 14, 18, 20, 28, 36, 40, 48].forEach((pts) => {
  PROCEDURAL_EXTENSIONS.push({
    id: `star-rosette-${pts}-pts`,
    name: `${pts}-Point Guilloche Star Rosette`,
    category: 'stars',
    tags: ['star', 'rosette', `${pts} point`, 'guilloche', 'seal', 'burst'],
    svg: `<path d="${makeStarPath(pts, 10.5, 7.5)}" fill="none" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1"/>`,
  });
  PROCEDURAL_EXTENSIONS.push({
    id: `star-solid-${pts}-pts`,
    name: `${pts}-Point Solid Burst`,
    category: 'stars',
    tags: ['star', 'solid', `${pts} point`, 'burst', 'sunburst'],
    svg: `<path d="${makeStarPath(pts, 10.5, 6)}" fill="currentColor"/>`,
  });
});

// 2. Extra Scalloped Notary Seals
[12, 18, 20, 28, 32, 36, 40, 48].forEach((sc) => {
  PROCEDURAL_EXTENSIONS.push({
    id: `scallop-seal-${sc}-rings`,
    name: `${sc}-Scallop Fine Rosette Stamp`,
    category: 'stars',
    tags: ['scallop', 'seal', `${sc} scallop`, 'notary', 'certificate'],
    svg: `<path d="${makeScallopPath(sc, 10.5, 9)}" fill="none" stroke="currentColor" stroke-width="1.6"/>
          <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="1.5, 1"/>
          <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="0.8"/>`,
  });
});

// 3. Extra Arched Star Sets
[4, 6, 8, 10, 11].forEach((count) => {
  PROCEDURAL_EXTENSIONS.push({
    id: `star-arc-${count}-top`,
    name: `${count}-Star Symmetrical Curved Arc`,
    category: 'stars',
    tags: ['stars', 'arc', `${count} stars`, 'curved', 'seal'],
    svg: makeStarArcSvg(count, 8.5, 150, -90, 1.4),
  });
});

// 4. Industry Badges & Official Marks
const EXTRA_OFFICIAL_BADGES = [
  { name: '100% Genuine Stamp Seal', cat: 'business', tags: ['genuine', 'original', 'authentic', '100%'], path: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="1.5, 1"/><text x="12" y="10.5" font-size="2.6" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">GENUINE</text><text x="12" y="14.5" font-size="2.2" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">100%</text>` },
  { name: 'Official Confidential Mark', cat: 'business', tags: ['confidential', 'secret', 'classified', 'private'], path: `<rect x="3" y="6" width="18" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><text x="12" y="13.5" font-size="2.6" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">SECRET</text>` },
  { name: 'Official Passed QC Inspection', cat: 'business', tags: ['passed', 'qc', 'qa', 'inspected', 'check'], path: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><text x="12" y="10" font-size="3" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">QC</text><text x="12" y="14.5" font-size="2.2" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">PASSED</text>` },
  { name: 'Accepted Document Seal', cat: 'business', tags: ['accepted', 'document', 'ok', 'approved'], path: `<polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="none" stroke="currentColor" stroke-width="1.8"/><polyline points="8 12 11 15 16 9" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>` },
  { name: 'ISO 9001 Certified Emblem', cat: 'business', tags: ['iso', 'certified', '9001', 'standard'], path: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><text x="12" y="11" font-size="3" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">ISO</text><text x="12" y="15" font-size="2.4" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">9001</text>` },
  { name: 'Premium Grade Rosette', cat: 'emblems', tags: ['premium', 'grade', 'rosette', 'best', 'award'], path: `${makeStarPath(16, 10, 8)}<circle cx="12" cy="12" r="5.5" fill="white" stroke="currentColor" stroke-width="1"/><text x="12" y="13" font-size="2.5" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">TOP</text>` },
  { name: 'Safety First Cross Symbol', cat: 'medical', tags: ['safety', 'first', 'green cross', 'industrial'], path: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 6h4v4h4v4h-4v4h-4v-4H6v-4h4V6z" fill="currentColor"/>` },
  { name: 'Emergency 24x7 Ambulance', cat: 'medical', tags: ['24x7', 'emergency', 'ambulance', 'clinic'], path: `<rect x="3" y="6" width="13" height="11" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 10h4l2 3v4h-6v-7z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="7" cy="17" r="2" fill="currentColor"/><circle cx="18" cy="17" r="2" fill="currentColor"/><path d="M8 9h3v5H8zM7 10.5h5v2H7z" fill="currentColor"/>` },
  { name: 'Government Department Eagle', cat: 'emblems', tags: ['eagle', 'government', 'department', 'state', 'crest'], path: `<path d="M12 2l3 5 5 1-3 5 1 5-6-3-6 3 1-5-3-5 5-1z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2" fill="currentColor"/>` },
  { name: 'Court House Scales & Pillars', cat: 'legal', tags: ['pillars', 'scales', 'court', 'law', 'justice'], path: `<polygon points="12,2 3,7 21,7" fill="currentColor"/><rect x="5" y="8" width="2" height="10" fill="currentColor"/><rect x="17" y="8" width="2" height="10" fill="currentColor"/><rect x="3" y="18" width="18" height="3" fill="currentColor"/><path d="M12 9v7M9 11l3-1 3 1M9 11l-1 3h2l-1-3M15 11l-1 3h2l-1-3" stroke="currentColor" stroke-width="1.2" fill="none"/>` },
  { name: 'Bank Guarantee Lock', cat: 'finance', tags: ['guarantee', 'bank', 'lock', 'safe', 'money'], path: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="8" y="11" width="8" height="7" rx="1.5" fill="currentColor"/><path d="M9.5 11V8.5a2.5 2.5 0 015 0V11" stroke="currentColor" stroke-width="1.8" fill="none"/>` },
  { name: 'Tax Invoice Official Paid', cat: 'finance', tags: ['paid', 'tax', 'invoice', 'receipt', 'bill'], path: `<rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><text x="12" y="14" font-size="4" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">PAID</text>` },
  { name: 'Diamond Solitaire Ring', cat: 'business', tags: ['ring', 'diamond', 'jewelry', 'wedding', 'gem'], path: `<circle cx="12" cy="14" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><polygon points="12,3 15,6 9,6" fill="currentColor"/><polygon points="9,6 15,6 12,9" fill="none" stroke="currentColor" stroke-width="1"/>` },
  { name: 'Industrial Factory Chimney', cat: 'transport', tags: ['factory', 'industrial', 'plant', 'manufacturing'], path: `<path d="M3 21h18v-9l-5 4v-4l-5 4V4H3v17z" fill="none" stroke="currentColor" stroke-width="1.8"/>` },
  { name: 'Green Eco Planet Leaf', cat: 'nature', tags: ['eco', 'planet', 'earth', 'leaf', 'green', 'sustainable'], path: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 6c4 0 7 3 7 7 0 4-3 7-7 7-4 0-7-3-7-7 0-4 3-7 7-7z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6 16c3-1 6-4 6-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>` },

  // --- ANIMALS & CRESTS ---
  { name: 'Majestic Eagle in Flight', cat: 'emblems', tags: ['eagle', 'flying', 'bird', 'usa', 'freedom', 'hawk'], path: `<path d="M12 4l3 4 7-2-5 6 4 5-7-2-2 5-2-5-7 2 4-5-5-6 7 2z" fill="currentColor"/>` },
  { name: 'Rearing Stallion Horse', cat: 'emblems', tags: ['horse', 'stallion', 'equestrian', 'mustang', 'ferrari', 'porsche'], path: `<path d="M15 3c-2 0-3 1-4 3l-1 3-3 1-1 3 2 1v4l-2 3v3h3l2-3 2 1 1-3v-4l2-2 1-5c0-1 0-2-2-2z" fill="currentColor"/>` },
  { name: 'Royal Crowned Lion Head', cat: 'heraldry', tags: ['lion', 'king', 'crowned', 'royal', 'beast', 'mane'], path: `<circle cx="12" cy="13" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 6l2 2 2-3 2 3 2-2v3H8V6z" fill="currentColor"/><circle cx="10" cy="12" r="1" fill="currentColor"/><circle cx="14" cy="12" r="1" fill="currentColor"/><path d="M12 14l-1 2h2l-1-2z" fill="currentColor"/><path d="M9 17c1.5 1 4.5 1 6 0" stroke="currentColor" stroke-width="1.5" fill="none"/>` },
  { name: 'Majestic Stag Deer Antlers', cat: 'nature', tags: ['deer', 'stag', 'antlers', 'hunting', 'buck', 'forest'], path: `<circle cx="12" cy="15" r="4" fill="currentColor"/><path d="M9 12L4 6M4 6l4 2M4 6V3M15 12l5-6M20 6l-4 2M20 6V3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>` },
  { name: 'Howling Wolf Silhouette', cat: 'nature', tags: ['wolf', 'howl', 'moon', 'wild', 'timberwolf'], path: `<path d="M7 21l3-7 2-4 2-5 3 2-1 4 3 2v4l3 4h-4l-2-2-3 4H7z" fill="currentColor"/>` },
  { name: 'Honeybee Pollinator', cat: 'nature', tags: ['bee', 'honey', 'hive', 'industry', 'nature', 'queen'], path: `<ellipse cx="12" cy="14" rx="4" ry="6" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="15" x2="16" y2="15" stroke="currentColor" stroke-width="1.5"/><path d="M12 8c-3-4-8-4-8 0s5 4 8 0zM12 8c3-4 8-4 8 0s-5 4-8 0z" fill="none" stroke="currentColor" stroke-width="1.6"/>` },
  { name: 'Marine Dolphin Jumping', cat: 'nature', tags: ['dolphin', 'sea', 'ocean', 'marine', 'jump', 'water'], path: `<path d="M3 17c4-8 10-12 16-10-3 3-4 6-2 9-3-2-6-2-9 1l-5 0z" fill="currentColor"/><path d="M19 7l3-3-1 4z" fill="currentColor"/>` },
  { name: 'Butterfly Symmetrical Wings', cat: 'nature', tags: ['butterfly', 'wings', 'beauty', 'flutter', 'nature'], path: `<line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 6c4-4 9-2 9 3s-4 6-9 4M12 13c3 0 7 2 7 5s-4 4-7 1M12 6c-4-4-9-2-9 3s4 6 9 4M12 13c-3 0-7 2-7 5s4 4 7 1" stroke="currentColor" stroke-width="1.8" fill="none"/>` },

  // --- SACRED & CULTURAL ---
  { name: 'Christian Latin Cross', cat: 'emblems', tags: ['cross', 'christian', 'church', 'jesus', 'faith', 'holy'], path: `<path d="M12 2v20M6 8h12" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>` },
  { name: 'Celtic Trinity Cross', cat: 'emblems', tags: ['celtic', 'cross', 'ireland', 'trinity', 'faith'], path: `<path d="M12 2v20M6 8h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="8" r="4.5" fill="none" stroke="currentColor" stroke-width="1.6"/>` },
  { name: 'Star of David (Magen David)', cat: 'emblems', tags: ['david', 'jewish', 'israel', 'star', 'judaism', 'hexagram'], path: `<polygon points="12,2 20,16 4,16" fill="none" stroke="currentColor" stroke-width="1.8"/><polygon points="12,22 20,8 4,8" fill="none" stroke="currentColor" stroke-width="1.8"/>` },
  { name: 'Islamic Crescent & Star', cat: 'emblems', tags: ['islam', 'muslim', 'crescent', 'star', 'turkey', 'faith'], path: `<path d="M14 4a8 8 0 100 16 10 10 0 010-16z" fill="currentColor"/><polygon points="17,8 18,10 20,10 18.5,11.5 19,13.5 17,12.5 15,13.5 15.5,11.5 14,10 16,10" fill="currentColor"/>` },
  { name: 'Ashoka Chakra (24 Spokes)', cat: 'emblems', tags: ['ashoka', 'chakra', 'india', 'wheel', 'navy', 'flag'], path: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M12 2.5v19M2.5 12h19M5.3 5.3l13.4 13.4M5.3 18.7L18.7 5.3" stroke="currentColor" stroke-width="1.2"/>` },
  { name: 'Yin Yang Harmony Balance', cat: 'emblems', tags: ['yin yang', 'balance', 'harmony', 'taoism', 'zen'], path: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5a4.75 4.75 0 010 9.5 4.75 4.75 0 000 9.5 9.5 9.5 0 010-19z" fill="currentColor"/><circle cx="12" cy="7.25" r="1.5" fill="white"/><circle cx="12" cy="16.75" r="1.5" fill="currentColor"/>` },
  { name: 'Jewish 7-Branch Menorah', cat: 'emblems', tags: ['menorah', 'candelabra', 'jewish', 'hanukkah', 'temple'], path: `<path d="M12 4v16M8 8a4 4 0 008 0M5 6a7 7 0 0014 0M3 20h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>` },

  // --- SPORTS & FITNESS ---
  { name: 'Football / Classic Soccer Ball', cat: 'business', tags: ['soccer', 'football', 'ball', 'sports', 'fifa'], path: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><polygon points="12,8 15,10 14,14 10,14 9,10" fill="currentColor"/><line x1="12" y1="8" x2="12" y2="2.5" stroke="currentColor" stroke-width="1.6"/><line x1="15" y1="10" x2="20" y2="7.5" stroke="currentColor" stroke-width="1.6"/><line x1="14" y1="14" x2="18" y2="18.5" stroke="currentColor" stroke-width="1.6"/><line x1="10" y1="14" x2="6" y2="18.5" stroke="currentColor" stroke-width="1.6"/><line x1="9" y1="10" x2="4" y2="7.5" stroke="currentColor" stroke-width="1.6"/>` },
  { name: 'Basketball Leather Seams', cat: 'business', tags: ['basketball', 'nba', 'ball', 'hoop', 'sports'], path: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="2.5" y1="12" x2="21.5" y2="12" stroke="currentColor" stroke-width="1.8"/><line x1="12" y1="2.5" x2="12" y2="21.5" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 5.5a10 10 0 010 13M18.5 5.5a10 10 0 000 13" stroke="currentColor" stroke-width="1.8" fill="none"/>` },
  { name: 'Heavy Gym Barbell Dumbbell', cat: 'business', tags: ['gym', 'fitness', 'dumbbell', 'barbell', 'workout', 'muscle'], path: `<rect x="2" y="9" width="3" height="6" rx="1" fill="currentColor"/><rect x="5" y="10" width="2" height="4" rx="0.5" fill="currentColor"/><rect x="7" y="11" width="10" height="2" rx="0.5" fill="currentColor"/><rect x="17" y="10" width="2" height="4" rx="0.5" fill="currentColor"/><rect x="19" y="9" width="3" height="6" rx="1" fill="currentColor"/>` },
  { name: 'Tennis Crossed Rackets', cat: 'business', tags: ['tennis', 'racket', 'wimbledon', 'sports', 'match'], path: `<ellipse cx="7" cy="7" rx="4" ry="4" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="10" y1="10" x2="20" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><ellipse cx="17" cy="7" rx="4" ry="4" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="14" y1="10" x2="4" y2="20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>` },

  // --- TOOLS & TRADES ---
  { name: 'Precision Caliper Gauge', cat: 'transport', tags: ['caliper', 'precision', 'gauge', 'measurement', 'engineer'], path: `<path d="M4 3v18M4 6h14v4h-3V8H4M4 14h10v3h-3v-1H4" stroke="currentColor" stroke-width="1.8" fill="none"/>` },
  { name: 'Construction Hard Hat', cat: 'transport', tags: ['helmet', 'hat', 'construction', 'safety', 'worker'], path: `<path d="M3 15a9 9 0 0118 0H3zM2 15h20v2H2v-2z" fill="currentColor"/><path d="M10 6v9M14 6v9" stroke="white" stroke-width="1.5"/>` },
  { name: 'Plumbing Faucet Tap', cat: 'transport', tags: ['plumber', 'tap', 'water', 'faucet', 'pipe', 'leak'], path: `<path d="M6 10h8v4a3 3 0 01-3 3H8v2H5v-4h1v-5zM10 5v5M7 5h6" stroke="currentColor" stroke-width="1.8" fill="none"/>` },
  { name: 'Painter Roller with Drip', cat: 'transport', tags: ['paint', 'roller', 'decorator', 'wall', 'art'], path: `<rect x="5" y="4" width="14" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 7h-2v6h8v4M11 17h2v4h-2z" stroke="currentColor" stroke-width="1.8" fill="none"/>` },
  { name: 'Edison Innovation Lightbulb', cat: 'tech', tags: ['lightbulb', 'idea', 'innovation', 'smart', 'creative'], path: `<path d="M9 18h6M10 21h4M12 3a6 6 0 00-6 6c0 2.2 1.2 4.2 3 5.3V16h6v-1.7c1.8-1.1 3-3.1 3-5.3a6 6 0 00-6-6z" stroke="currentColor" stroke-width="1.8" fill="none"/>` },

  // --- OFFICIAL TEXT MARKS & RUBBER STAMP MARKS ---
  { name: 'RECEIVED Date Box Stamp', cat: 'business', tags: ['received', 'date', 'box', 'office', 'mail'], path: `<rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" stroke-width="1.5"/><text x="12" y="8.5" font-size="3" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">RECEIVED</text><line x1="5" y1="15" x2="19" y2="15" stroke="currentColor" stroke-width="1" stroke-dasharray="1.5, 1"/>` },
  { name: 'APPROVED Signature Box', cat: 'business', tags: ['approved', 'signature', 'box', 'sign', 'ok'], path: `<rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" stroke-width="1.5"/><text x="12" y="8.5" font-size="3" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">APPROVED</text><line x1="5" y1="15" x2="19" y2="15" stroke="currentColor" stroke-width="1" stroke-dasharray="1.5, 1"/>` },
  { name: 'PAID Stamp Badge', cat: 'finance', tags: ['paid', 'payment', 'cash', 'receipt', 'invoice'], path: `<rect x="2" y="6" width="20" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><text x="12" y="14.5" font-size="5" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">PAID</text>` },
  { name: 'CANCELLED Void Mark', cat: 'business', tags: ['cancelled', 'void', 'null', 'stamp'], path: `<rect x="2" y="6" width="20" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><text x="12" y="14" font-size="3.2" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">CANCELLED</text>` },
  { name: 'URGENT Priority Seal', cat: 'business', tags: ['urgent', 'priority', 'rush', 'asap', 'alert'], path: `<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><text x="12" y="13.5" font-size="3.5" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">URGENT</text>` },
  { name: 'ORIGINAL Document Stamp', cat: 'business', tags: ['original', 'first', 'official', 'master'], path: `<rect x="2" y="6" width="20" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><text x="12" y="14" font-size="3.2" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">ORIGINAL</text>` },
  { name: 'DUPLICATE Copy Stamp', cat: 'business', tags: ['duplicate', 'copy', 'second', 'carbon'], path: `<rect x="2" y="6" width="20" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><text x="12" y="14" font-size="2.8" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">DUPLICATE</text>` },
  { name: 'Air Mail Par Avion Wings', cat: 'shipping', tags: ['airmail', 'avion', 'post', 'wings', 'postal'], path: `<path d="M2 12c3-4 8-4 10-1 2-3 7-3 10 1-3 4-8 4-10 1-2 3-7 3-10-1z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/>` },
  { name: 'Postal Wavy Postmark Lines', cat: 'shipping', tags: ['postmark', 'waves', 'mail', 'stamp', 'postal'], path: `<path d="M2 7c4 2 8-2 10 0s6-2 10 0M2 12c4 2 8-2 10 0s6-2 10 0M2 17c4 2 8-2 10 0s6-2 10 0" stroke="currentColor" stroke-width="1.8" fill="none"/>` },

  // --- MORE ANIMALS & CRESTS ---
  { name: 'Roaring Wild Tiger', cat: 'emblems', tags: ['tiger', 'bengal', 'wild', 'cat', 'beast', 'predator'], path: `<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 5L5 8M17 5l2 3M12 9v5M9 13l3 2 3-2M8 17c2 1 6 1 8 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/><circle cx="9" cy="11" r="1.2" fill="currentColor"/><circle cx="15" cy="11" r="1.2" fill="currentColor"/>` },
  { name: 'Strong Charging Bull', cat: 'finance', tags: ['bull', 'wall street', 'market', 'charging', 'ox', 'taurus'], path: `<path d="M4 8c2-3 4-4 7-2 0 1-1 3-2 4 4 1 7 4 8 8H5c-1-3 0-6 2-7-1-1-2-2-3-3z" fill="currentColor"/><path d="M19 12c2-2 3-4 2-6-1 0-2 2-3 3" stroke="currentColor" stroke-width="1.8" fill="none"/>` },
  { name: 'Two Doves of Peace', cat: 'nature', tags: ['dove', 'peace', 'bird', 'olive', 'wings', 'purity'], path: `<path d="M18 5c-3 1-6 4-7 8-2-1-4-1-6 1 3 1 5 1 7-1l1 4h3l1-4c3-1 5-4 5-8h-4z" fill="currentColor"/><path d="M7 14c-2 0-4 1-5 3 2 0 4-1 5-3z" fill="currentColor"/>` },
  { name: 'Soaring Falcon Hawk', cat: 'emblems', tags: ['falcon', 'hawk', 'bird', 'predator', 'flight'], path: `<path d="M12 2l3 6 7 2-6 5 2 7-6-4-6 4 2-7-6-5 7-2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="11" r="2.5" fill="currentColor"/>` },
  { name: 'Mythical Pegasus Wings', cat: 'heraldry', tags: ['pegasus', 'wings', 'horse', 'mythical', 'fantasy'], path: `<path d="M12 12c-2-4-6-7-10-7 2 5 5 9 10 9 0 3 2 6 5 7l2-2c-2-2-3-4-3-7 3 0 6-2 8-5-3 0-6 1-8 3-1-3-3-5-4-8z" fill="currentColor"/>` },

  // --- MORE MEDICAL & CARE ---
  { name: 'Optometry Eye Snellen Chart', cat: 'medical', tags: ['eye', 'snellen', 'chart', 'vision', 'optician'], path: `<rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><text x="12" y="9" font-size="4.5" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">E</text><text x="12" y="13.5" font-size="3" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">F P</text><text x="12" y="17.5" font-size="2" font-weight="bold" font-family="Arial" text-anchor="middle" fill="currentColor">T O Z</text>` },
  { name: 'Human Brain Neurology', cat: 'medical', tags: ['brain', 'mind', 'neurology', 'psychology', 'intellect'], path: `<path d="M12 4c-3-2-7 0-7 4 0 2 1 3 1 5-2 2-2 5 0 7 2 2 5 2 6 0 1 2 4 2 6 0 2-2 2-5 0-7 0-2 1-3 1-5 0-4-4-6-7-4z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 4v16M8 8c2 1 3 3 1 5M16 8c-2 1-3 3-1 5" stroke="currentColor" stroke-width="1.4" fill="none"/>` },
  { name: 'Chiropractic Spine Column', cat: 'medical', tags: ['spine', 'chiropractic', 'orthopedic', 'bone', 'vertebrae'], path: `<circle cx="12" cy="4" r="1.8" fill="currentColor"/><circle cx="12" cy="8" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="16" r="1.8" fill="currentColor"/><circle cx="12" cy="20" r="1.8" fill="currentColor"/><path d="M8 8h8M7 12h10M8 16h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>` },
  { name: 'Pharmaceutical Capsule Pill', cat: 'medical', tags: ['pill', 'capsule', 'medicine', 'tablet', 'pharmacy'], path: `<rect x="6" y="9" width="12" height="6" rx="3" transform="rotate(45 12 12)" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="7.76" x2="12" y2="16.24" transform="rotate(45 12 12)" stroke="currentColor" stroke-width="2"/>` },
  { name: 'Laboratory Beaker Flask', cat: 'academic', tags: ['beaker', 'flask', 'chemistry', 'science', 'lab'], path: `<path d="M9 3h6v4l5 10a2 2 0 01-2 3H6a2 2 0 01-2-3l5-10V3z" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="8" y1="3" x2="16" y2="3" stroke="currentColor" stroke-width="2"/><line x1="6.5" y1="16" x2="17.5" y2="16" stroke="currentColor" stroke-width="1.5" stroke-dasharray="1.5, 1"/><circle cx="10" cy="13" r="1" fill="currentColor"/><circle cx="14" cy="12" r="0.8" fill="currentColor"/>` },

  // --- MORE FOOD & HOSPITALITY ---
  { name: 'Sweet Bakery Cupcake', cat: 'food', tags: ['cupcake', 'bakery', 'cake', 'sweet', 'muffin'], path: `<path d="M6 11l2 10h8l2-10H6z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6 11c-2-2-1-5 2-6 2-1 4 1 4 1s2-2 4-1c3 1 4 4 2 6H6z" fill="currentColor"/><circle cx="12" cy="4" r="1.5" fill="white"/>` },
  { name: 'Italian Pizzeria Slice', cat: 'food', tags: ['pizza', 'slice', 'crust', 'pizzeria', 'fast food', 'italian'], path: `<path d="M12 2l9 16a2 2 0 01-2 2H5a2 2 0 01-2-2L12 2z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="10" cy="12" r="1.2" fill="currentColor"/><circle cx="14" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="16" r="1.2" fill="currentColor"/>` },
  { name: 'Frothy Beer Mug Stein', cat: 'food', tags: ['beer', 'mug', 'pub', 'brewery', 'drink', 'stein'], path: `<rect x="5" y="7" width="10" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M15 10h4a2 2 0 012 2v4a2 2 0 01-2 2h-4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 7c-1-2 1-4 3-4s3 2 4 1 2-2 4-1 2 2 1 4H5z" fill="currentColor"/>` },
  { name: 'Fresh Organic Apple', cat: 'nature', tags: ['apple', 'fruit', 'organic', 'fresh', 'healthy'], path: `<path d="M12 6c-4-3-8 0-8 6 0 6 5 10 8 10s8-4 8-10c0-6-4-9-8-6z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 6V2M12 4c2-2 5-1 5 1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>` },
];

EXTRA_OFFICIAL_BADGES.forEach((badge, idx) => {
  PROCEDURAL_EXTENSIONS.push({
    id: `ext-badge-${idx + 1}`,
    name: badge.name,
    category: badge.cat,
    tags: badge.tags,
    svg: badge.path,
  });
});

// Append all procedurally generated high-precision vector stamp items
PROCEDURAL_EXTENSIONS.forEach((item) => {
  STAMP_CLIPART_CATALOG.push(item);
});
