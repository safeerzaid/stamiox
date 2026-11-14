/**
 * Keeps AI answers correct for the editor:
 *  - ELEMENT_SCHEMA tells the model the exact element format the editor renders.
 *  - normalizeElements() repairs common mistakes (wrong field names, aliases, missing
 *    defaults) and drops anything the editor cannot draw.
 *  - sameDesign() lets callers tell whether an "edit" actually changed anything.
 */

/**
 * Text in an Indian script needs a font that has those letters — otherwise it shows as boxes or
 * falls back to a random system font. If the chosen font can't draw the script, use a good one.
 */
const SCRIPT_FONTS: Array<{ re: RegExp; ok: RegExp; font: string }> = [
  { re: /[\u0D00-\u0D7F]/, ok: /Malayalam|Manjari|Gayathri|Chilanka|Chettan/i, font: "'Noto Sans Malayalam', sans-serif" },
  { re: /[\u0900-\u097F]/, ok: /Devanagari|Hind|Mukta|Rozha|Poppins|Kalam/i, font: "'Noto Sans Devanagari', sans-serif" },
  { re: /[\u0B80-\u0BFF]/, ok: /Tamil/i, font: "'Noto Sans Tamil', sans-serif" },
];
export function scriptSafeFont(text: string, font: string): string {
  for (const s of SCRIPT_FONTS) if (s.re.test(text || '') && !s.ok.test(font || '')) return s.font;
  return font;
}

const SCRIPT_TEXT = /[ऀ-෿]/; // Devanagari … Malayalam

/** Typography rules that must always hold, whatever the model returned. */
function enforceTypography(e: any) {
  // Indian scripts join letters — extra spacing breaks them apart
  if (SCRIPT_TEXT.test(e.text || '') && typeof e.letterSpacing === 'number' && e.letterSpacing > 0.1) e.letterSpacing = 0.1;
  // (handwriting fonts on small text are NOT forced away here: the user's exact choice wins —
  //  the AI adds a short tip instead)
}

export const ELEMENT_SCHEMA = `ELEMENT FORMAT (mm units, origin top-left of the stamp; use ONLY these types and fields):
- {"id","type":"ring","cx","cy","radius","strokeWidth","strokeType":"solid"|"dashed"|"dotted"}
- {"id","type":"oval","cx","cy","rx","ry","strokeWidth","strokeType"}
- {"id","type":"rect","x","y","width","height","rx","ry","strokeWidth","strokeType"}   (x,y = top-left corner)
- {"id","type":"line","x1","y1","x2","y2","strokeWidth","strokeType"}
- {"id","type":"serrated-ring","cx","cy","outerRadius","innerRadius","teeth","strokeWidth"}
- {"id","type":"text","text","x","y","fontSize","fontFamily","fontWeight","align":"center"|"left"|"right","letterSpacing"}   (x,y = anchor point, y is the vertical centre)
- {"id","type":"arc-text","text","cx","cy","radius","fontSize","fontFamily","fontWeight","letterSpacing","isReversed"}   (isReversed:false = text along the TOP, true = along the BOTTOM)
- {"id","type":"clipart","name":"star-five-point"|"stars-triple"|"scales-of-justice"|"caduceus"|"shield-check","cx","cy","width","height"}
- {"id","type":"qrcode","content","cx","cy","size"}
- {"id","type":"image", "x","y","width","height", "threshold" 20–240, "simplify" 0–3, "smooth" 0–4, "thickness" -3–3, "contrast" -100–100, "style":"solid"|"outline"|"dots", "invert", "removeBg" true|false}   (an uploaded logo: edit ONLY these fields with "update"; never add or remove an image yourself; x,y = top-left corner)
Never invent other types or field names. Keep every existing "id". New elements get a new unique id.`;

const num = (v: any, d?: number): number | undefined => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return typeof n === 'number' && isFinite(n) ? n : d;
};

