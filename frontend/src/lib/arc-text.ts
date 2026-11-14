import { ArcTextElement } from '../types/stamp';

export interface ArcGlyph {
  char: string;
  x: number;
  y: number;
  rotation: number; // in degrees
  angleRad: number;
}

function getCharWidthRatio(char: string): number {
  if (char === ' ' || char === '\t') return 0.38;
  if ('ijl1!|.,;:\'"`'.includes(char)) return 0.32;
  if ('frtI-()[]{}'.includes(char)) return 0.44;
  if ('mwMW@★#%&'.includes(char)) return 0.85;
  if ('ABCDEFGHJKLNOPQRSTUVWXYZ023456789'.includes(char)) return 0.62;
  return 0.55;
}

/**
 * Calculates position and rotation for each character in an arc text element.
 * Text is dynamically centered at the 12 o'clock (top) or 6 o'clock (bottom) apex,
 * naturally expanding outward according to text length and font size.
 */
export function calculateArcGlyphs(
  elementOrText: ArcTextElement | string,
  cxParam?: number,
  cyParam?: number,
  radiusParam?: number,
  startAngleParam?: number,
  sweepAngleParam?: number,
  isReversedParam?: boolean,
  letterSpacingParam?: number,
  rxParam?: number,
  ryParam?: number,
  angleOffsetParam?: number
): ArcGlyph[] {
  const isObject = typeof elementOrText === 'object' && elementOrText !== null;
  const text = isObject ? elementOrText.text : (elementOrText as string);
  const cx = cxParam ?? (isObject ? elementOrText.cx : 0);
  const cy = cyParam ?? (isObject ? elementOrText.cy : 0);
  const radius = radiusParam ?? (isObject ? elementOrText.radius : 15);
  const rx = rxParam ?? (isObject ? (elementOrText as any).rx : undefined) ?? radius;
  const ry = ryParam ?? (isObject ? (elementOrText as any).ry : undefined) ?? radius;
  const isReversed = isReversedParam ?? (isObject ? (elementOrText.isReversed ?? false) : false);
  const fontSize = isObject ? (elementOrText.fontSize ?? 3.0) : 3.0;
  const letterSpacing = letterSpacingParam ?? (isObject ? (elementOrText.letterSpacing ?? 0) : 0);
  const angleOffset = angleOffsetParam ?? (isObject ? (elementOrText.angleOffset ?? 0) : 0);

  if (!text || text.length === 0 || rx <= 0 || ry <= 0) return [];

  const chars = Array.from(text);
  const numChars = chars.length;
  const glyphs: ArcGlyph[] = [];

  // Calculate individual physical millimeter widths for each character
  const charWidthsMm = chars.map((char) => getCharWidthRatio(char) * fontSize + letterSpacing);
  const totalLengthMm = charWidthsMm.reduce((sum, w) => sum + w, 0);

  // Exact linear velocity along ellipse at parameter angle t (mm per radian)
  const getSpeed = (t: number) => {
    const dx = rx * Math.sin(t);
    const dy = ry * Math.cos(t);
    return Math.max(0.1, Math.sqrt(dx * dx + dy * dy));
  };

  // Advance parameter angle t by an exact millimeter distance along the ellipse contour
  const advanceAngle = (fromT: number, distMm: number, dir: 1 | -1) => {
    let t = fromT;
    let remaining = distMm;
    const maxSteps = 30;
    for (let s = 0; s < maxSteps && remaining > 0.005; s++) {
      const step = Math.min(remaining, 1.5);
      const v = getSpeed(t);
      t += dir * (step / v);
      remaining -= step;
    }
    return t;
  };

  const offsetRad = (angleOffset * Math.PI) / 180;

  if (isReversed) {
    // --- Bottom Arc: Centered at 6 o'clock apex (+90° = Math.PI / 2) + angleOffset ---
    // Text reads left to right (clockwise along bottom, decreasing parameter t)
    const apexT = Math.PI / 2 + offsetRad;
    let currentT = advanceAngle(apexT, totalLengthMm / 2, +1); // Start at left (+t direction)

    for (let i = 0; i < numChars; i++) {
      const char = chars[i];
      const charWidth = charWidthsMm[i];

      // Place character centered in its character width slot
      const charT = advanceAngle(currentT, charWidth / 2, -1);
      const x = cx + rx * Math.cos(charT);
      const y = cy + ry * Math.sin(charT);

      // Tangent vector in direction of reading (decreasing t): (-dx/dt, -dy/dt) = (rx * sin(t), -ry * cos(t))
      const tangent = Math.atan2(-ry * Math.cos(charT), rx * Math.sin(charT));
      const rotationDeg = (tangent * 180) / Math.PI;

      glyphs.push({
        char,
        x: Number(x.toFixed(3)),
        y: Number(y.toFixed(3)),
        rotation: Number(rotationDeg.toFixed(2)),
        angleRad: charT,
      });

      currentT = advanceAngle(charT, charWidth / 2, -1);
    }
  } else {
    // --- Top Arc: Centered at 12 o'clock apex (-90° = -Math.PI / 2) + angleOffset ---
    // Text reads left to right (counter-clockwise along top, increasing parameter t)
    const apexT = -Math.PI / 2 + offsetRad;
    let currentT = advanceAngle(apexT, totalLengthMm / 2, -1); // Start at left (-t direction)

    for (let i = 0; i < numChars; i++) {
      const char = chars[i];
      const charWidth = charWidthsMm[i];

      // Place character centered in its character width slot
      const charT = advanceAngle(currentT, charWidth / 2, +1);
      const x = cx + rx * Math.cos(charT);
      const y = cy + ry * Math.sin(charT);

      // Tangent vector in direction of reading (increasing t): (dx/dt, dy/dt) = (-rx * sin(t), ry * cos(t))
      const tangent = Math.atan2(ry * Math.cos(charT), -rx * Math.sin(charT));
      const rotationDeg = (tangent * 180) / Math.PI;

      glyphs.push({
        char,
        x: Number(x.toFixed(3)),
        y: Number(y.toFixed(3)),
        rotation: Number(rotationDeg.toFixed(2)),
        angleRad: charT,
      });

      currentT = advanceAngle(charT, charWidth / 2, +1);
    }
  }

  return glyphs;
}

