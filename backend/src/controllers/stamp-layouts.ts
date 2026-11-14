/**
 * Category layouts — how a professional stamp designer lays out each kind of stamp.
 *
 * The AI describes a new stamp as a small "design spec" (category, size, and each text in its
 * role); this file turns that into exact, balanced, print-safe elements. Every size is in real
 * millimetres and follows the shop rules: text ≥ 2 mm, lines ≥ 0.3 mm, ~1 mm gaps, centred and
 * symmetric. Text is sized to FIT (long names get smaller / condensed type, never squeezed).
 */

import { arcCharRatio } from './ai-elements';

export type StampCategory = 'company_seal' | 'business' | 'signature' | 'office' | 'logo' | 'other';

export interface DesignSpec {
  category?: StampCategory | string;
  shape?: 'ROUND' | 'OVAL' | 'RECTANGULAR' | 'SQUARE' | string;
  widthMm?: number;
  heightMm?: number;
  inkColor?: string;
  // seals
  topText?: string;
  bottomText?: string;
  centerLines?: string[];
  // rectangular stamps: lines top → bottom (first = main name)
  lines?: string[];
  // signature stamps
  forText?: string; // "For SUNRISE TRADERS"
  designation?: string; // "Authorised Signatory"
  // office stamps
  statusWord?: string; // PAID, RECEIVED, APPROVED…
  withDate?: boolean;
  withSignature?: boolean;
  extraLine?: string; // e.g. company name under the word
  // ── design decisions made by the AI, applied exactly by the engine ──
  fontStyle?: 'modern' | 'classic' | 'condensed' | string; // names / headings (small detail lines stay clean sans)
  border?: 'double' | 'single' | 'dotted' | 'serrated' | 'none' | string;
  decoration?: 'stars' | 'none' | string; // seals: stars between top and bottom text
}

export interface BuiltDesign {
  shape: 'ROUND' | 'OVAL' | 'RECTANGULAR' | 'SQUARE';
  widthMm: number;
  heightMm: number;
  inkColor: string;
  elements: any[];
}

const SANS = 'Montserrat, Arial, sans-serif';
const CONDENSED = "'Oswald', Arial, sans-serif";
const IMPACT = "'Bebas Neue', Impact, sans-serif";
const r2 = (v: number) => Math.round(v * 100) / 100;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const clean = (s?: string) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '');
let seq = 0;
const id = (p: string) => `${p}-${Date.now().toString(36)}${(seq++).toString(36)}`;

/** about how wide a line of text is (mm) — average letter ≈ 0.62 × size (+ letter spacing) */
const textWidth = (text: string, size: number, spacing = 0, ratio = 0.62) => Array.from(text).length * (size * ratio + spacing);
/** biggest text size (mm) so `text` fits in `space` mm, within [min, max] */
const fitSize = (text: string, space: number, min: number, max: number, spacing = 0, ratio = 0.62) => {
  const n = Math.max(1, Array.from(text).length);
  return r2(clamp((space - n * spacing) / (n * ratio), min, max));
};

const STATUS_INK: Record<string, string> = {
  PAID: '#c1121f', REJECTED: '#c1121f', URGENT: '#c1121f', CONFIDENTIAL: '#c1121f', CANCELLED: '#c1121f', OVERDUE: '#c1121f',
  APPROVED: '#15803d', VERIFIED: '#15803d', CHECKED: '#15803d', COMPLETED: '#15803d', PASSED: '#15803d',
  RECEIVED: '#1d4ed8', DISPATCHED: '#1d4ed8', ENTERED: '#1d4ed8', POSTED: '#1d4ed8', DELIVERED: '#1d4ed8',
};

