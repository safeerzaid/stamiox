'use client';

/**
 * Stamp file downloads (SVG / PNG / PDF) — used by the Export window and by the AI ("export it as PDF").
 */
import { jsPDF } from 'jspdf';
import { generateStampSvg } from './svg-generator';
import { MM_TO_PX } from './units';
import { embedFontsInSvg } from './font-embed';

export type ExportFormat = 'svg' | 'png' | 'pdf';

export interface ExportDesign {
  widthMm: number;
  heightMm: number;
  inkColor: string;
  elements: any[];
  projectTitle: string;
  invert?: boolean;
  mirror?: boolean;
}

const fileBase = (title: string) => (title || 'stamp').trim().replace(/\s+/g, '_').replace(/[\\/:*?"<>|]+/g, '') || 'stamp';

const download = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** The stamp as SVG text with its fonts embedded (an SVG used as an image can't reach page fonts). */
export async function stampSvgWithFonts(d: ExportDesign): Promise<string> {
  const svg = generateStampSvg({
    widthMm: d.widthMm,
    heightMm: d.heightMm,
    inkColor: d.inkColor,
    elements: d.elements,
    invert: !!d.invert,
    mirror: !!d.mirror,
    distressEffect: false,
  });
  return embedFontsInSvg(svg, d.elements as any);
}

/** Draws the stamp onto a canvas at `scale` × screen size (4 ≈ 300 DPI). */
export async function renderStampCanvas(d: ExportDesign, scale: number): Promise<HTMLCanvasElement | null> {
  const svg = await stampSvgWithFonts(d);
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = d.widthMm * MM_TO_PX * scale;
    canvas.height = d.heightMm * MM_TO_PX * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve(null);
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    img.onload = () => {
      if (d.invert) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/** High-resolution PNG (≈300 DPI). */
export async function stampPngBlob(d: ExportDesign): Promise<Blob | null> {
  const canvas = await renderStampCanvas(d, 4);
  if (!canvas) return null;
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

/** Downloads the stamp in the given format. Returns false if it could not be made. */
export async function exportStamp(format: ExportFormat, d: ExportDesign): Promise<boolean> {
  const name = fileBase(d.projectTitle);
  if (format === 'svg') {
    const svg = await stampSvgWithFonts(d);
    download(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${name}_vector.svg`);
    return true;
  }
  if (format === 'png') {
    const blob = await stampPngBlob(d);
    if (!blob) return false;
    download(blob, `${name}_300dpi.png`);
    return true;
  }
  // PDF at the real stamp size in mm
  const canvas = await renderStampCanvas(d, 6);
  if (!canvas) return false;
  const doc = new jsPDF({ orientation: d.widthMm >= d.heightMm ? 'landscape' : 'portrait', unit: 'mm', format: [d.widthMm, d.heightMm] });
  doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, d.widthMm, d.heightMm);
  doc.save(`${name}_300dpi.pdf`);
  return true;
}