/**
 * Generates an SVG path string for circular text path definition
 */
export function getArcPathDefinition(
  cx: number,
  cy: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number,
  isReversed = false
): string {
  const startRad = (startAngleDeg * Math.PI) / 180;
  const endRad = (endAngleDeg * Math.PI) / 180;

  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);

  const deltaAngle = Math.abs(endAngleDeg - startAngleDeg);
  const largeArcFlag = deltaAngle > 180 ? 1 : 0;
  const sweepFlag = isReversed ? 0 : 1;

  return `M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${radius.toFixed(3)} ${radius.toFixed(3)} 0 ${largeArcFlag} ${sweepFlag} ${x2.toFixed(3)} ${y2.toFixed(3)}`;
}

/**
 * Generates an SVG path string for a circular leaf-wreath garland ring
 */
export function generateLeafWreathPath(
  cx: number,
  cy: number,
  stemRadius: number,
  leafLength = 1.6,
  count = 54
): string {
  const paths: string[] = [];
  const step = (Math.PI * 2) / count;

  for (let i = 0; i < count; i++) {
    const angle = i * step - Math.PI / 2;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const bx = cx + stemRadius * cosA;
    const by = cy + stemRadius * sinA;

    const cxTip = cx + (stemRadius + leafLength) * cosA;
    const cyTip = cy + (stemRadius + leafLength) * sinA;

    const w = leafLength * 0.28;
    const px = -sinA * w;
    const py = cosA * w;

    const midX = (bx + cxTip) / 2;
    const midY = (by + cyTip) / 2;
    paths.push(
      `M ${bx.toFixed(3)},${by.toFixed(3)} Q ${(midX + px).toFixed(3)},${(midY + py).toFixed(3)} ${cxTip.toFixed(3)},${cyTip.toFixed(3)} Q ${(midX - px).toFixed(3)},${(midY - py).toFixed(3)} ${bx.toFixed(3)},${by.toFixed(3)}`
    );

    const leftAngle = angle - 0.52;
    const lxTip = cx + (stemRadius + leafLength * 0.82) * Math.cos(leftAngle);
    const lyTip = cy + (stemRadius + leafLength * 0.82) * Math.sin(leftAngle);
    const lMidX = (bx + lxTip) / 2;
    const lMidY = (by + lyTip) / 2;
    const lPx = -Math.sin(leftAngle) * (w * 0.75);
    const lPy = Math.cos(leftAngle) * (w * 0.75);
    paths.push(
      `M ${bx.toFixed(3)},${by.toFixed(3)} Q ${(lMidX + lPx).toFixed(3)},${(lMidY + lPy).toFixed(3)} ${lxTip.toFixed(3)},${lyTip.toFixed(3)} Q ${(lMidX - lPx).toFixed(3)},${(lMidY - lPy).toFixed(3)} ${bx.toFixed(3)},${by.toFixed(3)}`
    );

    const rightAngle = angle + 0.52;
    const rxTip = cx + (stemRadius + leafLength * 0.82) * Math.cos(rightAngle);
    const ryTip = cy + (stemRadius + leafLength * 0.82) * Math.sin(rightAngle);
    const rMidX = (bx + rxTip) / 2;
    const rMidY = (by + ryTip) / 2;
    const rPx = -Math.sin(rightAngle) * (w * 0.75);
    const rPy = Math.cos(rightAngle) * (w * 0.75);
    paths.push(
      `M ${bx.toFixed(3)},${by.toFixed(3)} Q ${(rMidX + rPx).toFixed(3)},${(rMidY + rPy).toFixed(3)} ${rxTip.toFixed(3)},${ryTip.toFixed(3)} Q ${(rMidX - rPx).toFixed(3)},${(rMidY - rPy).toFixed(3)} ${bx.toFixed(3)},${by.toFixed(3)}`
    );
  }

  return paths.join(' ');
}