// ── Company seal / logo stamp (round or oval) ──
/** Perimeter of an ellipse (Ramanujan) — for a circle 2πr. */
const ellipsePerimeter = (a: number, b: number) => Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
/** Bold capitals in the stamp fonts are wider than average letters: width ratio per font. */
const BOLD_CAPS = 0.7, BOLD_CAPS_CONDENSED = 0.54;
/** Length of curved text exactly as the editor spaces it (its own letter table, any font). */
const arcLen = (text: string, f: number, ls: number) => Array.from(text).reduce((s, c) => s + arcCharRatio(c) * f + ls, 0);

function companySeal(spec: DesignSpec, forLogo: boolean): BuiltDesign {
  const oval = String(spec.shape).toUpperCase() === 'OVAL';
  // no size given: the standard size where the name stays comfortably readable (≥ 2.6 mm) —
  // a long name gets a 45 / 50 mm seal instead of tiny letters
  const topRaw = clean(spec.topText).toUpperCase(), botRaw = clean(spec.bottomText).toUpperCase();
  const fitsAt = (w: number) => {
    const h = oval ? w * 0.66 : w;
    const R = ellipsePerimeter(w / 2 - 4.5, h / 2 - 4.5) / (2 * Math.PI);
    return arcLen(topRaw, 2.6, 0.2) <= R * ((200 * Math.PI) / 180) && arcLen(botRaw, 2.6, 0.2) <= R * ((110 * Math.PI) / 180);
  };
  const autoW = (oval ? [50, 55, 60] : [40, 45, 50]).find(fitsAt) ?? (oval ? 60 : 50);
  const W = clamp(Number(spec.widthMm) || autoW, 25, 80);
  const H = oval ? clamp(Number(spec.heightMm) || W * 0.66, 18, 60) : W;
  const cx = W / 2, cy = H / 2;
  // every ring is an ellipse with its own width & height radius (a round seal: both equal) — an
  // oval seal uses the WHOLE oval, not a circle squeezed into it
  const AX = W / 2, AY = H / 2;
  let top = clean(spec.topText).toUpperCase();
  const bottom = clean(spec.bottomText).toUpperCase();
  const center = (spec.centerLines || []).map(clean).filter(Boolean).slice(0, 3);
  // curve "radius" for text fitting = the radius of a circle with the same length as the ellipse
  const effR = (inset: number) => ellipsePerimeter(AX - inset, AY - inset) / (2 * Math.PI);

  // A name too long for the top curve even in small condensed type: move its last words into the
  // centre (e.g. "…DEVELOPMENT BANK LTD" → top "…DEVELOPMENT", centre "BANK LTD")
  {
    const room = effR(0.8 + 1.4 + 1.0 + 1.0) * ((210 * Math.PI) / 180);
    const moved: string[] = [];
    while (top.includes(' ') && arcLen(top, 2, 0.15) > room) {
      const sp = top.lastIndexOf(' ');
      moved.unshift(top.slice(sp + 1));
      top = top.slice(0, sp);
    }
    if (moved.length) center.unshift(moved.join(' '));
  }

  const els: any[] = [];
  const ring = (name: string, inset: number, sw: number) =>
    oval
      ? { id: id('oval'), type: 'oval', name, cx, cy, rx: r2(AX - inset), ry: r2(AY - inset), strokeWidth: sw, strokeType: 'solid' }
      : { id: id('ring'), type: 'ring', name, cx, cy, radius: r2(AX - inset), strokeWidth: sw, strokeType: 'solid' };
  // double border: outer 1 mm, inner thin ring 1.4 mm inside it
  const outerInset = 0.8, innerInset = 2.2;
  els.push(ring('Outer border', outerInset, 1));
  els.push(ring('Inner border', innerInset, 0.4));

  // curved text: top may use up to ~200° of the curve, bottom ~110° — that leaves a clear gap on
  // each side for a star. Top & bottom share one size; a long name gets condensed / smaller, never overlaps.
  let spacing = 0.25;
  const TOP_MAX = (200 * Math.PI) / 180, BOTTOM_MAX = (110 * Math.PI) / 180;
  const textInset = (f: number) => innerInset + 1.0 + f / 2;
  const fitBoth = (ratio: number) => {
    let f = 3.6;
    for (; f > 2; f = r2(f - 0.05)) {
      const R = effR(textInset(f));
      const okTop = !top || arcLen(top, f, spacing) <= R * TOP_MAX;
      const okBot = !bottom || arcLen(bottom, f, spacing) <= R * BOTTOM_MAX;
      if (okTop && okBot) break;
    }
    return f;
  };
  let f = fitBoth(BOLD_CAPS);
  if (top && arcLen(top, f, spacing) > effR(textInset(f)) * TOP_MAX) {
    spacing = 0.1; // last resort: tighter letters
    f = fitBoth(BOLD_CAPS);
  }
  // small or tightly spaced curved capitals: condensed letters so neighbours never touch
  const font = f <= 2.4 || spacing < 0.2 ? CONDENSED : SANS;
  const tx = r2(AX - textInset(f)), ty = r2(AY - textInset(f));
  const textR = r2(oval ? (tx + ty) / 2 : tx);
  const arcGeom = oval ? { radius: textR, rx: tx, ry: ty } : { radius: textR };
  if (top) els.push({ id: id('arc'), type: 'arc-text', name: 'Top text', text: top, cx, cy, ...arcGeom, startAngle: -150, sweepAngle: 300, fontSize: f, fontFamily: font, fontWeight: 'bold', letterSpacing: spacing, isReversed: false });
  if (bottom) els.push({ id: id('arc'), type: 'arc-text', name: 'Bottom text', text: bottom, cx, cy, ...arcGeom, startAngle: 30, sweepAngle: 120, fontSize: f, fontFamily: font, fontWeight: 'bold', letterSpacing: spacing, isReversed: true });

  // stars in the middle of the two gaps between top and bottom text (a mirrored pair), on the curve
  if (top && bottom) {
    const R = effR(textInset(f));
    const topAng = arcLen(top, f, spacing) / R;
    const botAng = arcLen(bottom, f, spacing) / R;
    const gap = (2 * Math.PI - topAng - botAng) / 2;
    if (gap > 0.2) {
      const s = r2(clamp(Math.min(f * 0.75, R * gap * 0.5), 1.4, 2.6));
      const a = -Math.PI / 2 - topAng / 2 - gap / 2; // left gap (screen angles, 0 = right, −π/2 = top)
      const sx = r2(tx * Math.cos(a)), sy = r2(ty * Math.sin(a));
      els.push({ id: id('star'), type: 'clipart', name: 'star-five-point', cx: r2(cx + sx), cy: r2(cy + sy), width: s, height: s, size: s });
      els.push({ id: id('star'), type: 'clipart', name: 'star-five-point', cx: r2(cx - sx), cy: r2(cy + sy), width: s, height: s, size: s });
    }
  }

  // centre ring just inside the curved text, then the centre lines stacked around the middle
  const centreInset = textInset(f) + f / 2 + 1.0;
  const crx = AX - centreInset, cry = AY - centreInset;
  if (Math.min(crx, cry) > 5) els.push(ring('Centre ring', centreInset, 0.4));
  if (!forLogo && center.length) {
    // each line must fit the centre area: normal font → condensed → split in two at a space
    const usableW = (crx - 1.2) * 2;
    const rows: Array<{ text: string; size: number; font: string; bold: boolean }> = [];
    center.forEach((raw, i) => {
      const t = raw.toUpperCase();
      const max = i === 0 ? 3.2 : 2.6;
      const room = usableW * 0.86;
      if (textWidth(t, 2, 0.1, BOLD_CAPS) <= room) rows.push({ text: t, size: fitSize(t, room, 2, max, 0.1, BOLD_CAPS), font: SANS, bold: i === 0 });
      else if (textWidth(t, 2, 0.1, BOLD_CAPS_CONDENSED) <= room) rows.push({ text: t, size: fitSize(t, room, 2, max, 0.1, BOLD_CAPS_CONDENSED), font: CONDENSED, bold: i === 0 });
      else {
        const sp = t.lastIndexOf(' ', Math.ceil(t.length / 2)) > 0 ? t.lastIndexOf(' ', Math.ceil(t.length / 2)) : t.indexOf(' ');
        const parts = sp > 0 ? [t.slice(0, sp), t.slice(sp + 1)] : [t];
        for (const p of parts) rows.push({ text: p, size: fitSize(p, room, 2, max, 0.1, BOLD_CAPS_CONDENSED), font: CONDENSED, bold: i === 0 });
      }
    });
    // the block must also fit the centre area's HEIGHT (an oval is flatter): close up, then shrink
    const list = rows.slice(0, 4);
    const roomH = (cry - 1.0) * 2;
    let k = 1.35;
    const sum = list.reduce((a, r) => a + r.size, 0);
    if (sum * k > roomH) k = Math.max(1.15, roomH / sum);
    if (sum * k > roomH) { const s = roomH / (sum * k); list.forEach((r) => (r.size = r2(Math.max(2, r.size * s)))); }
    const gaps = list.map((r) => r.size * k);
    const total = gaps.reduce((a, b) => a + b, 0);
    let y = cy - total / 2;
    list.forEach((r, i) => {
      els.push({ id: id('text'), type: 'text', name: `Centre line ${i + 1}`, text: r.text, x: cx, y: r2(y + gaps[i] / 2), fontSize: r.size, fontFamily: r.font, fontWeight: r.bold ? 'bold' : 'normal', align: 'center', letterSpacing: 0.1 });
      y += gaps[i];
    });
  }
  // (an empty centre stays empty — no decoration the user didn't ask for)

  return { shape: oval ? 'OVAL' : 'ROUND', widthMm: r2(W), heightMm: r2(H), inkColor: spec.inkColor || '#1e3a8a', elements: els };
}

