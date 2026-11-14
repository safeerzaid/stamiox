/**
 * Logo → rubber-stamp conversion.
 *
 * A rubber stamp prints one ink colour, so an uploaded logo is turned into a
 * 1-bit silhouette: pixels darker than `threshold` become ink, the rest is
 * removed. The result is stored as a white-on-transparent PNG and used as an
 * SVG luminance mask over a rectangle filled with the current ink colour, so
 * the logo always follows ink colour, laser-invert and mirror settings.
 */

export const LOGO_MAX_SOURCE_PX = 900; // downscale big uploads to keep projects light
export const DEFAULT_LOGO_THRESHOLD = 150;

export interface ProcessedLogo {
  maskSrc: string; // white-on-transparent PNG data URL, trimmed to the ink area
  aspect: number; // width / height of the trimmed mask
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read this image file.'));
    img.src = src;
  });

/** Read a File as a data URL, downscaling raster images that are larger than needed. */
export async function readLogoFile(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read this file.'));
    r.readAsDataURL(file);
  });
  const img = await loadImage(raw);
  const w = img.naturalWidth || 600;
  const h = img.naturalHeight || 600;
  const scale = Math.min(1, LOGO_MAX_SOURCE_PX / Math.max(w, h));
  // SVGs and small images are kept as-is; SVGs are rasterized at a good size below.
  if (scale === 1 && !file.type.includes('svg')) return raw;
  const target = file.type.includes('svg') ? LOGO_MAX_SOURCE_PX / Math.max(w, h) : scale;
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * target));
  c.height = Math.max(1, Math.round(h * target));
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}

/**
 * Is this a light logo (white/pale artwork) rather than a dark one?
 *  - On a transparent background: the visible artwork is mostly light.
 *  - On a solid background: the background (image border) is dark, so the artwork is the light part.
 */
export function detectLightLogo(px: Uint8ClampedArray, w: number, h: number): boolean {
  const lumAt = (i: number) => 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
  const step = Math.max(1, Math.floor(Math.sqrt((w * h) / 40000))); // sample ~40k pixels
  let transparent = 0, total = 0, opaqueLum = 0, opaque = 0;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4;
      total++;
      if (px[i + 3] <= 110) transparent++;
      else { opaque++; opaqueLum += lumAt(i); }
    }
  }
  if (!opaque) return false;
  if (transparent / total > 0.05) return opaqueLum / opaque > 170;

  // solid background → look at the border ring
  let borderLum = 0, n = 0;
  const sample = (x: number, y: number) => { borderLum += lumAt((y * w + x) * 4); n++; };
  for (let x = 0; x < w; x += step) { sample(x, 0); sample(x, h - 1); }
  for (let y = 0; y < h; y += step) { sample(0, y); sample(w - 1, y); }
  return borderLum / n < 90;
}

/** Every logo edit; all optional — defaults give the plain silhouette. */
export interface LogoEdit {
  threshold?: number; // ink amount 20..240
  invert?: boolean;
  style?: 'solid' | 'outline' | 'dots';
  outlineWidth?: number; // px of the working image, 1..8
  contrast?: number; // -100..100
  smooth?: number; // 0..4 — blur before tracing = smoother edges
  thickness?: number; // -3..3 — thinner / bolder strokes
  rotate?: number; // 0 | 90 | 180 | 270
  fineRotate?: number; // -45..45 degrees
  flipH?: boolean;
  flipV?: boolean;
  crop?: { top: number; right: number; bottom: number; left: number }; // % of each side, 0..45
  simplify?: number; // 0..3 — remove specks / small holes / jagged edges (stamp-friendly)
  /**
   * Two-colour logos: darkness cut-off between the darker and the lighter colour (0 = off).
   * The darker colour prints solid, the lighter colour becomes an outline — so a coloured shape
   * with dark lettering keeps its lettering instead of turning into one solid blob.
   */
  splitTone?: number;
  /** remove a solid / coloured background (the area of the edge colour touching the image border) */
  removeBg?: boolean;
}