const TYPE_ALIASES: Record<string, string> = {
  'arc-text': 'arc-text', arc: 'arc-text', arctext: 'arc-text', curvedtext: 'arc-text', 'curved-text': 'arc-text', text_arc: 'arc-text',
  text: 'text', straighttext: 'text', 'straight-text': 'text', label: 'text', text_line: 'text',
  ring: 'ring', circle: 'ring', border: 'ring', 'circle-border': 'ring',
  oval: 'oval', ellipse: 'oval',
  rect: 'rect', rectangle: 'rect', box: 'rect', square: 'rect', frame: 'rect',
  line: 'line', divider: 'line', rule: 'line',
  'serrated-ring': 'serrated-ring', starburst: 'serrated-ring', serrated: 'serrated-ring',
  clipart: 'clipart', icon: 'clipart', star: 'clipart', symbol: 'clipart',
  qrcode: 'qrcode', qr: 'qrcode', 'qr-code': 'qrcode',
  image: 'image', logo: 'image',
};

const CLIPART_ALIASES: Array<[RegExp, string]> = [
  [/stars?[-_ ]?(triple|three|3)|three[-_ ]?stars?/i, 'stars-triple'],
  [/star/i, 'star-five-point'],
  [/scale|justice|law|legal/i, 'scales-of-justice'],
  [/caduceus|medical|doctor|health/i, 'caduceus'],
  [/shield|check|verified|approved/i, 'shield-check'],
];
const KNOWN_CLIPART = new Set(['star-five-point', 'stars-triple', 'scales-of-justice', 'caduceus', 'shield-check']);

const STROKE_TYPES = new Set(['solid', 'dashed', 'dotted']);

export function normalizeElements(raw: any, design: { widthMm?: number; heightMm?: number } = {}): any[] {
  if (!Array.isArray(raw)) return [];
  const W = num(design.widthMm, 40)!;
  const H = num(design.heightMm, 40)!;
  const cx0 = W / 2, cy0 = H / 2;
  const seen = new Set<string>();
  const out: any[] = [];

  for (const src of raw) {
    if (!src || typeof src !== 'object') continue;
    const key = String(src.type || '').toLowerCase().replace(/\s+/g, '');
    let type = TYPE_ALIASES[key];
    if (!type) continue; // the editor can't draw it

    const e: any = { ...src, type };
    let id = typeof e.id === 'string' && e.id ? e.id : '';
    if (!id || seen.has(id)) id = `${type}-${Math.random().toString(36).slice(2, 8)}`;
    e.id = id;
    seen.add(id);

    const stroke = () => {
      e.strokeWidth = num(e.strokeWidth, 0.6);
      if (!STROKE_TYPES.has(e.strokeType)) e.strokeType = 'solid';
    };

    switch (type) {
      case 'arc-text': {
        if (typeof e.text !== 'string' || !e.text.trim()) continue;
        e.cx = num(e.cx, cx0); e.cy = num(e.cy, cy0);
        e.radius = num(e.radius, Math.min(W, H) * 0.38);
        e.fontSize = num(e.fontSize, 2.8);
        e.fontFamily = scriptSafeFont(e.text, e.fontFamily || 'Montserrat');
        enforceTypography(e);
        if (typeof e.isReversed !== 'boolean') e.isReversed = /bottom/i.test(String(e.position || e.placement || ''));
        break;
      }
      case 'text': {
        if (typeof e.text !== 'string' || !e.text.trim()) continue;
        e.x = num(e.x ?? e.cx, cx0); e.y = num(e.y ?? e.cy, cy0);
        e.fontSize = num(e.fontSize, 3);
        e.fontFamily = scriptSafeFont(e.text, e.fontFamily || 'Montserrat');
        enforceTypography(e);
        if (!['left', 'center', 'right'].includes(e.align)) e.align = 'center';
        break;
      }
      case 'ring': {
        e.cx = num(e.cx, cx0); e.cy = num(e.cy, cy0);
        e.radius = num(e.radius ?? e.r, undefined);
        if (!e.radius) continue;
        stroke();
        break;
      }
      case 'oval': {
        e.cx = num(e.cx, cx0); e.cy = num(e.cy, cy0);
        e.rx = num(e.rx, undefined); e.ry = num(e.ry, undefined);
        if (!e.rx || !e.ry) continue;
        stroke();
        break;
      }
      case 'rect': {
        e.width = num(e.width, undefined); e.height = num(e.height, undefined);
        if (!e.width || !e.height) continue;
        // accept a centre point if the model sent one
        if (e.x === undefined && e.cx !== undefined) e.x = num(e.cx)! - e.width / 2;
        if (e.y === undefined && e.cy !== undefined) e.y = num(e.cy)! - e.height / 2;
        e.x = num(e.x, (W - e.width) / 2); e.y = num(e.y, (H - e.height) / 2);
        stroke();
        break;
      }
      case 'line': {
        e.x1 = num(e.x1, undefined); e.y1 = num(e.y1, undefined); e.x2 = num(e.x2, undefined); e.y2 = num(e.y2, undefined);
        if ([e.x1, e.y1, e.x2, e.y2].some((v) => v === undefined)) continue;
        stroke();
        break;
      }
      case 'serrated-ring': {
        e.cx = num(e.cx, cx0); e.cy = num(e.cy, cy0);
        e.outerRadius = num(e.outerRadius, Math.min(W, H) * 0.48);
        e.innerRadius = num(e.innerRadius, e.outerRadius * 0.9);
        e.teeth = Math.round(num(e.teeth, 48)!);
        e.strokeWidth = num(e.strokeWidth, 0.5);
        break;
      }
      case 'clipart': {
        let name = String(e.name || e.shape || e.icon || e.clipart || (key === 'star' ? 'star' : ''));
        if (!KNOWN_CLIPART.has(name)) {
          const hit = CLIPART_ALIASES.find(([re]) => re.test(name));
          if (!hit && !e.svgPath) continue;
          if (hit) name = hit[1];
        }
        e.name = name;
        const size = num(e.size, 6);
        e.cx = num(e.cx ?? e.x, cx0); e.cy = num(e.cy ?? e.y, cy0);
        e.width = num(e.width, size); e.height = num(e.height, size);
        delete e.shape; delete e.icon; delete e.size; delete e.x; delete e.y;
        break;
      }
      case 'qrcode': {
        e.cx = num(e.cx ?? e.x, cx0); e.cy = num(e.cy ?? e.y, cy0);
        e.size = num(e.size, Math.min(W, H) * 0.35);
        e.content = String(e.content || e.text || 'https://stamiox.com');
        break;
      }
      case 'image': {
        if (!e.src) continue;
        break;
      }
    }
    out.push(e);
  }
  return tidyLayout(out, W, H);
}

