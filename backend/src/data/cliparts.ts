export interface ClipartSeed {
  id: string;
  name: string;
  category: 'stars' | 'legal' | 'medical' | 'emblems' | 'office' | 'borders';
  viewBox: string;
  svgPath: string; // SVG inner path or elements
}

export const CLIPARTS: ClipartSeed[] = [
  {
    id: 'star-five-point',
    name: '5-Point Classic Star',
    category: 'stars',
    viewBox: '0 0 24 24',
    svgPath: '<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="currentColor" />',
  },
  {
    id: 'stars-triple',
    name: 'Triple Star Motif',
    category: 'stars',
    viewBox: '0 0 60 20',
    svgPath: `
      <polygon points="12,2 14.5,7.5 20,8.3 16,12.2 17,17.7 12,15 7,17.7 8,12.2 4,8.3 9.5,7.5" fill="currentColor" />
      <polygon points="30,0 33.2,7 41,8 35.5,13.5 37,21 30,17.2 23,21 24.5,13.5 19,8 26.8,7" fill="currentColor" />
      <polygon points="48,2 50.5,7.5 56,8.3 52,12.2 53,17.7 48,15 43,17.7 44,12.2 40,8.3 45.5,7.5" fill="currentColor" />
    `,
  },
  {
    id: 'scales-of-justice',
    name: 'Scales of Justice',
    category: 'legal',
    viewBox: '0 0 24 24',
    svgPath: `
      <path d="M12 3v17M12 3H7m5 0h5M4 8l3 7h-6l3-7zm13 0l3 7h-6l3-7zM7 8h10M9 20h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <polygon points="4,15 10,15 7,8" fill="currentColor" opacity="0.3"/>
      <polygon points="14,15 20,15 17,8" fill="currentColor" opacity="0.3"/>
    `,
  },
  {
    id: 'caduceus',
    name: 'Medical Caduceus / Asclepius',
    category: 'medical',
    viewBox: '0 0 24 24',
    svgPath: `
      <path d="M12 2v20M8 5c2-2 6-2 8 0s0 4-4 5 2 4 4 5-2 3-4 3-4-2-4-3 6-4 4-5-6-3-4-5z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <circle cx="12" cy="3" r="1.5" fill="currentColor" />
    `,
  },
  {
    id: 'shield-check',
    name: 'Security Shield & Check',
    category: 'emblems',
    viewBox: '0 0 24 24',
    svgPath: `
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline points="9 12 11 14 15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    `,
  },
  {
    id: 'botanical-wreath',
    name: 'Victorian Botanical Laurel Wreath',
    category: 'emblems',
    viewBox: '0 0 64 64',
    svgPath: `
      <path d="M32 58 C16 58 6 46 6 32 C6 20 14 10 24 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M32 58 C48 58 58 46 58 32 C58 20 50 10 40 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="10" cy="42" r="2.5" fill="currentColor"/>
      <circle cx="8" cy="30" r="2.5" fill="currentColor"/>
      <circle cx="12" cy="18" r="2.5" fill="currentColor"/>
      <circle cx="20" cy="10" r="2.5" fill="currentColor"/>
      <circle cx="54" cy="42" r="2.5" fill="currentColor"/>
      <circle cx="56" cy="30" r="2.5" fill="currentColor"/>
      <circle cx="52" cy="18" r="2.5" fill="currentColor"/>
      <circle cx="44" cy="10" r="2.5" fill="currentColor"/>
    `,
  },
  {
    id: 'approved-stamp-badge',
    name: 'Official Approved Badge',
    category: 'office',
    viewBox: '0 0 24 24',
    svgPath: `
      <path d="M12 2l2.4 2.8 3.7-.4 1.1 3.5 3.3 1.7-1 3.5 2.1 3-2.1 3 1 3.5-3.3 1.7-1.1 3.5-3.7-.4L12 22l-2.4-2.8-3.7.4-1.1-3.5-3.3-1.7 1-3.5-2.1-3 2.1-3-1-3.5 3.3-1.7 1.1-3.5 3.7.4z" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `,
  },
];