export const LOGO_EDIT_KEYS: (keyof LogoEdit)[] = [
  'threshold', 'invert', 'style', 'outlineWidth', 'contrast', 'smooth', 'thickness', 'rotate', 'fineRotate', 'flipH', 'flipV', 'crop', 'simplify', 'splitTone', 'removeBg',
];

/**
 * The colour around the image edge, if the edge is one fairly even colour (a background).
 * Returns null when the edge is already transparent or too mixed to be a background.
 */
export function edgeBackground(px: Uint8ClampedArray, w: number, h: number): { r: number; g: number; b: number } | null {
  const rs: number[] = [], gs: number[] = [], bs: number[] = [];
  let transparent = 0, total = 0;
  const step = Math.max(1, Math.floor((w + h) / 400));
  const take = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    total++;
    if (px[i + 3] <= 110) { transparent++; return; }
    rs.push(px[i]); gs.push(px[i + 1]); bs.push(px[i + 2]);
  };
  for (let x = 0; x < w; x += step) { take(x, 0); take(x, h - 1); }
  for (let y = 0; y < h; y += step) { take(0, y); take(w - 1, y); }
  if (!total || transparent / total > 0.5 || rs.length < 8) return null;
  const med = (a: number[]) => a.slice().sort((p, q) => p - q)[a.length >> 1];
  const bg = { r: med(rs), g: med(gs), b: med(bs) };
  // most of the edge must be close to that colour
  let close = 0;
  for (let k = 0; k < rs.length; k++) if (Math.abs(rs[k] - bg.r) + Math.abs(gs[k] - bg.g) + Math.abs(bs[k] - bg.b) < 90) close++;
  return close / rs.length > 0.7 ? bg : null;
}

/**
 * Background removal: the background colour (found on the image edge) is cleared everywhere —
 * around the logo AND in the gaps inside it (e.g. the blue inside a white ring), so only the
 * artwork is left to print. Returns the share of the image that was removed.
 */
export function removeBackground(px: Uint8ClampedArray, w: number, h: number, tolerance = 60): number {
  const bg = edgeBackground(px, w, h);
  if (!bg) return 0;
  const n = w * h;
  let removed = 0;
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    if (px[p + 3] <= 110) continue;
    if (Math.abs(px[p] - bg.r) + Math.abs(px[p + 1] - bg.g) + Math.abs(px[p + 2] - bg.b) < tolerance * 1.5) {
      px[p + 3] = 0;
      removed++;
    }
  }
  return removed / n;
}

/**
 * Removes ink islands and paper holes smaller than `minArea` pixels (4-connected).
 * Specks of ink and pin-holes are the details that look messy and break when engraved.
 */
function removeSmallRegions(ink: Uint8Array, w: number, h: number, minArea: number, value: 0 | 1) {
  if (minArea < 1) return;
  const seen = new Uint8Array(ink.length);
  const stack: number[] = [];
  const region: number[] = [];
  for (let start = 0; start < ink.length; start++) {
    if (seen[start] || ink[start] !== value) continue;
    region.length = 0;
    let touchesEdge = false;
    seen[start] = 1;
    stack.push(start);
    while (stack.length) {
      const i = stack.pop()!;
      region.push(i);
      const x = i % w, y = (i - x) / w;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) touchesEdge = true;
      if (x > 0 && !seen[i - 1] && ink[i - 1] === value) { seen[i - 1] = 1; stack.push(i - 1); }
      if (x < w - 1 && !seen[i + 1] && ink[i + 1] === value) { seen[i + 1] = 1; stack.push(i + 1); }
      if (y > 0 && !seen[i - w] && ink[i - w] === value) { seen[i - w] = 1; stack.push(i - w); }
      if (y < h - 1 && !seen[i + w] && ink[i + w] === value) { seen[i + w] = 1; stack.push(i + w); }
    }
    // paper connected to the image edge is the background, never a "hole"
    if (value === 0 && touchesEdge) continue;
    if (region.length < minArea) for (const i of region) ink[i] = value ? 0 : 1;
  }
}