/**
 * Style 2: Checkered / Square Block Chain
 */
export function generateCheckeredPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  count = 60
): string {
  const paths: string[] = [];
  const step = (Math.PI * 2) / count;

  for (let i = 0; i < count; i += 2) {
    const a1 = i * step - Math.PI / 2;
    const a2 = (i + 1) * step - Math.PI / 2;

    const x1in = cx + innerRadius * Math.cos(a1);
    const y1in = cy + innerRadius * Math.sin(a1);
    const x1out = cx + outerRadius * Math.cos(a1);
    const y1out = cy + outerRadius * Math.sin(a1);

    const x2out = cx + outerRadius * Math.cos(a2);
    const y2out = cy + outerRadius * Math.sin(a2);
    const x2in = cx + innerRadius * Math.cos(a2);
    const y2in = cy + innerRadius * Math.sin(a2);

    paths.push(
      `M ${x1in.toFixed(3)},${y1in.toFixed(3)} L ${x1out.toFixed(3)},${y1out.toFixed(3)} L ${x2out.toFixed(3)},${y2out.toFixed(3)} L ${x2in.toFixed(3)},${y2in.toFixed(3)} Z`
    );
  }

  return paths.join(' ');
}

/**
 * Style 3: Floral Rosette / Blossom Chain
 */
export function generateFloralChainPath(
  cx: number,
  cy: number,
  radius: number,
  count = 42
): string {
  const paths: string[] = [];
  const step = (Math.PI * 2) / count;
  const petalR = 0.55;

  for (let i = 0; i < count; i++) {
    const angle = i * step - Math.PI / 2;
    const fx = cx + radius * Math.cos(angle);
    const fy = cy + radius * Math.sin(angle);

    // 4 small petals around rosette center
    for (let p = 0; p < 4; p++) {
      const pa = angle + (p * Math.PI) / 2;
      const px = fx + petalR * Math.cos(pa);
      const py = fy + petalR * Math.sin(pa);
      paths.push(
        `M ${fx.toFixed(3)},${fy.toFixed(3)} Q ${(fx + (px - fx) * 1.3).toFixed(3)},${(fy + (py - fy) * 1.3).toFixed(3)} ${px.toFixed(3)},${py.toFixed(3)}`
      );
    }
  }

  return paths.join(' ');
}

