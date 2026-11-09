/**
 * Convert a design between round and box (square / rectangular) stamp shapes.
 *
 * - Borders that sit at the stamp edge become borders of the new shape at the same
 *   relative inset (double ring → double frame, starburst → bold frame, frame → ring).
 * - Everything else keeps its own design and is scaled uniformly around the center,
 *   just enough to fit inside the new frame — a round seal becomes a round seal in a
 *   square frame, a square layout becomes a layout inside a ring. Nothing is stretched.
 */

type El = Record<string, any>;

const charRatio = (c: string) =>
  c === ' ' ? 0.38 : '.,:;ijl1!|'.includes(c) ? 0.32 : 'MW@&%'.includes(c) ? 0.85 : c === c.toUpperCase() ? 0.66 : 0.55;

/** Distance (x, y, radial) the element reaches from the old center. */
function reach(e: El, cx: number, cy: number): { dx: number; dy: number; dist: number } {
  const box = (x0: number, y0: number, x1: number, y1: number) => {
    const dx = Math.max(Math.abs(x0 - cx), Math.abs(x1 - cx));
    const dy = Math.max(Math.abs(y0 - cy), Math.abs(y1 - cy));
    return { dx, dy, dist: Math.hypot(dx, dy) };
  };
  switch (e.type) {
    case 'ring': {
      const r = (e.radius || 0) + (e.strokeWidth || 0.5) / 2 + Math.hypot(e.cx - cx, e.cy - cy);
      return { dx: r, dy: r, dist: r };
    }
    case 'serrated-ring': {
      const r = (e.outerRadius || 0) + Math.hypot(e.cx - cx, e.cy - cy);
      return { dx: r, dy: r, dist: r };
    }
    case 'oval':
      return { dx: e.rx + Math.abs(e.cx - cx), dy: e.ry + Math.abs(e.cy - cy), dist: Math.max(e.rx, e.ry) + Math.hypot(e.cx - cx, e.cy - cy) };
    case 'arc-text': {
      const r = (e.radius || 0) + (e.fontSize || 3) * 0.42 + Math.hypot(e.cx - cx, e.cy - cy);
      return { dx: r, dy: r, dist: r };
    }
    case 'text': {
      const f = e.fontSize || 3;
      const lines = String(e.text || '').split('\n');
      const w = Math.max(...lines.map((l) => Array.from(l).reduce((s, c) => s + charRatio(c) * f + (e.letterSpacing || 0), 0)));
      const h = lines.length * f * 1.1;
      const x0 = e.align === 'left' ? e.x : e.align === 'right' ? e.x - w : e.x - w / 2;
      return box(x0, e.y - h / 2, x0 + w, e.y + h / 2);
    }
    case 'line':
      return box(Math.min(e.x1, e.x2), Math.min(e.y1, e.y2), Math.max(e.x1, e.x2), Math.max(e.y1, e.y2));
    case 'rect':
    case 'image':
      return box(e.x, e.y, e.x + e.width, e.y + e.height);
    case 'clipart': {
      const w = e.width || e.size || 8;
      const h = e.height || e.size || 8;
      return box(e.cx - w / 2, e.cy - h / 2, e.cx + w / 2, e.cy + h / 2);
    }
    case 'qrcode':
      return box(e.cx - e.size / 2, e.cy - e.size / 2, e.cx + e.size / 2, e.cy + e.size / 2);
    default:
      return { dx: 0, dy: 0, dist: 0 };
  }
}

