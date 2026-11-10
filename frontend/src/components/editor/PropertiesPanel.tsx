'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useEditor } from '../../context/EditorContext';
import { FONT_OPTIONS, STAMP_INK_COLORS, STAMP_MOUNT_PRESETS } from '../../lib/units';
import { ensureFont } from '../../lib/font-loader';
import { useCustomFonts, addCustomFont, removeCustomFont, toFontOption, getCustomFonts } from '../../lib/custom-fonts';
import { assessLogoQuality, vectorizeLogoMask, type LogoQuality } from '../../lib/vectorize';

/** Font name drawn in its own font — the font is only downloaded once the row scrolls into view. */
const LazyFontName: React.FC<{ name: string; value: string }> = ({ name, value }) => {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        ensureFont(value);
        setShown(true);
        io.disconnect();
      }
    }, { rootMargin: '120px' });
    io.observe(el);
    return () => io.disconnect();
  }, [value, shown]);
  return (
    <span ref={ref} className="text-[13px] truncate" style={shown ? { fontFamily: value } : undefined}>
      {name}
    </span>
  );
};
import {
  ArcTextElement,
  StraightTextElement,
  RingElement,
  SerratedRingElement,
  RectElement,
  OvalElement,
  LineElement,
  ClipartElement,
} from '../../types/stamp';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignStartHorizontal,
  AlignEndHorizontal,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Sliders,
  Sparkles,
  Layers,
  Download,
  Lock,
  Unlock,
  ChevronDown,
  Contrast,
  Trash2,
  Search,
  PanelRightClose,
  Check,
  Wand2,
  Orbit,
  Type,
  Group,
  Ungroup,
  RotateCcw,
  Upload,
  Maximize2,
} from 'lucide-react';

import { AiStudioCopilot } from './AiStudioCopilot';
import { AiOrbIcon } from './AiOrbIcon';
import { useSwipeScroll } from '../../hooks/useSwipeScroll';
import { ShapeSizeBadge } from '../common/ShapeSizeBadge';
import { processLogoAdvanced, readLogoFile, fitLogo, DEFAULT_LOGO_THRESHOLD, LOGO_EDIT_KEYS, type LogoEdit } from '../../lib/logo';


/** Logo editor: style, tone, transform, crop and size — every edit re-traces the stamp silhouette. */
type LogoEl = {
  id: string; src: string; maskSrc?: string; x: number; y: number; width: number; height: number;
} & LogoEdit;

const LOGO_DEFAULTS: Required<Omit<LogoEdit, 'crop'>> & { crop: NonNullable<LogoEdit['crop']> } = {
  threshold: DEFAULT_LOGO_THRESHOLD, invert: false, style: 'solid', outlineWidth: 2, contrast: 0, smooth: 0, thickness: 0,
  rotate: 0, fineRotate: 0, flipH: false, flipV: false, crop: { top: 0, right: 0, bottom: 0, left: 0 },
};

const LogoSlider: React.FC<{
  label: string; value: number; min: number; max: number; step?: number; display?: string; hint?: string;
  onChange: (v: number) => void; onCommit: (v: number) => void;
}> = ({ label, value, min, max, step = 1, display, hint, onChange, onCommit }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-slate-500 dark:text-slate-400" title={hint}>{label}</span>
      <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">{display ?? value}</span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value} aria-label={label}
      onChange={(e) => { const v = Number(e.target.value); onChange(v); onCommit(v); }}
      onDoubleClick={() => { const v = Math.min(max, Math.max(min, 0)); onChange(v); onCommit(v); }}
      className="w-full accent-[#0d99ff]"
    />
  </div>
);