/** Otsu's method: the luminance that best splits a logo into ink and paper. */
function otsuThreshold(values: Float32Array, mask: Uint8Array): number {
  const hist = new Array(256).fill(0);
  let total = 0;
  for (let i = 0; i < values.length; i++) if (mask[i]) { hist[Math.max(0, Math.min(255, Math.round(values[i])))]++; total++; }
  if (!total) return DEFAULT_LOGO_THRESHOLD;
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];
  let sumB = 0, wB = 0, best = 0, bestT = DEFAULT_LOGO_THRESHOLD;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) { best = between; bestT = t; }
  }
  return bestT;
}

// ── binary-image helpers (ink = 1) ──
function dilate(src: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(src.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let dy = -1; dy <= 1 && !v; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx >= 0 && xx < w && src[yy * w + xx]) { v = 1; break; }
        }
      }
      out[y * w + x] = v;
    }
  }
  return out;
}
function erode(src: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(src.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 1;
      for (let dy = -1; dy <= 1 && v; dy++) {
        const yy = y + dy;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (yy < 0 || yy >= h || xx < 0 || xx >= w || !src[yy * w + xx]) { v = 0; break; }
        }
      }
      out[y * w + x] = v;
    }
  }
  return out;
}
/** separable box blur, `r` passes approximates a gaussian */
function blur(v: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(v.length);
  for (let pass = 0; pass < r; pass++) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const a = v[y * w + Math.max(0, x - 1)], b = v[y * w + x], c = v[y * w + Math.min(w - 1, x + 1)];
      tmp[y * w + x] = (a + b + c) / 3;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const a = tmp[Math.max(0, y - 1) * w + x], b = tmp[y * w + x], c = tmp[Math.min(h - 1, y + 1) * w + x];
      v[y * w + x] = (a + b + c) / 3;
    }
  }
}

/**
 * Full logo pipeline: crop → rotate / flip → contrast → smooth → trace (solid or halftone dots)
 * → line weight → outline → invert → trim. Returns the white-on-transparent mask.
 */