/**
 * Style 4: Rope / Wheat Grain Braid
 */
export function generateRopePath(
  cx: number,
  cy: number,
  radius: number,
  count = 50
): string {
  const paths: string[] = [];
  const step = (Math.PI * 2) / count;

  for (let i = 0; i < count; i++) {
    const angle = i * step - Math.PI / 2;
    const tilt = angle + 0.65; // 37 deg tilt

    const rx = cx + radius * Math.cos(angle);
    const ry = cy + radius * Math.sin(angle);

    const x1 = rx - 0.7 * Math.cos(tilt);
    const y1 = ry - 0.7 * Math.sin(tilt);
    const x2 = rx + 0.7 * Math.cos(tilt);
    const y2 = ry + 0.7 * Math.sin(tilt);

    paths.push(`M ${x1.toFixed(3)},${y1.toFixed(3)} L ${x2.toFixed(3)},${y2.toFixed(3)}`);
  }

  return paths.join(' ');
}

/**
 * Style 5: Beaded Semicircular Scallops
 */
export function generateBeadedPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  count = 54
): string {
  const points: string[] = [];
  const step = (Math.PI * 2) / count;

  for (let i = 0; i < count; i++) {
    const a1 = i * step - Math.PI / 2;
    const a2 = (i + 1) * step - Math.PI / 2;

    const x1 = cx + innerRadius * Math.cos(a1);
    const y1 = cy + innerRadius * Math.sin(a1);
    const x2 = cx + innerRadius * Math.cos(a2);
    const y2 = cy + innerRadius * Math.sin(a2);

    const midA = (a1 + a2) / 2;
    const mx = cx + outerRadius * Math.cos(midA);
    const my = cy + outerRadius * Math.sin(midA);

    points.push(`M ${x1.toFixed(3)},${y1.toFixed(3)} Q ${mx.toFixed(3)},${my.toFixed(3)} ${x2.toFixed(3)},${y2.toFixed(3)}`);
  }

  return points.join(' ');
}

/**
 * Style 6: Large Scalloped Waves
 */
export function generateScallopPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  count = 28
): string {
  const points: string[] = [];
  const step = (Math.PI * 2) / count;

  for (let i = 0; i < count; i++) {
    const a1 = i * step - Math.PI / 2;
    const a2 = (i + 1) * step - Math.PI / 2;

    const x1 = cx + innerRadius * Math.cos(a1);
    const y1 = cy + innerRadius * Math.sin(a1);
    const x2 = cx + innerRadius * Math.cos(a2);
    const y2 = cy + innerRadius * Math.sin(a2);

    const midA = (a1 + a2) / 2;
    const mx = cx + outerRadius * Math.cos(midA);
    const my = cy + outerRadius * Math.sin(midA);

    points.push(`M ${x1.toFixed(3)},${y1.toFixed(3)} Q ${mx.toFixed(3)},${my.toFixed(3)} ${x2.toFixed(3)},${y2.toFixed(3)}`);
  }

  return points.join(' ');
}

/**
 * Style 7: Daisy Flower Band
 */
export function generateDaisyBandPath(
  cx: number,
  cy: number,
  radius: number,
  count = 36
): string {
  const paths: string[] = [];
  const step = (Math.PI * 2) / count;

  for (let i = 0; i < count; i++) {
    const angle = i * step - Math.PI / 2;
    const dx = cx + radius * Math.cos(angle);
    const dy = cy + radius * Math.sin(angle);

    // 6 tiny petals around center dot
    for (let p = 0; p < 6; p++) {
      const pa = (p * Math.PI) / 3;
      const px = dx + 0.5 * Math.cos(pa);
      const py = dy + 0.5 * Math.sin(pa);
      paths.push(`M ${dx.toFixed(3)},${dy.toFixed(3)} L ${px.toFixed(3)},${py.toFixed(3)}`);
    }
  }

  return paths.join(' ');
}