const LogoSettings: React.FC<{
  el: LogoEl;
  widthMm: number;
  heightMm: number;
  onChange: (patch: Record<string, any>) => void;
}> = ({ el, widthMm, heightMm, onChange }) => {
  const current = (): typeof LOGO_DEFAULTS => ({
    ...LOGO_DEFAULTS,
    ...Object.fromEntries(LOGO_EDIT_KEYS.filter((k) => (el as any)[k] !== undefined).map((k) => [k, (el as any)[k]])),
    crop: { ...LOGO_DEFAULTS.crop, ...(el.crop || {}) },
  });
  // local copy so sliders move instantly; tracing runs behind it
  const [edit, setEdit] = useState(current);
  const [busy, setBusy] = useState(false);
  const [lockRatio, setLockRatio] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [open, setOpen] = useState<{ tone: boolean; transform: boolean; crop: boolean }>({ tone: true, transform: false, crop: false });
  const fileRef = React.useRef<HTMLInputElement>(null);
  const jobRef = React.useRef(0);
  const timerRef = React.useRef<number | null>(null);

  // ── Vector conversion (suggested for small / blurry uploads) ──
  const [quality, setQuality] = useState<LogoQuality | null>(null);
  const [vecDetail, setVecDetail] = useState<0 | 1 | 2>(1);
  const [vectorizing, setVectorizing] = useState(false);
  const [vecError, setVecError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setQuality(null);
    assessLogoQuality(el.src).then((q) => alive && setQuality(q)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [el.src]);
  const convertToVector = async () => {
    if (!el.maskSrc) return;
    setVectorizing(true);
    setVecError(null);
    try {
      const v = await vectorizeLogoMask(el.maskSrc, vecDetail);
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      const h = el.height;
      const w = +(h * v.aspect).toFixed(2);
      // becomes a vector element in the same place (Ctrl+Z brings the image back)
      onChange({ type: 'clipart', name: 'Vector logo', svgPath: v.svgPath, viewBox: v.viewBox, cx: +cx.toFixed(2), cy: +cy.toFixed(2), width: w, height: h });
    } catch (e: any) {
      setVecError(e?.message || 'Could not convert this image.');
    } finally {
      setVectorizing(false);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setEdit(current()), [el.id]);

  // Re-trace with the given edits; keeps the logo's centre and height (or refits it to the stamp)
  const retrace = async (src: string, next: typeof LOGO_DEFAULTS, refit = false) => {
    const job = ++jobRef.current;
    setBusy(true);
    try {
      const { maskSrc, aspect } = await processLogoAdvanced(src, next);
      if (job !== jobRef.current) return; // a newer change superseded this one
      const editPatch = { ...next, crop: { ...next.crop } };
      if (refit) {
        onChange({ src, maskSrc, ...editPatch, ...fitLogo(aspect, widthMm, heightMm) });
      } else {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        const h = el.height;
        const w = +(h * aspect).toFixed(2);
        onChange({ src, maskSrc, ...editPatch, width: w, height: h, x: +(cx - w / 2).toFixed(2), y: +(cy - h / 2).toFixed(2) });
      }
    } finally {
      if (job === jobRef.current) setBusy(false);
    }
  };

  // sliders fire a lot — trace at most every ~90 ms
  const apply = (patch: Partial<typeof LOGO_DEFAULTS>, immediate = false) => {
    const next = { ...edit, ...patch, crop: { ...edit.crop, ...(patch.crop || {}) } };
    setEdit(next);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (immediate) retrace(el.src, next);
    else timerRef.current = window.setTimeout(() => retrace(el.src, next), 90);
  };

  const isEdited = JSON.stringify(edit) !== JSON.stringify(LOGO_DEFAULTS);

  const resize = (w: number, h: number) => {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    onChange({ width: +w.toFixed(2), height: +h.toFixed(2), x: +(cx - w / 2).toFixed(2), y: +(cy - h / 2).toFixed(2) });
  };
  const ratio = el.width / Math.max(0.01, el.height);

  const SEG = (active: boolean) =>
    `h-7 rounded-md text-[11px] transition-all cursor-pointer ${
      active ? 'bg-white dark:bg-slate-700 text-[#0d99ff] font-semibold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
    }`;
  const ICONBTN =
    'h-8 flex-1 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer';
  // a plain function (not a component defined in render) so sliders inside keep working while dragging
  const group = (id: 'tone' | 'transform' | 'crop', title: string, children: React.ReactNode) => (
    <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => ({ ...o, [id]: !o[id] }))}
        className="w-full flex items-center justify-between py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
        aria-expanded={open[id]}
      >
        {title}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${open[id] ? 'rotate-180' : ''}`} />
      </button>
      {open[id] && <div className="space-y-2.5 pt-1.5 pb-1">{children}</div>}
    </div>
  );

  const lowQuality = !!quality && (quality.lowRes || quality.blurry);
  const ACTION =
    'h-8 flex-1 flex items-center justify-center gap-1.5 rounded-lg text-[12px] font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-60';

  return (
    <section className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <h3 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">{(el as any).isQr ? 'QR code' : 'Logo'}</h3>
        <span className="flex items-center gap-2">
          {(busy || vectorizing) && <span className="text-[11px] text-slate-400 dark:text-slate-500">{vectorizing ? 'Converting…' : 'Updating…'}</span>}
          {isEdited && (
            <button
              type="button"
              onClick={() => { setEdit(LOGO_DEFAULTS); retrace(el.src, LOGO_DEFAULTS); }}
              className="text-[11px] text-[#0d99ff] hover:underline cursor-pointer"
              title="Undo every logo edit (keeps the image)"
            >
              Reset
            </button>
          )}
        </span>
      </div>

      {/* One preview: how it prints, with the original as a small corner thumbnail */}
      <div className="relative h-28 rounded-xl border border-slate-200 dark:border-slate-700 bg-white flex items-center justify-center overflow-hidden px-6 py-4">
        {el.maskSrc && (
          <div
            className="w-full h-full bg-slate-900"
            style={{ WebkitMaskImage: `url(${el.maskSrc})`, maskImage: `url(${el.maskSrc})`, WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' }}
          />
        )}
        <div
          className="absolute left-1.5 bottom-1.5 w-9 h-9 rounded-md border border-slate-200 bg-[repeating-conic-gradient(#cbd5e1_0%_25%,#f1f5f9_0%_50%)] bg-[length:6px_6px] flex items-center justify-center overflow-hidden p-0.5"
          title="Original image"
        >
          <img src={el.src} alt="Original" className="max-w-full max-h-full object-contain" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5">
        <button type="button" onClick={() => fileRef.current?.click()} className={ACTION} title="Replace image">
          <Upload className="w-3.5 h-3.5" />
          Replace
        </button>
        <button type="button" onClick={() => retrace(el.src, edit, true)} className={ACTION} title="Fit to the stamp and center">
          <Maximize2 className="w-3.5 h-3.5" />
          Fit
        </button>
        <button
          type="button"
          onClick={convertToVector}
          disabled={vectorizing || !el.maskSrc}
          className={`${ACTION} ${lowQuality ? '!bg-[#0d99ff] !border-[#0d99ff] !text-white hover:!bg-[#0b87e0]' : ''}`}
          title="Trace into smooth vector outlines for sharp printing (Ctrl+Z to undo)"
        >
          <Wand2 className="w-3.5 h-3.5" />
          Vector
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            const src = await readLogoFile(file);
            retrace(src, edit, true);
          }}
        />
      </div>
      {lowQuality && (
        <p className="text-[11px] leading-snug text-amber-700 dark:text-amber-300">
          {quality!.lowRes ? `Low-quality image (${quality!.width}×${quality!.height} px)` : 'Blurry image'} — tap <b>Vector</b> for sharp edges.
        </p>
      )}
      {vecError && <p className="text-[11px] text-rose-600 dark:text-rose-400">{vecError}</p>}

      {/* Style */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950/60" role="radiogroup" aria-label="Logo style">
        {([
          { v: 'solid', label: 'Solid' },
          { v: 'outline', label: 'Outline' },
          { v: 'dots', label: 'Dots' },
        ] as const).map(({ v, label }) => (
          <button key={v} type="button" role="radio" aria-checked={edit.style === v} onClick={() => apply({ style: v }, true)} className={SEG(edit.style === v)}>
            {label}
          </button>
        ))}
      </div>

      <LogoSlider label="Ink amount" hint="Higher = more of the image prints as ink" value={edit.threshold} min={20} max={240} step={5}
        onChange={(v) => setEdit((s) => ({ ...s, threshold: v }))} onCommit={(v) => apply({ threshold: v })} />
      {edit.style === 'outline' && (
        <LogoSlider label="Outline width" value={edit.outlineWidth} min={1} max={8}
          onChange={(v) => setEdit((s) => ({ ...s, outlineWidth: v }))} onCommit={(v) => apply({ outlineWidth: v })} />
      )}

      <label className="flex items-center gap-2.5 cursor-pointer">
        <span className="text-[12px] text-slate-700 dark:text-slate-200">Invert</span>
        <input type="checkbox" checked={edit.invert} onChange={(e) => apply({ invert: e.target.checked }, true)} className="sr-only" />
        <span aria-hidden className={`ml-auto relative w-7 h-4 rounded-full shrink-0 transition-colors ${edit.invert ? 'bg-[#0d99ff]' : 'bg-slate-200 dark:bg-slate-700'}`}>
          <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${edit.invert ? 'translate-x-3' : ''}`} />
        </span>
      </label>

      {/* Size */}
      <div className="flex items-center gap-1.5">
        <div className="grid grid-cols-2 gap-1.5 flex-1">
          <InlineNumberField label="W" value={Number(el.width.toFixed(1))} step={0.5} min={2} max={Math.max(widthMm, heightMm) * 1.5}
            onChange={(w) => resize(w, lockRatio ? w / ratio : el.height)} />
          <InlineNumberField label="H" value={Number(el.height.toFixed(1))} step={0.5} min={2} max={Math.max(widthMm, heightMm) * 1.5}
            onChange={(h) => resize(lockRatio ? h * ratio : el.width, h)} />
        </div>
        <button
          type="button"
          onClick={() => setLockRatio((v) => !v)}
          aria-pressed={lockRatio}
          title={lockRatio ? 'Proportions locked — click to stretch freely' : 'Free size — click to keep proportions'}
          className={`h-8 w-8 shrink-0 rounded-md flex items-center justify-center transition-colors cursor-pointer ${lockRatio ? 'text-[#0d99ff] bg-[#e5f2ff] dark:bg-blue-950/60' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          {lockRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Everything else, tucked away */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="w-full flex items-center justify-between py-1.5 text-[12px] text-slate-600 dark:text-slate-300 cursor-pointer"
        >
          More options
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${showMore ? 'rotate-180' : ''}`} />
        </button>
        {showMore && (
          <div className="space-y-3 pt-1.5">
            <LogoSlider label="Contrast" value={edit.contrast} min={-100} max={100} step={5} display={`${edit.contrast > 0 ? '+' : ''}${edit.contrast}`}
              onChange={(v) => setEdit((s) => ({ ...s, contrast: v }))} onCommit={(v) => apply({ contrast: v })} />
            <LogoSlider label="Smooth edges" value={edit.smooth} min={0} max={4} display={edit.smooth ? `${edit.smooth}` : 'Off'}
              onChange={(v) => setEdit((s) => ({ ...s, smooth: v }))} onCommit={(v) => apply({ smooth: v })} />
            <LogoSlider label="Line weight" hint="Bolder lines print better; thinner slims heavy areas" value={edit.thickness} min={-3} max={3}
              display={edit.thickness === 0 ? 'Normal' : edit.thickness > 0 ? `+${edit.thickness}` : `${edit.thickness}`}
              onChange={(v) => setEdit((s) => ({ ...s, thickness: v }))} onCommit={(v) => apply({ thickness: v })} />

            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Rotate & flip</span>
              <div className="flex gap-1.5">
                <button type="button" className={ICONBTN} title="Rotate left 90°" aria-label="Rotate left" onClick={() => apply({ rotate: (edit.rotate + 270) % 360 }, true)}>
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button type="button" className={ICONBTN} title="Rotate right 90°" aria-label="Rotate right" onClick={() => apply({ rotate: (edit.rotate + 90) % 360 }, true)}>
                  <RotateCw className="w-4 h-4" />
                </button>
                <button type="button" className={`${ICONBTN} ${edit.flipH ? '!bg-[#e5f2ff] dark:!bg-blue-950/60 !text-[#0d99ff]' : ''}`} title="Flip horizontally" aria-pressed={edit.flipH} onClick={() => apply({ flipH: !edit.flipH }, true)}>
                  <FlipHorizontal className="w-4 h-4" />
                </button>
                <button type="button" className={`${ICONBTN} ${edit.flipV ? '!bg-[#e5f2ff] dark:!bg-blue-950/60 !text-[#0d99ff]' : ''}`} title="Flip vertically" aria-pressed={edit.flipV} onClick={() => apply({ flipV: !edit.flipV }, true)}>
                  <FlipVertical className="w-4 h-4" />
                </button>
              </div>
              <LogoSlider label="Fine rotate" value={edit.fineRotate} min={-45} max={45} display={`${edit.fineRotate}°`}
                onChange={(v) => setEdit((s) => ({ ...s, fineRotate: v }))} onCommit={(v) => apply({ fineRotate: v })} />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Crop</span>
                {Object.values(edit.crop).some(Boolean) && (
                  <button type="button" onClick={() => apply({ crop: { top: 0, right: 0, bottom: 0, left: 0 } }, true)} className="text-[11px] text-[#0d99ff] hover:underline cursor-pointer">
                    Reset
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {(['top', 'bottom', 'left', 'right'] as const).map((side) => (
                  <LogoSlider key={side} label={side[0].toUpperCase() + side.slice(1)} value={edit.crop[side]} min={0} max={45} display={`${edit.crop[side]}%`}
                    onChange={(v) => setEdit((s) => ({ ...s, crop: { ...s.crop, [side]: v } }))} onCommit={(v) => apply({ crop: { ...edit.crop, [side]: v } })} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

interface PropertiesPanelProps {
  activeRightTab: 'SETUP' | 'AI';
  setActiveRightTab: (tab: 'SETUP' | 'AI') => void;
}

// Unified Ultra-Clean Modern Stepper (Figma / Linear Style with Pixel-Perfect Controls)
/**
 * Compact Figma-style number field: label inside on the left, unit on the right.
 * Type a value, use ↑/↓ (Shift = ×10), or the mouse wheel while hovering.
 */
const InlineNumberField: React.FC<{
  label: string;
  value: number;
  step?: number;
  unit?: string;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}> = ({ label, value, step = 0.5, unit = 'mm', min, max, onChange }) => {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  const clamp = (v: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v));
  const commit = (v: number) => onChange(Number(clamp(v).toFixed(2)));
  const nudge = (dir: 1 | -1, big = false) => {
    const next = Number((value + dir * step * (big ? 10 : 1)).toFixed(2));
    commit(next);
    setDraft(String(clamp(next)));
  };

  // wheel to nudge (non-passive so the panel doesn't scroll while adjusting)
  useEffect(() => {
    const el = inputRef.current?.parentElement;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (document.activeElement !== inputRef.current && !el.matches(':hover')) return;
      e.preventDefault();
      nudge(e.deltaY < 0 ? 1 : -1, e.shiftKey);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  return (
    <label className="group h-8 flex items-center gap-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus-within:bg-white focus-within:border-[#0d99ff] focus-within:ring-2 focus-within:ring-[#0d99ff]/15 transition-colors cursor-text">
      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 group-focus-within:text-[#0d99ff] select-none w-3">{label}</span>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={draft}
        onFocus={(e) => {
          setFocused(true);
          e.currentTarget.select();
        }}
        onChange={(e) => {
          setDraft(e.target.value);
          const v = parseFloat(e.target.value);
          if (!Number.isNaN(v)) commit(v);
        }}
        onBlur={() => {
          setFocused(false);
          setDraft(String(value));
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            nudge(e.key === 'ArrowUp' ? 1 : -1, e.shiftKey);
          } else if (e.key === 'Enter') {
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        className="flex-1 min-w-0 bg-transparent text-[12px] font-medium text-slate-900 dark:text-white tabular-nums outline-none"
        aria-label={label}
      />
      <span className="text-[11px] text-slate-400 dark:text-slate-500 select-none">{unit}</span>
    </label>
  );
};

const ModernStepper: React.FC<{
  value: number;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  onChange: (val: number) => void;
  disabled?: boolean;
}> = ({ value, step = 0.1, min, max, unit = 'mm', onChange, disabled }) => {
  const handleDecrement = () => {
    let next = Number((value - step).toFixed(2));
    if (min !== undefined && next < min) next = min;
    onChange(next);
  };

  const handleIncrement = () => {
    let next = Number((value + step).toFixed(2));
    if (max !== undefined && next > max) next = max;
    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    }
  };

  const displayVal = isNaN(value) ? '' : step >= 1 ? Math.round(value) : Number(value.toFixed(1));

  return (
    <div
      className={`flex items-center h-9 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 focus-within:bg-white rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs focus-within:border-[#0d99ff] focus-within:ring-2 focus-within:ring-[#0d99ff]/15 transition-all overflow-hidden ${
        disabled ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700 cursor-not-allowed' : ''
      }`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || (min !== undefined && value <= min)}
        className="w-7 h-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 active:bg-slate-200 disabled:opacity-40 transition-colors shrink-0 cursor-pointer rounded-l-xl border-r border-slate-200/60 dark:border-slate-700 select-none"
        title={`Decrease (-${step}${unit})`}
      >
        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>

      <div className="flex-1 flex items-center justify-center min-w-0 px-1 h-full gap-0.5">
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={displayVal}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) onChange(val);
          }}
          disabled={disabled}
          className={`w-full text-center bg-transparent font-bold text-xs outline-none p-0 tracking-tight [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono ${
            disabled ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'
          }`}
        />
        {unit && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold select-none shrink-0 font-sans">
            {unit}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || (max !== undefined && value >= max)}
        className="w-7 h-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 active:bg-slate-200 disabled:opacity-40 transition-colors shrink-0 cursor-pointer rounded-r-xl border-l border-slate-200/60 dark:border-slate-700 select-none"
        title={`Increase (+${step}${unit})`}
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
    </div>
  );
};

/** Primary family of a CSS font stack, normalised: "'Montserrat', sans-serif" → "montserrat". */
const primaryFamily = (stack?: string) => (stack || '').split(',')[0].replace(/["']/g, '').trim().toLowerCase();
/** Font option for an element's fontFamily, tolerant of quoting / fallback differences. */
const findFontOption = (stack?: string) => {
  if (!stack) return undefined;
  const p = primaryFamily(stack);
  const all = [...getCustomFonts().map(toFontOption), ...FONT_OPTIONS];
  return all.find((o) => o.value === stack) || all.find((o) => primaryFamily(o.value) === p || o.name.toLowerCase() === p);
};

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ activeRightTab, setActiveRightTab }) => {
  // Sections slide in one by one only when the Setup tab opens — not every time a selection
  // adds a section (that made the panel jump on each click).
  const [setupIntro, setSetupIntro] = useState(true);
  useEffect(() => {
    if (activeRightTab !== "SETUP") return;
    setSetupIntro(true);
    const t = window.setTimeout(() => setSetupIntro(false), 1000);
    return () => window.clearTimeout(t);
  }, [activeRightTab]);
  const {
    selectedId,
    selectedIds,
    selectedElement,
    elements,
    groupElements,
    ungroupElements,
    setElements,
    pushHistory,
    updateElement,
    deleteElement,
    duplicateElement,
    bringForward,
    sendBackward,
    alignSelected,
    nudgeElement,
    shape,
    widthMm,
    setWidthMm,
    heightMm,
    setHeightMm,
    inkColor,
    setInkColor,
    mountPreset,
    setMountPreset,
    laserInvert,
    setLaserInvert,
    laserMirror,
    setLaserMirror,
    distressEffect,
    setDistressEffect,
    autoCanvasShape,
    setAutoCanvasShape,
    zoom,
    isRightSidebarOpen,
    toggleRightSidebar,
  } = useEditor();

  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  // the user's own uploaded fonts (.ttf / .otf / .woff), listed first
  const customFonts = useCustomFonts();
  const allFonts = React.useMemo(() => [...customFonts.map(toFontOption), ...FONT_OPTIONS], [customFonts]);
  const fontFileRef = React.useRef<HTMLInputElement>(null);
  const [fontUploadMsg, setFontUploadMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    if (!fontUploadMsg) return;
    const t = window.setTimeout(() => setFontUploadMsg(null), 3500);
    return () => window.clearTimeout(t);
  }, [fontUploadMsg]);
  const fontChipsSwipe = useSwipeScroll<HTMLDivElement>(); // swipeable font category chips (no scrollbar)
  const [fontSearchQuery, setFontSearchQuery] = useState('');
  const [fontCategoryFilter, setFontCategoryFilter] = useState('ALL');

  // Resizable Panel Width State (Figma / VS Code style)
  const [panelWidth, setPanelWidth] = useState<number>(310);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 260 && newWidth <= 520) {
        setPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleAlignCenterX = () => {
    if (!selectedId) return;
    pushHistory();
    if (selectedElement?.type === 'text') {
      updateElement(selectedId, { x: widthMm / 2 });
    } else if (selectedElement && 'cx' in selectedElement) {
      updateElement(selectedId, { cx: widthMm / 2 } as any);
    }
  };

  const handleAlignCenterY = () => {
    if (!selectedId) return;
    pushHistory();
    if (selectedElement?.type === 'text') {
      updateElement(selectedId, { y: heightMm / 2 });
    } else if (selectedElement && 'cy' in selectedElement) {
      updateElement(selectedId, { cy: heightMm / 2 } as any);
    }
  };

  return (
    <aside
      style={{
        width: isRightSidebarOpen ? `${panelWidth}px` : '0px',
        opacity: isRightSidebarOpen ? 1 : 0,
      }}
      className={`relative bg-white dark:bg-slate-900 text-[#333] dark:text-slate-200 border-l border-[#e5e5e5] dark:border-slate-800 flex flex-col select-none text-xs shadow-xs z-30 shrink-0 h-full overflow-hidden transition-colors ${
        isResizing ? 'transition-none select-none pointer-events-auto' : 'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
      } ${!isRightSidebarOpen ? 'border-l-0 pointer-events-none' : ''}`}
    >
      <div style={{ width: `${panelWidth}px` }} className="flex flex-col h-full shrink-0">
        {/* Left Resizer Drag Handle */}
        {isRightSidebarOpen && (
          <div
            onMouseDown={startResizing}
            className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-40 group flex items-center justify-center hover:bg-[#0d99ff]/20 transition-all ${
              isResizing ? 'bg-[#0d99ff] w-1' : ''
            }`}
            title="Drag left/right to resize properties panel"
          >
            <div className={`w-[2px] h-10 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-[#0d99ff] transition-all ${isResizing ? 'bg-[#0d99ff] h-20' : ''}`} />
          </div>
        )}
        {/* Inspector Header & Tabs */}
        <div className="flex flex-col bg-white dark:bg-slate-900 sticky top-0 z-20 shrink-0 border-b border-slate-100 dark:border-slate-800">
          <div className="pl-4 pr-2 h-12 flex items-center justify-between">
            <span className="font-semibold text-[13px] text-slate-900 dark:text-white truncate mr-2">
              {activeRightTab === 'AI'
                ? 'Clixio AI'
                : selectedIds.length > 1
                ? `${selectedIds.length} Layers Selected`
                : selectedElement
                ? (selectedElement.type === 'arc-text' ? 'Arc Text' : selectedElement.type === 'ring' ? 'Ring' : selectedElement.type === 'serrated-ring' ? 'Starburst' : selectedElement.type === 'text' ? 'Straight Text' : selectedElement.type === 'rect' ? 'Box Frame' : selectedElement.type === 'image' ? ((selectedElement as any).isQr ? 'QR code' : 'Logo') : 'Element')
                : 'Stamp Setup'}
            </span>
            <div className="flex items-center gap-0.5 shrink-0">
              {activeRightTab === 'SETUP' && (
                <span className="mr-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md tabular-nums">
                  <ShapeSizeBadge shape={shape} widthMm={widthMm} heightMm={heightMm} />
                </span>
              )}
              {activeRightTab === 'SETUP' && (
                // always takes its space (just hidden with nothing selected) so the header never shifts
                <button
                  onClick={() => selectedId && deleteElement(selectedId)}
                  disabled={!selectedId}
                  aria-hidden={!selectedId}
                  tabIndex={selectedId ? 0 : -1}
                  className={`p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-opacity ${
                    selectedId ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                  title="Delete Selected Element (Del)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {/* Collapse Inspector Button */}
              <button
                type="button"
                onClick={toggleRightSidebar}
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Collapse Panel"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <style>{`
            @keyframes clx-flow { from { transform: translateX(0); } to { transform: translateX(-50%); } }
            @keyframes clx-flow-rev { from { transform: translateX(-50%); } to { transform: translateX(0); } }
            @keyframes clx-bob { 0%,100% { translate: 0 0; } 50% { translate: 0 8%; } }
            @keyframes clx-hue { from { filter: hue-rotate(0deg) saturate(.65); } to { filter: hue-rotate(360deg) saturate(.65); } }
            .clx-wave { position: absolute; left: 0; bottom: 0; width: 200%; height: 100%; }
            .clx-wave-back { opacity: .35; filter: blur(2px); animation: clx-flow-rev 6s linear infinite, clx-bob 2.6s ease-in-out infinite; }
            .clx-wave-front { opacity: .55; filter: blur(1px); animation: clx-flow 4s linear infinite, clx-bob 3.2s ease-in-out infinite reverse; }
            .clx-wave-glow { opacity: .2; filter: blur(8px); animation: clx-flow 4s linear infinite; }
            .clx-hue { position: absolute; inset: 0; animation: clx-hue 10s linear infinite; }
            .clx-ai-btn[data-active=true] .clx-wave-front { animation-duration: 2.6s, 2.2s; }
            .clx-ai-btn[data-active=true] .clx-wave-back { animation-duration: 4s, 2s; }
            @media (prefers-reduced-motion: reduce) { .clx-wave, .clx-hue { animation: none !important; } }
          `}</style>
          <div className="px-3 pb-3">
            <div className="relative grid grid-cols-2 gap-1 p-1 rounded-full bg-slate-100 dark:bg-slate-800">
              {/* Setup indicator */}
              <span
                aria-hidden
                className={`absolute top-1 bottom-1 left-1 w-[calc(50%-6px)] rounded-full bg-[#0d99ff] shadow-[0_4px_12px_-4px_rgba(13,153,255,0.6)] transition-all duration-500 ease-out ${
                  activeRightTab === 'SETUP' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
              />

              <button
                type="button"
                onClick={() => setActiveRightTab('SETUP')}
                role="tab"
                aria-selected={activeRightTab === 'SETUP'}
                className={`relative z-10 h-8 flex items-center justify-center gap-1.5 text-[12px] font-medium rounded-full transition-colors cursor-pointer ${
                  activeRightTab === 'SETUP' ? 'text-white font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Setup
              </button>

              {/* Clixio AI – glossy liquid pill */}
              <button
                type="button"
                onClick={() => setActiveRightTab('AI')}
                role="tab"
                aria-selected={activeRightTab === 'AI'}
                data-active={activeRightTab === 'AI'}
                className={`clx-ai-btn relative z-10 h-8 rounded-full overflow-hidden cursor-pointer select-none transition-all duration-300 ${
                  activeRightTab === 'AI'
                    ? 'shadow-[0_6px_18px_-6px_rgba(168,85,247,0.7)]'
                    : 'hover:bg-white/60 dark:hover:bg-slate-700/60'
                }`}
                style={activeRightTab === 'AI' ? { background: 'linear-gradient(180deg, #05051a 0%, #0d0b2b 55%, #1a1240 100%)' } : undefined}
              >
                {activeRightTab === 'AI' && (
                <>
                <span aria-hidden className="clx-hue fx-pill-in">
                  <svg className="clx-wave clx-wave-glow" viewBox="0 0 200 40" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="clx-rainbow" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="0" spreadMethod="repeat">
                        <stop offset="0" stopColor="#facc15" />
                        <stop offset=".18" stopColor="#f97316" />
                        <stop offset=".36" stopColor="#22c55e" />
                        <stop offset=".54" stopColor="#22d3ee" />
                        <stop offset=".72" stopColor="#6366f1" />
                        <stop offset=".88" stopColor="#d946ef" />
                        <stop offset="1" stopColor="#facc15" />
                      </linearGradient>
                    </defs>
                    {/* soft glow under the wave */}
                    <path fill="url(#clx-rainbow)" d="M0 20 Q12.5 13 25 20 T50 20 T75 20 T100 20 T125 20 T150 20 T175 20 T200 20 V40 H0 Z" />
                  </svg>
                  <svg className="clx-wave clx-wave-back" viewBox="0 0 200 40" preserveAspectRatio="none">
                    <path fill="url(#clx-rainbow)" d="M0 22 Q12.5 30 25 22 T50 22 T75 22 T100 22 T125 22 T150 22 T175 22 T200 22 V40 H0 Z" />
                  </svg>
                  <svg className="clx-wave clx-wave-front" viewBox="0 0 200 40" preserveAspectRatio="none">
                    <path fill="url(#clx-rainbow)" d="M0 25 Q12.5 18 25 25 T50 25 T75 25 T100 25 T125 25 T150 25 T175 25 T200 25 V40 H0 Z" />
                  </svg>
                </span>
                {/* top gloss */}
                <span aria-hidden className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 via-white/0 to-transparent" />
                {/* glass rim */}
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full"
                  style={{
                    boxShadow:
                      'inset 0 0 0 1px rgba(255,255,255,0.55), inset 0 1px 2px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(255,255,255,0.25)',
                  }}
                />
                </>
                )}
                <span className={`relative flex items-center justify-center gap-1.5 text-[12px] ${activeRightTab === 'AI' ? 'font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]' : 'font-medium text-slate-500 dark:text-slate-400'}`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  Clixio AI
                </span>
              </button>
            </div>
          </div>
        </div>

      {activeRightTab === 'AI' ? (
        <div key="tab-ai" className="fx-tab-in flex-1 min-h-0 flex flex-col">
          <AiStudioCopilot />
        </div>
      ) : (
      <div key="tab-setup" className={`${setupIntro ? "fx-tab-stagger " : ""}p-4 space-y-5 flex-1 overflow-y-auto`}>
        {/* --- MULTI-SELECTION & GROUP ACTION PANEL --- */}
        {(selectedIds.length > 1 || selectedElement?.groupId) && (() => {
          const selectedElements = elements.filter((e) => selectedIds.includes(e.id));
          const effectiveGroupId = selectedElement?.groupId || (selectedElements.length > 1 && selectedElements[0]?.groupId);
          const isGrouped = Boolean(effectiveGroupId && (selectedElement?.groupId || (selectedElements.length > 1 && selectedElements.every((e) => e.groupId === effectiveGroupId))));

          return (
            <section className="p-3 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 rounded-xl border border-blue-200/80 dark:border-blue-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0d99ff]/15 dark:bg-[#0d99ff]/25 flex items-center justify-center text-[#0d99ff]">
                    {isGrouped ? <Group className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {isGrouped ? 'Grouped Elements' : `${selectedIds.length} Layers Selected`}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isGrouped ? 'Unified group · Moves together' : 'Combine into a single moveable group'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {isGrouped ? (
                  <button
                    type="button"
                    onClick={() => ungroupElements()}
                    className="flex-1 h-8 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Ungroup className="w-3.5 h-3.5 text-rose-500" />
                    <span>Ungroup</span>
                    <kbd className="text-[9px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-400">Ctrl+Shift+G</kbd>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => groupElements()}
                    className="flex-1 h-8 px-3 rounded-lg bg-[#0d99ff] hover:bg-[#0b87e0] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Group className="w-3.5 h-3.5" />
                    <span>Group Selected</span>
                    <kbd className="text-[9px] px-1 py-0.5 rounded bg-white/25 font-mono text-white/90">Ctrl+G</kbd>
                  </button>
                )}
              </div>
            </section>
          );
        })()}

        {/* --- 1. TEXT (shown first when a text layer is selected) --- */}
        {selectedElement && (selectedElement.type === 'arc-text' || selectedElement.type === 'text') && (
          <section className="space-y-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            {/* Text */}
            <div className="space-y-2">
              <h3 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">Text</h3>
              <textarea
                value={(selectedElement as any).text || ''}
                onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                rows={2}
                placeholder="Type your stamp text…"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-[#0d99ff] focus:ring-2 focus:ring-[#0d99ff]/15 text-[12px] text-slate-900 dark:text-white outline-none resize-none transition-colors"
              />

              {/* Layout: straight or curved */}
              <div className="grid grid-cols-2 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950/60" role="radiogroup" aria-label="Text layout">
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedElement.type === 'text'}
                  onClick={() => {
                    if (selectedElement.type === 'arc-text') {
                      pushHistory();
                      const arc = selectedElement as any;
                      const cx = widthMm / 2;
                      const cy = heightMm / 2;
                      const targetY = arc.isReversed ? (cy + (arc.radius || 10) * 0.7) : (cy - (arc.radius || 10) * 0.7);

                      setElements((prev) =>
                        prev.map((el) => {
                          if (el.id !== selectedElement.id) return el;
                          return {
                            id: el.id,
                            type: 'text',
                            name: el.name ? el.name.replace('(Arc)', '').trim() : 'Straight Text',
                            text: arc.text || 'STAMP TEXT',
                            x: cx,
                            y: Number(targetY.toFixed(1)),
                            fontSize: arc.fontSize || 3.0,
                            fontFamily: arc.fontFamily || 'Inter',
                            fontWeight: arc.fontWeight || 'bold',
                            fontStyle: arc.fontStyle || 'normal',
                            letterSpacing: arc.letterSpacing || 0,
                            align: 'center',
                            visible: true,
                            locked: false,
                          } as any;
                        })
                      );
                    }
                  }}
                  className={`h-7 rounded-md flex items-center justify-center gap-1.5 text-[12px] font-medium transition-colors ${selectedElement.type === 'text' ? 'bg-white dark:bg-slate-800 text-[#0d99ff] shadow-[0_1px_2px_rgba(15,23,42,0.08)]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'}`}
                >
                  <Type className="w-3.5 h-3.5" />
                  Straight
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedElement.type === 'arc-text'}
                  onClick={() => {
                    if (selectedElement.type === 'text') {
                      pushHistory();
                      const t = selectedElement as any;
                      const cx = widthMm / 2;
                      const cy = heightMm / 2;
                      const currentY = t.y ?? cy;
                      const isBottom = currentY > cy;
                      const r = Math.max(8, Number((Math.min(widthMm, heightMm) / 2 - 4.5).toFixed(1)));

                      setElements((prev) =>
                        prev.map((el) => {
                          if (el.id !== selectedElement.id) return el;
                          return {
                            id: el.id,
                            type: 'arc-text',
                            name: el.name ? `${el.name} (Arc)` : 'Curved Text',
                            text: t.text || 'STAMP TEXT',
                            cx,
                            cy,
                            radius: r,
                            startAngle: isBottom ? 40 : -140,
                            sweepAngle: 100,
                            isReversed: isBottom,
                            angleOffset: 0,
                            letterSpacing: t.letterSpacing || 0.15,
                            fontSize: t.fontSize || 3.0,
                            fontFamily: t.fontFamily || 'Inter',
                            fontWeight: t.fontWeight || 'bold',
                            fontStyle: t.fontStyle || 'normal',
                            visible: true,
                            locked: false,
                          } as any;
                        })
                      );
                    }
                  }}
                  className={`h-7 rounded-md flex items-center justify-center gap-1.5 text-[12px] font-medium transition-colors ${selectedElement.type === 'arc-text' ? 'bg-white dark:bg-slate-800 text-[#0d99ff] shadow-[0_1px_2px_rgba(15,23,42,0.08)]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'}`}
                >
                  <Orbit className="w-3.5 h-3.5" />
                  Curved
                </button>
              </div>
            </div>

            {/* Font */}
            <div className="relative space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Font</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">{allFonts.length} fonts</span>
              </div>
              <input
                ref={fontFileRef}
                type="file"
                accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
                className="hidden"
                aria-label="Upload font file"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  try {
                    const font = await addCustomFont(file);
                    updateElement(selectedElement.id, { fontFamily: toFontOption(font).value } as any);
                    setFontUploadMsg({ ok: true, text: `Added “${font.name}” and applied it` });
                  } catch (err: any) {
                    setFontUploadMsg({ ok: false, text: err?.message || 'Could not add this font.' });
                  }
                }}
              />
              {fontUploadMsg && (
                <p role="status" className={`text-[11px] ${fontUploadMsg.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {fontUploadMsg.text}
                </p>
              )}
              <button
                type="button"
                onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                className="w-full h-9 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#0d99ff] focus:ring-2 focus:ring-[#0d99ff]/15 flex items-center justify-between transition-colors group cursor-pointer select-none"
              >
                <span className="text-[13px] text-slate-800 dark:text-slate-100 truncate" style={{ fontFamily: (selectedElement as any).fontFamily || FONT_OPTIONS[0].value }}>
                  {findFontOption((selectedElement as any).fontFamily)?.name || (selectedElement as any).fontFamily?.split(',')[0].replace(/["']/g, '') || 'Plus Jakarta Sans'}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-300 shrink-0 ${isFontDropdownOpen ? 'rotate-180 text-[#0d99ff]' : ''}`} />
              </button>

              {isFontDropdownOpen && (
                <div
                  className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl p-2 z-50 max-h-80 overflow-hidden flex flex-col fx-menu text-xs"
                  onMouseLeave={() => setIsFontDropdownOpen(false)}
                >
                  {/* Search Bar & Category Filters */}
                  <div className="pb-2 border-b border-slate-100 dark:border-slate-800 space-y-1.5 shrink-0">
                    <div className="flex items-center gap-1.5">
                    <div className="flex-1 min-w-0 flex items-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus-within:border-[#0d99ff] focus-within:bg-white rounded-xl px-2.5 py-1.5 transition-all">
                      <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mr-1.5 shrink-0" />
                      <input
                        type="text"
                        value={fontSearchQuery}
                        onChange={(e) => setFontSearchQuery(e.target.value)}
                        placeholder="Search fonts by name..."
                        className="w-full bg-transparent text-xs text-slate-900 dark:text-white outline-none placeholder:text-slate-400 font-medium"
                        autoFocus
                      />
                      {fontSearchQuery && (
                        <button onClick={() => setFontSearchQuery('')} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-xs">
                          ✕
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fontFileRef.current?.click()}
                      title="Upload your own font (.ttf, .otf, .woff, .woff2)"
                      className="shrink-0 h-[30px] px-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-semibold flex items-center gap-1 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      Upload
                    </button>
                    </div>

                    {/* Category Filter Pills */}
                    <div ref={fontChipsSwipe.ref} {...fontChipsSwipe.handlers} className="no-scrollbar flex items-center gap-1 overflow-x-auto overscroll-x-contain select-none cursor-grab active:cursor-grabbing [mask-image:linear-gradient(to_right,black_82%,transparent)]">
                      {[
                        { id: 'ALL', label: 'All' },
                        ...(customFonts.length ? [{ id: 'custom', label: 'My fonts' }] : []),
                        { id: 'sans', label: 'Sans' },
                        { id: 'serif', label: 'Serif' },
                        { id: 'bold', label: 'Bold' },
                        { id: 'script', label: 'Script' },
                        { id: 'mono', label: 'Dater' },
                        { id: 'vintage', label: 'Vintage' },
                        { id: 'indian', label: 'Indian' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFontCategoryFilter(cat.id)}
                          className={`shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                            fontCategoryFilter === cat.id
                              ? 'bg-[#0d99ff] text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-950/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filtered Fonts List */}
                  <div className="overflow-y-auto overflow-x-hidden space-y-1 pt-1.5 max-h-56 pr-0.5">
                    {allFonts
                      .filter((f) => {
                        const matchesSearch = f.name.toLowerCase().includes(fontSearchQuery.toLowerCase()) || f.tag.toLowerCase().includes(fontSearchQuery.toLowerCase());
                        const matchesCat = fontCategoryFilter === 'ALL' || f.category === fontCategoryFilter;
                        return matchesSearch && matchesCat;
                      })
                      .map((f, i) => {
                        const current = findFontOption((selectedElement as any).fontFamily);
                        const isSelected = current ? current.value === f.value : !((selectedElement as any).fontFamily) && f.value === FONT_OPTIONS[0].value;

                        return (
                          <button
                            key={`${f.value}-${i}`}
                            type="button"
                            onClick={() => {
                              updateElement(selectedElement.id, { fontFamily: f.value });
                              setIsFontDropdownOpen(false);
                            }}
                            className={`fx-item w-full text-left px-3 py-2 rounded-xl flex items-center justify-between group cursor-pointer select-none ${
                              isSelected
                                ? 'bg-[#e5f2ff] dark:bg-blue-950/60 text-[#0d99ff] font-bold border border-[#0d99ff]/30 shadow-2xs'
                                : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-transparent'
                            }`}
                          >
                            <LazyFontName name={f.name} value={f.value} />
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-950/60 px-1.5 py-0.5 rounded">
                                {f.tag}
                              </span>
                              {isSelected && <span className="text-[#0d99ff] font-bold text-xs">✓</span>}
                              {f.category === 'custom' && (
                                <span
                                  role="button"
                                  tabIndex={0}
                                  title="Remove this font"
                                  aria-label={`Remove ${f.name}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const own = customFonts.find((c) => c.name === f.name);
                                    if (own) removeCustomFont(own.id);
                                  }}
                                  className="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                >
                                  ✕
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Size</span>
                <div className="w-32">
                  <ModernStepper
                    value={(selectedElement as any).fontSize || 3.0}
                    step={0.1}
                    min={1.0}
                    max={25.0}
                    unit="mm"
                    onChange={(val) => updateElement(selectedElement.id, { fontSize: val })}
                  />
                </div>
              </div>
              <input
                type="range"
                min="1.2"
                max="10.0"
                step="0.1"
                value={(selectedElement as any).fontSize || 3.0}
                onChange={(e) => updateElement(selectedElement.id, { fontSize: parseFloat(e.target.value) })}
                className="w-full accent-[#0d99ff] h-1 cursor-pointer"
                aria-label="Text size"
              />
              <div className="grid grid-cols-4 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950/60">
                {[
                  { label: 'S', size: 2.2 },
                  { label: 'M', size: 3.2 },
                  { label: 'L', size: 4.5 },
                  { label: 'XL', size: 6.0 },
                ].map((p) => {
                  const on = Math.abs(((selectedElement as any).fontSize || 3.0) - p.size) < 0.2;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => updateElement(selectedElement.id, { fontSize: p.size })}
                      title={`${p.size} mm`}
                      className={`h-7 rounded-md flex items-center justify-center gap-1.5 text-[12px] font-medium transition-colors ${on ? 'bg-white dark:bg-slate-800 text-[#0d99ff] shadow-[0_1px_2px_rgba(15,23,42,0.08)]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'}`}
                    >
                      {p.label}
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">{p.size}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Curve (curved text only) */}
            {selectedElement.type === 'arc-text' && (() => {
              const arc = selectedElement as any;
              const isOvalShape = shape === 'OVAL';
              const maxDim = Math.max(widthMm || 40, heightMm || 40);
              const currentRx = arc.rx || Number((arc.radius * ((widthMm || 40) / maxDim)).toFixed(1));
              const currentRy = arc.ry || Number((arc.radius * ((heightMm || 40) / maxDim)).toFixed(1));

              // Helper to auto-spread text across the entire top or bottom arc contour
              const handleSpreadAcrossArc = () => {
                const textStr = arc.text || '';
                if (textStr.length < 2) return;
                const rxVal = isOvalShape ? currentRx : (arc.radius || 15);
                const ryVal = isOvalShape ? currentRy : (arc.radius || 15);
                // Approximate half-perimeter of the ellipse/circle available for top/bottom arc (~70% of half circumference)
                const halfCircumference = Math.PI * Math.sqrt((rxVal * rxVal + ryVal * ryVal) / 2);
                const usableArcMm = halfCircumference * 0.72; // Leave comfortable margin at sides
                const approxCharW = (arc.fontSize || 3.0) * 0.58;
                const baseTextW = textStr.length * approxCharW;
                const targetSpacing = Math.max(0, (usableArcMm - baseTextW) / (textStr.length - 1));
                updateElement(selectedElement.id, { letterSpacing: Number(targetSpacing.toFixed(2)) });
              };
              const posPresets = [
                { label: '0°', value: 0, title: 'Centred at the top / bottom' },
                { label: '−90°', value: -90, title: 'Rotate left' },
                { label: '+90°', value: 90, title: 'Rotate right' },
                { label: '180°', value: 180, title: 'Flip to the opposite side' },
              ];

              return (
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">Curve</h3>

                  {/* Side */}
                  <div className="grid grid-cols-2 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950/60" role="radiogroup" aria-label="Curve side">
                    {([
                      { bottom: false, label: 'Top', d: 'M2.5 10 Q8 2.5 13.5 10' },
                      { bottom: true, label: 'Bottom', d: 'M2.5 6 Q8 13.5 13.5 6' },
                    ] as const).map((opt) => {
                      const active = !!arc.isReversed === opt.bottom;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => !active && updateElement(selectedElement.id, { isReversed: opt.bottom, angleOffset: 0 } as any)}
                          className={`h-7 rounded-md flex items-center justify-center gap-1.5 text-[12px] font-medium transition-colors ${active ? 'bg-white dark:bg-slate-800 text-[#0d99ff] shadow-[0_1px_2px_rgba(15,23,42,0.08)]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'}`}
                        >
                          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d={opt.d} />
                          </svg>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Radius */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{isOvalShape ? 'Curve size' : 'Radius'}</span>
                      <div className="w-32">
                        <ModernStepper
                          value={arc.radius || 15.0}
                          step={0.5}
                          min={4.0}
                          max={60.0}
                          unit="mm"
                          onChange={(newR) => {
                            if (isOvalShape) {
                              const newRx = Number((newR * ((widthMm || 40) / maxDim)).toFixed(1));
                              const newRy = Number((newR * ((heightMm || 40) / maxDim)).toFixed(1));
                              updateElement(selectedElement.id, { radius: newR, rx: newRx, ry: newRy });
                            } else {
                              updateElement(selectedElement.id, { radius: newR });
                            }
                          }}
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min="6.0"
                      max="35.0"
                      step="0.2"
                      value={arc.radius || 15.0}
                      onChange={(e) => {
                        const newR = parseFloat(e.target.value);
                        if (isOvalShape) {
                          const newRx = Number((newR * ((widthMm || 40) / maxDim)).toFixed(1));
                          const newRy = Number((newR * ((heightMm || 40) / maxDim)).toFixed(1));
                          updateElement(selectedElement.id, { radius: newR, rx: newRx, ry: newRy });
                        } else {
                          updateElement(selectedElement.id, { radius: newR });
                        }
                      }}
                      className="w-full accent-[#0d99ff] h-1 cursor-pointer"
                      aria-label="Curve radius"
                    />
                  </div>

                  {isOvalShape && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Width (rx)</span>
                        <ModernStepper value={currentRx} step={0.5} min={4} max={45} unit="mm" onChange={(val) => updateElement(selectedElement.id, { rx: val })} />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Height (ry)</span>
                        <ModernStepper value={currentRy} step={0.5} min={3} max={40} unit="mm" onChange={(val) => updateElement(selectedElement.id, { ry: val })} />
                      </div>
                    </div>
                  )}

                  {/* Letter spacing + fit */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">Spacing</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSpreadAcrossArc}
                        className="h-8 px-2 rounded-md text-[11px] font-medium text-[#0d99ff] hover:bg-[#e5f2ff] dark:hover:bg-blue-950/60 transition-colors whitespace-nowrap"
                        title="Spread the letters evenly across the whole curve"
                      >
                        Fit
                      </button>
                      <div className="w-32">
                        <ModernStepper
                          value={arc.letterSpacing || 0}
                          step={0.05}
                          min={-1}
                          max={10}
                          unit="mm"
                          onChange={(val) => updateElement(selectedElement.id, { letterSpacing: val })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Position on circle */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Position on circle</span>
                      <div className="w-32">
                        <ModernStepper
                          value={arc.angleOffset || 0}
                          step={1}
                          min={-180}
                          max={180}
                          unit="°"
                          onChange={(val) => updateElement(selectedElement.id, { angleOffset: val })}
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={arc.angleOffset || 0}
                      onChange={(e) => updateElement(selectedElement.id, { angleOffset: parseFloat(e.target.value) || 0 })}
                      className="w-full accent-[#0d99ff] h-1 cursor-pointer"
                      aria-label="Position on circle"
                    />
                    <div className="grid grid-cols-4 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950/60">
                      {posPresets.map((p) => {
                        const on = (arc.angleOffset || 0) === p.value;
                        return (
                          <button
                            key={p.label}
                            type="button"
                            title={p.title}
                            onClick={() => updateElement(selectedElement.id, { angleOffset: p.value })}
                            className={`h-7 rounded-md flex items-center justify-center gap-1.5 text-[12px] font-medium transition-colors ${on ? 'bg-white dark:bg-slate-800 text-[#0d99ff] shadow-[0_1px_2px_rgba(15,23,42,0.08)]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'}` + ' tabular-nums'}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </section>
        )}

        {/* --- 2. ALIGNMENT & POSITION --- */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">Position</h3>
            {!selectedId && <span className="text-[11px] text-slate-400 dark:text-slate-500">Select a layer to move it</span>}
          </div>

          {selectedId && (
            <>
              <div className="grid grid-cols-6 gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950/60">
                {([
                  { key: 'left', title: 'Align left', Icon: AlignLeft },
                  { key: 'center-h', title: 'Center horizontally', Icon: AlignHorizontalJustifyCenter },
                  { key: 'right', title: 'Align right', Icon: AlignRight },
                  { key: 'top', title: 'Align top', Icon: AlignStartHorizontal },
                  { key: 'center-v', title: 'Center vertically', Icon: AlignVerticalJustifyCenter },
                  { key: 'bottom', title: 'Align bottom', Icon: AlignEndHorizontal },
                ] as const).map(({ key, title, Icon }) => (
                  <button
                    key={key}
                    onClick={() => alignSelected(key as any)}
                    title={title}
                    className="h-7 flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white hover:shadow-sm transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(['x', 'y'] as const).map((axis) => {
                  const center = axis === 'x' ? widthMm / 2 : heightMm / 2;
                  const cKey = axis === 'x' ? 'cx' : 'cy';
                  const isLine = selectedElement?.type === 'line';
                  const ln = selectedElement as any;
                  // a line is positioned by its centre point
                  const lineMid = isLine ? (axis === 'x' ? (ln.x1 + ln.x2) / 2 : (ln.y1 + ln.y2) / 2) : 0;
                  // a logo is positioned by its centre too (x / y are its top-left corner)
                  const isLogo = selectedElement?.type === 'image';
                  const half = isLogo ? (axis === 'x' ? (ln.width || 0) : (ln.height || 0)) / 2 : 0;
                  const logoMid = isLogo ? (ln[axis] || 0) + half : 0;
                  const raw = isLine ? lineMid : isLogo ? logoMid : selectedElement ? ((cKey in selectedElement ? (selectedElement as any)[cKey] : (selectedElement as any)[axis]) ?? center) : center;
                  return (
                    <InlineNumberField
                      key={axis}
                      label={axis.toUpperCase()}
                      value={Number(Number(raw).toFixed(1))}
                      step={0.5}
                      unit="mm"
                      onChange={(val) => {
                        if (!selectedId) return;
                        if (isLine) {
                          const d = val - lineMid;
                          const k1 = axis === 'x' ? 'x1' : 'y1';
                          const k2 = axis === 'x' ? 'x2' : 'y2';
                          updateElement(selectedId, { [k1]: Number((ln[k1] + d).toFixed(2)), [k2]: Number((ln[k2] + d).toFixed(2)) } as any);
                          return;
                        }
                        if (isLogo) {
                          updateElement(selectedId, { [axis]: Number((val - half).toFixed(2)) } as any);
                          return;
                        }
                        if (selectedElement && cKey in selectedElement) updateElement(selectedId, { [cKey]: val } as any);
                        else updateElement(selectedId, { [axis]: val } as any);
                      }}
                    />
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* --- 3. SHAPE STROKE WEIGHT & GEOMETRY PROPERTIES --- */}
        {selectedElement && (selectedElement.type === 'ring' || selectedElement.type === 'oval' || selectedElement.type === 'rect' || selectedElement.type === 'serrated-ring' || selectedElement.type === 'line') && (
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider block">
                {selectedElement.type === 'ring'
                  ? 'Ring Stroke & Size'
                  : selectedElement.type === 'oval'
                  ? 'Oval Stroke & Size'
                  : selectedElement.type === 'rect'
                  ? 'Box Frame & Stroke'
                  : selectedElement.type === 'serrated-ring'
                  ? 'Starburst Ring & Stroke'
                  : 'Line Stroke & Weight'}
              </span>
              <span className="text-[10px] font-mono font-bold text-[#0d99ff] bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-100">
                {((selectedElement as any).strokeWidth || 0.8).toFixed(1)} mm
              </span>
            </div>

            {/* Stroke Thickness / Weight (കട്ടി) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                Stroke Thickness (Border Weight)
              </label>

              {/* Quick Weight Preset Pills */}
              <div className="grid grid-cols-5 gap-1">
                {[
                  { label: 'Fine', val: 0.4 },
                  { label: 'Normal', val: 0.8 },
                  { label: 'Medium', val: 1.5 },
                  { label: 'Thick', val: 2.5 },
                  { label: 'Heavy', val: 4.0 },
                ].map((preset) => {
                  const isCurrent = Math.abs(((selectedElement as any).strokeWidth || 0.8) - preset.val) < 0.08;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => updateElement(selectedElement.id, { strokeWidth: preset.val } as any)}
                      className={`py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#0d99ff] text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-950/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Continuous Live Weight Slider + Stepper */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="range"
                  min={0.1}
                  max={8.0}
                  step={0.1}
                  value={(selectedElement as any).strokeWidth || 0.8}
                  onChange={(e) =>
                    updateElement(selectedElement.id, { strokeWidth: parseFloat(e.target.value) } as any)
                  }
                  className="flex-1 accent-[#0d99ff] cursor-pointer"
                />
                <div className="w-32 shrink-0">
                  <ModernStepper
                    value={(selectedElement as any).strokeWidth || 0.8}
                    step={0.1}
                    min={0.1}
                    max={15.0}
                    unit="mm"
                    onChange={(val) => updateElement(selectedElement.id, { strokeWidth: val } as any)}
                  />
                </div>
              </div>
            </div>

            {/* Border Style (Pattern) */}
            {selectedElement.type !== 'serrated-ring' && (
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Border Style
                </label>
                {(() => {
                  const cur = (selectedElement as any).strokeType || 'solid';
                  return (
                    <div role="radiogroup" aria-label="Border style" className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950/60">
                      {([
                        { v: 'solid', label: 'Solid', dash: undefined, cap: 'butt' },
                        { v: 'dashed', label: 'Dashed', dash: '5 3.5', cap: 'butt' },
                        { v: 'dotted', label: 'Dotted', dash: '0 4', cap: 'round' },
                      ] as const).map(({ v, label, dash, cap }) => {
                        const active = cur === v;
                        return (
                          <button
                            key={v}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => updateElement(selectedElement.id, { strokeType: v } as any)}
                            className={`h-12 flex flex-col items-center justify-center gap-1.5 rounded-md text-[11px] transition-all cursor-pointer ${
                              active
                                ? 'bg-white dark:bg-slate-700 text-[#0d99ff] font-semibold shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-800'
                            }`}
                          >
                            <svg width="40" height="6" viewBox="0 0 40 6" aria-hidden>
                              <line x1="3" y1="3" x2="37" y2="3" stroke="currentColor" strokeWidth="2.2" strokeDasharray={dash} strokeLinecap={cap} />
                            </svg>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Specific Shape Geometry: Ring */}
            {selectedElement.type === 'ring' && (
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">Ring Radius</label>
                <ModernStepper
                  value={(selectedElement as any).radius || 19}
                  step={0.5}
                  min={2}
                  max={60}
                  unit="mm"
                  onChange={(val) => updateElement(selectedElement.id, { radius: val })}
                />
              </div>
            )}

            {/* Specific Shape Geometry: Oval */}
            {selectedElement.type === 'oval' && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">Width Radius RX</label>
                  <ModernStepper
                    value={(selectedElement as any).rx || 20}
                    step={0.5}
                    min={2}
                    max={60}
                    unit="mm"
                    onChange={(val) => updateElement(selectedElement.id, { rx: val } as any)}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">Height Radius RY</label>
                  <ModernStepper
                    value={(selectedElement as any).ry || 12}
                    step={0.5}
                    min={2}
                    max={60}
                    unit="mm"
                    onChange={(val) => updateElement(selectedElement.id, { ry: val } as any)}
                  />
                </div>
              </div>
            )}

            {/* Specific Shape Geometry: Rect / Box Frame */}
            {selectedElement.type === 'rect' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">Width</label>
                    <ModernStepper
                      value={(selectedElement as any).width || 30}
                      step={0.5}
                      min={2}
                      max={120}
                      unit="mm"
                      onChange={(val) => updateElement(selectedElement.id, { width: val } as any)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">Height</label>
                    <ModernStepper
                      value={(selectedElement as any).height || 20}
                      step={0.5}
                      min={2}
                      max={120}
                      unit="mm"
                      onChange={(val) => updateElement(selectedElement.id, { height: val } as any)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">Corner Rounding (Radius)</label>
                  <ModernStepper
                    value={(selectedElement as any).rx || 0}
                    step={0.5}
                    min={0}
                    max={30}
                    unit="mm"
                    onChange={(val) => updateElement(selectedElement.id, { rx: val, ry: val } as any)}
                  />
                </div>
              </div>
            )}

            {/* Specific Shape Geometry: Starburst (Serrated Ring) */}
            {selectedElement.type === 'serrated-ring' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">Outer Radius</label>
                    <ModernStepper
                      value={(selectedElement as any).outerRadius || 18}
                      step={0.5}
                      min={4}
                      max={60}
                      unit="mm"
                      onChange={(val) => updateElement(selectedElement.id, { outerRadius: val } as any)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">Inner Radius</label>
                    <ModernStepper
                      value={(selectedElement as any).innerRadius || 16}
                      step={0.5}
                      min={2}
                      max={55}
                      unit="mm"
                      onChange={(val) => updateElement(selectedElement.id, { innerRadius: val } as any)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">Starburst Points (Teeth)</label>
                  <ModernStepper
                    value={(selectedElement as any).teeth || 36}
                    step={2}
                    min={8}
                    max={96}
                    unit="pts"
                    onChange={(val) => updateElement(selectedElement.id, { teeth: val } as any)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- LOGO / IMAGE --- */}
        {selectedElement && selectedElement.type === 'image' && (
          <LogoSettings
            el={selectedElement as any}
            widthMm={widthMm}
            heightMm={heightMm}
            onChange={(patch) => updateElement(selectedElement.id, patch as any)}
          />
        )}

        {/* --- 4. INK COLOR --- */}
        <section className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          {(() => {
            const current = STAMP_INK_COLORS.find((c) => c.hex.toLowerCase() === (inkColor || '').toLowerCase());
            return (
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">Ink color</h3>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {current ? current.label : 'Custom'} <span className="font-mono">{(inkColor || '').toUpperCase()}</span>
                </span>
              </div>
            );
          })()}
          <div className="flex items-center gap-2" role="radiogroup" aria-label="Ink color">
            {STAMP_INK_COLORS.map((c) => {
              const active = c.hex.toLowerCase() === (inkColor || '').toLowerCase();
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={c.name}
                  title={c.name}
                  onClick={() => setInkColor(c.hex)}
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                    active ? 'ring-2 ring-offset-2 ring-[#0d99ff]' : 'ring-1 ring-black/10 dark:ring-white/10'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              );
            })}
          </div>
        </section>

        {/* --- 5. LASER OUTPUT --- */}
        <section className="space-y-0.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 mb-1.5">Laser output</h3>
          {([
            { label: 'Invert', hint: 'White letters on black relief', Icon: Contrast, on: laserInvert, set: setLaserInvert },
            { label: 'Mirror', hint: 'Flip the plate for vulcanization', Icon: FlipHorizontal, on: laserMirror, set: setLaserMirror },
            { label: 'Rubber texture', hint: 'Realistic ink-print preview', Icon: Sparkles, on: distressEffect, set: setDistressEffect },
          ]).map(({ label, hint, Icon, on, set }) => (
            <label key={label} title={hint} className="flex items-center gap-2.5 h-9 -mx-1.5 px-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
              <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <span className="text-[12px] text-slate-700 dark:text-slate-200">{label}</span>
              <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} className="sr-only" />
              <span aria-hidden className={`ml-auto relative w-7 h-4 rounded-full shrink-0 transition-colors ${on ? 'bg-[#0d99ff]' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-3' : ''}`} />
              </span>
            </label>
          ))}
        </section>

        {/* --- 6. CANVAS --- */}
        <section className="space-y-0.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 mb-1.5">Canvas</h3>
          <label title="Adding a Ring makes the stamp round, a Box makes it square, a Rectangle makes it rectangular" className="flex items-center gap-2.5 h-9 -mx-1.5 px-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
            <Orbit className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="flex flex-col min-w-0 leading-tight">
              <span className="text-[12px] text-slate-700 dark:text-slate-200">Auto canvas shape</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">Shape follows the border you add</span>
            </span>
            <input type="checkbox" checked={autoCanvasShape} onChange={(e) => setAutoCanvasShape(e.target.checked)} className="sr-only" />
            <span aria-hidden className={`ml-auto relative w-7 h-4 rounded-full shrink-0 transition-colors ${autoCanvasShape ? 'bg-[#0d99ff]' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${autoCanvasShape ? 'translate-x-3' : ''}`} />
              </span>
          </label>
        </section>

      </div>
      )}
      </div>
    </aside>
  );
};
