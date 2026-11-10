/**
 * Pro template collection.
 *
 * Round seals are generated from one geometry builder so every seal shares the
 * same rhythm: border → thin rule → arc text band → inner ring → center block.
 * All radii are derived from the diameter and font size, so text never touches
 * a ring and top/bottom arcs never meet.
 */
import type { StampTemplateSeed } from './templates';
import { charWidthRatio } from './template-layout';

type Category = StampTemplateSeed['category'];
const FONT = 'Montserrat';
const HALF = 0.38; // half visual glyph height (× font size)
const GAP = 0.55; // clearance between text and rings (mm)

interface CenterLine {
  text: string;
  size: number;
  dy: number; // offset from center (mm)
  weight?: string;
  spacing?: number;
  font?: string; // per-line font (e.g. a script name under bold caps)
}
interface CenterArt {
  name: string;
  size: number;
  dy: number;
  h?: number; // height when the art is not square
}

/** Horizontal divider inside the inner ring; width is auto-fitted to the circle. */
interface CenterRule {
  rule: number; // dy from center (mm)
}

interface SealSpec {
  id: string;
  title: string;
  description: string;
  category: Category;
  diameter: number;
  ink?: string;
  border?: 'double' | 'single' | string; // string = serrated style ('serrated', 'scallop', 'beaded', 'rope', ...)
  teeth?: number;
  top: string;
  bottom?: string;
  arcSize: number;
  bottomSize?: number;
  arcSpacing?: number;
  sideStars?: boolean;
  innerDotted?: boolean;
  innerDashed?: boolean;
  font?: string;
  center: (CenterLine | CenterArt | CenterRule)[];
  tags: string[];
  isPremium?: boolean;
}

function roundSeal(s: SealSpec): StampTemplateSeed {
  const c = s.diameter / 2;
  const els: any[] = [];
  const bSize = s.bottomSize ?? s.arcSize * 0.9;
  const maxF = Math.max(s.arcSize, bSize);
  let wall: number; // inner edge of the outer border system

  if (s.border === 'double' || s.border === 'single' || !s.border) {
    els.push({ id: 'border-outer', type: 'ring', cx: c, cy: c, radius: +(c - 0.5).toFixed(2), strokeWidth: 0.8, strokeType: 'solid' });
    wall = c - 0.9;
    if (s.border !== 'single') {
      els.push({ id: 'border-rule', type: 'ring', cx: c, cy: c, radius: +(c - 1.5).toFixed(2), strokeWidth: 0.3, strokeType: 'solid' });
      wall = c - 1.65;
    }
  } else {
    els.push({
      id: 'border-pattern', type: 'serrated-ring', cx: c, cy: c,
      outerRadius: +(c - 0.3).toFixed(2), innerRadius: +(c - 1.8).toFixed(2),
      teeth: s.teeth ?? Math.round(s.diameter * 1.25), strokeWidth: 0.4,
      wreathStyle: s.border,
    });
    els.push({ id: 'border-ring', type: 'ring', cx: c, cy: c, radius: +(c - 2.3).toFixed(2), strokeWidth: 0.5, strokeType: 'solid' });
    wall = c - 2.55;
  }

  const arcR = +(wall - GAP - HALF * maxF).toFixed(2);
  const innerR = +(arcR - HALF * maxF - GAP - 0.25).toFixed(2);

  els.push({
    id: 'arc-top', type: 'arc-text', text: s.top, cx: c, cy: c, radius: arcR,
    fontSize: s.arcSize, fontFamily: s.font ?? FONT, fontWeight: 'bold', letterSpacing: s.arcSpacing ?? 0.35, isReversed: false,
  });
  if (s.bottom) {
    els.push({
      id: 'arc-bottom', type: 'arc-text', text: s.bottom, cx: c, cy: c, radius: arcR,
      fontSize: bSize, fontFamily: s.font ?? FONT, fontWeight: 'bold', letterSpacing: s.arcSpacing ?? 0.35, isReversed: true,
    });
  }
  els.push({
    id: 'ring-inner', type: 'ring', cx: c, cy: c, radius: innerR,
    strokeWidth: s.innerDotted || s.innerDashed ? 0.45 : 0.5, strokeType: s.innerDotted ? 'dotted' : s.innerDashed ? 'dashed' : 'solid',
  });
  if (s.sideStars) {
    const st = +(maxF * 0.85).toFixed(2);
    els.push({ id: 'star-left', type: 'clipart', name: 'star-five-point', cx: +(c - arcR).toFixed(2), cy: c, width: st, height: st });
    els.push({ id: 'star-right', type: 'clipart', name: 'star-five-point', cx: +(c + arcR).toFixed(2), cy: c, width: st, height: st });
  }

  s.center.forEach((item, i) => {
    if ('rule' in item) {
      const half = +(Math.sqrt(Math.max(0, (innerR - 1.2) ** 2 - item.rule ** 2)) * 0.82).toFixed(2);
      els.push({ id: `rule-${i}`, type: 'line', x1: +(c - half).toFixed(2), y1: +(c + item.rule).toFixed(2), x2: +(c + half).toFixed(2), y2: +(c + item.rule).toFixed(2), strokeWidth: 0.3 });
    } else if ('name' in item) {
      els.push({ id: `art-${i}`, type: 'clipart', name: item.name, cx: c, cy: +(c + item.dy).toFixed(2), width: item.size, height: item.h ?? item.size });
    } else {
      els.push({
        id: `text-${i}`, type: 'text', text: item.text, x: c, y: +(c + item.dy).toFixed(2),
        fontSize: item.size, fontFamily: item.font ?? s.font ?? FONT, fontWeight: item.weight ?? 'bold', align: 'center',
        ...(item.spacing ? { letterSpacing: item.spacing } : {}),
      });
    }
  });

  return {
    id: s.id, title: s.title, description: s.description, category: s.category,
    shape: 'ROUND', widthMm: s.diameter, heightMm: s.diameter, tags: s.tags, isPremium: !!s.isPremium,
    defaultData: { inkColor: s.ink ?? '#1e3a8a', fields: {}, elements: els },
  };
}