export async function processLogoAdvanced(src: string, edit: LogoEdit = {}): Promise<ProcessedLogo> {
  const img = await loadImage(src);
  const iw = img.naturalWidth || 600;
  const ih = img.naturalHeight || 600;
  const threshold = edit.threshold ?? DEFAULT_LOGO_THRESHOLD;
  const crop = edit.crop || { top: 0, right: 0, bottom: 0, left: 0 };
  const sx = Math.round((iw * Math.min(45, crop.left)) / 100);
  const sy = Math.round((ih * Math.min(45, crop.top)) / 100);
  const sw = Math.max(1, iw - sx - Math.round((iw * Math.min(45, crop.right)) / 100));
  const sh = Math.max(1, ih - sy - Math.round((ih * Math.min(45, crop.bottom)) / 100));

  // light-vs-dark artwork is judged on the cropped image before rotation (rotation adds transparent corners)
  const probe = document.createElement('canvas');
  probe.width = sw;
  probe.height = sh;
  const pctx = probe.getContext('2d', { willReadFrequently: true })!;
  pctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  // background removal happens first, on the cropped image — everything after works on the logo alone
  if (edit.removeBg) {
    const cleaned = pctx.getImageData(0, 0, sw, sh);
    removeBackground(cleaned.data, sw, sh);
    pctx.putImageData(cleaned, 0, 0);
  }
  const lightInk = detectLightLogo(pctx.getImageData(0, 0, sw, sh).data, sw, sh);

  // rotate / flip into a canvas big enough for the turned image
  const angle = (((edit.rotate || 0) + (edit.fineRotate || 0)) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(angle)), sin = Math.abs(Math.sin(angle));
  const w = Math.max(1, Math.round(sw * cos + sh * sin));
  const h = Math.max(1, Math.round(sw * sin + sh * cos));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.translate(w / 2, h / 2);
  // flip in the final (rotated) view, so "flip horizontally" always mirrors left ↔ right on screen
  ctx.scale(edit.flipH ? -1 : 1, edit.flipV ? -1 : 1);
  ctx.rotate(angle);
  // (draw the cropped probe — it already has the background removed when that is on)
  ctx.drawImage(probe, 0, 0, sw, sh, -sw / 2, -sh / 2, sw, sh);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;

  // darkness value per pixel: 0 = full ink … 255 = paper (light logos are flipped so ink is always dark)
  const n = w * h;
  const val = new Float32Array(n);
  const opaque = new Uint8Array(n);
  const ct = Math.max(-100, Math.min(100, edit.contrast || 0)) * 2.55;
  const cf = (259 * (ct + 255)) / (255 * (259 - ct));
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    opaque[i] = px[p + 3] > 110 ? 1 : 0;
    let lum = 0.299 * px[p] + 0.587 * px[p + 1] + 0.114 * px[p + 2];
    if (lightInk) lum = 255 - lum;
    lum = cf * (lum - 128) + 128;
    val[i] = opaque[i] ? Math.max(0, Math.min(255, lum)) : 255;
  }
  if (edit.smooth) blur(val, w, h, Math.round(edit.smooth));

  let ink: Uint8Array = new Uint8Array(n);
  if (edit.style === 'dots') {
    // halftone: one dot per cell, dot size follows how dark the cell is
    const cell = Math.max(4, Math.round(Math.max(w, h) / 55)); // coarse enough to print on rubber
    const shift = threshold - DEFAULT_LOGO_THRESHOLD;
    for (let cy = 0; cy < h; cy += cell) {
      for (let cx = 0; cx < w; cx += cell) {
        let sum = 0, cnt = 0;
        for (let y = cy; y < Math.min(h, cy + cell); y++) for (let x = cx; x < Math.min(w, cx + cell); x++) { sum += val[y * w + x]; cnt++; }
        const dark = Math.max(0, Math.min(1, (255 - (sum / cnt - shift)) / 255));
        const r = cell * 0.62 * Math.sqrt(dark);
        if (r < 0.35) continue;
        const mx = cx + cell / 2, my = cy + cell / 2;
        for (let y = Math.max(0, Math.floor(my - r)); y < Math.min(h, Math.ceil(my + r)); y++) {
          for (let x = Math.max(0, Math.floor(mx - r)); x < Math.min(w, Math.ceil(mx + r)); x++) {
            if ((x + 0.5 - mx) ** 2 + (y + 0.5 - my) ** 2 <= r * r) ink[y * w + x] = 1;
          }
        }
      }
    }
  } else if (edit.splitTone && edit.splitTone > 0 && edit.splitTone < threshold) {
    // two-colour logo: darker colour solid + the whole shape's outline (lighter colour → outline)
    const shape = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      shape[i] = opaque[i] && val[i] < threshold ? 1 : 0;
      ink[i] = opaque[i] && val[i] < edit.splitTone ? 1 : 0;
    }
    // pin-holes and specks would each get their own outline ring — clean the shape first
    const tiny = Math.round((Math.max(w, h) * 0.02) ** 2);
    removeSmallRegions(shape, w, h, tiny, 0);
    removeSmallRegions(shape, w, h, tiny, 1);
    let inner: Uint8Array = shape;
    const edgePx = Math.max(2, Math.round(Math.max(w, h) * 0.014)); // about 1.4% of the logo — prints clearly
    for (let k = 0; k < edgePx; k++) inner = erode(inner, w, h);
    for (let i = 0; i < n; i++) if (shape[i] && !inner[i]) ink[i] = 1;
  } else {
    for (let i = 0; i < n; i++) ink[i] = opaque[i] && val[i] < threshold ? 1 : 0;
  }
  if (edit.invert) for (let i = 0; i < n; i++) ink[i] = opaque[i] ? 1 - ink[i] : 0;

  // Simplify FIRST (before line weight, so specks are removed before they could grow):
  // drop specks and pin-holes, and at higher levels round off jagged spurs / notches
  const simplify = Math.max(0, Math.min(3, Math.round(edit.simplify || 0)));
  if (simplify && edit.style !== 'dots') {
    const minSide = [0, 0.008, 0.018, 0.03][simplify] * Math.max(w, h);
    const minArea = Math.round(minSide * minSide);
    if (simplify >= 2) ink = dilate(erode(ink, w, h), w, h); // open: removes thin spurs and specks
    removeSmallRegions(ink, w, h, minArea, 1);
    removeSmallRegions(ink, w, h, minArea, 0);
    if (simplify >= 3) ink = erode(dilate(ink, w, h), w, h); // close: fills hairline gaps and notches
  }

  const t = Math.max(-3, Math.min(3, Math.round(edit.thickness || 0)));
  for (let k = 0; k < Math.abs(t); k++) ink = t > 0 ? dilate(ink, w, h) : erode(ink, w, h);

  if (edit.style === 'outline') {
    let inner: Uint8Array = ink;
    for (let k = 0; k < Math.max(1, Math.min(8, Math.round(edit.outlineWidth || 2))); k++) inner = erode(inner, w, h);
    for (let i = 0; i < n; i++) ink[i] = ink[i] && !inner[i] ? 1 : 0;
  }

  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x, p = i * 4;
      px[p] = px[p + 1] = px[p + 2] = 255;
      px[p + 3] = ink[i] ? 255 : 0;
      if (ink[i]) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  ctx.putImageData(data, 0, 0);
  if (maxX < 0) return { maskSrc: c.toDataURL('image/png'), aspect: w / h };
  const tw = maxX - minX + 1;
  const th = maxY - minY + 1;
  const out = document.createElement('canvas');
  out.width = tw;
  out.height = th;
  out.getContext('2d')!.drawImage(c, minX, minY, tw, th, 0, 0, tw, th);
  return { maskSrc: out.toDataURL('image/png'), aspect: tw / th };
}

