/**
 * Makes exported stamps keep their fonts.
 *
 * PNG / PDF exports draw the SVG as an image, and an image cannot use the page's web fonts —
 * text silently falls back to a default font. A downloaded SVG only looks right where the font
 * is installed. So before exporting, every font the design uses is embedded in the SVG:
 *  - uploaded fonts: the user's own file
 *  - Google fonts:   only the character subsets the text actually needs
 */
import { customFontFaceCss } from './custom-fonts';
import { primaryFontName } from './font-loader';

const cssCache = new Map<string, string>(); // font name → @font-face css (with data URLs)

const toDataUrl = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('font download failed');
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(blob);
  });
};

/** Does a CSS unicode-range ("U+0000-00FF, U+0131") cover any of these code points? */
const rangeCovers = (range: string, codes: number[]) =>
  range.split(',').some((part) => {
    const m = part.trim().match(/^U\+([0-9A-Fa-f?]+)(?:-([0-9A-Fa-f]+))?$/);
    if (!m) return false;
    const lo = parseInt(m[1].replace(/\?/g, '0'), 16);
    const hi = m[2] ? parseInt(m[2], 16) : m[1].includes('?') ? parseInt(m[1].replace(/\?/g, 'F'), 16) : lo;
    return codes.some((c) => c >= lo && c <= hi);
  });

async function googleFontCss(name: string, codes: number[]): Promise<string> {
  const key = name + '|' + codes.join(',');
  if (cssCache.has(key)) return cssCache.get(key)!;
  const family = encodeURIComponent(name).replace(/%20/g, '+');
  let css = '';
  for (const q of [`${family}:wght@400;700`, family]) {
    const res = await fetch(`https://fonts.googleapis.com/css2?family=${q}&display=swap`);
    if (res.ok) {
      css = await res.text();
      break;
    }
  }
  if (!css) return '';
  const blocks = css.match(/@font-face\s*{[^}]*}/g) || [];
  const out: string[] = [];
  for (const block of blocks) {
    const range = block.match(/unicode-range:\s*([^;]+);/)?.[1];
    if (range && !rangeCovers(range, codes)) continue; // subset the text doesn't use
    const url = block.match(/url\(([^)]+)\)/)?.[1];
    if (!url) continue;
    try {
      out.push(block.replace(url, await toDataUrl(url.replace(/['"]/g, ''))));
    } catch {
      /* skip this subset */
    }
  }
  const result = out.join('\n');
  cssCache.set(key, result);
  return result;
}

/** Return the SVG with every used font embedded (falls back to the original SVG on any failure). */
export async function embedFontsInSvg(svg: string, elements: Array<{ fontFamily?: string; text?: string }>): Promise<string> {
  try {
    const byFont = new Map<string, Set<number>>();
    for (const el of elements || []) {
      if (!el || !el.fontFamily) continue;
      const name = primaryFontName(el.fontFamily);
      if (!name || /^(sans-serif|serif|monospace|cursive|arial|helvetica|times new roman)$/i.test(name)) continue;
      const set = byFont.get(name) || new Set<number>();
      for (const ch of String(el.text || '')) set.add(ch.codePointAt(0)!);
      for (const ch of '0123456789') set.add(ch.codePointAt(0)!);
      byFont.set(name, set);
    }
    if (!byFont.size) return svg;
    const rules: string[] = [];
    for (const [name, codes] of Array.from(byFont.entries())) {
      const own = customFontFaceCss(name);
      if (own) rules.push(own);
      else rules.push(await googleFontCss(name, Array.from(codes)));
    }
    const css = rules.filter(Boolean).join('\n');
    if (!css) return svg;
    return svg.replace(/<svg\b[^>]*>/, (open) => `${open}<defs><style type="text/css"><![CDATA[\n${css}\n]]></style></defs>`);
  } catch {
    return svg;
  }
}