/**
 * Style 8: Diamond Ornament Chain
 */
export function generateDiamondChainPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  count = 48
): string {
  const paths: string[] = [];
  const step = (Math.PI * 2) / count;
  const midR = (innerRadius + outerRadius) / 2;

  for (let i = 0; i < count; i++) {
    const a1 = i * step - Math.PI / 2;
    const a2 = (i + 1) * step - Math.PI / 2;
    const midA = (a1 + a2) / 2;

    const x1 = cx + midR * Math.cos(a1);
    const y1 = cy + midR * Math.sin(a1);
    const xTop = cx + outerRadius * Math.cos(midA);
    const yTop = cy + outerRadius * Math.sin(midA);
    const x2 = cx + midR * Math.cos(a2);
    const y2 = cy + midR * Math.sin(a2);
    const xBot = cx + innerRadius * Math.cos(midA);
    const yBot = cy + innerRadius * Math.sin(midA);

    paths.push(
      `M ${x1.toFixed(3)},${y1.toFixed(3)} L ${xTop.toFixed(3)},${yTop.toFixed(3)} L ${x2.toFixed(3)},${y2.toFixed(3)} L ${xBot.toFixed(3)},${yBot.toFixed(3)} Z`
    );
  }

  return paths.join(' ');
}

/**
 * Generates polygon points for serrated notary starburst seals or custom decorative border styles
 */
// Decorative border paths are expensive (wreaths have hundreds of curves) but depend only on their
// inputs, so cache them — dragging any layer must not rebuild a border that did not change.
const serratedPathCache = new Map<string, string>();

export function generateSerratedPath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  teeth = 48,
  isWreath: boolean | string = false
): string {
  const key = `${cx}|${cy}|${outerRadius}|${innerRadius}|${teeth}|${isWreath}`;
  const hit = serratedPathCache.get(key);
  if (hit !== undefined) return hit;
  const d = buildSerratedPath(cx, cy, outerRadius, innerRadius, teeth, isWreath);
  if (serratedPathCache.size > 300) serratedPathCache.clear();
  serratedPathCache.set(key, d);
  return d;
}

function buildSerratedPath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  teeth = 48,
  isWreath: boolean | string = false
): string {
  const style = typeof isWreath === 'string' ? isWreath : isWreath ? 'wreath' : 'serrated';
  const leafLen = Math.max(0.8, outerRadius - innerRadius);

  switch (style) {
    case 'wreath':
    case 'leaf':
      return generateLeafWreathPath(cx, cy, innerRadius, leafLen, teeth || 54);
    case 'checkered':
    case 'square':
      return generateCheckeredPath(cx, cy, innerRadius, outerRadius, teeth || 60);
    case 'flower':
    case 'blossom':
      return generateFloralChainPath(cx, cy, (innerRadius + outerRadius) / 2, teeth || 42);
    case 'rope':
    case 'wheat':
      return generateRopePath(cx, cy, (innerRadius + outerRadius) / 2, teeth || 50);
    case 'beaded':
    case 'dots':
      return generateBeadedPath(cx, cy, innerRadius, outerRadius, teeth || 54);
    case 'scallop':
    case 'waves':
      return generateScallopPath(cx, cy, innerRadius, outerRadius, teeth || 28);
    case 'daisy':
      return generateDaisyBandPath(cx, cy, (innerRadius + outerRadius) / 2, teeth || 36);
    case 'diamond':
      return generateDiamondChainPath(cx, cy, innerRadius, outerRadius, teeth || 48);
    default: {
      const points: string[] = [];
      const totalPoints = teeth * 2;
      const step = (Math.PI * 2) / totalPoints;

      for (let i = 0; i < totalPoints; i++) {
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = i * step - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        points.push(`${x.toFixed(3)},${y.toFixed(3)}`);
      }

      return `M ${points.join(' L ')} Z`;
    }
  }
}

