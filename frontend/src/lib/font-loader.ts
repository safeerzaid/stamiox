/**
 * Loads a Google Font on demand (only the ones that are not in the page's base stylesheet).
 * A font file is fetched just once, the first time the font is previewed or used.
 */
import { EXTRA_FONT_NAMES } from './fonts-extra';

const requested = new Set<string>();

/** "'Lobster', cursive" → "Lobster" */
export const primaryFontName = (stack?: string) => (stack || '').split(',')[0].trim().replace(/^['"]|['"]$/g, '');

export function ensureFont(stack?: string) {
  if (typeof document === 'undefined' || !stack) return;
  const name = primaryFontName(stack);
  if (!name || requested.has(name) || !EXTRA_FONT_NAMES.has(name)) return;
  requested.add(name);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  // regular weight (works for every family); the browser draws bold itself where a font has no bold
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, '+')}&display=swap`;
  link.dataset.font = name;
  document.head.appendChild(link);
}

/** Load every font used by these elements. */
export function ensureFontsFor(elements: Array<{ fontFamily?: string }> | undefined) {
  for (const el of elements || []) if (el && el.fontFamily) ensureFont(el.fontFamily);
}