/** Scale an element uniformly by k about the old center and move it to the new center. */
function scaleAbout(e: El, k: number, ocx: number, ocy: number, ncx: number, ncy: number): El {
  const X = (x: number) => +(ncx + (x - ocx) * k).toFixed(2);
  const Y = (y: number) => +(ncy + (y - ocy) * k).toFixed(2);
  const S = (v: number | undefined) => (v === undefined ? v : +(v * k).toFixed(2));
  const SW = (v: number | undefined) => (v === undefined ? v : Math.max(0.2, +(v * Math.sqrt(k)).toFixed(2)));
  switch (e.type) {
    case 'arc-text': {
      const { rx, ry, ...rest } = e;
      return { ...rest, cx: X(e.cx), cy: Y(e.cy), radius: S(e.radius), fontSize: Math.max(1, S(e.fontSize)!), letterSpacing: S(e.letterSpacing || 0) };
    }
    case 'text':
      return { ...e, x: X(e.x), y: Y(e.y), fontSize: Math.max(1, S(e.fontSize)!), letterSpacing: S(e.letterSpacing || 0) };
    case 'ring':
      return { ...e, cx: X(e.cx), cy: Y(e.cy), radius: S(e.radius), strokeWidth: SW(e.strokeWidth) };
    case 'serrated-ring':
      return { ...e, cx: X(e.cx), cy: Y(e.cy), outerRadius: S(e.outerRadius), innerRadius: S(e.innerRadius), strokeWidth: SW(e.strokeWidth) };
    case 'oval':
      return { ...e, cx: X(e.cx), cy: Y(e.cy), rx: S(e.rx), ry: S(e.ry), strokeWidth: SW(e.strokeWidth) };
    case 'rect':
    case 'image':
      return { ...e, x: X(e.x), y: Y(e.y), width: S(e.width), height: S(e.height), ...(e.strokeWidth ? { strokeWidth: SW(e.strokeWidth) } : {}) };
    case 'line':
      return { ...e, x1: X(e.x1), y1: Y(e.y1), x2: X(e.x2), y2: Y(e.y2), strokeWidth: SW(e.strokeWidth) };
    case 'clipart':
      return { ...e, cx: X(e.cx), cy: Y(e.cy), width: S(e.width), height: S(e.height), size: S(e.size) };
    case 'qrcode':
      return { ...e, cx: X(e.cx), cy: Y(e.cy), size: S(e.size) };
    default:
      return e;
  }
}

/** Is this element a border sitting at the stamp edge? Returns its inset from the edge (mm). */
function edgeInset(e: El, w: number, h: number): number | null {
  const half = Math.min(w, h) / 2;
  const centered = (x: number, y: number) => Math.abs(x - w / 2) < 0.6 && Math.abs(y - h / 2) < 0.6;
  if (e.type === 'ring' && centered(e.cx, e.cy) && e.radius >= half * 0.85) return half - e.radius;
  if (e.type === 'serrated-ring' && centered(e.cx, e.cy) && e.outerRadius >= half * 0.85) return half - e.outerRadius;
  if (e.type === 'rect' && e.width >= w * 0.85 && e.height >= h * 0.85) return Math.min(e.x, e.y);
  if (e.type === 'oval' && centered(e.cx, e.cy) && e.rx >= (w / 2) * 0.85 && e.ry >= (h / 2) * 0.85)
    return Math.min(w / 2 - e.rx, h / 2 - e.ry);
  return null;
}