/**
 * Perfect alignment: the model often places things *almost* centred or *almost* symmetric
 * (20.3 instead of 20, a star at y 19.6 and its twin at 20.2). Snap such near-misses into place.
 * Only small offsets are snapped, so anything placed off-centre on purpose stays where it is.
 */
export function tidyLayout(elements: any[], W: number, H: number): any[] {
  const cx = W / 2, cy = H / 2;
  const SNAP = 0.6; // mm
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const near = (a: number, b: number) => Number.isFinite(a) && Math.abs(a - b) <= SNAP;

  for (const e of elements) {
    // rings, curved text, ovals, serrated rings: share the stamp's centre
    if (['ring', 'arc-text', 'oval', 'serrated-ring'].includes(e.type)) {
      if (near(e.cx, cx)) e.cx = cx;
      if (near(e.cy, cy)) e.cy = cy;
    }
    // centred straight text sits exactly on the centre line
    if (e.type === 'text' && e.align === 'center' && near(e.x, cx)) e.x = cx;
    // logos / icons / QR meant for the middle
    if ((e.type === 'clipart' || e.type === 'qrcode') && near(e.cx, cx)) e.cx = cx;
  }

  // mirrored pairs (stars / icons left and right): same height, same distance from the centre
  const decos = elements.filter((e) => e.type === 'clipart' && Number.isFinite(e.cx) && Number.isFinite(e.cy));
  const used = new Set<any>();
  for (const a of decos) {
    if (used.has(a) || a.cx >= cx - 0.01) continue; // left-hand ones
    const b = decos.find(
      (o) => !used.has(o) && o !== a && o.cx > cx && (o.name || '') === (a.name || '') && Math.abs(o.cy - a.cy) <= 1.2 && Math.abs((o.cx - cx) - (cx - a.cx)) <= 1.2
    );
    if (!b) continue;
    used.add(a); used.add(b);
    const y = r2((a.cy + b.cy) / 2);
    const d = r2(((cx - a.cx) + (b.cx - cx)) / 2);
    a.cy = y; b.cy = y;
    a.cx = r2(cx - d); b.cx = r2(cx + d);
  }

  // the top and bottom curved texts of a seal match (same circle, same size) when nearly equal
  const tops = elements.filter((e) => e.type === 'arc-text' && !e.isReversed);
  const bottoms = elements.filter((e) => e.type === 'arc-text' && e.isReversed);
  if (tops.length === 1 && bottoms.length === 1) {
    const [t, b] = [tops[0], bottoms[0]];
    if (Math.abs(t.radius - b.radius) <= 0.5) b.radius = t.radius;
    if (Math.abs(t.fontSize - b.fontSize) <= 0.3) b.fontSize = t.fontSize;
  }
  return elements;
}

