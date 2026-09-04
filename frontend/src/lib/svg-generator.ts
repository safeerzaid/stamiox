import { StampElement, ArcTextElement, StraightTextElement, RingElement, SerratedRingElement, RectElement, OvalElement, LineElement, ClipartElement, ImageElement, QRCodeElement } from '../types/stamp';
import { calculateArcGlyphs, generateSerratedPath } from './arc-text';

export interface SvgRenderOptions {
  widthMm: number;
  heightMm: number;
  inkColor: string;
  elements: StampElement[];
  shape?: string;
  invert?: boolean; // Laser negative for engraving
  mirror?: boolean; // Mirror horizontal for stamp maker plate
  distressEffect?: boolean; // Realistic rubber ink texture
}

export function generateStampSvg(options: SvgRenderOptions): string {
  const {
    widthMm,
    heightMm,
    inkColor,
    elements,
    shape = 'ROUND',
    invert = false,
    mirror = false,
    distressEffect = false,
  } = options;

  const actualInk = invert ? '#ffffff' : inkColor;
  const bgColor = invert ? '#000000' : 'none';

  let filterDefs = '';
  if (distressEffect) {
    filterDefs = `
      <defs>
        <filter id="stamp-grunge" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    `;
  }

  const renderedElements = elements
    .filter((el) => el.visible !== false)
    .map((el) => renderElementSvg(el, actualInk, shape, widthMm, heightMm))
    .join('\n');

  let transformAttr = '';
  if (mirror) {
    transformAttr = `transform="translate(${widthMm}, 0) scale(-1, 1)"`;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" 
      width="${widthMm}mm" 
      height="${heightMm}mm" 
      viewBox="0 0 ${widthMm} ${heightMm}" 
      style="background-color: ${bgColor};"
      ${distressEffect ? 'filter="url(#stamp-grunge)"' : ''}
    >
      ${filterDefs}
      ${invert ? `<rect width="${widthMm}" height="${heightMm}" fill="#000000" />` : ''}
      <g id="stamp-content" ${transformAttr} fill="${actualInk}" stroke="${actualInk}">
        ${renderedElements}
      </g>
    </svg>
  `.trim();
}

function renderElementSvg(
  el: StampElement,
  inkColor: string,
  shape?: string,
  widthMm?: number,
  heightMm?: number
): string {
  switch (el.type) {
    case 'arc-text': {
      const arc = el as ArcTextElement;
      const isOvalShape = shape === 'OVAL';
      const maxDim = Math.max(widthMm || 40, heightMm || 40);
      const rx = (arc as any).rx || (isOvalShape ? arc.radius * ((widthMm || 40) / maxDim) : arc.radius);
      const ry = (arc as any).ry || (isOvalShape ? arc.radius * ((heightMm || 40) / maxDim) : arc.radius);
      const glyphs = calculateArcGlyphs(arc, arc.cx, arc.cy, arc.radius, undefined, undefined, arc.isReversed, arc.letterSpacing, rx, ry);
      const glyphElements = glyphs
        .map(
          (g) =>
            `<text 
              x="${g.x.toFixed(3)}" 
              y="${g.y.toFixed(3)}" 
              font-family="${arc.fontFamily || 'Montserrat, Arial, sans-serif'}" 
              font-size="${arc.fontSize || 3.0}" 
              font-weight="${arc.fontWeight || 'bold'}" 
              font-style="${arc.fontStyle || 'normal'}" 
              text-anchor="middle" 
              dominant-baseline="central" 
              fill="${inkColor}" 
              stroke="none" 
              transform="rotate(${g.rotation.toFixed(2)}, ${g.x.toFixed(3)}, ${g.y.toFixed(3)})"
            >${escapeXml(g.char)}</text>`
        )
        .join('\n');
      return `<g id="${arc.id}" class="element-arc-text">${glyphElements}</g>`;
    }

    case 'text': {
      const txt = el as StraightTextElement;
      const textAnchor = txt.align === 'center' ? 'middle' : txt.align === 'right' ? 'end' : 'start';
      const lines = (txt.text || '').split('\n');
      const fontSize = txt.fontSize || 3.0;
      const lineHeight = (txt.lineHeight || 1.25) * fontSize;
      const totalBlockHeight = (lines.length - 1) * lineHeight;
      const startY = txt.y - totalBlockHeight / 2;

      const renderedLines = lines
        .map((line, idx) => {
          const lineY = lines.length === 1 ? txt.y : startY + idx * lineHeight;
          return `<text 
            x="${txt.x}" 
            y="${lineY.toFixed(2)}" 
            font-family="${txt.fontFamily || 'Montserrat, Arial, sans-serif'}" 
            font-size="${fontSize}" 
            font-weight="${txt.fontWeight || 'bold'}" 
            font-style="${txt.fontStyle || 'normal'}" 
            text-anchor="${textAnchor}" 
            dominant-baseline="central" 
            fill="${inkColor}" 
            stroke="none"
            letter-spacing="${txt.letterSpacing ? txt.letterSpacing + 'mm' : '0'}"
          >${escapeXml(line)}</text>`;
        })
        .join('\n');

      return `<g id="${txt.id}" class="element-straight-text">${renderedLines}</g>`;
    }

    case 'ring': {
      const ring = el as RingElement;
      let dashArrayAttr = '';
      if (ring.strokeType === 'dashed') dashArrayAttr = 'stroke-dasharray="1.5, 1"';
      if (ring.strokeType === 'dotted') dashArrayAttr = 'stroke-dasharray="0.6, 0.8"';

      if ((ring as any).rx !== undefined && (ring as any).ry !== undefined) {
        return `
          <ellipse 
            id="${ring.id}" 
            cx="${ring.cx}" 
            cy="${ring.cy}" 
            rx="${(ring as any).rx}" 
            ry="${(ring as any).ry}" 
            fill="none" 
            stroke="${inkColor}" 
            stroke-width="${ring.strokeWidth || 0.6}" 
            ${dashArrayAttr} 
          />
        `;
      }

      return `
        <circle 
          id="${ring.id}" 
          cx="${ring.cx}" 
          cy="${ring.cy}" 
          r="${ring.radius}" 
          fill="none" 
          stroke="${inkColor}" 
          stroke-width="${ring.strokeWidth || 0.6}" 
          ${dashArrayAttr} 
        />
      `;
    }

    case 'serrated-ring': {
      const s = el as SerratedRingElement;
      const isWreath = (s as any).wreathStyle || (s as any).wreath || false;
      const pathD = generateSerratedPath(s.cx, s.cy, s.outerRadius, s.innerRadius, s.teeth, isWreath);
      return `
        <path 
          id="${s.id}" 
          d="${pathD}" 
          fill="${isWreath && (isWreath === true || isWreath === 'wreath' || isWreath === 'checkered' || isWreath === 'diamond') ? inkColor : 'none'}" 
          stroke="${inkColor}" 
          stroke-width="${s.strokeWidth || 0.6}" 
        />
      `;
    }

    case 'rect': {
      const r = el as RectElement;
      let dashAttr = '';
      if (r.strokeType === 'dashed') dashAttr = 'stroke-dasharray="2, 1"';
      if (r.strokeType === 'dotted') dashAttr = 'stroke-dasharray="0.8, 0.8"';

      return `
        <rect 
          id="${r.id}" 
          x="${r.x}" 
          y="${r.y}" 
          width="${r.width}" 
          height="${r.height}" 
          rx="${r.rx || 0}" 
          ry="${r.ry || 0}" 
          fill="none" 
          stroke="${inkColor}" 
          stroke-width="${r.strokeWidth || 0.6}" 
          ${dashAttr} 
        />
      `;
    }

    case 'oval': {
      const o = el as OvalElement;
      return `
        <ellipse 
          id="${o.id}" 
          cx="${o.cx}" 
          cy="${o.cy}" 
          rx="${o.rx}" 
          ry="${o.ry}" 
          fill="none" 
          stroke="${inkColor}" 
          stroke-width="${o.strokeWidth || 0.6}" 
        />
      `;
    }

    case 'line': {
      const l = el as LineElement;
      return `
        <line 
          id="${l.id}" 
          x1="${l.x1}" 
          y1="${l.y1}" 
          x2="${l.x2}" 
          y2="${l.y2}" 
          stroke="${inkColor}" 
          stroke-width="${l.strokeWidth || 0.4}" 
          stroke-linecap="round" 
        />
      `;
    }

    case 'clipart': {
      const c = el as ClipartElement;
      const width = c.width || 8;
      const height = c.height || 8;
      const x = c.cx - width / 2;
      const y = c.cy - height / 2;
      const vb = (c as any).viewBox || (c.svgPath ? '0 0 100 100' : '0 0 24 24');

      let inner = c.svgPath || '';
      if (!inner) {
        if (c.name === 'star-five-point') {
          inner = '<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="currentColor"/>';
        } else if (c.name === 'stars-triple') {
          inner = `
            <polygon points="12,4 14,8 19,9 15,13 16,18 12,15 8,18 9,13 5,9 10,8" fill="currentColor"/>
            <polygon points="30,2 32.5,7.5 38,8.5 34,13 35,19 30,16 25,19 26,13 22,8.5 27.5,7.5" fill="currentColor"/>
            <polygon points="48,4 50,8 55,9 51,13 52,18 48,15 44,18 45,13 41,9 46,8" fill="currentColor"/>
          `;
        } else if (c.name === 'scales-of-justice') {
          inner = '<path d="M12 3v17M12 3H7m5 0h5M4 8l3 7h-6l3-7zm13 0l3 7h-6l3-7zM7 8h10M9 20h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>';
        } else if (c.name === 'caduceus') {
          inner = '<path d="M12 2v20M8 5c2-2 6-2 8 0s0 4-4 5 2 4 4 5-2 3-4 3-4-2-4-3 6-4 4-5-6-3-4-5z" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="12" cy="3" r="1.5" fill="currentColor"/>';
        } else if (c.name === 'shield-check') {
          inner = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" stroke-width="1.8"/><polyline points="9 12 11 14 15 10" stroke="currentColor" stroke-width="2" fill="none"/>';
        } else {
          inner = '<circle cx="12" cy="12" r="8" fill="currentColor"/>';
        }
      }

      return `
        <svg 
          id="${c.id}" 
          x="${x.toFixed(2)}" 
          y="${y.toFixed(2)}" 
          width="${width}" 
          height="${height}" 
          viewBox="${vb}" 
          color="${inkColor}"
          style="overflow: visible;"
        >
          ${inner}
        </svg>
      `;
    }

    case 'qrcode': {
      const q = el as QRCodeElement;
      const size = q.size || 14;
      const x = q.cx - size / 2;
      const y = q.cy - size / 2;
      const half = size / 2;
      return `
        <g id="${q.id}">
          <rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${size}" height="${size}" fill="none" stroke="${inkColor}" stroke-width="0.3"/>
          <text x="${q.cx}" y="${q.cy}" font-size="2" text-anchor="middle" dominant-baseline="central" fill="${inkColor}" stroke="none">QR CODE</text>
        </g>
      `;
    }

    case 'image': {
      const img = el as ImageElement;
      return `
        <image 
          id="${img.id}" 
          href="${img.src}" 
          x="${img.x}" 
          y="${img.y}" 
          width="${img.width}" 
          height="${img.height}" 
        />
      `;
    }

    default:
      return '';
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
