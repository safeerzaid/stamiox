/**
 * Template layout normalizer.
 *
 * Runs once over every template seed before it is served. It:
 *  1. Converts legacy arc-text fields (startAngle/endAngle/isClockwise) into the
 *     `isReversed` flag the renderer actually reads, so bottom arcs render at the bottom.
 *  2. Keeps arc text inside its half of the circle (no top/bottom collision) by
 *     reducing letter spacing first, then font size.
 *  3. Keeps arc text inside the band between the surrounding rings.
 *  4. Shrinks straight text / clipart that would collide with arc text, rings or
 *     the stamp frame.
 *
 * The width model mirrors frontend/src/lib/arc-text.ts (getCharWidthRatio).
 */
import type { StampTemplateSeed } from './templates';

export function charWidthRatio(char: string): number {
  if (char === ' ' || char === '\t') return 0.38;
  if ('ijl1!|.,;:\'"`'.includes(char)) return 0.32;
  if ('frtI-()[]{}'.includes(char)) return 0.44;
  if ('mwMW@★#%&'.includes(char)) return 0.85;
  if ('ABCDEFGHJKLNOPQRSTUVWXYZ023456789'.includes(char)) return 0.62;
  return 0.55;
}

/** Real rendered glyphs (bold sans) run wider than the layout model; pad for that. */
const RENDER_WIDTH_FACTOR = 1.08;
/** Straight text renders at full Montserrat width (wider than the arc model). */
const TEXT_WIDTH_FACTOR = 1.2;
/** Half the visual height of a glyph centered with dominant-baseline="central". */
const HALF_GLYPH = 0.36;
const PAD = 0.35; // mm clearance between any two things
/** Caps sit off the path with dominant-baseline="central": outward on top arcs, inward on bottom arcs. */
const CAP_SHIFT = 0; // measured in SVG: caps are centered on dominant-baseline="central" (±0.35em)
const visualShift = (el: any) => (el.isReversed ? -1 : 1) * CAP_SHIFT * (el.fontSize || 3);
const MIN_ARC_FONT = 1.5;
const MIN_TEXT_FONT = 1.3;

const arcLength = (text: string, fontSize: number, spacing: number) =>
  Array.from(text || '').reduce((s, c) => s + charWidthRatio(c) * fontSize + spacing, 0);

const textWidth = (el: any) => {
  const lines = String(el.text || '').split('\n');
  const f = el.fontSize || 3;
  const ls = el.letterSpacing || 0;
  return Math.max(
    ...lines.map((l) => Array.from(l).reduce((s, c) => s + charWidthRatio(c) * f + ls, 0) * TEXT_WIDTH_FACTOR)
  );
};

/** Axis-aligned box of a straight text element (mm). */
export function textBox(el: any) {
  const f = el.fontSize || 3;
  const lines = String(el.text || '').split('\n').length;
  const lh = (el.lineHeight || 1.25) * f;
  const w = textWidth(el);
  const h = (lines - 1) * lh + 2 * HALF_GLYPH * f;
  const x0 = el.align === 'center' ? el.x - w / 2 : el.align === 'right' ? el.x - w : el.x;
  return { x0, x1: x0 + w, y0: el.y - h / 2, y1: el.y + h / 2 };
}

export function clipartBox(el: any) {
  const w = el.width || 4;
  const h = el.height || 4;
  const cx = el.cx ?? (el.x ?? 0) + w / 2;
  const cy = el.cy ?? (el.y ?? 0) + h / 2;
  return { x0: cx - w / 2, x1: cx + w / 2, y0: cy - h / 2, y1: cy + h / 2 };
}

type Box = { x0: number; x1: number; y0: number; y1: number };
type Circle = { x: number; y: number; r: number };

export const boxesOverlap = (a: Box, b: Box, pad = 0) =>
  a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.y0 < b.y1 + pad && b.y0 < a.y1 + pad;