/**
 * Print check on the real stamp size (mm): lines too thin to engrave, text too small, text
 * touching a border, parts outside the stamp. Returns short plain-language warnings (max 3).
 * Warnings only — the design is never changed here, so the user's exact choices stay.
 */
export function printCheck(elements: any[], W: number, H: number, shape?: string): string[] {
  const out: string[] = [];
  const els = (elements || []).filter((e) => e && e.visible !== false);

  const lines = ['ring', 'oval', 'rect', 'line', 'serrated-ring'];
  if (els.some((e) => lines.includes(e.type) && Number(e.strokeWidth) > 0 && Number(e.strokeWidth) < 0.3)) {
    out.push('A border / line is thinner than 0.3 mm — it may break when engraved.');
  }

  const texts = els.filter((e) => (e.type === 'text' || e.type === 'arc-text') && typeof e.text === 'string' && e.text.trim());
  const tiny = texts.filter((e) => Number(e.fontSize) < 2);
  if (tiny.length) out.push(`${tiny.length === 1 ? 'Some text is' : `${tiny.length} texts are`} smaller than 2 mm — it may not print clearly.`);

  // curved text touching a ring: the text band is about radius ± half the text size
  const rings = els.filter((e) => e.type === 'ring' && Number.isFinite(e.radius));
  const touching = texts.some((t) => {
    if (t.type !== 'arc-text' || !Number.isFinite(t.radius)) return false;
    const f = Number(t.fontSize) || 3;
    const inner = t.radius - f * 0.5, outer = t.radius + f * 0.5;
    return rings.some((r) => {
      if (Math.hypot((r.cx ?? 0) - (t.cx ?? 0), (r.cy ?? 0) - (t.cy ?? 0)) > 0.6) return false;
      const half = (Number(r.strokeWidth) || 0.6) / 2;
      const gap = r.radius >= t.radius ? r.radius - half - outer : inner - (r.radius + half);
      return gap < 0.3;
    });
  });
  if (touching) out.push('Curved text is very close to a border — leave a small gap so they don’t merge.');

  // text too long for its place, even after shrinking to the minimum
  if (texts.some((t) => overflows(t, els, W, H, shape))) out.push('Some text is too long to fit — shorten it or choose a bigger stamp.');

  // anything outside the stamp
  const round = shape === 'ROUND' || shape === 'OVAL';
  const outside = els.some((e) => {
    const half = (Number(e.strokeWidth) || 0) / 2;
    if ((e.type === 'ring' || e.type === 'serrated-ring') && Number.isFinite(e.cx)) {
      const r = (e.type === 'ring' ? e.radius : e.outerRadius) + half;
      return round ? r > Math.min(W, H) / 2 + 0.2 : e.cx - r < -0.2 || e.cx + r > W + 0.2 || e.cy - r < -0.2 || e.cy + r > H + 0.2;
    }
    if (e.type === 'rect') return e.x < -0.2 || e.y < -0.2 || e.x + e.width > W + 0.2 || e.y + e.height > H + 0.2;
    if (e.type === 'image') return e.x < -0.5 || e.y < -0.5 || e.x + e.width > W + 0.5 || e.y + e.height > H + 0.5;
    return false;
  });
  if (outside) out.push(`Part of the design goes outside the ${W}×${H} mm stamp.`);

  return out.slice(0, 4);
}

// ── Production rules (AI behaviour rules 3, 4, 5, 9) ──────────────────────────────────────────

export const MIN_STROKE_MM = 0.3;
export const MIN_TEXT_MM = 2;

/** Rough letter width as a share of the text size — condensed faces are narrower. */
const letterRatio = (font?: string) => (/Oswald|Barlow Condensed|Bebas|Condensed/i.test(font || '') ? 0.52 : 0.62);
/** The editor's own letter widths for curved text (lib/arc-text.ts getCharWidthRatio) — curved
 *  letters are spaced by this table whatever the font, so fitting must use exactly the same. */