// ── Pattern borders on any outline ──────────────────────────────────────────────────────────────
// A decorative border (leaf wreath, daisy, rope, checkered, beads, scallop, diamonds, teeth) is
// designed around a circle. To put the SAME pattern on a square / rectangular / oval stamp, it is
// built around a circle with the outline's length and then bent onto the outline point by point:
// position along the circle → position along the outline, distance from the circle → distance
// from the outline. Every motif keeps its look and size; only the path it follows changes.

export type PatternFrameGeom =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; r: number }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number };

/** Evenly sampled outline (clockwise from the top middle): position + outward normal by length. */
function sampleOutline(g: PatternFrameGeom) {
  const pts: Array<[number, number]> = [];
  if (g.kind === 'ellipse') {
    const N = 1440;
    for (let i = 0; i < N; i++) {
      const t = -Math.PI / 2 + (i / N) * Math.PI * 2;
      pts.push([g.cx + g.rx * Math.cos(t), g.cy + g.ry * Math.sin(t)]);
    }
  } else {
    const { x, y, w, h } = g;
    const r = Math.max(0, Math.min(g.r, w / 2, h / 2));
    const line = (x0: number, y0: number, x1: number, y1: number) => {
      const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.1));
      for (let i = 0; i < n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n]);
    };
    const corner = (ccx: number, ccy: number, a0: number) => {
      if (r <= 0) return;
      const n = Math.max(4, Math.ceil((r * Math.PI) / 2 / 0.1));
      for (let i = 0; i < n; i++) {
        const a = a0 + (Math.PI / 2) * (i / n);
        pts.push([ccx + r * Math.cos(a), ccy + r * Math.sin(a)]);
      }
    };
    line(x + w / 2, y, x + w - r, y);
    corner(x + w - r, y + r, -Math.PI / 2);
    line(x + w, y + r, x + w, y + h - r);
    corner(x + w - r, y + h - r, 0);
    line(x + w - r, y + h, x + r, y + h);
    corner(x + r, y + h - r, Math.PI / 2);
    line(x, y + h - r, x, y + r);
    corner(x + r, y + r, Math.PI);
    line(x + r, y, x + w / 2, y);
  }
  const cum = [0];
  for (let i = 1; i <= pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i % pts.length];
    cum.push(cum[i - 1] + Math.hypot(bx - ax, by - ay));
  }
  const length = cum[cum.length - 1];
  const at = (s: number) => {
    s = ((s % length) + length) % length;
    let lo = 0, hi = pts.length;
    while (lo < hi - 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= s) lo = mid; else hi = mid; }
    const [ax, ay] = pts[lo], [bx, by] = pts[(lo + 1) % pts.length];
    const seg = cum[lo + 1] - cum[lo] || 1e-6;
    const k = (s - cum[lo]) / seg;
    const tx = bx - ax, ty = by - ay, tl = Math.hypot(tx, ty) || 1;
    // clockwise on screen (y down): the outward normal is the tangent turned left
    return { x: ax + tx * k, y: ay + ty * k, nx: ty / tl, ny: -tx / tl };
  };
  return { length, at };
}

const patternFrameCache = new Map<string, string>();

/**
 * The path of a pattern border along a rectangle / ellipse. `band` = the pattern's width (mm),
 * `motifSpacing` = distance between motifs (mm) taken from the original circular pattern.
 */