const circleHitsBox = (c: Circle, b: Box, pad = 0) => {
  const nx = Math.max(b.x0, Math.min(c.x, b.x1));
  const ny = Math.max(b.y0, Math.min(c.y, b.y1));
  return (nx - c.x) ** 2 + (ny - c.y) ** 2 < (c.r + pad) ** 2;
};

/** Glyph centers for an arc text, mirroring calculateArcGlyphs for circles. */
export function arcGlyphCircles(el: any): Circle[] {
  const f = el.fontSize || 3;
  const ls = el.letterSpacing || 0;
  const r = el.radius;
  const chars = Array.from(String(el.text || ''));
  const widths = chars.map((c) => charWidthRatio(c) * f + ls);
  const total = widths.reduce((a, b) => a + b, 0);
  const out: Circle[] = [];
  const dir = el.isReversed ? -1 : 1;
  let t = (el.isReversed ? Math.PI / 2 : -Math.PI / 2) - dir * (total / 2) / r;
  widths.forEach((w, i) => {
    const ct = t + dir * (w / 2) / r;
    if (chars[i].trim()) { const vr = r + visualShift(el); out.push({ x: el.cx + vr * Math.cos(ct), y: el.cy + vr * Math.sin(ct), r: HALF_GLYPH * f * 1.05 }); }
    t = ct + dir * (w / 2) / r;
  });
  return out;
}

/** Ring "walls" as [innerEdge, outerEdge] radii around the template center. */
function ringWalls(els: any[]): { inner: number; outer: number }[] {
  const walls: { inner: number; outer: number }[] = [];
  for (const e of els) {
    if (e.type === 'ring' && e.radius) {
      const sw = (e.strokeWidth || 0.5) / 2;
      walls.push({ inner: e.radius - sw, outer: e.radius + sw });
    } else if (e.type === 'serrated-ring') {
      walls.push({ inner: e.innerRadius ?? e.outerRadius - 2, outer: e.outerRadius });
    }
  }
  return walls;
}

function convertLegacyArc(el: any) {
  if (el.isReversed !== undefined) return;
  let bottom = false;
  if (typeof el.isClockwise === 'boolean') bottom = el.isClockwise === false;
  if (typeof el.startAngle === 'number' && typeof el.endAngle === 'number') {
    const mid = ((((el.startAngle + el.endAngle) / 2) % 360) + 360) % 360;
    bottom = mid > 0 && mid < 180; // SVG y-down: 90° is 6 o'clock
  }
  el.isReversed = bottom;
}

function fitArcSpan(el: any, maxSpanRad: number) {
  const r = el.radius;
  const fits = () => arcLength(el.text, el.fontSize, el.letterSpacing || 0) * RENDER_WIDTH_FACTOR / r <= maxSpanRad;
  while (!fits() && (el.letterSpacing || 0) > 0.1) el.letterSpacing = +((el.letterSpacing || 0) - 0.1).toFixed(2);
  while (!fits() && el.fontSize > MIN_ARC_FONT) el.fontSize = +(el.fontSize - 0.05).toFixed(2);
}

function fitArcBand(el: any, walls: { inner: number; outer: number }[]) {
  const r = el.radius;
  const outsideWall = walls.filter((w) => w.inner > r).sort((a, b) => a.inner - b.inner)[0];
  const insideWall = walls.filter((w) => w.outer < r).sort((a, b) => b.outer - a.outer)[0];
  if (!outsideWall) return;
  const hi = outsideWall.inner - PAD;
  const lo = insideWall ? insideWall.outer + PAD : 0;
  const half = HALF_GLYPH * el.fontSize;
  const vc = r + visualShift(el); // where the capitals actually sit
  if (vc + half <= hi && vc - half >= lo) return;
  const band = hi - lo;
  if (band < 2 * half) el.fontSize = +Math.max(MIN_ARC_FONT, band / (2 * HALF_GLYPH)).toFixed(2);
  const h2 = HALF_GLYPH * el.fontSize;
  // center inside band, but prefer hugging the outer wall when there is no inner ring
  const targetVc = insideWall ? (lo + hi) / 2 : hi - h2;
  el.radius = +(targetVc - visualShift(el)).toFixed(2);
}

