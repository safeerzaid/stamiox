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

const textW = (t: string, f: number, ls: number) => Array.from(t).reduce((s, c) => s + charRatio(c) * f + ls, 0);

/** Curved text length exactly as the editor spaces it (lib/arc-text.ts — same table, any font). */
const arcCharRatio = (c: string) =>
  c === ' ' || c === '\t' ? 0.38
  : 'ijl1!|.,;:\'"`'.includes(c) ? 0.32
  : 'frtI-()[]{}'.includes(c) ? 0.44
  : 'mwMW@★#%&'.includes(c) ? 0.85
  : 'ABCDEFGHJKLNOPQRSTUVWXYZ023456789'.includes(c) ? 0.62
  : 0.55;
const arcTextLen = (t: string, f: number, ls: number) => Array.from(t).reduce((s, c) => s + arcCharRatio(c) * f + ls, 0);
/** Perimeter of an ellipse (Ramanujan) — 2πr for a circle. */
const ellipsePerimeter = (a: number, b: number) => Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));

/** Do the top and bottom curved texts of a seal leave a gap at the sides? (≥ ~16° each side) */
function arcsFit(els: El[], w: number, h: number, shape: string): boolean {
  const tops = els.filter((e) => e.type === 'arc-text' && !e.isReversed);
  const bots = els.filter((e) => e.type === 'arc-text' && e.isReversed);
  if (!tops.length || !bots.length) return true;
  const M = Math.max(w, h);
  const len = (e: El) => {
    const rx = e.rx || (shape === 'OVAL' ? e.radius * (w / M) : e.radius);
    const ry = e.ry || (shape === 'OVAL' ? e.radius * (h / M) : e.radius);
    return { text: arcTextLen(String(e.text || ''), e.fontSize || 3, e.letterSpacing || 0), perim: ellipsePerimeter(rx, ry) };
  };
  const t = len(tops[0]), b = len(bots[0]);
  return t.text / t.perim + b.text / b.perim <= 1 - 32 / 360;
}

/**
 * Lines of text stacked top → bottom around (cx, cy) inside a maxW × maxH area: each keeps its
 * size unless it is too wide, and the block shrinks evenly (never below 2 mm) to fit the height.
 */
function restack(items: El[], cx: number, cy: number, maxW: number, maxH: number, ellipse?: { rx: number; ry: number }): El[] {
  // icons / logos / QR codes in the stack keep their place in the order (a star above the name…)
  const midY = (e: El) => (e.type === 'text' ? e.y : e.type === 'image' ? e.y + (e.height || 0) / 2 : e.cy);
  const sorted = [...items].sort((a, b) => midY(a) - midY(b));
  const isText = (e: El) => e.type === 'text';
  const iconH = (e: El) => (e.type === 'qrcode' ? e.size : e.height || e.size || e.width || 4);
  const iconW = (e: El, s: number) => (e.type === 'qrcode' ? s : ((e.width || e.size || s) * s) / (iconH(e) || s));
  let spacing = sorted.map((t) => t.letterSpacing || 0);
  // too wide: tighten wide letter spacing before making the text smaller
  sorted.forEach((t, i) => {
    if (!isText(t)) return;
    const n = Array.from(String(t.text || '')).length;
    const w = textW(String(t.text || ''), t.fontSize || 3, spacing[i]);
    if (w > maxW && spacing[i] > 0.12) spacing[i] = +Math.max(0.12, spacing[i] - (w - maxW) / n).toFixed(3);
  });
  let sizes = sorted.map((t, i) => {
    if (!isText(t)) return Math.min(iconH(t), maxH * 0.4, maxW);
    const one = textW(String(t.text || ''), 1, 0) || 1;
    const n = Array.from(String(t.text || '')).length;
    return Math.max(2, Math.min(t.fontSize || 3, (maxW - n * spacing[i]) / one));
  });
  // line spacing 1.3 × the text size; a tight block may close it up to 1.12 (capitals keep a clear gap)
  let lineK = 1.3;
  const stepOf = (e: El, s: number) => (isText(e) ? s * lineK : s + 0.8);
  const total = sorted.reduce((sum, e, i) => sum + stepOf(e, sizes[i]), 0);
  if (total > maxH) {
    const textSum = sorted.reduce((sum, e, i) => sum + (isText(e) ? sizes[i] : 0), 0);
    const iconSum = total - textSum * lineK;
    if (textSum > 0) lineK = Math.max(1.12, Math.min(1.3, (maxH - iconSum) / textSum));
  }
  const total2 = sorted.reduce((sum, e, i) => sum + stepOf(e, sizes[i]), 0);
  if (total2 > maxH) sizes = sizes.map((s, i) => Math.max(isText(sorted[i]) ? 2 : 1.5, s * (maxH / total2)));

  // place the stack; inside a circle / oval every line must also fit the width at its own height
  const place = () => {
    const height = sorted.reduce((sum, e, i) => sum + stepOf(e, sizes[i]), 0);
    let y = cy - height / 2;
    return sorted.map((e, i) => {
      const step = stepOf(e, sizes[i]);
      const mid = y + step / 2;
      y += step;
      return mid;
    });
  };
  let mids = place();
  if (ellipse) {
    const widthOf = (e: El, i: number) =>
      isText(e) ? textW(String(e.text || ''), sizes[i], spacing[i]) : iconW(e, sizes[i]);
    const fitsAt = (e: El, i: number) => {
      const dy = Math.abs(mids[i] - cy) + sizes[i] / 2;
      if (dy >= ellipse.ry) return false;
      const half = ellipse.rx * Math.sqrt(1 - (dy / ellipse.ry) ** 2);
      return widthOf(e, i) / 2 + 0.3 <= half;
    };
    // shrink only what doesn't fit (the name stays the biggest line); once a line is at the
    // minimum size, tighten its letters; if nothing can shrink further, make the whole block smaller
    for (let n = 0; n < 40; n++) {
      const bad = sorted.map((e, i) => !fitsAt(e, i));
      if (!bad.some(Boolean)) break;
      let moved = false;
      sorted.forEach((e, i) => {
        if (!bad[i]) return;
        const min = isText(e) ? 2 : 1.5;
        // wide letter spacing goes first (keeps the name big), then the size, then the last spacing
        if (isText(e) && spacing[i] > 0.12) { spacing[i] = +Math.max(0.12, spacing[i] * 0.7).toFixed(3); moved = true; }
        else if (sizes[i] > min + 0.001) { sizes[i] = Math.max(min, sizes[i] * 0.94); moved = true; }
        else if (spacing[i] > 0.02) { spacing[i] = +(spacing[i] * 0.7).toFixed(3); moved = true; }
      });
      if (!moved) sizes = sizes.map((s, i) => Math.max(isText(sorted[i]) ? 2 : 1.5, s * 0.94));
      mids = place();
    }
  }
  return sorted.map((t, i) => {
    const mid = +mids[i].toFixed(2);
    const s = +sizes[i].toFixed(2);
    if (isText(t)) return { ...t, x: +cx.toFixed(2), y: mid, fontSize: s, align: 'center', letterSpacing: spacing[i] };
    const k = s / (iconH(t) || s);
    if (t.type === 'qrcode') return { ...t, cx: +cx.toFixed(2), cy: mid, size: s };
    const w = +((t.width || t.size || s) * k).toFixed(2);
    if (t.type === 'image') return { ...t, x: +(cx - w / 2).toFixed(2), y: +(mid - s / 2).toFixed(2), width: w, height: s };
    return { ...t, cx: +cx.toFixed(2), cy: mid, width: w, height: s, ...(t.size ? { size: Math.max(w, s) } : {}) };
  });
}

