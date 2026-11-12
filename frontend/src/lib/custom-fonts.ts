/**
 * Fonts the user uploads (.ttf / .otf / .woff / .woff2).
 * Kept in IndexedDB (this browser), registered with the FontFace API so the canvas, the
 * font picker and exports can use them like any other font.
 */
import { useEffect, useState } from 'react';
import { storeGet, storeSet } from './local-store';
import type { FontOption } from './units';

export interface CustomFont {
  id: string;
  name: string; // CSS font-family name used in designs
  fileName: string;
  dataUrl: string; // the font file, base64
  addedAt: number;
}

const KEY = 'custom-fonts';
const MAX_BYTES = 8 * 1024 * 1024;
const FORMAT: Record<string, string> = { ttf: 'truetype', otf: 'opentype', woff: 'woff', woff2: 'woff2' };

let fonts: CustomFont[] = [];
let loaded: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const register = async (f: CustomFont) => {
  if (typeof document === 'undefined') return;
  if ([...(document.fonts as any)].some((ff: FontFace) => ff.family.replace(/['"]/g, '') === f.name)) return;
  const face = new FontFace(f.name, `url(${f.dataUrl})`);
  await face.load();
  (document.fonts as any).add(face);
};

/** Load saved fonts once and register them (safe to call many times). */
export function loadCustomFonts(): Promise<void> {
  if (!loaded) {
    loaded = (async () => {
      const saved = (await storeGet<CustomFont[]>(KEY)) || [];
      fonts = saved;
      await Promise.all(saved.map((f) => register(f).catch(() => {})));
      emit();
    })();
  }
  return loaded;
}

export const getCustomFonts = () => fonts;
export const customFontByName = (name: string) => fonts.find((f) => f.name === name);

/** "My-Brand_Font-Bold.ttf" → "My Brand Font Bold", made unique among the user's fonts. */
const familyFromFile = (fileName: string) => {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim() || 'My Font';
  let name = base;
  for (let i = 2; fonts.some((f) => f.name.toLowerCase() === name.toLowerCase()); i++) name = `${base} ${i}`;
  return name;
};

/** Add an uploaded font file. Throws a friendly message if it can't be used. */
export async function addCustomFont(file: File): Promise<CustomFont> {
  await loadCustomFonts();
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!FORMAT[ext]) throw new Error('Choose a font file: .ttf, .otf, .woff or .woff2');
  if (file.size > MAX_BYTES) throw new Error('That font file is larger than 8 MB.');
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not read this file.'));
    r.readAsDataURL(file);
  });
  const font: CustomFont = { id: `cf-${Date.now().toString(36)}`, name: familyFromFile(file.name), fileName: file.name, dataUrl, addedAt: Date.now() };
  try {
    await register(font);
  } catch {
    throw new Error('This file is not a working font.');
  }
  fonts = [font, ...fonts];
  await storeSet(KEY, fonts);
  emit();
  return font;
}

export async function removeCustomFont(id: string) {
  fonts = fonts.filter((f) => f.id !== id);
  await storeSet(KEY, fonts);
  emit();
}

export const customFontStack = (name: string) => `'${name}', sans-serif`;

export const toFontOption = (f: CustomFont): FontOption => ({
  label: `${f.name} (My font)`,
  name: f.name,
  value: customFontStack(f.name),
  family: customFontStack(f.name),
  category: 'custom',
  tag: 'My font',
});

/** React hook: the user's fonts as picker options, kept in sync. */
export function useCustomFonts(): CustomFont[] {
  const [list, setList] = useState<CustomFont[]>(fonts);
  useEffect(() => {
    const l = () => setList([...fonts]);
    listeners.add(l);
    loadCustomFonts().then(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return list;
}

/** CSS @font-face rule embedding one of the user's fonts (for exports). */
export function customFontFaceCss(name: string): string | null {
  const f = customFontByName(name);
  if (!f) return null;
  const ext = (f.fileName.split('.').pop() || 'ttf').toLowerCase();
  return `@font-face{font-family:'${f.name}';src:url(${f.dataUrl}) format('${FORMAT[ext] || 'truetype'}');}`;
}