const lineBox = (e: any): Box => {
  const h = (e.strokeWidth || 0.4) / 2;
  return { x0: Math.min(e.x1, e.x2), x1: Math.max(e.x1, e.x2), y0: Math.min(e.y1, e.y2) - h, y1: Math.max(e.y1, e.y2) + h };
};
const elementBox = (e: any): Box | null =>
  e.type === 'text' ? textBox(e) : e.type === 'clipart' ? clipartBox(e) : e.type === 'line' ? lineBox(e)
    : e.type === 'qrcode' ? { x0: e.cx - e.size / 2, x1: e.cx + e.size / 2, y0: e.cy - e.size / 2, y1: e.cy + e.size / 2 } : null;

function shiftY(e: any, dy: number) {
  const r = (n: number) => +(n + dy).toFixed(2);
  if (e.type === 'text') e.y = r(e.y);
  else if (e.type === 'qrcode') e.cy = r(e.cy);
  else if (e.type === 'clipart') {
    if (e.cy !== undefined) e.cy = r(e.cy);
    else if (e.y !== undefined) e.y = r(e.y);
  } else if (e.type === 'line') {
    e.y1 = r(e.y1);
    e.y2 = r(e.y2);
  }
}

/** Move a group of elements together so its bounding box is centered on `targetY`. */
function centerGroupVertically(group: any[], targetY: number) {
  const boxes = group.map(elementBox).filter(Boolean) as Box[];
  if (!boxes.length) return;
  const top = Math.min(...boxes.map((b) => b.y0));
  const bottom = Math.max(...boxes.map((b) => b.y1));
  const off = (top + bottom) / 2 - targetY;
  if (Math.abs(off) > 0.25) group.forEach((e) => shiftY(e, -off));
}

function layoutRound(t: StampTemplateSeed) {
  const els = t.defaultData.elements;
  const arcs = els.filter((e) => e.type === 'arc-text');
  const walls = ringWalls(els);
  const cx = t.widthMm / 2;
  const cy = t.heightMm / 2;

  // Each arc keeps to its own half when the opposite side is also used.
  for (const a of arcs) {
    const opposite = arcs.some((b) => b !== a && !!b.isReversed !== !!a.isReversed);
    const sameSide = arcs.filter((b) => !!b.isReversed === !!a.isReversed);
    fitArcBand(a, walls);
    // stacked arcs on the same side are at different radii, so only the opposite side limits span
    fitArcSpan(a, opposite ? (165 * Math.PI) / 180 : (sameSide.length > 1 ? 200 : 230) * (Math.PI / 180));
  }

  // Visual harmony: top & bottom arc text should not differ wildly in size.
  const top = arcs.filter((a) => !a.isReversed);
  const bottom = arcs.filter((a) => a.isReversed);
  if (top.length === 1 && bottom.length === 1) {
    const [small, big] = [top[0], bottom[0]].sort((a, b) => a.fontSize - b.fontSize);
    const cap = +(small.fontSize * 1.2).toFixed(2);
    if (big.fontSize > cap) big.fontSize = cap;
  }

  const glyphs = arcs.flatMap(arcGlyphCircles);
  // innermost wall that encloses the center content
  const enclosing = (dist: number) =>
    walls.filter((w) => w.inner > dist).sort((a, b) => a.inner - b.inner)[0];

  const collides = (box: Box) => {
    if (glyphs.some((g) => circleHitsBox(g, box, PAD))) return true;
    const corners = [
      [box.x0, box.y0], [box.x1, box.y0], [box.x0, box.y1], [box.x1, box.y1],
    ];
    const centerDist = Math.hypot((box.x0 + box.x1) / 2 - cx, (box.y0 + box.y1) / 2 - cy);
    const wall = enclosing(centerDist);
    if (wall && corners.some(([x, y]) => Math.hypot(x - cx, y - cy) > wall.inner - PAD)) return true;
    return false;
  };

  // Vertically center the central block (text, centered emblems, divider rules) on the seal center.
  const central = els.filter(
    (e) =>
      e.type === 'text' ||
      (e.type === 'clipart' && Math.abs((e.cx ?? 0) - cx) < 3) ||
      (e.type === 'line' && Math.abs(e.y1 - e.y2) < 0.01 && Math.abs((e.x1 + e.x2) / 2 - cx) < 1)
  );
  centerGroupVertically(central, cy);

  for (const e of els) {
    if (e.type === 'text') {
      let guard = 0;
      while (collides(textBox(e)) && e.fontSize > MIN_TEXT_FONT && guard++ < 80) {
        if ((e.letterSpacing || 0) > 0.1) e.letterSpacing = +(e.letterSpacing - 0.1).toFixed(2);
        else e.fontSize = +(e.fontSize - 0.05).toFixed(2);
      }
    } else if (e.type === 'clipart') {
      let guard = 0;
      while (collides(clipartBox(e)) && (e.width || 4) > 1.6 && guard++ < 60) {
        const s = 0.95;
        e.width = +((e.width || 4) * s).toFixed(2);
        e.height = +((e.height || 4) * s).toFixed(2);
      }
    }
  }
}