// ── Rectangular stack of lines (business / address / generic) ──
function lineStack(lines: string[], spec: DesignSpec, opts: { boldFirst: boolean; border: boolean }): BuiltDesign {
  const items = lines.map(clean).filter(Boolean).slice(0, 7);
  // pick a standard size that keeps every line ≥ 2 mm
  const presets: Array<[number, number]> = items.length <= 3 ? [[47, 18], [58, 22], [70, 25]] : items.length <= 5 ? [[58, 22], [60, 30], [70, 35]] : [[60, 33], [70, 38], [80, 45]];
  let [W, H] = spec.widthMm && spec.heightMm ? [Number(spec.widthMm), Number(spec.heightMm)] : presets[0];
  const layout = (w: number, h: number) => {
    const inner = w - 4; // 2 mm side margins
    const raw = items.map((t, i) => fitSize(t, inner, 1.2, i === 0 && opts.boldFirst ? 4 : 3, 0, i === 0 && opts.boldFirst ? 0.66 : 0.6));
    // all detail lines share one size (the one that fits the longest) — a clean, even block
    const detail = Math.min(...raw.slice(opts.boldFirst ? 1 : 0));
    const sizes = raw.map((s, i) => (opts.boldFirst && i === 0 ? Math.max(s, Number.isFinite(detail) ? detail : s) : detail));
    const total = sizes.reduce((a, s) => a + s * 1.32, 0);
    return { sizes, total, fits: total <= h - 3 && sizes.every((s) => s >= 2) };
  };
  let res = layout(W, H);
  if (!res.fits && !(spec.widthMm && spec.heightMm)) {
    for (const [w, h] of presets.slice(1)) {
      res = layout(w, h);
      W = w; H = h;
      if (res.fits) break;
    }
  }
  // if the height is the limit, shrink line spacing evenly
  const scale = Math.min(1, (H - 3) / res.total);
  const els: any[] = [];
  if (opts.border) els.push({ id: id('rect'), type: 'rect', name: 'Border', x: 0.6, y: 0.6, width: r2(W - 1.2), height: r2(H - 1.2), rx: 0.8, ry: 0.8, strokeWidth: 0.6, strokeType: 'solid' });
  let y = H / 2 - (res.total * scale) / 2;
  items.forEach((t, i) => {
    const s = clamp(res.sizes[i] * Math.min(1, scale + 0.08), 2, 4);
    const step = res.sizes[i] * 1.32 * scale;
    els.push({ id: id('text'), type: 'text', name: i === 0 ? 'Name' : `Line ${i + 1}`, text: t, x: r2(W / 2), y: r2(y + step / 2), fontSize: r2(s), fontFamily: SANS, fontWeight: i === 0 && opts.boldFirst ? 'bold' : 'normal', align: 'center', letterSpacing: i === 0 ? 0.1 : 0 });
    y += step;
  });
  return { shape: 'RECTANGULAR', widthMm: W, heightMm: H, inkColor: spec.inkColor || '#1e3a8a', elements: els };
}