interface RectLine {
  text?: string;
  /** Form field: renders "LABEL:" left-aligned plus a blank rule; all blanks in a stamp share one start x. */
  field?: string;
  size: number;
  y: number;
  weight?: string;
  spacing?: number;
  align?: 'left' | 'center';
  font?: string;
}
interface RectSpec {
  id: string;
  title: string;
  description: string;
  category: Category;
  w: number;
  h: number;
  ink?: string;
  font?: string;
  frame?: 'double' | 'single' | 'bold' | 'none';
  radius?: number;
  lines: RectLine[];
  rules?: number[]; // y positions of horizontal divider rules
  shape?: 'RECTANGULAR' | 'SQUARE';
  tags: string[];
  isPremium?: boolean;
}

function rectStamp(s: RectSpec): StampTemplateSeed {
  const els: any[] = [];
  const r = s.radius ?? 1;
  const frame = s.frame ?? 'single';
  if (frame !== 'none') {
    const sw = frame === 'bold' ? 1.0 : 0.7;
    els.push({ id: 'frame-outer', type: 'rect', x: 0.6, y: 0.6, width: +(s.w - 1.2).toFixed(2), height: +(s.h - 1.2).toFixed(2), rx: r, ry: r, strokeWidth: sw });
    if (frame === 'double' || frame === 'bold') {
      els.push({ id: 'frame-inner', type: 'rect', x: 1.8, y: 1.8, width: +(s.w - 3.6).toFixed(2), height: +(s.h - 3.6).toFixed(2), rx: Math.max(0, r - 0.6), ry: Math.max(0, r - 0.6), strokeWidth: 0.3 });
    }
  }
  const inset = frame === 'double' || frame === 'bold' ? 4 : 3;
  (s.rules || []).forEach((y, i) =>
    els.push({ id: `rule-${i}`, type: 'line', x1: inset, y1: y, x2: +(s.w - inset).toFixed(2), y2: y, strokeWidth: 0.3 })
  );
  // Form fields: one label column, one blank column → perfectly aligned rows.
  const fieldText = (l: RectLine) => (/[.:]$/.test(l.field!) ? l.field! : `${l.field}:`);
  const fields = s.lines.filter((l) => l.field);
  const labelW = (l: RectLine) =>
    Array.from(fieldText(l)).reduce((sum, ch) => sum + charWidthRatio(ch) * l.size, 0) * 1.12;
  const fieldLeft = inset + 1.5;
  const blankStart = fields.length ? fieldLeft + Math.max(...fields.map(labelW)) + 1.4 : 0;
  const blankEnd = s.w - inset - 1.5;

  s.lines.forEach((l, i) => {
    if (l.field) {
      els.push({
        id: `field-${i}`, type: 'text', text: fieldText(l), x: +fieldLeft.toFixed(2), y: l.y,
        fontSize: l.size, fontFamily: l.font ?? s.font ?? FONT, fontWeight: l.weight ?? '600', align: 'left',
      });
      const ly = +(l.y + l.size * 0.36).toFixed(2); // sits on the label baseline
      els.push({ id: `blank-${i}`, type: 'line', x1: +blankStart.toFixed(2), y1: ly, x2: +blankEnd.toFixed(2), y2: ly, strokeWidth: 0.25 });
      return;
    }
    const left = l.align === 'left';
    els.push({
      id: `line-${i}`, type: 'text', text: l.text, x: left ? inset : +(s.w / 2).toFixed(2), y: l.y,
      fontSize: l.size, fontFamily: l.font ?? s.font ?? FONT, fontWeight: l.weight ?? 'bold', align: left ? 'left' : 'center',
      ...(l.spacing ? { letterSpacing: l.spacing } : {}),
    });
  });
  return {
    id: s.id, title: s.title, description: s.description, category: s.category,
    shape: s.shape ?? (s.w === s.h ? 'SQUARE' : 'RECTANGULAR'), widthMm: s.w, heightMm: s.h, tags: s.tags, isPremium: !!s.isPremium,
    defaultData: { inkColor: s.ink ?? '#1e3a8a', fields: {}, elements: els },
  };
}

