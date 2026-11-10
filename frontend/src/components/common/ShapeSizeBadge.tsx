'use client';

import React from 'react';
import { formatStampSize, SHAPE_LABELS } from '../../lib/units';

/** Small outline of the stamp shape (drawn to its real proportions) + its size, e.g. ◯ Ø 40 mm / □ 40 × 40 mm. */
export const ShapeSizeBadge: React.FC<{ shape: string; widthMm: number; heightMm: number; className?: string }> = ({
  shape,
  widthMm,
  heightMm,
  className = '',
}) => {
  const k = 12 / Math.max(widthMm, heightMm, 1);
  const w = Math.max(5, widthMm * k);
  const h = Math.max(5, heightMm * k);
  const radius = shape === 'ROUND' || shape === 'OVAL' ? '50%' : '2px';
  return (
    <span className={`inline-flex items-center gap-1.5 tabular-nums ${className}`} title={`${SHAPE_LABELS[shape] || shape} · ${formatStampSize(shape, widthMm, heightMm)}`}>
      <span className="inline-flex w-3 h-3 items-center justify-center shrink-0">
        <span className="border-[1.5px] border-current" style={{ width: w, height: h, borderRadius: radius }} />
      </span>
      {formatStampSize(shape, widthMm, heightMm)}
    </span>
  );
};