export function morphBetweenShapeFamilies(
  elements: El[],
  oldW: number,
  oldH: number,
  newW: number,
  newH: number,
  newShape: string
): any[] {
  const ocx = oldW / 2, ocy = oldH / 2;
  const toBox = newShape === 'SQUARE' || newShape === 'RECTANGULAR';
  const toOval = newShape === 'OVAL';
  const ncx = newW / 2, ncy = newH / 2;
  // On an oval stamp, circles are drawn as ellipses whose long axis keeps the radius,
  // so circular designs scale by the long side.
  const unit = (toOval ? Math.max(newW, newH) : Math.min(newW, newH)) / Math.min(oldW, oldH);

  const frames = elements
    .map((e) => ({ e, inset: edgeInset(e, oldW, oldH) }))
    .filter((f) => f.inset !== null) as { e: El; inset: number }[];
  const frameIds = new Set(frames.map((f) => f.e.id));

  // 1. Edge borders → borders of the new shape, same relative inset
  let innermostEdge = 0.8; // inner boundary for content (mm from the new edge)
  const newFrames = frames.map(({ e, inset }) => {
    const ni = Math.max(0.5, +(inset * unit).toFixed(2));
    const sw = e.type === 'serrated-ring' ? 1.0 : Math.max(0.25, +((e.strokeWidth || 0.6) * Math.sqrt(unit)).toFixed(2));
    innermostEdge = Math.max(innermostEdge, ni + sw);
    const base = { id: e.id, name: e.name, visible: e.visible, locked: e.locked, strokeWidth: sw, strokeType: e.strokeType || 'solid' };
    if (toBox) {
      return { ...base, type: 'rect', x: ni, y: ni, width: +(newW - 2 * ni).toFixed(2), height: +(newH - 2 * ni).toFixed(2), rx: 1, ry: 1 };
    }
    if (toOval) {
      return { ...base, type: 'oval', cx: ncx, cy: ncy, rx: +(newW / 2 - ni - sw / 2).toFixed(2), ry: +(newH / 2 - ni - sw / 2).toFixed(2) };
    }
    return { ...base, type: 'ring', cx: ncx, cy: ncy, radius: +(Math.min(newW, newH) / 2 - ni - sw / 2).toFixed(2) };
  });

  // 2. Content → uniform scale, as large as fits inside the new frame (never larger than the size change)
  const content = elements.filter((e) => !frameIds.has(e.id));
  const gap = toBox ? 0.7 : 1.3; // square corners need more room inside a ring
  let k = unit;
  if (content.length) {
    const r = content.map((e) => reach(e, ocx, ocy));
    if (toBox) {
      const maxDx = Math.max(0.01, ...r.map((v) => v.dx));
      const maxDy = Math.max(0.01, ...r.map((v) => v.dy));
      k = Math.min(unit, (newW / 2 - innermostEdge - gap) / maxDx, (newH / 2 - innermostEdge - gap) / maxDy);
    } else if (toOval) {
      // fit every element's reach inside the inner ellipse
      const A = Math.max(0.5, newW / 2 - innermostEdge - gap);
      const B = Math.max(0.5, newH / 2 - innermostEdge - gap);
      const M = Math.max(newW, newH);
      const sx = newW / M, sy = newH / M; // how the oval stamp draws a circle of radius r
      const limits = content.map((e, i) => {
        const v = r[i];
        const round = (e.type === 'ring' || e.type === 'serrated-ring' || e.type === 'arc-text') && e.rx === undefined;
        if (round) return Math.min(A / Math.max(0.01, v.dist * sx), B / Math.max(0.01, v.dist * sy));
        return 1 / Math.max(0.01, Math.hypot(v.dx / A, v.dy / B));
      });
      k = Math.min(unit, ...limits);
    } else {
      const maxDist = Math.max(0.01, ...r.map((v) => v.dist));
      k = Math.min(unit, (Math.min(newW, newH) / 2 - innermostEdge - gap) / maxDist);
    }
    k = Math.max(0.2, k);
  }

  return elements.map((e) => {
    if (frameIds.has(e.id)) return newFrames[frames.findIndex((f) => f.e.id === e.id)];
    const s = scaleAbout(e, k, ocx, ocy, ncx, ncy);
    // an ellipse has a shorter path than its circle: tighten curved text so the top and bottom lines don't meet
    if (toOval && s.type === 'arc-text' && s.rx === undefined) {
      const q = Math.min(newW, newH) / Math.max(newW, newH);
      const p = (1 + q) / 2; // ≈ ellipse / circle perimeter
      return { ...s, fontSize: Math.max(1, +(s.fontSize * Math.sqrt(p)).toFixed(2)), letterSpacing: +((s.letterSpacing || 0) * p * p).toFixed(2) };
    }
    return s;
  });
}

/** Does the design already have a border at the stamp edge? */
export function hasEdgeBorder(elements: El[], w: number, h: number): boolean {
  return elements.some((e) => edgeInset(e, w, h) !== null);
}

/** A fresh outer border matching the stamp shape. */
export function makeEdgeBorder(shape: string, w: number, h: number): El {
  const id = 'el_' + Math.random().toString(36).substring(2, 9);
  if (shape === 'SQUARE' || shape === 'RECTANGULAR') {
    return { id, type: 'rect', x: 0.8, y: 0.8, width: +(w - 1.6).toFixed(2), height: +(h - 1.6).toFixed(2), rx: 1, ry: 1, strokeWidth: 0.8 };
  }
  if (shape === 'OVAL') {
    return { id, type: 'oval', cx: w / 2, cy: h / 2, rx: +(w / 2 - 1).toFixed(2), ry: +(h / 2 - 1).toFixed(2), strokeWidth: 0.8 };
  }
  return { id, type: 'ring', cx: w / 2, cy: h / 2, radius: +(Math.min(w, h) / 2 - 1).toFixed(2), strokeWidth: 0.8, strokeType: 'solid' };
}