export const PRO_TEMPLATES: StampTemplateSeed[] = [
  // ───────────── ROUND SEALS ─────────────
  roundSeal({
    id: 'template-pro-company-common-seal',
    title: 'Company Common Seal (Double Rule)',
    description: '40 mm classic company common seal with double outer rule, side stars and two-line center.',
    category: 'company', diameter: 40, border: 'double',
    top: 'ACME INDUSTRIES PRIVATE LIMITED', bottom: 'MUMBAI • INDIA', arcSize: 2.5, bottomSize: 2.4, sideStars: true,
    center: [
      { text: 'COMMON', size: 3.0, dy: -1.9, spacing: 0.3 },
      { text: 'SEAL', size: 3.0, dy: 2.0, spacing: 0.3 },
    ],
    tags: ['company', 'common seal', 'corporate', 'private limited', 'round'],
  }),
  roundSeal({
    id: 'template-pro-director-authorised-seal',
    title: 'Authorised Signatory Round Seal',
    description: '38 mm director / authorised signatory seal with company name arc and designation center.',
    category: 'company', diameter: 38, border: 'double',
    top: 'BRIGHTWAVE SOLUTIONS LLP', bottom: 'BENGALURU', arcSize: 2.4, sideStars: true,
    center: [
      { text: 'AUTHORISED', size: 2.3, dy: -1.6 },
      { text: 'SIGNATORY', size: 2.3, dy: 1.6 },
    ],
    tags: ['director', 'authorised signatory', 'company', 'llp', 'round'],
  }),
  roundSeal({
    id: 'template-pro-notary-scalloped',
    title: 'Notary Public Scalloped Seal',
    description: '45 mm notary seal with scalloped border, scales of justice and commission expiry.',
    category: 'notary', diameter: 45, border: 'scallop', teeth: 44,
    top: 'MARIA L. GONZALEZ', bottom: 'NOTARY PUBLIC • STATE OF TEXAS', arcSize: 2.8, bottomSize: 2.4,
    center: [
      { name: 'scales-of-justice', size: 7, dy: -3.6 },
      { text: 'COMM. NO. 13490285', size: 2.0, dy: 2.4 },
      { text: 'EXP. 12/31/2028', size: 2.0, dy: 5.2, weight: '600' },
    ],
    tags: ['notary', 'notary public', 'texas', 'scales', 'seal'],
    isPremium: true,
  }),
  roundSeal({
    id: 'template-pro-doctor-caduceus-seal',
    title: 'Doctor Registration Seal (Caduceus)',
    description: '38 mm medical practitioner seal with caduceus emblem and council registration number.',
    category: 'medical', diameter: 38, border: 'double', ink: '#0f5c4d',
    top: 'DR. PRIYA NAIR  MBBS, MD', bottom: 'REG. NO. KMC 45821', arcSize: 2.3,
    center: [
      { name: 'caduceus', size: 7, dy: -2.4 },
      { text: 'CONSULTANT', size: 1.9, dy: 3.6 },
    ],
    tags: ['doctor', 'medical', 'caduceus', 'registration', 'round'],
  }),
  roundSeal({
    id: 'template-pro-professional-engineer',
    title: 'Professional Engineer License Seal',
    description: '45 mm licensed professional engineer seal with license number, expiry and discipline.',
    category: 'engineering', diameter: 45, border: 'double',
    top: 'STATE OF CALIFORNIA', bottom: 'PROFESSIONAL ENGINEER', arcSize: 2.8, bottomSize: 2.6, sideStars: true,
    center: [
      { text: 'ROBERT K. CHEN', size: 2.4, dy: -4.6 },
      { text: 'NO. C 84211', size: 2.4, dy: -1.2 },
      { text: 'EXP. 06/30/2027', size: 1.9, dy: 1.9, weight: '600' },
      { text: 'CIVIL', size: 2.8, dy: 5.4, spacing: 0.6 },
    ],
    tags: ['engineer', 'pe', 'license', 'civil', 'california', 'seal'],
    isPremium: true,
  }),
  roundSeal({
    id: 'template-pro-verified-shield',
    title: 'Verified Document Seal',
    description: '30 mm compact verification seal with shield-check emblem.',
    category: 'office', diameter: 30, border: 'single', ink: '#15803d',
    top: 'DOCUMENT VERIFIED', bottom: 'QUALITY DESK', arcSize: 2.1, innerDotted: true,
    center: [{ name: 'shield-check', size: 8, dy: 0 }],
    tags: ['verified', 'checked', 'office', 'shield', 'round'],
  }),
  roundSeal({
    id: 'template-pro-qc-passed-beaded',
    title: 'QC Passed Inspection Seal',
    description: '32 mm beaded-border quality control seal with inspector number.',
    category: 'office', diameter: 32, border: 'beaded', teeth: 40, ink: '#166534',
    top: 'QUALITY CONTROL', bottom: 'INSPECTOR 07', arcSize: 2.1,
    center: [
      { text: 'QC', size: 4.4, dy: -1.3, spacing: 0.3 },
      { text: 'PASSED', size: 2.1, dy: 2.6, spacing: 0.3 },
    ],
    tags: ['qc', 'quality', 'passed', 'inspection', 'factory', 'round'],
  }),
  roundSeal({
    id: 'template-pro-wedding-blossom',
    title: 'Blossom Wedding Monogram',
    description: '40 mm wedding monogram seal with blossom border, couple names and year.',
    category: 'monogram', diameter: 40, border: 'blossom', teeth: 36, ink: '#9d174d',
    top: 'ANNA & RAHUL', bottom: 'EST. 2026', arcSize: 2.6, arcSpacing: 0.8,
    center: [
      { text: 'A  |  R', size: 5.0, dy: 0, spacing: 0.2 },
    ],
    tags: ['wedding', 'monogram', 'couple', 'blossom', 'invitation'],
    isPremium: true,
  }),
  roundSeal({
    id: 'template-pro-teacher-excellent',
    title: 'Teacher “Excellent Work” Stamp',
    description: '28 mm teacher reward stamp with triple stars.',
    category: 'office', diameter: 28, border: 'single', ink: '#b91c1c',
    top: 'EXCELLENT', bottom: 'KEEP IT UP', arcSize: 2.3, arcSpacing: 0.5,
    center: [{ name: 'stars-triple', size: 11, h: 3.9, dy: 0 }],
    tags: ['teacher', 'school', 'reward', 'excellent', 'kids'],
  }),
  roundSeal({
    id: 'template-pro-cafe-rope',
    title: 'Café & Bakery Rope Seal',
    description: '38 mm rope-border café seal for cups, bags and boxes.',
    category: 'company', diameter: 38, border: 'rope', teeth: 46, ink: '#78350f',
    top: 'THE CORNER CAFÉ', bottom: 'SINCE 2019', arcSize: 2.6, arcSpacing: 0.6,
    center: [
      { text: 'FRESH', size: 2.2, dy: -2.9, spacing: 0.4 },
      { text: 'COFFEE', size: 3.4, dy: 0.3 },
      { text: '& BAKES', size: 2.2, dy: 3.4, spacing: 0.4 },
    ],
    tags: ['cafe', 'bakery', 'coffee', 'packaging', 'brand', 'rope'],
  }),

  // ───────────── RECTANGULAR / SQUARE ─────────────
  rectStamp({
    id: 'template-pro-return-address-4line',
    title: 'Return Address 4-Line (Trodat 4913)',
    description: '58×22 mm four-line return address stamp with balanced line spacing.',
    category: 'address', w: 58, h: 22, frame: 'none',
    lines: [
      { text: 'ARJUN MENON', size: 3.4, y: 4.3, spacing: 0.3 },
      { text: '24/118, Rose Garden Lane, Kakkanad', size: 2.4, y: 9.2, weight: '600' },
      { text: 'Kochi, Kerala 682030, India', size: 2.4, y: 13.3, weight: '600' },
      { text: '+91 98470 12345  •  arjun@email.com', size: 2.1, y: 17.6, weight: '500' },
    ],
    tags: ['address', 'return address', '4913', 'home', 'envelope'],
  }),
  rectStamp({
    id: 'template-pro-company-gst-stamp',
    title: 'Company GST Invoice Stamp',
    description: '50×20 mm framed company stamp with divider rule and GSTIN.',
    category: 'company', w: 50, h: 20, frame: 'double', radius: 1.2,
    rules: [9.6],
    lines: [
      { text: 'KERALA SPICE TRADERS', size: 3.0, y: 6.2, spacing: 0.2 },
      { text: 'GSTIN: 32ABCDE1234F1Z5', size: 2.0, y: 12.4, weight: '600' },
      { text: 'Authorised Signatory', size: 1.9, y: 15.4, weight: '500' },
    ],
    tags: ['gst', 'company', 'invoice', 'gstin', 'business'],
  }),
  rectStamp({
    id: 'template-pro-received-date',
    title: '“Received” Date Stamp',
    description: '50×30 mm received stamp with date, time and signature fields.',
    category: 'date', w: 50, h: 30, frame: 'bold', radius: 1.5, ink: '#b91c1c',
    rules: [10.5],
    lines: [
      { text: 'RECEIVED', size: 5.0, y: 6.6, spacing: 0.6 },
      { field: 'DATE', size: 2.2, y: 14.4 },
      { field: 'TIME', size: 2.2, y: 19.0 },
      { field: 'SIGN', size: 2.2, y: 23.6 },
    ],
    tags: ['received', 'date', 'inward', 'office', 'mail'],
  }),
  rectStamp({
    id: 'template-pro-urgent-square',
    title: '“Urgent” Priority Square Stamp',
    description: '30×30 mm bold square priority stamp.',
    category: 'office', w: 30, h: 30, frame: 'bold', radius: 1.5, ink: '#b91c1c',
    rules: [11, 19],
    lines: [
      { text: 'PRIORITY', size: 2.4, y: 7.4, spacing: 0.6 },
      { text: 'URGENT', size: 4.6, y: 15.0, spacing: 0.3 },
      { text: 'ACTION TODAY', size: 2.0, y: 22.6, spacing: 0.3 },
    ],
    shape: 'SQUARE',
    tags: ['urgent', 'priority', 'office', 'square'],
  }),

  // ───────────── COLLECTION 2 · ROUND SEALS ─────────────
  roundSeal({
    id: 'template-pro-school-principal-seal',
    title: 'School Principal Seal',
    description: '42 mm school / college principal seal with divider rules around the designation.',
    category: 'office', diameter: 42, border: 'double',
    top: "ST. MARY'S HIGHER SECONDARY SCHOOL", bottom: 'THRISSUR • KERALA', arcSize: 2.3, bottomSize: 2.3, sideStars: true,
    center: [
      { rule: -2.6 },
      { text: 'PRINCIPAL', size: 3.0, dy: 0, spacing: 0.4 },
      { rule: 2.6 },
    ],
    tags: ['school', 'college', 'principal', 'education', 'institution'],
  }),
  roundSeal({
    id: 'template-pro-association-secretary-seal',
    title: 'Association Secretary Seal',
    description: '40 mm registered society / association seal with triple stars and office-bearer title.',
    category: 'company', diameter: 40, border: 'double',
    top: 'KERALA TRADERS ASSOCIATION', bottom: 'REG. NO. TSR/124/2015', arcSize: 2.4, bottomSize: 2.1,
    center: [
      { name: 'stars-triple', size: 9, h: 3.2, dy: -3.2 },
      { text: 'SECRETARY', size: 2.8, dy: 1.2, spacing: 0.3 },
      { text: 'Thrissur Unit', size: 2.0, dy: 4.4, weight: '600' },
    ],
    tags: ['association', 'society', 'club', 'secretary', 'registered'],
  }),
  roundSeal({
    id: 'template-pro-village-office-seal',
    title: 'Government Office Seal',
    description: '45 mm government / village office seal with district name and officer designation.',
    category: 'office', diameter: 45, border: 'serrated', teeth: 72,
    top: 'OFFICE OF THE VILLAGE OFFICER', bottom: 'ERNAKULAM DISTRICT', arcSize: 2.5, bottomSize: 2.4,
    center: [
      { name: 'star-five-point', size: 4.2, dy: -4.6 },
      { text: 'KAKKANAD', size: 3.2, dy: -0.2, spacing: 0.3 },
      { rule: 2.2 },
      { text: 'VILLAGE OFFICER', size: 2.0, dy: 4.4 },
    ],
    tags: ['government', 'village office', 'officer', 'district', 'official'],
  }),
  roundSeal({
    id: 'template-pro-notary-india',
    title: 'Notary Seal (India)',
    description: '42 mm Government of India notary seal with scales of justice and registration number.',
    category: 'notary', diameter: 42, border: 'double',
    top: 'ADV. RAJESH KUMAR', bottom: 'NOTARY • GOVT. OF INDIA', arcSize: 2.7, bottomSize: 2.4, sideStars: true,
    center: [
      { name: 'scales-of-justice', size: 6.5, dy: -3.2 },
      { text: 'REG. NO. 8842/2020', size: 2.0, dy: 2.4 },
      { text: 'KOCHI', size: 2.2, dy: 5.2, spacing: 0.4 },
    ],
    tags: ['notary', 'india', 'advocate', 'scales', 'government'],
  }),
  roundSeal({
    id: 'template-pro-architect-seal',
    title: 'Registered Architect Seal',
    description: '42 mm Council of Architecture registered architect seal.',
    category: 'engineering', diameter: 42, border: 'double',
    top: 'COUNCIL OF ARCHITECTURE', bottom: 'REG. NO. CA/2015/71234', arcSize: 2.5, bottomSize: 2.2,
    center: [
      { text: 'AR. MEERA DAS', size: 2.7, dy: -2.4 },
      { rule: 0 },
      { text: 'ARCHITECT', size: 2.4, dy: 2.4, spacing: 0.5 },
    ],
    tags: ['architect', 'coa', 'registration', 'building', 'design'],
  }),
  roundSeal({
    id: 'template-pro-chartered-engineer',
    title: 'Chartered Engineer Seal',
    description: '42 mm chartered engineer seal with dashed inner ring and membership number.',
    category: 'engineering', diameter: 42, border: 'single', innerDashed: true,
    top: 'CHARTERED ENGINEER', bottom: 'M.I.E. 1234567-8', arcSize: 2.7, bottomSize: 2.4,
    center: [
      { text: 'ER. VISHNU P.', size: 2.7, dy: -2.6 },
      { text: 'B.TECH, M.TECH', size: 2.0, dy: 0.6, weight: '600' },
      { text: 'MECHANICAL', size: 2.2, dy: 3.8, spacing: 0.4 },
    ],
    tags: ['engineer', 'chartered', 'iei', 'mechanical', 'membership'],
  }),
  roundSeal({
    id: 'template-pro-pharmacy-seal',
    title: 'Pharmacy / Medical Store Seal',
    description: '38 mm pharmacy seal with drug licence number and Rx mark.',
    category: 'medical', diameter: 38, border: 'double', ink: '#047857',
    top: 'GREEN CROSS PHARMACY', bottom: 'D.L. 20B/KL/1123', arcSize: 2.4, bottomSize: 2.2,
    center: [
      { text: 'Rx', size: 6.0, dy: -1.6 },
      { text: 'PHARMACIST', size: 2.0, dy: 3.6, spacing: 0.4 },
    ],
    tags: ['pharmacy', 'medical store', 'chemist', 'drug licence', 'rx'],
  }),
  roundSeal({
    id: 'template-pro-lab-verified',
    title: 'Diagnostic Lab Verified Seal',
    description: '32 mm diagnostic laboratory report verification seal.',
    category: 'medical', diameter: 32, border: 'single', innerDotted: true, ink: '#0e7490',
    top: 'CITY DIAGNOSTICS', bottom: 'REPORT VERIFIED', arcSize: 2.2,
    center: [
      { name: 'shield-check', size: 6.5, dy: -1.2 },
      { text: 'LAB', size: 2.0, dy: 3.8, spacing: 0.5 },
    ],
    tags: ['lab', 'diagnostics', 'report', 'verified', 'pathology'],
  }),
  roundSeal({
    id: 'template-pro-family-monogram-checkered',
    title: 'Family Initial Monogram',
    description: '34 mm family monogram with checkered border and serif initial.',
    category: 'monogram', diameter: 34, border: 'checkered', teeth: 40, font: 'Georgia, serif',
    top: 'THE SHARMA FAMILY', bottom: 'EST. 1998', arcSize: 2.4, arcSpacing: 0.5,
    center: [{ text: 'S', size: 9.0, dy: 0.3 }],
    tags: ['family', 'monogram', 'initial', 'crest', 'gift'],
    isPremium: true,
  }),
  roundSeal({
    id: 'template-pro-thank-you-daisy',
    title: '“Thank You” Packaging Seal',
    description: '32 mm daisy-border thank-you stamp for packaging, bags and cards.',
    category: 'company', diameter: 32, border: 'daisy', teeth: 28, ink: '#be185d',
    top: 'THANK YOU', bottom: 'FOR SHOPPING WITH US', arcSize: 2.4, bottomSize: 2.0, arcSpacing: 0.5,
    center: [
      { name: 'star-five-point', size: 3.2, dy: -3.4 },
      { text: 'LUNA', size: 4.0, dy: 0.6, spacing: 0.4 },
      { text: 'BOUTIQUE', size: 1.9, dy: 3.8, spacing: 0.4 },
    ],
    tags: ['thank you', 'packaging', 'boutique', 'small business', 'gift'],
  }),
  roundSeal({
    id: 'template-pro-handmade-diamond',
    title: '“Handmade” Craft Seal',
    description: '30 mm handmade / crafted-with-love seal with diamond border.',
    category: 'company', diameter: 30, border: 'diamond', teeth: 30, ink: '#7c2d12',
    top: 'HANDMADE', bottom: 'WITH LOVE', arcSize: 2.3, arcSpacing: 0.6,
    center: [
      { text: 'KALA', size: 3.6, dy: -0.9, spacing: 0.3 },
      { text: 'CRAFTS', size: 1.9, dy: 2.4, spacing: 0.5 },
    ],
    tags: ['handmade', 'craft', 'artisan', 'packaging', 'small business'],
  }),

  // ───────────── COLLECTION 2 · RECTANGULAR / SQUARE ─────────────
  rectStamp({
    id: 'template-pro-doctor-name-rect',
    title: 'Doctor Name Stamp (4913)',
    description: '58×22 mm doctor name and registration stamp for prescriptions.',
    category: 'medical', w: 58, h: 22, frame: 'single', radius: 1.2,
    lines: [
      { text: 'Dr. ANIL KUMAR', size: 3.4, y: 5.0, spacing: 0.2 },
      { text: 'MBBS, MD (General Medicine)', size: 2.3, y: 9.6, weight: '600' },
      { text: 'Consultant Physician', size: 2.2, y: 13.2, weight: '500' },
      { text: 'Reg. No. TCMC 45213', size: 2.2, y: 17.0, weight: '600' },
    ],
    tags: ['doctor', 'prescription', 'name stamp', 'medical', 'registration'],
  }),
  rectStamp({
    id: 'template-pro-deposit-endorsement',
    title: 'Bank Deposit Endorsement',
    description: '58×22 mm "For Deposit Only" cheque endorsement stamp.',
    category: 'company', w: 58, h: 22, frame: 'double', radius: 1,
    rules: [8.4],
    lines: [
      { text: 'FOR DEPOSIT ONLY', size: 3.2, y: 5.4, spacing: 0.4 },
      { text: 'SUNRISE TRADERS', size: 2.5, y: 11.3 },
      { text: 'HDFC BANK • A/C 5010 0123 4567', size: 2.0, y: 14.8, weight: '600' },
      { text: 'Authorised Signatory', size: 1.9, y: 18.0, weight: '500' },
    ],
    tags: ['bank', 'deposit', 'cheque', 'endorsement', 'accounts'],
  }),
  rectStamp({
    id: 'template-pro-ship-to-label',
    title: '“Ship To” Address Label',
    description: '70×34 mm shipping label stamp with address lines.',
    category: 'address', w: 70, h: 34, frame: 'double', radius: 1.5,
    rules: [9.5],
    lines: [
      { text: 'SHIP TO', size: 4.0, y: 6.1, spacing: 0.8 },
      { field: 'NAME', size: 2.4, y: 14.0 },
      { field: 'ADDRESS', size: 2.4, y: 18.8 },
      { field: 'CITY', size: 2.4, y: 23.6 },
      { field: 'PIN / PH', size: 2.4, y: 28.4 },
    ],
    tags: ['shipping', 'ship to', 'courier', 'address', 'label'],
  }),
  rectStamp({
    id: 'template-pro-scanned-date',
    title: '“Scanned” Date Stamp',
    description: '40×20 mm document scanned stamp with date and initials.',
    category: 'date', w: 40, h: 20, frame: 'single', radius: 1, ink: '#1d4ed8',
    rules: [8],
    lines: [
      { text: 'SCANNED', size: 3.6, y: 4.9, spacing: 0.6 },
      { field: 'DATE', size: 2.0, y: 11.6 },
      { field: 'BY', size: 2.0, y: 15.4 },
    ],
    tags: ['scanned', 'digitized', 'date', 'office', 'records'],
  }),
  rectStamp({
    id: 'template-pro-inward-register',
    title: 'Inward Register Stamp',
    description: '50×30 mm inward / tapal register stamp with number, date and section.',
    category: 'date', w: 50, h: 30, frame: 'double', radius: 1.2,
    rules: [9.2],
    lines: [
      { text: 'INWARD', size: 4.2, y: 5.9, spacing: 0.8 },
      { field: 'No.', size: 2.2, y: 13.6 },
      { field: 'Date', size: 2.2, y: 18.2 },
      { field: 'Section', size: 2.2, y: 22.8 },
    ],
    tags: ['inward', 'tapal', 'register', 'government', 'office'],
  }),
  rectStamp({
    id: 'template-pro-duplicate-bold',
    title: '“Duplicate” Copy Stamp',
    description: '40×14 mm bold duplicate copy marker.',
    category: 'office', w: 40, h: 14, frame: 'bold', radius: 1, ink: '#b91c1c',
    lines: [{ text: 'DUPLICATE', size: 4.4, y: 7.0, spacing: 0.6 }],
    tags: ['duplicate', 'copy', 'office', 'records'],
  }),
  rectStamp({
    id: 'template-pro-original-square',
    title: '“Original” Verification Square',
    description: '35×35 mm square stamp marking a document as the verified original.',
    category: 'office', w: 35, h: 35, frame: 'bold', radius: 1.5,
    rules: [13.2, 21.8],
    lines: [
      { text: 'CERTIFIED', size: 2.4, y: 8.6, spacing: 0.6 },
      { text: 'ORIGINAL', size: 4.4, y: 17.5, spacing: 0.3 },
      { field: 'VERIFIED BY', size: 2.0, y: 27.0 },
    ],
    shape: 'SQUARE',
    tags: ['original', 'certified', 'verified', 'square', 'document'],
  }),
  rectStamp({
    id: 'template-pro-approved-signature',
    title: '“Approved” Signature Block',
    description: '50×24 mm approval stamp with signature and date lines.',
    category: 'office', w: 50, h: 24, frame: 'double', radius: 1.2, ink: '#15803d',
    rules: [9.4],
    lines: [
      { text: 'APPROVED', size: 4.4, y: 6.0, spacing: 0.8 },
      { field: 'SIGN', size: 2.2, y: 13.8 },
      { field: 'DATE', size: 2.2, y: 18.4 },
    ],
    tags: ['approved', 'signature', 'sign off', 'office', 'workflow'],
  }),

  // ───────────── COLLECTION 3 · NEW FONT SHOWCASE ─────────────
  roundSeal({
    id: 'template-pro-ayurveda-clinic',
    title: 'Ayurveda Clinic Seal',
    description: '40 mm Ayurveda clinic seal in Roman-inscription lettering with divider rules.',
    category: 'medical', diameter: 40, border: 'double', ink: '#166534', font: "'Marcellus', serif",
    top: 'SREE DHANWANTHARI AYURVEDA', bottom: 'THRISSUR • EST. 1985', arcSize: 2.4, bottomSize: 2.3,
    center: [
      { rule: -3.2 },
      { text: 'AYURVEDA', size: 3.4, dy: -0.6, spacing: 0.4 },
      { text: 'Panchakarma Centre', size: 3.0, dy: 2.8, weight: '400', font: "'Parisienne', cursive" },
      { rule: 5.4 },
    ],
    tags: ['ayurveda', 'clinic', 'kerala', 'wellness', 'medical'],
  }),
  roundSeal({
    id: 'template-pro-script-wedding',
    title: 'Script Wedding Seal',
    description: '42 mm wedding seal with calligraphy couple names and dotted inner ring.',
    category: 'monogram', diameter: 42, border: 'blossom', teeth: 40, ink: '#9f1239', font: "'Cinzel', Georgia, serif",
    top: 'TOGETHER FOREVER', bottom: '12 • 12 • 2026', arcSize: 2.5, arcSpacing: 0.7, innerDotted: true,
    center: [
      { text: 'Anna', size: 5.2, dy: -4.0, weight: '400', font: "'Great Vibes', cursive" },
      { text: '&', size: 2.2, dy: 0, weight: '400', font: "'Cinzel', Georgia, serif" },
      { text: 'Joel', size: 5.2, dy: 3.4, weight: '400', font: "'Great Vibes', cursive" },
    ],
    tags: ['wedding', 'script', 'calligraphy', 'couple', 'invitation'],
    isPremium: true,
  }),
  roundSeal({
    id: 'template-pro-filter-coffee-rye',
    title: 'Filter Coffee Western Seal',
    description: '40 mm vintage western-style coffee seal with rope border.',
    category: 'company', diameter: 40, border: 'rope', teeth: 48, ink: '#7c2d12', font: "'Rye', cursive",
    top: 'MALABAR COFFEE CO.', bottom: 'ROASTED IN KERALA', arcSize: 2.3, arcSpacing: 0.4,
    center: [
      { text: 'FILTER', size: 3.0, dy: -2.6, spacing: 0.3 },
      { text: 'KAAPI', size: 4.4, dy: 1.4, spacing: 0.2 },
    ],
    tags: ['coffee', 'cafe', 'kerala', 'vintage', 'western', 'packaging'],
  }),
  roundSeal({
    id: 'template-pro-gym-stencil',
    title: 'Gym / Fitness Stencil Seal',
    description: '40 mm bold stencil-type gym and fitness seal with serrated border.',
    category: 'company', diameter: 40, border: 'serrated', teeth: 60, ink: '#111827', font: "'Black Ops One', sans-serif",
    top: 'IRON FORGE FITNESS', bottom: 'NO PAIN • NO GAIN', arcSize: 2.6, bottomSize: 2.3, arcSpacing: 0.4, sideStars: true,
    center: [
      { text: 'EST', size: 2.0, dy: -3.4, spacing: 0.6 },
      { text: '2024', size: 5.0, dy: 0.6, spacing: 0.2 },
    ],
    tags: ['gym', 'fitness', 'sports', 'stencil', 'bold', 'brand'],
  }),
  roundSeal({
    id: 'template-pro-ex-libris-blackletter',
    title: 'Ex Libris Blackletter Seal',
    description: '38 mm book-owner seal with a blackletter initial and old-print lettering.',
    category: 'monogram', diameter: 38, border: 'beaded', teeth: 44, ink: '#1e3a8a', font: "'IM Fell English SC', serif",
    top: 'EX LIBRIS', bottom: 'FROM THE LIBRARY OF', arcSize: 2.6, bottomSize: 2.2, arcSpacing: 0.8,
    center: [
      { text: 'R', size: 9.5, dy: -0.8, weight: '400', font: "'UnifrakturMaguntia', cursive" },
      { text: 'Rahul Varma', size: 2.0, dy: 4.6, weight: '400', font: "'IM Fell English SC', serif" },
    ],
    tags: ['ex libris', 'library', 'book', 'vintage', 'blackletter', 'monogram'],
    isPremium: true,
  }),
  roundSeal({
    id: 'template-pro-malabar-restaurant',
    title: 'Restaurant Poster-Serif Seal',
    description: '42 mm restaurant / catering seal with bold poster-serif center.',
    category: 'company', diameter: 42, border: 'double', ink: '#b45309', font: "'Libre Baskerville', serif",
    top: 'TASTE OF MALABAR', bottom: 'KOZHIKODE • SINCE 1998', arcSize: 2.4, bottomSize: 2.2, sideStars: true,
    center: [
      { text: 'Biryani', size: 5.2, dy: -1.2, weight: '400', font: "'Abril Fatface', serif" },
      { text: 'HOUSE', size: 2.4, dy: 3.2, spacing: 0.9 },
    ],
    tags: ['restaurant', 'food', 'catering', 'malabar', 'biryani', 'brand'],
  }),

  // ───────────── COLLECTION 3 · RECTANGULAR (incl. Malayalam / Hindi) ─────────────
  rectStamp({
    id: 'template-pro-paid-malayalam',
    title: 'Paid Stamp — English + Malayalam',
    description: '50×22 mm bilingual paid stamp (English / Malayalam).',
    category: 'office', w: 50, h: 22, frame: 'bold', radius: 1.2, ink: '#b91c1c',
    rules: [11.4],
    lines: [
      { text: 'PAID', size: 5.2, y: 6.9, spacing: 1.2 },
      { text: 'പണം അടച്ചു', size: 3.4, y: 15.6, weight: '700', font: "'Noto Sans Malayalam', sans-serif" },
    ],
    tags: ['paid', 'malayalam', 'bilingual', 'kerala', 'accounts'],
  }),
  rectStamp({
    id: 'template-pro-received-malayalam',
    title: 'Received Stamp — English + Malayalam',
    description: '55×30 mm bilingual received stamp with date and sign fields.',
    category: 'date', w: 55, h: 30, frame: 'double', radius: 1.2, ink: '#1e3a8a',
    rules: [10.2],
    lines: [
      { text: 'RECEIVED • ലഭിച്ചു', size: 3.4, y: 6.0, weight: '700', font: "'Baloo Chettan 2', sans-serif" },
      { field: 'DATE / തീയതി', size: 2.1, y: 15.0, font: "'Noto Sans Malayalam', sans-serif" },
      { field: 'SIGN / ഒപ്പ്', size: 2.1, y: 21.0, font: "'Noto Sans Malayalam', sans-serif" },
    ],
    tags: ['received', 'malayalam', 'bilingual', 'kerala', 'office', 'date'],
  }),
  rectStamp({
    id: 'template-pro-paid-hindi',
    title: 'Paid Stamp — English + Hindi',
    description: '50×22 mm bilingual paid stamp (English / Hindi).',
    category: 'office', w: 50, h: 22, frame: 'bold', radius: 1.2, ink: '#15803d',
    rules: [11.4],
    lines: [
      { text: 'PAID', size: 5.2, y: 6.9, spacing: 1.2 },
      { text: 'भुगतान किया गया', size: 3.2, y: 15.6, weight: '700', font: "'Noto Sans Devanagari', sans-serif" },
    ],
    tags: ['paid', 'hindi', 'bilingual', 'india', 'accounts'],
  }),
  rectStamp({
    id: 'template-pro-typewriter-confidential',
    title: 'Typewriter “Confidential” Stamp',
    description: '55×20 mm vintage typewriter-style confidential stamp.',
    category: 'office', w: 55, h: 20, frame: 'double', radius: 0.8, ink: '#991b1b', font: "'Special Elite', cursive",
    lines: [
      { text: 'CONFIDENTIAL', size: 4.6, y: 8.2, weight: '400', spacing: 0.5 },
      { text: 'Do not copy or distribute', size: 2.1, y: 13.6, weight: '400' },
    ],
    tags: ['confidential', 'typewriter', 'vintage', 'office', 'secret'],
  }),
  rectStamp({
    id: 'template-pro-signature-block',
    title: 'Signature Block (Script Name)',
    description: '58×24 mm authorised signatory block with a real-signature script name.',
    category: 'company', w: 58, h: 24, frame: 'single', radius: 1, ink: '#1e3a8a', font: "'Manrope', sans-serif",
    rules: [14.8],
    lines: [
      { text: 'For SUNRISE TRADERS', size: 2.6, y: 4.6, weight: '700' },
      { text: 'Arjun Menon', size: 6.4, y: 10.6, weight: '400', font: "'Herr Von Muellerhoff', cursive" },
      { text: 'AUTHORISED SIGNATORY', size: 2.0, y: 18.4, weight: '700', spacing: 0.4 },
    ],
    tags: ['signature', 'signatory', 'company', 'script', 'authorised'],
  }),
  rectStamp({
    id: 'template-pro-dater-numbering',
    title: 'Numbering / Dater Stamp',
    description: '50×20 mm typewriter-mono dater stamp with invoice number field.',
    category: 'date', w: 50, h: 20, frame: 'single', radius: 1, ink: '#1d4ed8', font: "'Courier Prime', monospace",
    rules: [8.2],
    lines: [
      { text: 'DATE  04 NOV 2026', size: 3.2, y: 4.9, weight: '700', spacing: 0.2 },
      { field: 'INVOICE NO.', size: 2.1, y: 12.4 },
      { field: 'CHECKED BY', size: 2.1, y: 16.4 },
    ],
    tags: ['dater', 'date', 'numbering', 'invoice', 'typewriter', 'mono'],
  }),

  // ───────────── COLLECTION 4 · ESSENTIALS ─────────────
  roundSeal({
    id: 'template-pro-ca-firm-seal',
    title: 'Chartered Accountants Firm Seal',
    description: '40 mm CA firm seal with firm registration number and partner designation.',
    category: 'office', diameter: 40, border: 'double', ink: '#1e3a8a', font: "'Manrope', sans-serif",
    top: 'MENON & ASSOCIATES', bottom: 'FRN 012345S • KOCHI', arcSize: 2.5, bottomSize: 2.2, sideStars: true,
    center: [
      { text: 'CHARTERED', size: 2.4, dy: -1.7, spacing: 0.4 },
      { text: 'ACCOUNTANTS', size: 2.4, dy: 1.7, spacing: 0.4 },
    ],
    tags: ['ca', 'chartered accountant', 'firm', 'audit', 'frn', 'office'],
  }),
  roundSeal({
    id: 'template-pro-panchayat-seal',
    title: 'Grama Panchayat Office Seal',
    description: '45 mm local-body office seal with Malayalam-ready designation and district.',
    category: 'office', diameter: 45, border: 'serrated', teeth: 70, ink: '#1e3a8a', font: "'Marcellus', serif",
    top: 'KADAMAKKUDY GRAMA PANCHAYAT', bottom: 'ERNAKULAM DISTRICT', arcSize: 2.4, bottomSize: 2.3,
    center: [
      { name: 'star-five-point', size: 4.0, dy: -4.4 },
      { text: 'SECRETARY', size: 3.0, dy: 0, spacing: 0.4 },
      { text: 'സെക്രട്ടറി', size: 2.6, dy: 3.8, weight: '700', font: "'Noto Sans Malayalam', sans-serif" },
    ],
    tags: ['panchayat', 'government', 'local body', 'malayalam', 'secretary', 'kerala'],
  }),
  roundSeal({
    id: 'template-pro-real-estate-seal',
    title: 'Real Estate Consultant Seal',
    description: '38 mm property consultant / builder seal with RERA registration.',
    category: 'company', diameter: 38, border: 'double', ink: '#0f766e', font: "'Sora', sans-serif",
    top: 'GREENLEAF PROPERTIES', bottom: 'RERA K-RERA/AG/0451', arcSize: 2.3, bottomSize: 2.0,
    center: [
      { text: 'REAL', size: 3.0, dy: -2.2, spacing: 0.5 },
      { text: 'ESTATE', size: 3.0, dy: 1.6, spacing: 0.5 },
    ],
    tags: ['real estate', 'property', 'builder', 'rera', 'consultant'],
  }),
  rectStamp({
    id: 'template-pro-cancelled-bold',
    title: '“Cancelled” Bold Stamp',
    description: '45×16 mm bold cancelled stamp for invoices, cheques and forms.',
    category: 'office', w: 45, h: 16, frame: 'bold', radius: 1, ink: '#b91c1c', font: "'Black Ops One', sans-serif",
    lines: [{ text: 'CANCELLED', size: 5.0, y: 8.0, weight: '400', spacing: 0.6 }],
    tags: ['cancelled', 'void', 'office', 'invoice', 'cheque'],
  }),
  rectStamp({
    id: 'template-pro-gst-invoice-paid',
    title: 'GST Invoice Paid Stamp',
    description: '58×28 mm paid stamp with mode of payment, reference and date fields.',
    category: 'company', w: 58, h: 28, frame: 'double', radius: 1.2, ink: '#15803d', font: "'Manrope', sans-serif",
    rules: [9.4],
    lines: [
      { text: 'PAYMENT RECEIVED', size: 3.6, y: 5.9, weight: '800', spacing: 0.4 },
      { field: 'MODE', size: 2.1, y: 13.4 },
      { field: 'REF. NO.', size: 2.1, y: 18.2 },
      { field: 'DATE', size: 2.1, y: 23.0 },
    ],
    tags: ['paid', 'payment', 'gst', 'invoice', 'received', 'accounts'],
  }),
];
