/**
 * Logo → vector. Turns a traced logo mask into smooth SVG outlines so a low-quality
 * (small / blurry) image prints with clean, sharp edges at any size.
 *
 *  1. Upscale the 1-bit mask with smoothing + a light blur, then re-threshold — this melts
 *     the pixel "staircase" of small images into smooth curves.
 *  2. Walk the boundary between ink and paper (outer shapes and holes) into closed loops.
 *  3. Cut the stair-step corners, simplify (Douglas–Peucker) and draw curves through the
 *     points, keeping real corners sharp.
 */

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read the logo image.'));
    img.src = src;
  });

export interface LogoQuality {
  width: number;
  height: number;
  lowRes: boolean;
  blurry: boolean;
}

/** Is this source image small or soft enough that it will print with rough edges? */
export async function assessLogoQuality(src: string): Promise<LogoQuality> {
  const img = await loadImage(src);
  const width = img.naturalWidth || 0;
  const height = img.naturalHeight || 0;
  const lowRes = Math.max(width, height) < 500;
  // blur check: share of mid-grey pixels among the visible artwork (sharp logos are mostly solid)
  const s = Math.min(1, 300 / Math.max(width, height, 1));
  const w = Math.max(1, Math.round(width * s));
  const h = Math.max(1, Math.round(height * s));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  let art = 0, mid = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 40) continue;
    const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    if (lum > 235) continue; // paper
    art++;
    if (lum > 55 && lum < 200) mid++;
  }
  const blurry = art > 50 && mid / art > 0.35;
  return { width, height, lowRes, blurry };
}

type Pt = [number, number];

/** Closed boundary loops of the ink area, on the pixel-corner grid (ink always on the right). */
function traceLoops(ink: Uint8Array, w: number, h: number): Pt[][] {
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && ink[y * w + x] === 1;
  const W1 = w + 1;
  const next = new Map<number, number[]>(); // start vertex → end vertices
  const add = (x0: number, y0: number, x1: number, y1: number) => {
    const k = y0 * W1 + x0;
    const v = y1 * W1 + x1;
    const list = next.get(k);
    if (list) list.push(v);
    else next.set(k, [v]);
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!at(x, y)) continue;
      if (!at(x, y - 1)) add(x, y, x + 1, y); // top edge → right
      if (!at(x + 1, y)) add(x + 1, y, x + 1, y + 1); // right edge → down
      if (!at(x, y + 1)) add(x + 1, y + 1, x, y + 1); // bottom edge → left
      if (!at(x - 1, y)) add(x, y + 1, x, y); // left edge → up
    }
  }
  const loops: Pt[][] = [];
  next.forEach((ends, start) => {
    while (ends.length) {
      const loop: Pt[] = [];
      let cur = start;
      let guard = 0;
      do {
        loop.push([cur % W1, Math.floor(cur / W1)]);
        const outs = next.get(cur);
        if (!outs || !outs.length) break;
        cur = outs.pop()!;
      } while (cur !== start && ++guard < 2_000_000);
      if (loop.length >= 4) loops.push(loop);
    }
  });
  return loops;
}

/** Douglas–Peucker on a closed polygon. */
function simplify(pts: Pt[], eps: number): Pt[] {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length);
  const rec = (a: number, b: number) => {
    let maxD = 0, idx = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > eps && idx > 0) {
      keep[idx] = 1;
      rec(a, idx);
      rec(idx, b);
    }
  };
  // split the loop at its farthest point from the start so both halves are open chains
  let far = 0, fd = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]);
    if (d > fd) { fd = d; far = i; }
  }
  keep[0] = keep[far] = 1;
  rec(0, far);
  const closed = [...pts, pts[0]];
  const k2 = new Uint8Array(closed.length);
  k2.set(keep);
  const rec2 = (a: number, b: number) => {
    let maxD = 0, idx = -1;
    const [ax, ay] = closed[a], [bx, by] = closed[b];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * closed[i][0] - dx * closed[i][1] + bx * ay - by * ax) / len;
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > eps && idx > 0) {
      k2[idx] = 1;
      rec2(a, idx);
      rec2(idx, b);
    }
  };
  rec2(far, closed.length - 1);
  return pts.filter((_, i) => k2[i]);
}