// ── Signature (authorised signatory) stamp ──
function signatureStamp(spec: DesignSpec): BuiltDesign {
  const W = clamp(Number(spec.widthMm) || 50, 35, 80);
  const H = clamp(Number(spec.heightMm) || 25, 15, 40);
  const company = clean(spec.forText) || clean((spec.lines || [])[0]);
  // a signatory block always reads "For <COMPANY>"
  const forText = company && !/^for\b/i.test(company) ? `For ${company}` : company;
  const designation = clean(spec.designation) || 'Authorised Signatory';
  const els: any[] = [];
  const fTop = fitSize(forText, W - 4, 2.2, 3.4, 0, 0.64);
  const fBot = fitSize(designation, W - 6, 2.0, 2.8);
  if (forText) els.push({ id: id('text'), type: 'text', name: 'For company', text: forText, x: r2(W / 2), y: r2(1.6 + fTop / 2), fontSize: fTop, fontFamily: SANS, fontWeight: 'bold', align: 'center', letterSpacing: 0.05 });
  // clear signing space in between (≥ 8 mm), then a thin line and the designation
  const lineY = r2(H - 2.2 - fBot - 0.6);
  els.push({ id: id('line'), type: 'line', name: 'Signature line', x1: r2(W * 0.2), y1: lineY, x2: r2(W * 0.8), y2: lineY, strokeWidth: 0.3, strokeType: 'solid' });
  els.push({ id: id('text'), type: 'text', name: 'Designation', text: designation, x: r2(W / 2), y: r2(H - 1.6 - fBot / 2), fontSize: fBot, fontFamily: SANS, fontWeight: 'normal', align: 'center' });
  return { shape: 'RECTANGULAR', widthMm: W, heightMm: H, inkColor: spec.inkColor || '#1e3a8a', elements: els };
}