function layoutRect(t: StampTemplateSeed) {
  const els = t.defaultData.elements;
  // inner frame: smallest rect that encloses the center
  const frames = els
    .filter((e) => e.type === 'rect' && e.width > t.widthMm * 0.6)
    .map((e) => ({ x0: e.x + (e.strokeWidth || 0.5) / 2, x1: e.x + e.width - (e.strokeWidth || 0.5) / 2 }))
    .sort((a, b) => a.x1 - a.x0 - (b.x1 - b.x0));
  const frame = frames[0] || { x0: 0, x1: t.widthMm };

  // Vertically center the content inside the innermost frame. Stamps with a header band
  // (a partial-height rect, e.g. "PAID") keep their designed layout.
  const enclosingRects = els.filter((e) => e.type === 'rect' && e.width > t.widthMm * 0.6 && e.height > t.heightMm * 0.6);
  const hasBand = els.some((e) => e.type === 'rect' && !enclosingRects.includes(e));
  if (!hasBand) {
    const inner = enclosingRects
      .map((e) => ({ y0: e.y + (e.strokeWidth || 0.5) / 2, y1: e.y + e.height - (e.strokeWidth || 0.5) / 2 }))
      .sort((a, b) => a.y1 - a.y0 - (b.y1 - b.y0))[0] || { y0: 0, y1: t.heightMm };
    centerGroupVertically(els.filter((e) => e.type === 'text' || e.type === 'line' || e.type === 'clipart' || e.type === 'qrcode'), (inner.y0 + inner.y1) / 2);
  }

  for (const e of els) {
    if (e.type !== 'text') continue;
    let guard = 0;
    const tooWide = () => {
      const b = textBox(e);
      return b.x0 < frame.x0 + PAD || b.x1 > frame.x1 - PAD;
    };
    while (tooWide() && e.fontSize > MIN_TEXT_FONT && guard++ < 80) {
      if ((e.letterSpacing || 0) > 0.1) e.letterSpacing = +(e.letterSpacing - 0.1).toFixed(2);
      else e.fontSize = +(e.fontSize - 0.05).toFixed(2);
    }
  }
}

export function layoutTemplate(src: StampTemplateSeed): StampTemplateSeed {
  const t: StampTemplateSeed = JSON.parse(JSON.stringify(src));
  for (const e of t.defaultData.elements) {
    if (e.type === 'arc-text') {
      convertLegacyArc(e);
      delete e.startAngle;
      delete e.endAngle;
      delete e.isClockwise;
      if (e.fontSize == null) e.fontSize = 3;
    }
  }
  if (t.shape === 'ROUND') layoutRound(t);
  else if (t.shape === 'RECTANGULAR' || t.shape === 'SQUARE') layoutRect(t);
  return t;
}