const f = (v: number) => +v.toFixed(1);

/** Smooth closed path: curves through edge midpoints, straight into sharp corners. */
function loopToPath(p: Pt[]): string {
  const n = p.length;
  if (n < 3) return '';
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const sharp = (i: number) => {
    const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n];
    const v1x = b[0] - a[0], v1y = b[1] - a[1], v2x = c[0] - b[0], v2y = c[1] - b[1];
    const cos = (v1x * v2x + v1y * v2y) / ((Math.hypot(v1x, v1y) || 1) * (Math.hypot(v2x, v2y) || 1));
    return cos < 0.35; // turns sharper than ~70° stay crisp corners
  };
  let d = '';
  const start = mid(p[n - 1], p[0]);
  d += `M${f(start[0])} ${f(start[1])}`;
  for (let i = 0; i < n; i++) {
    const m = mid(p[i], p[(i + 1) % n]);
    if (sharp(i)) d += `L${f(p[i][0])} ${f(p[i][1])}L${f(m[0])} ${f(m[1])}`;
    else d += `Q${f(p[i][0])} ${f(p[i][1])} ${f(m[0])} ${f(m[1])}`;
  }
  return d + 'Z';
}

export interface VectorLogo {
  svgPath: string; // inner SVG markup (one compound path)
  viewBox: string;
  aspect: number;
}

/**
 * Trace a logo mask (white-on-transparent PNG, as produced by processLogo) into vector outlines.
 * `detail`: 0 = smoothest … 2 = keeps the most detail.
 */
export async function vectorizeLogoMask(maskSrc: string, detail = 1): Promise<VectorLogo> {
  const img = await loadImage(maskSrc);
  const iw = img.naturalWidth || 1;
  const ih = img.naturalHeight || 1;
  const target = 640;
  const s = target / Math.max(iw, ih);
  const w = Math.max(8, Math.round(iw * s));
  const h = Math.max(8, Math.round(ih * s));
  const pad = 2; // room so outer edges trace cleanly
  const c = document.createElement('canvas');
  c.width = w + pad * 2;
  c.height = h + pad * 2;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // softening melts pixel stair-steps; small sources need more of it
  const softness = Math.max(0.6, Math.min(4, s * 0.45)) * (detail === 0 ? 1.5 : detail === 2 ? 0.6 : 1);
  ctx.filter = `blur(${softness.toFixed(2)}px)`;
  ctx.drawImage(img, pad, pad, w, h);
  ctx.filter = 'none';
  const W = c.width, H = c.height;
  const data = ctx.getImageData(0, 0, W, H).data;
  const ink = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) ink[i] = data[i * 4 + 3] >= 128 ? 1 : 0;

  const loops = traceLoops(ink, W, H);
  const eps = detail === 0 ? 1.6 : detail === 2 ? 0.6 : 1.0;
  const minArea = (W * H) * 0.00002; // drop dust specks
  const parts: string[] = [];
  for (const loop of loops) {
    // cut the stair-step corners first (midpoints of the pixel edges)
    const cut: Pt[] = loop.map((pt, i) => {
      const q = loop[(i + 1) % loop.length];
      return [(pt[0] + q[0]) / 2 - pad, (pt[1] + q[1]) / 2 - pad];
    });
    let area = 0;
    for (let i = 0; i < cut.length; i++) {
      const a = cut[i], b = cut[(i + 1) % cut.length];
      area += a[0] * b[1] - b[0] * a[1];
    }
    if (Math.abs(area / 2) < minArea) continue;
    const simple = simplify(cut, eps);
    const d = loopToPath(simple);
    if (d) parts.push(d);
  }
  if (!parts.length) throw new Error('Nothing to trace — increase the ink amount first.');
  return {
    svgPath: `<path d="${parts.join('')}" fill="currentColor" fill-rule="evenodd" stroke="none"/>`,
    viewBox: `0 0 ${w} ${h}`,
    aspect: w / h,
  };
}