// ── Office status stamp (PAID / RECEIVED / APPROVED …) ──
function officeStamp(spec: DesignSpec): BuiltDesign {
  const word = (clean(spec.statusWord) || clean((spec.lines || [])[0]) || 'APPROVED').toUpperCase();
  const extra = clean(spec.extraLine);
  const withDate = !!spec.withDate;
  const withSign = !!spec.withSignature;
  const rows = (withDate ? 1 : 0) + (withSign ? 1 : 0) + (extra ? 1 : 0);
  const W = clamp(Number(spec.widthMm) || (rows ? 50 : 45), 30, 80);
  const H = clamp(Number(spec.heightMm) || (rows === 0 ? 15 : rows === 1 ? 22 : 28), 12, 45);
  const els: any[] = [];
  // bold double border
  els.push({ id: id('rect'), type: 'rect', name: 'Outer border', x: 0.6, y: 0.6, width: r2(W - 1.2), height: r2(H - 1.2), rx: 1.2, ry: 1.2, strokeWidth: 1, strokeType: 'solid' });
  els.push({ id: id('rect'), type: 'rect', name: 'Inner border', x: 1.9, y: 1.9, width: r2(W - 3.8), height: r2(H - 3.8), rx: 0.8, ry: 0.8, strokeWidth: 0.4, strokeType: 'solid' });
  const wordH = rows ? Math.min(9, (H - 4) * 0.5) : H - 5;
  const fWord = r2(clamp(Math.min(wordH, (W - 7) / (word.length * 0.45)), 3, 12));
  // the word and its lines form one block, centred top-to-bottom inside the inner border
  const small = r2(clamp((H - 5 - fWord - 0.8) / Math.max(1, rows) / 1.36, 2, 3));
  const block = fWord + (rows ? 0.8 + rows * small * 1.36 : 0);
  let y = rows ? (H - block) / 2 + fWord / 2 : H / 2;
  els.push({ id: id('text'), type: 'text', name: 'Status word', text: word, x: r2(W / 2), y: r2(y), fontSize: fWord, fontFamily: IMPACT, fontWeight: 'bold', align: 'center', letterSpacing: 0.4 });
  y += fWord / 2 + 0.8;
  const addRow = (text: string, name: string) => {
    y += small * 0.68;
    els.push({ id: id('text'), type: 'text', name, text, x: r2(W / 2), y: r2(y), fontSize: small, fontFamily: SANS, fontWeight: 'normal', align: 'center' });
    y += small * 0.68;
  };
  if (extra) addRow(extra.toUpperCase(), 'Company');
  if (withDate) addRow('DATE: ____________', 'Date line');
  if (withSign) addRow('SIGN: ____________', 'Signature line');
  return { shape: 'RECTANGULAR', widthMm: W, heightMm: H, inkColor: spec.inkColor || STATUS_INK[word] || '#c1121f', elements: els };
}