export const arcCharRatio = (c: string) =>
  c === ' ' || c === '\t' ? 0.38
  : 'ijl1!|.,;:\'"`'.includes(c) ? 0.32
  : 'frtI-()[]{}'.includes(c) ? 0.44
  : 'mwMW@★#%&'.includes(c) ? 0.85
  : 'ABCDEFGHJKLNOPQRSTUVWXYZ023456789'.includes(c) ? 0.62
  : 0.55;
const textLen = (e: any, size = Number(e.fontSize) || 3) => {
  const ls = Number(e.letterSpacing) || 0;
  if (e.type === 'arc-text') return Array.from(String(e.text || '')).reduce((s, c) => s + arcCharRatio(c) * size + ls, 0);
  return Array.from(String(e.text || '')).length * (size * letterRatio(e.fontFamily) + ls);
};

/**
 * How much room a text element has (mm): a straight line → the width available at its height
 * inside the stamp (or inside the ring it sits in); curved text → the arc length it may use.
 */
function textRoom(e: any, all: any[], W: number, H: number, shape?: string): number | null {
  if (e.type === 'arc-text') {
    if (!Number.isFinite(e.radius) || e.radius <= 0) return null;
    // a seal with both top and bottom text keeps a gap on each side for the separators
    const hasBoth = all.some((o) => o.type === 'arc-text' && o.isReversed) && all.some((o) => o.type === 'arc-text' && !o.isReversed);
    const deg = hasBoth ? (e.isReversed ? 120 : 210) : 300;
    return e.radius * ((deg * Math.PI) / 180);
  }
  if (e.type !== 'text' || !Number.isFinite(e.x) || !Number.isFinite(e.y)) return null;
  const half = (Number(e.fontSize) || 3) / 2;
  let left = 1.5, right = W - 1.5; // side margins
  const round = shape === 'ROUND' || shape === 'OVAL';
  if (round) {
    // the innermost ring that still encloses this line, else the stamp outline
    const dy = Math.abs(e.y - H / 2) + half;
    const ring = all
      .filter((r) => r.type === 'ring' && Number.isFinite(r.radius) && r.radius - (Number(r.strokeWidth) || 0) / 2 - 0.8 > dy)
      .sort((a, b) => a.radius - b.radius)[0];
    let halfChord: number;
    if (ring) {
      const R = ring.radius - (Number(ring.strokeWidth) || 0) / 2 - 0.8;
      halfChord = Math.sqrt(Math.max(0, R * R - dy * dy));
    } else {
      const rx = W / 2 - 1.5, ry = H / 2 - 1.5;
      halfChord = rx * Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2));
    }
    left = W / 2 - halfChord;
    right = W / 2 + halfChord;
  }
  if (e.align === 'left') return right - e.x;
  if (e.align === 'right') return e.x - left;
  return 2 * Math.min(e.x - left, right - e.x);
}

/** True when a text element is wider than the room it has, even at its current size. */
function overflows(e: any, all: any[], W: number, H: number, shape?: string): boolean {
  const room = textRoom(e, all, W, H, shape);
  return room !== null && room > 0 && textLen(e) > room + 0.3;
}

/**
 * Makes AI output production-safe. Only the elements in `ids` are touched (the ones this answer
 * created or changed) — what the user set by hand in the editor is left alone. Returns short notes
 * on anything that was adjusted, for the reply.
 *  - lines / borders ≥ 0.3 mm, text ≥ 2 mm (no thin lines, no tiny type)
 *  - text that is too long for its place is made smaller until it fits (never below 2 mm)
 */