/** Vertical middle of an element. */
const midOf = (e: El) => (e.type === 'image' ? e.y + (e.height || 0) / 2 : e.type === 'text' ? e.y : e.cy);
/** An icon / logo / QR code sitting on the stamp's vertical centre line. */
const isCentreIcon = (e: El, ocx: number) => {
  if (e.type === 'clipart' || e.type === 'qrcode') return Math.abs(e.cx - ocx) < 3;
  if (e.type === 'image') return Math.abs(e.x + (e.width || 0) / 2 - ocx) < 3;
  return false;
};

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
  const tol = Math.max(0.6, Math.min(w, h) * 0.06); // a slightly nudged border still counts
  const centered = (x: number, y: number) => Math.abs(x - w / 2) < tol && Math.abs(y - h / 2) < tol;
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
  newShape: string,
  /** the shape before — a box stamp that stays a box keeps its curved text as it is */
  oldShape?: string
): any[] {
  const wasBox = oldShape === 'SQUARE' || oldShape === 'RECTANGULAR';
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
  // A border that encloses ALL the text is an outer border too (e.g. the solid ring just inside a
  // dotted band): it stays outside the text with the same spacing — never moved inside it
  {
    const texts = elements.filter((e) => (e.type === 'arc-text' || e.type === 'text') && String(e.text || '').trim());
    if (texts.length) {
      // how far the text reaches from the centre, in x and y
      let tx = 0, ty = 0;
      for (const t of texts) {
        const r = reach(t, ocx, ocy);
        tx = Math.max(tx, r.dx); ty = Math.max(ty, r.dy);
      }
      const ctr = Math.max(0.6, Math.min(oldW, oldH) * 0.06);
      for (const e of elements) {
        if (frames.some((f) => f.e.id === e.id)) continue;
        let hx = 0, hy = 0, cx = NaN, cy = NaN, inset = 0;
        if (e.type === 'ring') { hx = hy = e.radius; cx = e.cx; cy = e.cy; inset = Math.min(oldW, oldH) / 2 - e.radius; }
        else if (e.type === 'oval') { hx = e.rx; hy = e.ry; cx = e.cx; cy = e.cy; inset = Math.min(oldW / 2 - e.rx, oldH / 2 - e.ry); }
        else if (e.type === 'rect' && (e.strokeWidth ?? 0.5) > 0) { hx = e.width / 2; hy = e.height / 2; cx = e.x + hx; cy = e.y + hy; inset = Math.min(e.x, e.y); }
        else continue;
        if (!(Math.abs(cx - ocx) < ctr && Math.abs(cy - ocy) < ctr) || inset < 0) continue;
        const sw = (e.strokeWidth || 0.5) / 2;
        // a ring encloses the text when every text point is inside it; for curved text dist ≤ r
        // (a box: every text line lies inside it top-to-bottom and its centre is inside left-to-right —
        //  width estimates of narrow fonts are too rough to rely on)
        const encloses = e.type === 'rect'
          ? texts.every((t) => {
              const r = reach(t, ocx, ocy);
              const midX = t.type === 'arc-text' ? t.cx : t.x;
              return r.dy <= hy - sw + 0.2 && Math.abs(midX - ocx) < hx - sw;
            })
          : texts.every((t) => reach(t, ocx, ocy).dist <= Math.min(hx, hy) - sw + 0.1);
        if (encloses) frames.push({ e, inset });
      }
    }
  }
  const frameIds = new Set(frames.map((f) => f.e.id));

  // 1. Edge borders → borders of the new shape, same relative inset
  let innermostEdge = 0.8; // inner boundary for content (mm from the new edge)
  const toRound = !toBox && !toOval;
  const newFrames = frames.map(({ e, inset }) => {
    // a decorative pattern border (leaf wreath, daisy, rope, checkered, beads, scallop, diamonds,
    // teeth) keeps EXACTLY its pattern in the new shape — the editor draws the same pattern along
    // the box / oval — and turns back into the original pattern ring when the stamp goes round again
    const patternOf = (x: El) => (x.type === 'serrated-ring' ? x : x.pattern && x.pattern.type === 'serrated-ring' ? x.pattern : null);
    const pattern = patternOf(e);
    const band = pattern ? Math.max(0.6, (pattern.outerRadius || 0) - (pattern.innerRadius || 0)) : 0;
    // a pattern frame's geometry is the middle of its band: its outer edge is half a band further out
    const outerInset = pattern && e.type !== 'serrated-ring' ? inset - band / 2 : inset;
    const ni = Math.max(0.5, +(outerInset * unit).toFixed(2));
    if (pattern && toRound) {
      const outer = +(Math.min(newW, newH) / 2 - ni).toFixed(2);
      innermostEdge = Math.max(innermostEdge, ni + band);
      const { pattern: _p, ...restOld } = pattern;
      return { ...restOld, id: e.id, name: e.name, visible: e.visible, locked: e.locked, groupId: e.groupId, type: 'serrated-ring', cx: ncx, cy: ncy, outerRadius: outer, innerRadius: +(outer - band).toFixed(2) };
    }
    if (pattern) {
      innermostEdge = Math.max(innermostEdge, ni + band);
      const mid = ni + band / 2; // the pattern runs along the middle of its band
      const base = { id: e.id, name: e.name, visible: e.visible, locked: e.locked, groupId: e.groupId, strokeWidth: Number(pattern.strokeWidth) || 0.5, strokeType: 'solid', pattern };
      if (toBox) return { ...base, type: 'rect', x: +mid.toFixed(2), y: +mid.toFixed(2), width: +(newW - 2 * mid).toFixed(2), height: +(newH - 2 * mid).toFixed(2), rx: +band.toFixed(2), ry: +band.toFixed(2) };
      return { ...base, type: 'oval', cx: ncx, cy: ncy, rx: +(newW / 2 - mid).toFixed(2), ry: +(newH / 2 - mid).toFixed(2) };
    }
    const sw = Math.max(0.25, +((e.strokeWidth || 0.6) * Math.sqrt(unit)).toFixed(2));
    innermostEdge = Math.max(innermostEdge, ni + sw);
    const base = {
      id: e.id, name: e.name, visible: e.visible, locked: e.locked, groupId: e.groupId, strokeWidth: sw,
      strokeType: e.strokeType || 'solid',
    };
    if (toBox) {
      return { ...base, type: 'rect', x: ni, y: ni, width: +(newW - 2 * ni).toFixed(2), height: +(newH - 2 * ni).toFixed(2), rx: 1, ry: 1 };
    }
    if (toOval) {
      return { ...base, type: 'oval', cx: ncx, cy: ncy, rx: +(newW / 2 - ni - sw / 2).toFixed(2), ry: +(newH / 2 - ni - sw / 2).toFixed(2) };
    }
    return { ...base, type: 'ring', cx: ncx, cy: ncy, radius: +(Math.min(newW, newH) / 2 - ni - sw / 2).toFixed(2) };
  });

  // 1a. Box frames inside a patterned border follow its rounded corner (concentric corners look clean)
  if (toBox) {
    const pf = newFrames.find((f: El) => f.type === 'rect' && f.pattern);
    if (pf) {
      const band = Math.max(0.6, (pf.pattern.outerRadius || 0) - (pf.pattern.innerRadius || 0));
      const st = String(pf.pattern.wreathStyle || pf.pattern.wreath || "");
      const r0 = Math.min(Math.max(pf.rx || 0, band * (/^(wreath|leaf)$/.test(st) ? 4.5 : /^(checkered|square)$/.test(st) ? 2.6 : 1.6), 1.5), pf.width / 2, pf.height / 2);
      for (const f of newFrames as El[]) {
        if (f === pf || f.type !== 'rect') continue;
        const r = +Math.max(0.8, r0 - (f.x - pf.x)).toFixed(2);
        f.rx = r; f.ry = r;
      }
    }
  }

  // 1b. Inner borders (rings / ovals / frames around the centre) take the new shape too, at the same
  //     size relative to the stamp — a round seal's inner ring becomes an inner frame or oval
  const ctol = Math.max(0.6, Math.min(oldW, oldH) * 0.08);
  const isCentred = (x: number, y: number) => Math.abs(x - ocx) < ctol && Math.abs(y - ocy) < ctol;
  const innerRel = (e: El): number | null => {
    if (frameIds.has(e.id)) return null;
    if (e.type === 'ring' && e.radius > 0 && isCentred(e.cx, e.cy)) return e.radius / (Math.min(oldW, oldH) / 2);
    if (e.type === 'oval' && e.rx > 0 && e.ry > 0 && isCentred(e.cx, e.cy)) return (e.rx / (oldW / 2) + e.ry / (oldH / 2)) / 2;
    if (e.type === 'rect' && e.width > 0 && e.height > 0 && (e.strokeWidth ?? 0.5) > 0 && isCentred(e.x + e.width / 2, e.y + e.height / 2))
      return (e.width / oldW + e.height / oldH) / 2;
    return null;
  };
  const innerFrames = elements
    .map((e) => ({ e, rel: innerRel(e) }))
    .filter((f) => f.rel !== null && f.rel < 1) as { e: El; rel: number }[];
  const innerIds = new Set(innerFrames.map((f) => f.e.id));
  const innerFrameAs = (e: El, ax: number, ay: number): El => {
    const sw = Math.max(0.3, +((e.strokeWidth || 0.5) * Math.sqrt(unit)).toFixed(2));
    const base = { id: e.id, name: e.name, visible: e.visible, locked: e.locked, strokeWidth: sw, strokeType: e.strokeType || 'solid' };
    if (toBox) return { ...base, type: 'rect', x: +(ncx - ax).toFixed(2), y: +(ncy - ay).toFixed(2), width: +(2 * ax).toFixed(2), height: +(2 * ay).toFixed(2), rx: 0.8, ry: 0.8 };
    if (toOval) return { ...base, type: 'oval', cx: ncx, cy: ncy, rx: +ax.toFixed(2), ry: +ay.toFixed(2) };
    return { ...base, type: 'ring', cx: ncx, cy: ncy, radius: +Math.min(ax, ay).toFixed(2) };
  };

  // 1c. Round / oval → box: curved top & bottom text become straight top & bottom lines, the
  //     separator stars move beside the top line, and the rest fits in the middle
  const arcs = toBox && !wasBox ? elements.filter((e) => e.type === 'arc-text' && !frameIds.has(e.id) && String(e.text || '').trim()) : [];
  if (toBox && arcs.length) {
    const outIds = new Map<string, El>();
    const arcR = Math.min(...arcs.map((a) => a.radius || 0));

    // borders that ran OUTSIDE the curved text stay outside it: nested frames just inside the edge
    // frame(s), evenly spaced. Borders that were INSIDE the text go around the middle part (below).
    const r0 = (f: { rel: number }) => f.rel * (Math.min(oldW, oldH) / 2);
    const outerRings = innerFrames.filter((f) => r0(f) > arcR).sort((a, b) => b.rel - a.rel);
    const middleRings = innerFrames.filter((f) => r0(f) <= arcR);
    let inset = innermostEdge + 0.5;
    for (const { e } of outerRings) {
      const sw = Math.max(0.3, +((e.strokeWidth || 0.5) * Math.sqrt(unit)).toFixed(2));
      const f = innerFrameAs(e, newW / 2 - inset - sw / 2, newH / 2 - inset - sw / 2);
      outIds.set(e.id, f);
      innermostEdge = inset + sw;
      inset = innermostEdge + 0.5;
    }

    const pad = innermostEdge + 1.1; // the top / bottom line keeps ≥ 1 mm from the frame
    const innerW = newW - 2 * pad;
    const stars = elements.filter((e) => e.type === 'clipart' && Math.hypot(e.cx - ocx, e.cy - ocy) >= arcR * 0.75);
    const starRoom = stars.length ? 2 * (Math.min(2.6, Math.max(...stars.map((s) => s.width || s.size || 2.5))) + 1.2) : 0;
    const CONDENSED = "'Oswald', Arial, sans-serif";
    // a straight top / bottom line that FITS the box: wide letter spacing goes first, then a
    // condensed font, then a smaller size (never under 2 mm)
    const line = (arc: El, top: boolean): El => {
      const text = String(arc.text);
      const n = Array.from(text).length;
      const bold = /bold|[6-9]00/.test(String(arc.fontWeight || ''));
      const room = (innerW - (top ? starRoom : 0)) * 0.94;
      const want = Math.min(arc.fontSize || 3, newH * 0.22);
      // bold capitals in the stamp fonts run wider than the average letter
      const widthAt = (f: number, ls: number, cond: boolean) => textW(text, f, ls) * (bold ? 1.16 : 1.04) * (cond ? 0.74 : 1);
      let ls = Math.min(arc.letterSpacing || 0, 0.3);
      let cond = false;
      if (widthAt(want, ls, false) > room) ls = Math.max(0, Math.min(ls, (room - widthAt(want, 0, false)) / n));
      if (widthAt(want, ls, false) > room) ls = 0;
      if (widthAt(Math.max(2, want * 0.85), 0, false) > room) cond = true; // shrinking a little more won't do
      let f = want;
      while (f > 2 && widthAt(f, ls, cond) > room) f = +(f - 0.05).toFixed(2);
      f = +Math.max(2, f).toFixed(2);
      const { cx: _cx, cy: _cy, radius: _r, rx: _rx, ry: _ry, startAngle: _sa, sweepAngle: _sw, isReversed: _rev, angleOffset: _ao, ...rest } = arc;
      return {
        ...rest,
        ...(cond ? { fontFamily: CONDENSED } : {}),
        type: 'text', x: +ncx.toFixed(2), y: +(top ? pad + f / 2 : newH - pad - f / 2).toFixed(2), fontSize: f, letterSpacing: +ls.toFixed(2), align: 'center',
      };
    };
    const topArc = arcs.filter((a) => !a.isReversed).sort((a, b) => b.radius - a.radius)[0];
    const botArc = arcs.filter((a) => a.isReversed).sort((a, b) => b.radius - a.radius)[0];
    const topLine = topArc ? line(topArc, true) : null;
    const botLine = botArc ? line(botArc, false) : null;
    if (topArc) outIds.set(topArc.id, topLine!);
    if (botArc) outIds.set(botArc.id, botLine!);

    // middle zone between the two lines
    // the middle frame keeps the same clear gap to the top line and to the bottom line
    let zTop = topLine ? topLine.y + topLine.fontSize / 2 + 1.2 : pad;
    let zBot = botLine ? botLine.y - botLine.fontSize / 2 - 1.2 : newH - pad;
    let zLeft = pad, zRight = newW - pad;
    let lastStroke = 0;
    middleRings
      .sort((a, b) => b.rel - a.rel)
      .forEach(({ e }, i) => {
        if (i > 0) { zTop += lastStroke / 2 + 0.6; zBot -= lastStroke / 2 + 0.6; zLeft += lastStroke / 2 + 0.6; zRight -= lastStroke / 2 + 0.6; }
        const ax = Math.max(1, (zRight - zLeft) / 2), ay = Math.max(1, (zBot - zTop) / 2);
        const f = innerFrameAs(e, ax, ay);
        f.y = +zTop.toFixed(2);
        f.height = +(2 * ay).toFixed(2);
        outIds.set(e.id, f);
        lastStroke = Number(f.strokeWidth) || 0.5;
      });
    // the text inside keeps a clear 1.2 mm from the inner edge of the frame line (never touching it)
    if (lastStroke) {
      const pad = lastStroke / 2 + 1.2;
      zTop += pad; zBot -= pad; zLeft += pad; zRight -= pad;
    }

    // separator stars (in the curved-text band) → either side of the top line
    if (topLine) {
      const tw = textW(String(topLine.text), topLine.fontSize, topLine.letterSpacing);
      for (const s of stars) {
        const size = +Math.min(s.width || s.size || 2.5, topLine.fontSize).toFixed(2);
        const left = s.cx < ocx;
        let x = ncx + (left ? -1 : 1) * (tw / 2 + 1 + size / 2);
        x = Math.min(newW - pad - size / 2, Math.max(pad + size / 2, x));
        outIds.set(s.id, { ...s, cx: +x.toFixed(2), cy: topLine.y, width: size, height: size, size });
      }
    }

    // everything else: centred in the middle zone (text lines re-stacked so they never overlap)
    const rest = elements.filter((e) => !frameIds.has(e.id) && !outIds.has(e.id));
    const zcx = (zLeft + zRight) / 2, zcy = (zTop + zBot) / 2;
    if (rest.length && rest.every((e) => e.type === 'text' || isCentreIcon(e, ocx))) {
      restack(rest, zcx, zcy, zRight - zLeft - 1, zBot - zTop - 0.4).forEach((t) => outIds.set(t.id, t));
    }
    let k2 = unit;
    const others = rest.filter((e) => !outIds.has(e.id));
    if (others.length) {
      const r = others.map((e) => reach(e, ocx, ocy));
      const maxDx = Math.max(0.01, ...r.map((v) => v.dx));
      const maxDy = Math.max(0.01, ...r.map((v) => v.dy));
      k2 = Math.max(0.2, Math.min(unit, ((zRight - zLeft) / 2 - 0.5) / maxDx, ((zBot - zTop) / 2 - 0.3) / maxDy));
    }
    return elements.map((e) => {
      if (frameIds.has(e.id)) return newFrames[frames.findIndex((f) => f.e.id === e.id)];
      if (outIds.has(e.id)) return outIds.get(e.id);
      return scaleAbout(e, k2, ocx, ocy, zcx, zcy);
    });
  }

  // 1d. Box → round / oval: a box layout becomes a seal layout — the first line goes on the top
  //     curve, the last line on the bottom curve (with 3+ lines), the rest in the centre
  const lines = !toBox
    ? elements
        .filter((e) => e.type === 'text' && !String(e.text || '').includes('\n') && String(e.text || '').trim() && (e.align ?? 'center') === 'center')
        .sort((a, b) => a.y - b.y)
    : [];
  const fromBox = (oldShape === undefined || wasBox) && !elements.some((e) => e.type === 'arc-text') && frames.some((f) => f.e.type === 'rect');
  if (!toBox && fromBox && lines.length >= 2) {
    const out = new Map<string, El>();
    const M = Math.max(newW, newH);
    const sx = toOval ? newW / M : 1, sy = toOval ? newH / M : 1; // how an oval stamp draws a circle
    const edgeR = (f: number) => Math.min((newW / 2 - innermostEdge - 1 - f / 2) / sx, (newH / 2 - innermostEdge - 1 - f / 2) / sy);
    const topT = lines[0];
    const botT = lines.length >= 3 ? lines[lines.length - 1] : lines[1];
    const middle = lines.filter((l) => l !== topT && l !== botT);
    // one size for both curves: the biggest that fits (top ~200°, bottom ~110° of the curve, so
    // they never meet at the sides). Measured exactly as the editor lays curved letters out, and
    // on the real curve: an oval's curve is shorter than the circle's.
    const curveLen = (f: number, deg: number) => {
      const R = edgeR(f);
      return ellipsePerimeter(R * sx, R * sy) * (deg / 360);
    };
    let ls = 0.25;
    const fitOnArc = (t: El, deg: number, f0: number) => {
      let f = Math.min(t.fontSize || 3, 3.6);
      for (; f > 2; f -= 0.05) if (arcTextLen(String(t.text), f, ls) <= curveLen(f, deg)) break;
      return Math.max(2, +Math.min(f, f0).toFixed(2));
    };
    let f = Math.min(fitOnArc(topT, 200, 3.6), fitOnArc(botT, 110, 3.6));
    if (arcTextLen(String(topT.text), f, ls) > curveLen(f, 200) || arcTextLen(String(botT.text), f, ls) > curveLen(f, 110)) {
      ls = 0.1; // tighter letters before giving up
      f = Math.min(fitOnArc(topT, 200, 3.6), fitOnArc(botT, 110, 3.6));
    }
    const R = +edgeR(f).toFixed(2);
    const arcOf = (t: El, bottom: boolean): El => {
      const { x: _x, y: _y, align: _a, ...rest } = t;
      return { ...rest, type: 'arc-text', cx: ncx, cy: ncy, radius: R, fontSize: f, letterSpacing: ls, isReversed: bottom, startAngle: bottom ? 30 : -150, sweepAngle: bottom ? 120 : 300 };
    };
    out.set(topT.id, arcOf(topT, false));
    out.set(botT.id, arcOf(botT, true));
    // inner border(s) just inside the curved text, then the centre lines inside them
    let inR = R - f / 2 - 1;
    innerFrames
      .sort((a, b) => b.rel - a.rel)
      .forEach(({ e }) => {
        out.set(e.id, innerFrameAs(e, inR * sx, inR * sy));
        inR -= 1.2;
      });
    // centred icons between the top and bottom lines stack with the middle lines (never on top of them)
    const icons = elements.filter((e) => isCentreIcon(e, ocx) && midOf(e) > topT.y && midOf(e) < botT.y);
    const stack = [...middle, ...icons];
    if (stack.length)
      restack(stack, ncx, ncy, 2 * (inR * sx - 0.8) * 0.92, 2 * (inR * sy - 0.8) * 0.75, { rx: inR * sx - 0.8, ry: inR * sy - 0.8 }).forEach((t) => out.set(t.id, t));
    const others = elements.filter((e) => !frameIds.has(e.id) && !out.has(e.id));
    let k3 = unit;
    if (others.length) {
      const maxDist = Math.max(0.01, ...others.map((e) => reach(e, ocx, ocy).dist));
      k3 = Math.max(0.2, Math.min(unit, (inR * Math.min(sx, sy) - 0.5) / maxDist));
    }
    return elements.map((e) => {
      if (frameIds.has(e.id)) return newFrames[frames.findIndex((fr) => fr.e.id === e.id)];
      if (out.has(e.id)) return out.get(e.id);
      return scaleAbout(e, k3, ocx, ocy, ncx, ncy);
    });
  }

  // 2. Content → uniform scale, as large as fits inside the new frame (never larger than the size change)
  const content = elements.filter((e) => !frameIds.has(e.id) && !innerIds.has(e.id));
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

  // A plain text layout that would shrink below 2 mm: re-stack its lines at a readable size instead
  const straight = content.filter((e) => e.type === 'text');
  const onlyText = content.every((e) => e.type === 'text' || e.type === 'line');
  if (onlyText && straight.length && straight.some((e) => (e.fontSize || 3) * k < 1.95)) {
    const e0 = innermostEdge + 0.8;
    const boxW = toBox ? newW - 2 * e0 : (newW - 2 * e0) * 0.74;
    const boxH = toBox ? newH - 2 * e0 : (newH - 2 * e0) * 0.7;
    const ellipse = toBox ? undefined : { rx: newW / 2 - e0, ry: newH / 2 - e0 };
    const stacked = new Map(restack(straight, ncx, ncy, boxW, boxH, ellipse).map((t) => [t.id, t]));
    return elements.map((e) => {
      if (frameIds.has(e.id)) return newFrames[frames.findIndex((f) => f.e.id === e.id)];
      if (stacked.has(e.id)) return stacked.get(e.id);
      if (innerIds.has(e.id)) return null; // an inner frame would cut through the re-stacked lines
      return scaleAbout(e, k, ocx, ocy, ncx, ncy);
    }).filter(Boolean);
  }

  // the band between the outer border(s) and the outermost inner ring — before and after
  const band = (() => {
    if (!frames.length || !innerFrames.length) return null;
    const half = Math.min(oldW, oldH) / 2;
    const innerEdgeOf = (f: El) =>
      f.type === 'ring' ? f.radius - (f.strokeWidth || 0.5) / 2
      : f.type === 'serrated-ring' ? f.innerRadius
      : f.type === 'oval' ? Math.min(f.rx, f.ry) - (f.strokeWidth || 0.5) / 2
      : f.type === 'rect' ? Math.min(f.width, f.height) / 2 - (f.strokeWidth || 0.5) / 2
      : half;
    const oldOuter = Math.min(...frames.map((f) => innerEdgeOf(f.e)));
    const top = innerFrames.slice().sort((a, b) => b.rel - a.rel)[0];
    const oldInner = top.rel * half + (top.e.strokeWidth || 0.5) / 2;
    if (!(oldOuter > oldInner)) return null;
    const M = Math.max(newW, newH), m = Math.min(newW, newH);
    const r0 = top.rel * half * k;
    const sw = (top.e.strokeWidth || 0.5) / 2;
    const ax = Math.min(newW / 2 - innermostEdge - 0.6, r0 * (toOval ? newW / M : toBox ? newW / m : 1)) + sw;
    const ay = Math.min(newH / 2 - innermostEdge - 0.6, r0 * (toOval ? newH / M : toBox ? newH / m : 1)) + sw;
    return { oldInner, oldOuter, newInnerX: ax, newInnerY: ay, newOuterX: newW / 2 - innermostEdge, newOuterY: newH / 2 - innermostEdge };
  })();

  return elements.map((e) => {
    if (frameIds.has(e.id)) return newFrames[frames.findIndex((f) => f.e.id === e.id)];
    if (innerIds.has(e.id)) {
      // scaled exactly like the content around / inside it (so curved text never runs into it),
      // drawn in the new shape — on an oval stamp the same way the oval draws circles
      const rel = innerFrames.find((f) => f.e.id === e.id)!.rel;
      const r0 = rel * (Math.min(oldW, oldH) / 2) * k;
      const M = Math.max(newW, newH), m = Math.min(newW, newH);
      const edge = innermostEdge + 0.6;
      const ax = Math.min(newW / 2 - edge, r0 * (toOval ? newW / M : toBox ? newW / m : 1));
      const ay = Math.min(newH / 2 - edge, r0 * (toOval ? newH / M : toBox ? newH / m : 1));
      return innerFrameAs(e, Math.max(1, ax), Math.max(1, ay));
    }
    // a decoration in the band between the outer border(s) and the inner ring (e.g. the two side
    // stars) stays in that band in the new shape — same direction, same place across the band —
    // instead of being pulled into the middle
    if ((e.type === 'clipart' || e.type === 'qrcode') && band) {
      const dx = e.cx - ocx, dy = e.cy - ocy, d = Math.hypot(dx, dy);
      if (d > band.oldInner) {
        const frac = Math.min(1, Math.max(0, (d - band.oldInner) / Math.max(0.1, band.oldOuter - band.oldInner)));
        const ux = dx / (d || 1), uy = dy / (d || 1);
        // distance from the centre to an outline along this direction
        const along = (ax: number, ay: number) =>
          toBox ? Math.min(ax / Math.max(1e-6, Math.abs(ux)), ay / Math.max(1e-6, Math.abs(uy))) : 1 / Math.hypot(ux / ax, uy / ay);
        const rIn = along(band.newInnerX, band.newInnerY), rOut = along(band.newOuterX, band.newOuterY);
        const r = rIn + (rOut - rIn) * frac;
        const size = Math.min(e.width || e.size || 3, Math.max(1.2, (rOut - rIn) * 0.8));
        return { ...e, cx: +(ncx + ux * r).toFixed(2), cy: +(ncy + uy * r).toFixed(2), width: +size.toFixed(2), height: +size.toFixed(2), ...(e.size ? { size: +size.toFixed(2) } : {}) };
      }
    }
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

/** How far a border at the stamp edge sits inside the edge (mm), or null if `e` is not one. */
export function edgeBorderInset(e: El, w: number, h: number): number | null {
  if (!e || !['ring', 'oval', 'rect'].includes(e.type)) return null;
  return edgeInset(e, w, h);
}

/** The border's own box (geometry, mm). */
function frameBox(e: El): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (e.type === 'ring' && e.radius > 0) return { minX: e.cx - e.radius, minY: e.cy - e.radius, maxX: e.cx + e.radius, maxY: e.cy + e.radius };
  if (e.type === 'oval' && e.rx > 0 && e.ry > 0) return { minX: e.cx - e.rx, minY: e.cy - e.ry, maxX: e.cx + e.rx, maxY: e.cy + e.ry };
  if (e.type === 'rect' && e.width > 0 && e.height > 0) return { minX: e.x, minY: e.y, maxX: e.x + e.width, maxY: e.y + e.height };
  return null;
}

const r2 = (v: number) => Math.round(v * 100) / 100;
function translate(e: El, dx: number, dy: number): El {
  const out = { ...e };
  for (const k of ['cx', 'x', 'x1', 'x2']) if (typeof out[k] === 'number') out[k] = r2(out[k] + dx);
  for (const k of ['cy', 'y', 'y1', 'y2']) if (typeof out[k] === 'number') out[k] = r2(out[k] + dy);
  return out;
}

/**
 * The stamp background follows its outer border: after the border (ring / oval / box at the stamp
 * edge) is resized or reshaped, the canvas takes the border's shape and size, keeping the same
 * `inset` around it, and the whole design moves so the border sits centred in the new canvas.
 * `inset` omitted → the border's own distance from the top-left (used after undo / redo, where the
 * restored border is still in the coordinates of the canvas it belonged to).
 * Returns null when nothing has to change.
 */
export function fitCanvasToBorder(
  elements: El[],
  borderId: string,
  current: { shape: string; widthMm: number; heightMm: number },
  inset?: number,
  /** the border before it was changed — the rest of the design keeps its place relative to the border's centre */
  before?: El
): { shape: string; widthMm: number; heightMm: number; elements: El[] } | null {
  const border = elements.find((e) => e.id === borderId);
  const box = border && frameBox(border);
  if (!border || !box) return null;
  // a ring on an oval stamp is drawn stretched — leave that case alone
  if (border.type === 'ring' && current.shape === 'OVAL') return null;
  const mx = inset ?? box.minX;
  const my = inset ?? box.minY;
  if (mx < 0 || my < 0) return null;
  const w = r2(box.maxX - box.minX + 2 * mx);
  const h = r2(box.maxY - box.minY + 2 * my);
  if (w < 10 || h < 10 || w > 150 || h > 150) return null;

  let shape: string;
  if (border.type === 'ring') shape = 'ROUND';
  else if (border.type === 'oval') shape = Math.abs(border.rx - border.ry) < 0.25 ? 'ROUND' : 'OVAL';
  else shape = Math.abs(w - h) < 0.5 ? 'SQUARE' : 'RECTANGULAR';

  const dx = r2(mx - box.minX);
  const dy = r2(my - box.minY);
  // a border stretched from one side moves its centre: the contents move with it, so they stay centred
  const old = before && frameBox(before);
  const cdx = old ? r2((box.minX + box.maxX) / 2 - (old.minX + old.maxX) / 2) : 0;
  const cdy = old ? r2((box.minY + box.maxY) / 2 - (old.minY + old.maxY) / 2) : 0;
  if (shape === current.shape && Math.abs(w - current.widthMm) < 0.05 && Math.abs(h - current.heightMm) < 0.05 && !dx && !dy && !cdx && !cdy) return null;
  return {
    shape,
    widthMm: w,
    heightMm: h,
    elements: elements.map((e) => (e.id === borderId ? translate(e, dx, dy) : translate(e, dx + cdx, dy + cdy))),
  };
}

/** The outermost border (ring / oval / box) of a design — the one the background follows. */
export function outermostBorderId(elements: El[]): string | null {
  let best: { id: string; area: number } | null = null;
  for (const e of elements) {
    if (e.visible === false) continue;
    const b = frameBox(e);
    if (!b) continue;
    const area = (b.maxX - b.minX) * (b.maxY - b.minY);
    if (!best || area > best.area) best = { id: e.id, area };
  }
  return best?.id ?? null;
}

/**
 * A template (or any design) in another stamp shape: same texts and parts, laid out for the new
 * shape at the standard size closest in area. Returns the template unchanged if it already has
 * that shape.
 */
export function designInShape<T extends { shape: string; widthMm: number; heightMm: number; defaultData: { elements: any[] } }>(
  t: T,
  target: string,
  presets: Array<{ shape: string; widthMm: number; heightMm: number }>
): T {
  if (t.shape === target) return t;
  const pick = convertToBestSize(t.defaultData.elements || [], { shape: t.shape, widthMm: t.widthMm, heightMm: t.heightMm }, target, presets);
  if (!pick) return t;
  return { ...t, shape: target, widthMm: pick.widthMm, heightMm: pick.heightMm, defaultData: { ...t.defaultData, elements: pick.elements } };
}

/**
 * Lines of text crowding a frame: the closest gap (mm) between any straight text inside a box
 * frame and that frame's line. 99 = nothing inside a frame.
 */
function closestTextToFrame(els: El[]): number {
  let gap = 99;
  const frames = els.filter((e) => e.type === 'rect' && e.width > 0 && e.height > 0);
  for (const t of els) {
    if (t.type !== 'text' || !String(t.text || '').trim()) continue;
    const f = Number(t.fontSize) || 3;
    const top = t.y - f * 0.5, bottom = t.y + f * 0.5; // the full line box, as it looks next to a frame
    for (const r of frames) {
      const sw = (Number(r.strokeWidth) || 0.5) / 2;
      if (t.y < r.y || t.y > r.y + r.height) continue; // text not inside this frame
      gap = Math.min(gap, top - (r.y + sw), r.y + r.height - sw - bottom);
    }
  }
  return gap;
}

/**
 * A design converted to another shape at the right standard size: start at the size closest in
 * area and step up to bigger standard sizes while text would get under 2 mm or come closer than
 * 1 mm to a frame line — a designer picks a bigger stamp instead of cramming.
 */
export function convertToBestSize(
  elements: El[],
  from: { shape: string; widthMm: number; heightMm: number },
  target: string,
  presets: Array<{ shape: string; widthMm: number; heightMm: number }>
): { widthMm: number; heightMm: number; elements: El[] } | null {
  const area = from.widthMm * from.heightMm;
  const options = presets.filter((p) => p.shape === target);
  if (!options.length) return null;
  const best = options.reduce((a, b) => (Math.abs(b.widthMm * b.heightMm - area) < Math.abs(a.widthMm * a.heightMm - area) ? b : a));
  const sizes = [best, ...options.filter((p) => p.widthMm * p.heightMm > best.widthMm * best.heightMm).sort((a, b) => a.widthMm * a.heightMm - b.widthMm * b.heightMm)];
  const minText = (els: any[]) => Math.min(99, ...els.filter((e) => e.type === 'text' || e.type === 'arc-text').map((e) => Number(e.fontSize) || 99));
  const score = (els: any[]) => Math.min(minText(els) / 2, (closestTextToFrame(els) + 0.001) / 1); // ≥ 1 = fine
  let pick = { size: best, elements: [] as any[], s: -Infinity };
  for (const size of sizes) {
    const morphed = morphBetweenShapeFamilies(elements, from.widthMm, from.heightMm, size.widthMm, size.heightMm, target, from.shape);
    const els = matchBordersToShape(morphed, target, size.widthMm, size.heightMm).elements;
    const fits = arcsFit(els, size.widthMm, size.heightMm, target);
    const s = score(els) - (fits ? 0 : 0.5);
    if (s > pick.s + 0.02) pick = { size, elements: els, s };
    if (minText(els) >= 1.95 && closestTextToFrame(els) >= 1.0 && fits) break;
  }
  return { widthMm: pick.size.widthMm, heightMm: pick.size.heightMm, elements: pick.elements };
}

/**
 * A design moved to another stamp shape and/or size (what the AI asks for with "make it round",
 * "45 mm", …): borders, inner rings and text follow, and any border left in the old shape is
 * converted too. Without a size, the standard size of the new shape closest in area is used.
 */
export function reshapeDesign(
  elements: El[],
  from: { shape: string; widthMm: number; heightMm: number },
  to: { shape: string; widthMm?: number; heightMm?: number },
  presets: Array<{ shape: string; widthMm: number; heightMm: number }>
): { elements: El[]; widthMm: number; heightMm: number } {
  let w = Number(to.widthMm) || 0;
  let h = Number(to.heightMm) || 0;
  const sameSize = (!w || Math.abs(w - from.widthMm) < 0.05) && (!h || Math.abs(h - from.heightMm) < 0.05);
  if (to.shape !== from.shape && sameSize) {
    // the AI only named the shape: pick that shape's standard size closest in area
    const area = from.widthMm * from.heightMm;
    const options = presets.filter((p) => p.shape === to.shape);
    if (options.length) {
      const best = options.reduce((a, b) => (Math.abs(b.widthMm * b.heightMm - area) < Math.abs(a.widthMm * a.heightMm - area) ? b : a));
      w = best.widthMm;
      h = best.heightMm;
    }
  }
  w = w || from.widthMm;
  h = h || from.heightMm;
  if (to.shape === 'ROUND' || to.shape === 'SQUARE') w = h = Math.max(w, h);
  const morphed = morphBetweenShapeFamilies(elements, from.widthMm, from.heightMm, w, h, to.shape, from.shape);
  const fixed = matchBordersToShape(morphed, to.shape, w, h);
  return { elements: fixed.elements, widthMm: w, heightMm: h };
}

/**
 * Re-aligns a square / rectangular stamp that got out of line (an old conversion, things moved
 * by hand): frames evenly nested, the first line at the top, the last at the bottom, the rest
 * centred in the middle and every line fitted inside the frames. It goes through the round layout
 * and back at the same size, so it uses exactly the same rules as a shape change. Text never grows.
 */
export function realignBoxDesign(elements: El[], shape: string, w: number, h: number): El[] {
  if (shape !== 'SQUARE' && shape !== 'RECTANGULAR') return elements;
  const d = Math.min(w, h);
  const round = morphBetweenShapeFamilies(elements, w, h, d, d, 'ROUND', shape);
  const back = morphBetweenShapeFamilies(round, d, d, w, h, shape, 'ROUND');
  // text keeps its own size (or gets smaller to fit) — never bigger than it was
  const before = new Map(elements.map((e) => [e.id, e]));
  return matchBordersToShape(
    back.map((e) => {
      const old = before.get(e.id);
      if (old && (e.type === 'text' || e.type === 'arc-text') && Number(e.fontSize) > Number(old.fontSize)) return { ...e, fontSize: old.fontSize };
      return e;
    }),
    shape,
    w,
    h
  ).elements;
}

/**
 * Re-aligns a round / oval seal: rings, curved texts and the middle part centred exactly; top and
 * bottom curved text on the same curve and the same size; the middle lines (and a centred logo /
 * icon) stacked evenly inside the innermost ring; separator stars mirrored left / right.
 * Text never gets bigger.
 */
export function realignRoundDesign(elements: El[], shape: string, w: number, h: number): El[] {
  if (shape !== 'ROUND' && shape !== 'OVAL') return elements;
  const cx = w / 2, cy = h / 2;
  const near = (x: number, y: number) => Math.abs(x - cx) < w * 0.25 && Math.abs(y - cy) < h * 0.25;
  let out = elements.map((e) => {
    if (['ring', 'oval', 'serrated-ring', 'arc-text'].includes(e.type) && Number.isFinite(e.cx) && near(e.cx, e.cy)) return { ...e, cx: +cx.toFixed(2), cy: +cy.toFixed(2) };
    return e;
  });
  // top & bottom curved text: one curve, one size (the smaller), so they read as a pair
  const tops = out.filter((e) => e.type === 'arc-text' && !e.isReversed);
  const bottoms = out.filter((e) => e.type === 'arc-text' && e.isReversed);
  if (tops.length === 1 && bottoms.length === 1) {
    const [t, b] = [tops[0], bottoms[0]];
    const f = Math.min(Number(t.fontSize) || 3, Number(b.fontSize) || 3);
    const r = Math.min(Number(t.radius) || 0, Number(b.radius) || 0) || t.radius;
    out = out.map((e) => (e.id === t.id || e.id === b.id ? { ...e, fontSize: f, radius: r, ...(t.rx && t.ry ? { rx: t.rx, ry: t.ry } : {}), angleOffset: 0 } : e));
  }
  // the innermost ring inside the curved text = the area for the middle part
  const arcR = Math.min(...out.filter((e) => e.type === 'arc-text').map((e) => Number(e.radius) || 99), 99);
  const M = Math.max(w, h);
  const sx = shape === 'OVAL' ? w / M : 1, sy = shape === 'OVAL' ? h / M : 1;
  const inner = out
    .filter((e) => (e.type === 'ring' && e.radius < arcR) || (e.type === 'oval' && Math.min(e.rx, e.ry) < arcR))
    .map((e) => (e.type === 'ring' ? { rx: e.radius * sx, ry: e.radius * sy, sw: e.strokeWidth || 0.4 } : { rx: e.rx, ry: e.ry, sw: e.strokeWidth || 0.4 }))
    .sort((a, b) => b.rx - a.rx)[0];
  const area = inner
    ? { rx: inner.rx - inner.sw / 2 - 1.0, ry: inner.ry - inner.sw / 2 - 1.0 }
    : { rx: (arcR < 99 ? arcR * sx : w / 2) - 3, ry: (arcR < 99 ? arcR * sy : h / 2) - 3 };
  const middle = out.filter((e) => (e.type === 'text' && Math.abs(e.x - cx) < w * 0.3 && Math.abs(e.y - cy) < Math.max(area.ry, 2)) || (isCentreIcon(e, cx) && Math.abs(midOf(e) - cy) < Math.max(area.ry, 2)));
  if (middle.length && area.rx > 2 && area.ry > 2) {
    const stacked = new Map(restack(middle, cx, cy, area.rx * 2 * 0.92, area.ry * 2 * 0.85, area).map((e) => [e.id, e]));
    const before = new Map(elements.map((e) => [e.id, e]));
    out = out.map((e) => {
      const s = stacked.get(e.id);
      if (!s) return e;
      const old = before.get(e.id);
      return s.type === 'text' && old && Number(s.fontSize) > Number(old.fontSize) ? { ...s, fontSize: old.fontSize } : s;
    });
  }
  // separator stars: a mirrored pair (same height, same distance from the centre)
  const stars = out.filter((e) => e.type === 'clipart' && !middle.some((m) => m.id === e.id) && Number.isFinite(e.cx));
  const left = stars.filter((s) => s.cx < cx), right = stars.filter((s) => s.cx > cx);
  if (left.length === 1 && right.length === 1) {
    const [l, r] = [left[0], right[0]];
    const y = +((l.cy + r.cy) / 2).toFixed(2), d = +(((cx - l.cx) + (r.cx - cx)) / 2).toFixed(2);
    const size = Math.min(l.width || l.size || 2.5, r.width || r.size || 2.5);
    out = out.map((e) => (e.id === l.id ? { ...e, cx: +(cx - d).toFixed(2), cy: y, width: size, height: size } : e.id === r.id ? { ...e, cx: +(cx + d).toFixed(2), cy: y, width: size, height: size } : e));
  }
  return matchBordersToShape(out, shape, w, h).elements;
}

export type BorderKind = 'ring' | 'oval' | 'rect';

/** Centre and half-size of a ring / oval / box. */
function borderGeom(e: El): { cx: number; cy: number; hx: number; hy: number } | null {
  const n = (v: any) => (typeof v === 'string' ? parseFloat(v) : Number(v)); // saved designs may hold "12.5"
  if (e.type === 'ring' && n(e.radius) > 0) return { cx: n(e.cx), cy: n(e.cy), hx: n(e.radius), hy: n(e.radius) };
  if (e.type === 'oval' && n(e.rx) > 0 && n(e.ry) > 0) return { cx: n(e.cx), cy: n(e.cy), hx: n(e.rx), hy: n(e.ry) };
  if (e.type === 'rect' && n(e.width) > 0 && n(e.height) > 0) {
    const x = n(e.x) || 0, y = n(e.y) || 0;
    return { cx: x + n(e.width) / 2, cy: y + n(e.height) / 2, hx: n(e.width) / 2, hy: n(e.height) / 2 };
  }
  return null;
}

/**
 * One border in another shape — same centre, same line, about the same size: a box becomes the
 * circle that fits inside it, a circle becomes the square around the same area, an oval keeps its
 * width and height. On an oval stamp a circle is drawn stretched, so `stretch` (W/M, H/M) gives
 * the size it really shows at.
 */
export function convertBorder(e: El, to: BorderKind, stretch: { sx: number; sy: number } = { sx: 1, sy: 1 }): El {
  const g = borderGeom(e);
  if (!g || e.type === to) return e;
  // what the border looks like on screen (a ring on an oval stamp shows as an ellipse)
  let { hx, hy } = g;
  if (e.type === 'ring') { hx *= stretch.sx; hy *= stretch.sy; }
  const base = {
    id: e.id, name: e.name, visible: e.visible, locked: e.locked, groupId: e.groupId,
    strokeWidth: Number(e.strokeWidth ?? 0.6) || 0.6, strokeType: e.strokeType || 'solid',
    ...(e.pattern ? { pattern: e.pattern } : {}),
  };
  const r = (v: number) => +v.toFixed(2);
  // a dotted frame that was a pattern ring (dots / daisy / teeth) becomes that pattern ring again
  if (to === 'ring' && e.pattern && e.pattern.type === 'serrated-ring') {
    const band = Math.max(0.6, (e.pattern.outerRadius || 0) - (e.pattern.innerRadius || 0));
    const outer = Math.min(hx / stretch.sx, hy / stretch.sy) + band / 2; // geometry = middle of the band
    const { pattern: _p, ...orig } = e.pattern;
    return { ...orig, id: e.id, name: e.name, visible: e.visible, locked: e.locked, groupId: e.groupId, type: 'serrated-ring', cx: r(g.cx), cy: r(g.cy), outerRadius: r(outer), innerRadius: r(outer - band) };
  }
  if (to === 'ring') {
    // the stamp draws a ring stretched by `stretch`: pick the radius that stays inside the old shape
    const radius = Math.min(hx / stretch.sx, hy / stretch.sy);
    return { ...base, type: 'ring', cx: r(g.cx), cy: r(g.cy), radius: r(radius) };
  }
  if (to === 'oval') {
    // a circle turned oval gets a classic seal proportion (wider than tall)
    if (Math.abs(hx - hy) < 0.3) hy = hx * 0.68;
    return { ...base, type: 'oval', cx: r(g.cx), cy: r(g.cy), rx: r(hx), ry: r(hy) };
  }
  return { ...base, type: 'rect', x: r(g.cx - hx), y: r(g.cy - hy), width: r(2 * hx), height: r(2 * hy), rx: 1, ry: 1 };
}

/** The border type that belongs to a stamp shape. */
export const borderKindFor = (shape: string): BorderKind => (shape === 'OVAL' ? 'oval' : shape === 'ROUND' ? 'ring' : 'rect');

/**
 * Turns every border around the stamp centre (rings, ovals, box frames) into the stamp's own shape —
 * e.g. square frames left inside a round stamp become circles. Small boxes (dividers, fields) and
 * anything off-centre are left alone. Returns how many borders changed.
 */
export function matchBordersToShape(elements: El[], shape: string, w: number, h: number): { elements: El[]; changed: number } {
  const to = borderKindFor(shape);
  const M = Math.max(w, h);
  const m = Math.min(w, h);
  const stretch = shape === 'OVAL' ? { sx: w / M, sy: h / M } : { sx: 1, sy: 1 };
  let changed = 0;
  const out = elements.map((e) => {
    if (e.type === to) return e;
    const g = borderGeom(e);
    if (!g || ![g.cx, g.cy, g.hx, g.hy].every(Number.isFinite)) return e;
    // a frame around the design: near the centre (a nudged border still counts), or simply big
    const centred = Math.abs(g.cx - w / 2) < Math.max(0.8, m * 0.12) && Math.abs(g.cy - h / 2) < Math.max(0.8, m * 0.12);
    const size = Math.min(g.hx, g.hy) * 2;
    const isFrame = centred ? size >= m * 0.2 : size >= m * 0.45;
    // on an oval stamp a ring already shows as an oval — leave it
    if (!isFrame || (to === 'oval' && e.type === 'ring')) return e;
    changed++;
    const c = convertBorder(e, to, stretch);
    if (!centred) return c;
    // a slightly nudged frame goes back to the exact centre of the stamp
    if (c.type === 'rect') return { ...c, x: +(w / 2 - c.width / 2).toFixed(2), y: +(h / 2 - c.height / 2).toFixed(2) };
    return { ...c, cx: +(w / 2).toFixed(2), cy: +(h / 2).toFixed(2) };
  });
  return { elements: changed ? out : elements, changed };
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