/**
 * When the AI is unavailable: recognise an office stamp from the message itself
 * ("PAID stamp with date", "received stamp, date um sign um venam") so it is still built properly.
 */
export function offlineSpec(prompt: string): DesignSpec | null {
  const p = (prompt || '').toUpperCase();
  const word = Object.keys(STATUS_INK).concat(['COPY', 'DUPLICATE', 'ORIGINAL', 'CERTIFIED TRUE COPY']).find((w) => new RegExp(`\\b${w}\\b`).test(p));
  if (!word) return null;
  const forMatch = prompt.match(/\bfor\s+([A-Za-z0-9&.,' -]{2,40})$/i);
  return {
    category: 'office',
    statusWord: word,
    withDate: /\b(DATE|THEEYATHI|TIYATHI)\b/.test(p),
    withSignature: /\b(SIGN|SIGNATURE|OPPU)\b/.test(p),
    extraLine: forMatch ? forMatch[1].trim() : undefined,
  };
}

export interface DesignVariation extends BuiltDesign {
  /** short name shown on the variation chip, e.g. "Classic serif" */
  label: string;
}

const SERIF = "'Cinzel', Georgia, serif";

/**
 * Professional alternatives to a new design — the same texts, laid out the way a stamp designer
 * would offer them for that category (another shape / standard size, a classic serif look, a
 * lighter or bolder frame). Never extra decoration, never different wording.
 */
export function buildVariations(raw: any): DesignVariation[] {
  if (!raw || typeof raw !== 'object') return [];
  const spec = raw as DesignSpec;
  const cat = String(spec.category || '').toLowerCase().replace(/[\s-]+/g, '_');
  const shape = String(spec.shape || '').toUpperCase();
  const out: DesignVariation[] = [];
  const add = (label: string, s: DesignSpec, tweak?: (d: BuiltDesign) => void) => {
    const d = buildCategoryDesign(s);
    if (!d) return;
    tweak?.(d);
    out.push({ label, ...d });
  };
  // the user's own size / ink are kept; only the layout choices change
  const base = { ...spec };
  const sized = !!(spec.widthMm && spec.heightMm);

  if (cat === 'office') {
    add('Single border', base, (d) => {
      d.elements = d.elements.filter((e) => e.name !== 'Inner border');
    });
    if (!sized) add('Larger', { ...base, widthMm: 58, heightMm: (base.withDate || base.withSignature || base.extraLine) ? 30 : 20 });
  } else if (cat === 'signature') {
    add('With border', base, (d) => {
      d.elements.unshift({ id: `rect-v${Date.now().toString(36)}`, type: 'rect', name: 'Border', x: 0.6, y: 0.6, width: r2(d.widthMm - 1.2), height: r2(d.heightMm - 1.2), rx: 0.8, ry: 0.8, strokeWidth: 0.5, strokeType: 'solid' });
    });
    if (!sized) add('Larger', { ...base, widthMm: 58, heightMm: 30 });
  } else if (cat === 'business' || ((shape === 'RECTANGULAR' || shape === 'SQUARE') && Array.isArray(spec.lines) && spec.lines.length)) {
    add('Classic serif name', base, (d) => {
      const name = d.elements.find((e) => e.name === 'Name');
      if (name) name.fontFamily = "'Playfair Display', Georgia, serif";
    });
    if (!sized) add('Larger, easier to read', { ...base, widthMm: 70, heightMm: Math.max(25, (spec.lines || []).length * 6) });
  } else if (cat === 'company_seal' || cat === 'logo' || shape === 'ROUND' || shape === 'OVAL') {
    add('Classic serif', base, (d) => {
      for (const e of d.elements) if (e.type === 'arc-text' && !/Oswald/.test(e.fontFamily)) e.fontFamily = SERIF;
    });
    if (shape === 'OVAL') add('Round 40 mm', { ...base, shape: 'ROUND', widthMm: 40, heightMm: undefined });
    else if (!sized) add('Oval 50×33 mm', { ...base, shape: 'OVAL', widthMm: 50, heightMm: 33 });
  }
  return out.slice(0, 2);
}

/**
 * Backup when the AI gave only its one-line brief ("Round company seal: SUNRISE TRADERS PVT LTD,
 * KOCHI, CIN U123…"): read the category and the texts from it, so the layout engine still builds it.
 */
export function specFromBrief(brief: string, prompt = ''): DesignSpec | null {
  const b = clean(brief);
  if (!b) return null;
  const office = offlineSpec(`${b} ${prompt}`);
  if (office) return office;
  const colon = b.indexOf(':');
  const head = (colon > 0 ? b.slice(0, colon) : '').toLowerCase();
  const body = colon > 0 ? b.slice(colon + 1) : b;
  const parts = body.split(/\s*[,;|\n]\s*/).map(clean).filter(Boolean);
  if (!parts.length) return null;
  const kind = `${head} ${prompt}`.toLowerCase();
  const shape = /oval/.test(kind) ? 'OVAL' : /rect|address|business|signature|signatory|gst|phone|doctor|clinic/.test(kind) ? 'RECTANGULAR' : 'ROUND';

  if (/signature|signatory|sign stamp/.test(kind)) {
    const desig = parts.find((p) => /signator|director|manager|proprietor|partner|secretary|principal|officer|accountant/i.test(p));
    const forText = parts.find((p) => /^for\b/i.test(p)) || (parts[0] !== desig ? `For ${parts[0].replace(/^for\s+/i, '')}` : '');
    return { category: 'signature', shape: 'RECTANGULAR', forText, designation: desig || 'Authorised Signatory' };
  }
  if (shape === 'RECTANGULAR') return { category: 'business', shape, lines: parts };

  // seal: name on top; a short place-like part (no digits) at the bottom; the rest in the centre
  const [topText, ...rest] = parts;
  const placeIdx = rest.findIndex((p) => !/\d/.test(p) && p.length <= 24 && !/\b(CIN|GST|REG|NO)\b/i.test(p));
  const bottomText = placeIdx >= 0 ? rest[placeIdx] : '';
  const centerLines = rest.filter((_, i) => i !== placeIdx).slice(0, 3);
  return { category: /logo/.test(kind) ? 'logo' : 'company_seal', shape, topText, bottomText, centerLines };
}

/** Builds a stamp from the AI's design spec, or returns null when the spec can't be used. */
export function buildCategoryDesign(raw: any): BuiltDesign | null {
  const built = buildLayout(raw);
  return built ? applyStyle(built, raw as DesignSpec) : null;
}

/**
 * The AI's style decisions, applied precisely: heading font, border style, decoration.
 * Small detail text keeps the clean sans (readability rule); office status words keep their impact type.
 */
function applyStyle(d: BuiltDesign, spec: DesignSpec): BuiltDesign {
  const font = String(spec.fontStyle || '').toLowerCase();
  const border = String(spec.border || '').toLowerCase();
  const deco = String(spec.decoration || '').toLowerCase();
  const heading = font === 'classic' ? SERIF : font === 'condensed' ? CONDENSED : font === 'modern' ? SANS : '';
  if (heading) {
    for (const e of d.elements) {
      const isHeading = e.type === 'arc-text' || e.name === 'Name' || e.name === 'For company' || (e.name === 'Centre line 1' && Number(e.fontSize) >= 3);
      if (isHeading && e.name !== 'Status word') e.fontFamily = heading;
    }
  }
  if (border) {
    const outer = d.elements.find((e) => e.name === 'Outer border' || e.name === 'Border');
    const inner = d.elements.find((e) => e.name === 'Inner border');
    if (border === 'none') d.elements = d.elements.filter((e) => e !== outer && e !== inner);
    else if (border === 'single' && inner) d.elements = d.elements.filter((e) => e !== inner);
    else if (border === 'dotted' && inner) inner.strokeType = 'dotted';
    else if (border === 'serrated' && outer && outer.type === 'ring') {
      // a toothed outer edge (classic notary / official look), same size as the ring it replaces
      const i = d.elements.indexOf(outer);
      d.elements[i] = { id: outer.id, type: 'serrated-ring', name: 'Outer border', cx: outer.cx, cy: outer.cy, outerRadius: r2(outer.radius + 0.5), innerRadius: r2(outer.radius - 0.4), teeth: Math.round(outer.radius * 4), strokeWidth: 0.5 };
    }
  }
  if (deco === 'none') d.elements = d.elements.filter((e) => !(e.type === 'clipart' && e.name === 'star-five-point'));
  return d;
}

function buildLayout(raw: any): BuiltDesign | null {
  if (!raw || typeof raw !== 'object') return null;
  const spec = raw as DesignSpec;
  const cat = String(spec.category || '').toLowerCase().replace(/[\s-]+/g, '_');
  const shape = String(spec.shape || '').toUpperCase();
  try {
    if (cat === 'office') return officeStamp(spec);
    if (cat === 'signature') return signatureStamp(spec);
    if (cat === 'business' || ((shape === 'RECTANGULAR' || shape === 'SQUARE') && Array.isArray(spec.lines) && spec.lines.length)) {
      return lineStack(spec.lines || [spec.topText || '', ...(spec.centerLines || []), spec.bottomText || ''], spec, { boldFirst: true, border: true });
    }
    if (cat === 'company_seal' || cat === 'logo' || shape === 'ROUND' || shape === 'OVAL') {
      if (!clean(spec.topText) && !(spec.centerLines || []).length) return null;
      return companySeal(spec, cat === 'logo');
    }
  } catch {
    return null;
  }
  return null;
}