export function generatePatternFrame(g: PatternFrameGeom, band: number, motifSpacing: number, style: string | boolean, origTeeth = 48): string {
  const key = JSON.stringify([g, band, motifSpacing, style, origTeeth]);
  const hit = patternFrameCache.get(key);
  if (hit !== undefined) return hit;
  // corners: a gentle curve (≥ 1.6 × the pattern's width) so motifs turn smoothly instead of
  // being squeezed and folded on the inside of the corner
  // (filled patterns — leaf wreath, checks — need a gentler corner still)
  const cornerK = /^(wreath|leaf)$/.test(String(style)) || style === true ? 4.5 : /^(checkered|square)$/.test(String(style)) ? 2.6 : 1.6;
  const geom: PatternFrameGeom = g.kind === 'rect' ? { ...g, r: Math.min(Math.max(g.r, band * cornerK, 1.5), g.w / 2, g.h / 2) } : g;
  const outline = sampleOutline(geom);
  const L = outline.length;
  const Rm = L / (2 * Math.PI);
  // a multiple of 4 motifs: one sits exactly at the middle of every side, so the border is
  // symmetric left / right and top / bottom (and alternating patterns stay even)
  const teeth = Math.max(8, Math.round(L / Math.max(0.5, motifSpacing) / 4) * 4);
  const circle = buildSerratedPath(0, 0, Rm + band / 2, Rm - band / 2, teeth, style);
  // bend every point of the circular pattern onto the outline
  const tokens = circle.match(/[MLQCZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
  const out: string[] = [];
  let pending: number | null = null;
  for (const tk of tokens) {
    if (/^[MLQCZ]$/i.test(tk)) { out.push(tk); pending = null; continue; }
    const v = parseFloat(tk);
    if (pending === null) { pending = v; continue; }
    const px = pending, py = v;
    pending = null;
    const r = Math.hypot(px, py);
    const theta = Math.atan2(py, px);
    const u = (((theta + Math.PI / 2) / (2 * Math.PI)) % 1 + 1) % 1;
    const p = outline.at(u * L);
    const off = r - Rm;
    out.push(`${(p.x + p.nx * off).toFixed(3)},${(p.y + p.ny * off).toFixed(3)}`);
  }
  const d = out.join(' ').replace(/ ,/g, ',');
  if (patternFrameCache.size > 200) patternFrameCache.clear();
  patternFrameCache.set(key, d);
  return d;
}

/** The pattern of a frame that was converted from a pattern ring (or null). */
export function framePattern(el: any): { style: string | boolean; band: number; spacing: number; teeth: number; fill: boolean } | null {
  const p = el?.pattern;
  if (!p || p.type !== 'serrated-ring') return null;
  const style = p.wreathStyle || p.wreath || false;
  const band = Math.max(0.6, (Number(p.outerRadius) || 0) - (Number(p.innerRadius) || 0));
  const teeth = Number(p.teeth) || 48;
  const Rmean = ((Number(p.outerRadius) || 10) + (Number(p.innerRadius) || 9)) / 2;
  const fill = !!style && (style === true || style === 'wreath' || style === 'checkered' || style === 'diamond');
  return { style, band, spacing: (2 * Math.PI * Rmean) / teeth, teeth, fill };
}

/**
 * Calculates the exact (x, y) coordinates of the apex (center) of the arc text along its circular guide line.
 */
export function getArcApexPoint(
  arc: ArcTextElement,
  widthMm?: number,
  heightMm?: number,
  shape?: string
): { x: number; y: number; angleRad: number; angleDeg: number } {
  const isOvalShape = shape === 'OVAL';
  const maxDim = Math.max(widthMm || 40, heightMm || 40);
  const rx = (arc as any).rx || (isOvalShape ? arc.radius * ((widthMm || 40) / maxDim) : arc.radius);
  const ry = (arc as any).ry || (isOvalShape ? arc.radius * ((heightMm || 40) / maxDim) : arc.radius);
  const angleOffset = arc.angleOffset || 0;
  const offsetRad = (angleOffset * Math.PI) / 180;
  const apexT = arc.isReversed ? Math.PI / 2 + offsetRad : -Math.PI / 2 + offsetRad;

  return {
    x: Number((arc.cx + rx * Math.cos(apexT)).toFixed(3)),
    y: Number((arc.cy + ry * Math.sin(apexT)).toFixed(3)),
    angleRad: apexT,
    angleDeg: Number(((apexT * 180) / Math.PI).toFixed(1)),
  };
}
