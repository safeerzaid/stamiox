/**
 * Import / export of stamp templates.
 *
 *  - .json  → fully editable template(s). Accepts our own "stamiox-template" files, the
 *             StampTemplate format the app uses ({ defaultData: { elements } }), or an array of them.
 *  - images → a template made from the picture (PNG / JPG / WEBP / SVG), traced to ink like a logo
 *             and fitted to the current stamp.
 *
 * Imported templates are kept in "My templates" (IndexedDB, this browser).
 */
import { storeGet, storeSet } from './local-store';
import { readLogoFile, processLogo, fitLogo, DEFAULT_LOGO_THRESHOLD } from './logo';

export const TEMPLATE_INK = '#111827';
const KNOWN_TYPES = new Set(['arc-text', 'text', 'ring', 'serrated-ring', 'rect', 'oval', 'line', 'clipart', 'image', 'qrcode']);
const SHAPES = new Set(['ROUND', 'RECTANGULAR', 'OVAL', 'SQUARE']);
const MY_KEY = 'my-templates';

export interface UserTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  shape: 'ROUND' | 'RECTANGULAR' | 'OVAL' | 'SQUARE';
  widthMm: number;
  heightMm: number;
  tags: string[];
  defaultData: { inkColor: string; fields: Record<string, string>; elements: any[] };
  importedAt: number;
}

const uid = () => `my-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Turn one parsed object into a template, or null if it isn't one. */
function toTemplate(raw: any, fallbackTitle: string): UserTemplate | null {
  if (!raw || typeof raw !== 'object') return null;
  const elements = raw.defaultData?.elements ?? raw.elements ?? raw.design?.elements;
  if (!Array.isArray(elements)) return null;
  const clean = elements
    .filter((e: any) => e && typeof e === 'object' && KNOWN_TYPES.has(e.type))
    .map((e: any, i: number) => ({ ...e, id: typeof e.id === 'string' && e.id ? e.id : `el-${i}-${Math.random().toString(36).slice(2, 6)}` }));
  if (!clean.length) return null;
  const w = Number(raw.widthMm ?? raw.design?.widthMm) || 40;
  const h = Number(raw.heightMm ?? raw.design?.heightMm) || w;
  const shapeRaw = String(raw.shape ?? raw.design?.shape ?? '').toUpperCase();
  const shape = (SHAPES.has(shapeRaw) ? shapeRaw : w === h ? 'ROUND' : 'RECTANGULAR') as UserTemplate['shape'];
  return {
    id: uid(),
    title: String(raw.title || raw.name || raw.projectTitle || fallbackTitle).slice(0, 80),
    description: String(raw.description || 'Imported template'),
    category: 'my-templates',
    shape,
    widthMm: w,
    heightMm: h,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : ['imported'],
    defaultData: { inkColor: TEMPLATE_INK, fields: raw.defaultData?.fields || {}, elements: clean },
    importedAt: Date.now(),
  };
}

/** Read a picked file into one or more templates. Throws a friendly message if it can't. */
export async function importTemplateFile(
  file: File,
  current: { shape: string; widthMm: number; heightMm: number }
): Promise<UserTemplate[]> {
  const base = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Imported template';

  if (/\.json$/i.test(file.name) || file.type === 'application/json') {
    let parsed: any;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      throw new Error('This file is not valid JSON.');
    }
    const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.templates) ? parsed.templates : [parsed];
    const out = list.map((t: any, i: number) => toTemplate(t, list.length > 1 ? `${base} ${i + 1}` : base)).filter(Boolean) as UserTemplate[];
    if (!out.length) throw new Error('No stamp design found in this file.');
    return out;
  }

  if (/^image\/(png|jpe?g|webp|svg\+xml|gif|bmp)$/.test(file.type)) {
    if (file.size > 10 * 1024 * 1024) throw new Error('That image is larger than 10 MB.');
    const src = await readLogoFile(file);
    const { maskSrc, aspect } = await processLogo(src, DEFAULT_LOGO_THRESHOLD, false);
    const box = fitLogo(aspect, current.widthMm, current.heightMm, 0.9);
    return [
      {
        id: uid(),
        title: base,
        description: 'Imported from an image',
        category: 'my-templates',
        shape: (SHAPES.has(current.shape) ? current.shape : 'ROUND') as UserTemplate['shape'],
        widthMm: current.widthMm,
        heightMm: current.heightMm,
        tags: ['imported', 'image'],
        defaultData: {
          inkColor: TEMPLATE_INK,
          fields: {},
          elements: [{ id: `img-${Math.random().toString(36).slice(2, 7)}`, type: 'image', src, maskSrc, threshold: DEFAULT_LOGO_THRESHOLD, invert: false, ...box }],
        },
        importedAt: Date.now(),
      },
    ];
  }

  throw new Error('Choose a template file (.json) or a stamp image (PNG, JPG, SVG).');
}

/** The current design as a template (for "Save as template"). */
export function designToTemplate(d: { title: string; shape: string; widthMm: number; heightMm: number; elements: any[] }): UserTemplate | null {
  return toTemplate({ title: d.title, shape: d.shape, widthMm: d.widthMm, heightMm: d.heightMm, elements: d.elements, tags: ['saved'] }, d.title || 'My template');
}

/** Download a template as a shareable .json file. */
export function downloadTemplate(t: UserTemplate) {
  const { importedAt, ...rest } = t;
  const blob = new Blob([JSON.stringify({ format: 'stamiox-template', version: 1, ...rest }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${t.title.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'stamp-template'}.stamiox.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export async function loadMyTemplates(): Promise<UserTemplate[]> {
  const list = await storeGet<UserTemplate[]>(MY_KEY);
  return Array.isArray(list) ? list : [];
}
export async function saveMyTemplates(list: UserTemplate[]) {
  await storeSet(MY_KEY, list);
}