/**
 * "Make stamp-ready": the settings that turn this particular logo into a clean, engravable stamp
 * graphic — the best ink cut-off for its colours (Otsu), simplified details, smooth edges, and
 * bolder lines when its strokes are too thin to survive engraving.
 */
export async function stampReadyEdit(src: string): Promise<LogoEdit> {
  const img = await loadImage(src);
  const scale = Math.min(1, 400 / Math.max(img.naturalWidth || 400, img.naturalHeight || 400));
  const w = Math.max(1, Math.round((img.naturalWidth || 400) * scale));
  const h = Math.max(1, Math.round((img.naturalHeight || 400) * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  // a coloured / dark solid background (not plain white paper) → remove it
  const bg = edgeBackground(px, w, h);
  const removeBg = !!bg && bg.r + bg.g + bg.b < 690; // white-ish backgrounds are paper already
  if (removeBg) removeBackground(px, w, h);
  const lightInk = detectLightLogo(px, w, h);
  const n = w * h;
  const val = new Float32Array(n);
  const opaque = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const p = i * 4;
    opaque[i] = px[p + 3] > 110 ? 1 : 0;
    const lum = 0.299 * px[p] + 0.587 * px[p + 1] + 0.114 * px[p + 2];
    val[i] = lightInk ? 255 - lum : lum;
  }
  // best split between ink and paper; kept in a sensible range so faint logos still print
  const threshold = Math.max(70, Math.min(215, Math.round(otsuThreshold(val, opaque) / 5) * 5 + 5));

  // thin-line check: if one erosion step wipes out most of the ink, the strokes are hairlines
  let ink: Uint8Array = new Uint8Array(n);
  let count = 0;
  for (let i = 0; i < n; i++) if (opaque[i] && val[i] < threshold) { ink[i] = 1; count++; }
  let kept = 0;
  const eroded = erode(ink, w, h);
  for (let i = 0; i < n; i++) kept += eroded[i];
  const thin = count > 0 && kept / count < 0.45;

  // Two clearly different colours inside the logo (e.g. orange shape + dark lettering)?
  // Split the ink part again; if both tones are large and far apart, keep them apart.
  const splitTone = findSplitTone(val, opaque, threshold);

  return { threshold, simplify: 2, smooth: 1, thickness: thin ? 1 : 0, contrast: 0, style: 'solid', invert: false, splitTone, removeBg };
}

/** Darkness cut-off between a logo's two ink colours, or 0 when it is really one colour. */
function findSplitTone(val: Float32Array, opaque: Uint8Array, threshold: number): number {
  const inkMask = new Uint8Array(val.length);
  let total = 0;
  for (let i = 0; i < val.length; i++) if (opaque[i] && val[i] < threshold) { inkMask[i] = 1; total++; }
  if (total < 200) return 0;
  const t2 = otsuThreshold(val, inkMask);
  let dark = 0, light = 0, sumD = 0, sumL = 0;
  for (let i = 0; i < val.length; i++) {
    if (!inkMask[i]) continue;
    if (val[i] < t2) { dark++; sumD += val[i]; } else { light++; sumL += val[i]; }
  }
  if (!dark || !light) return 0;
  const gap = sumL / light - sumD / dark;
  const share = Math.min(dark, light) / total;
  return gap > 45 && share > 0.08 ? Math.round(t2) : 0;
}

/** Convert a source image into a trimmed stamp silhouette mask. */
export async function processLogo(src: string, threshold = DEFAULT_LOGO_THRESHOLD, invert = false): Promise<ProcessedLogo> {
  const img = await loadImage(src);
  const w = img.naturalWidth || 600;
  const h = img.naturalHeight || 600;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  const lightInk = detectLightLogo(px, w, h);

  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = px[i + 3];
      const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      // Transparent pixels are always "paper". For normal (dark) logos dark pixels are ink;
      // for light/white logos the light pixels are ink, so white logos don't vanish.
      const passes = lightInk ? lum > 255 - threshold : lum < threshold;
      let ink = a > 110 && passes;
      if (invert) ink = a > 110 && !passes;
      px[i] = px[i + 1] = px[i + 2] = 255;
      px[i + 3] = ink ? 255 : 0;
      if (ink) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  ctx.putImageData(data, 0, 0);

  if (maxX < 0) {
    // nothing passed the threshold – return the full (empty) frame so the user can adjust
    return { maskSrc: c.toDataURL('image/png'), aspect: w / h };
  }
  const tw = maxX - minX + 1;
  const th = maxY - minY + 1;
  const out = document.createElement('canvas');
  out.width = tw;
  out.height = th;
  out.getContext('2d')!.drawImage(c, minX, minY, tw, th, 0, 0, tw, th);
  return { maskSrc: out.toDataURL('image/png'), aspect: tw / th };
}

/** Fit a logo of the given aspect inside a fraction of the stamp, centered. */
export function fitLogo(aspect: number, widthMm: number, heightMm: number, fraction = 0.45) {
  const box = Math.min(widthMm, heightMm) * fraction;
  const width = aspect >= 1 ? box : box * aspect;
  const height = aspect >= 1 ? box / aspect : box;
  return {
    x: +((widthMm - width) / 2).toFixed(2),
    y: +((heightMm - height) / 2).toFixed(2),
    width: +width.toFixed(2),
    height: +height.toFixed(2),
  };
}