export function enforceProduction(elements: any[], W: number, H: number, shape: string | undefined, ids?: Set<string>): string[] {
  const notes = new Set<string>();
  const touch = (e: any) => !ids || ids.has(String(e.id));
  const lineTypes = ['ring', 'oval', 'rect', 'line', 'serrated-ring'];
  for (const e of elements) {
    if (!e || !touch(e)) continue;
    if (lineTypes.includes(e.type) && Number(e.strokeWidth) > 0 && Number(e.strokeWidth) < MIN_STROKE_MM) {
      e.strokeWidth = MIN_STROKE_MM;
      notes.add('Thin lines were set to 0.3 mm so they don’t break when the stamp is made.');
    }
    if ((e.type === 'text' || e.type === 'arc-text') && typeof e.text === 'string') {
      if (Number(e.fontSize) < MIN_TEXT_MM) {
        e.fontSize = MIN_TEXT_MM;
        notes.add('Text was kept at the 2 mm minimum so it prints clearly.');
      }
      const room = textRoom(e, elements, W, H, shape);
      if (room !== null && room > 0 && textLen(e) > room) {
        const n = Math.max(1, Array.from(e.text).length);
        const perSize = textLen(e, 1) - n * (Number(e.letterSpacing) || 0); // width per mm of text size
        const fit = (room - n * (Number(e.letterSpacing) || 0)) / Math.max(0.01, perSize);
        const size = Math.max(MIN_TEXT_MM, Math.floor(fit * 100) / 100);
        if (size < e.fontSize) {
          e.fontSize = size;
          notes.add('Long text was made a little smaller so it fits the stamp.');
        }
      }
    }
  }
  // a seal's top and bottom curved text stay the same size (if one had to shrink, both do)
  const tops = elements.filter((e) => e?.type === 'arc-text' && !e.isReversed);
  const bottoms = elements.filter((e) => e?.type === 'arc-text' && e.isReversed);
  if (tops.length === 1 && bottoms.length === 1 && Math.abs((tops[0].radius || 0) - (bottoms[0].radius || 0)) < 0.6) {
    const touched = touch(tops[0]) || touch(bottoms[0]);
    const f = Math.min(Number(tops[0].fontSize) || 3, Number(bottoms[0].fontSize) || 3);
    if (touched && tops[0].fontSize !== bottoms[0].fontSize) { tops[0].fontSize = f; bottoms[0].fontSize = f; }
  }
  return [...notes];
}

/**
 * Never distort a logo: when an update changes a logo's width or height, the other side follows
 * the original proportions and the logo keeps its centre.
 */
export function keepLogoProportions(before: any, after: any): any {
  const isLogo = before?.type === 'image' || (before?.type === 'clipart' && before.svgPath);
  if (!isLogo) return after;
  const keys = before.type === 'image' ? { x: 'x', y: 'y', topLeft: true } : { x: 'cx', y: 'cy', topLeft: false };
  const w0 = Number(before.width), h0 = Number(before.height);
  const w1 = Number(after.width), h1 = Number(after.height);
  if (!(w0 > 0 && h0 > 0 && w1 > 0 && h1 > 0)) return after;
  const ratio = w0 / h0;
  if (Math.abs(w1 / h1 - ratio) / ratio <= 0.01) return after;
  // follow the side that changed the most
  const byWidth = Math.abs(w1 / w0 - 1) >= Math.abs(h1 / h0 - 1);
  const w = byWidth ? w1 : h1 * ratio;
  const h = byWidth ? w1 / ratio : h1;
  const out = { ...after, width: +w.toFixed(2), height: +h.toFixed(2) };
  if (keys.topLeft) {
    const cx = Number(after.x) + w1 / 2, cy = Number(after.y) + h1 / 2;
    out.x = +(cx - w / 2).toFixed(2);
    out.y = +(cy - h / 2).toFixed(2);
  }
  return out;
}

/** Real stamp sizes only: 8–150 mm, and a round stamp is as tall as it is wide. */
export function sanitizeStampSize(r: { shape?: string; widthMm?: any; heightMm?: any }) {
  const clampMm = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(Math.min(150, Math.max(8, n)) * 10) / 10 : undefined;
  };
  if (r.widthMm !== undefined) r.widthMm = clampMm(r.widthMm);
  if (r.heightMm !== undefined) r.heightMm = clampMm(r.heightMm);
  if (r.widthMm === undefined) delete r.widthMm;
  if (r.heightMm === undefined) delete r.heightMm;
  if (String(r.shape).toUpperCase() === 'ROUND' && r.widthMm && r.heightMm && r.widthMm !== r.heightMm) {
    r.heightMm = r.widthMm = Math.max(r.widthMm, r.heightMm);
  }
}

/** True when two element lists draw the same design (ignores key order). */
export function sameDesign(a: any[] | undefined, b: any[] | undefined): boolean {
  const norm = (els: any[] | undefined) =>
    JSON.stringify((els || []).map((e) => Object.keys(e).sort().reduce((o: any, k) => ((o[k] = e[k]), o), {})));
  return norm(a) === norm(b);
}
