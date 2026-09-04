import { A4StampInstance, A4SheetConfig } from '../types/a4-sheet';
import { StampElement, StampShapeType, ArcTextElement, StraightTextElement, RingElement, RectElement, OvalElement, SerratedRingElement } from '../types/stamp';
import { generateStampSvg } from './svg-generator';
import { jsPDF } from 'jspdf';

export function getA4PageDimensions(orientation: 'portrait' | 'landscape'): { widthMm: number; heightMm: number } {
  return orientation === 'portrait'
    ? { widthMm: 210, heightMm: 297 }
    : { widthMm: 297, heightMm: 210 };
}

/**
 * Packs stamps tightly on the A4 page in optimal rows with clean cutting gaps
 */
export function autoNestStampsOnA4(
  instances: A4StampInstance[],
  config: A4SheetConfig
): A4StampInstance[] {
  const { widthMm: pageW } = getA4PageDimensions(config.orientation);
  const margin = config.marginMm || 10;
  const gap = config.spacingMm || 4;

  let currentX = margin;
  let currentY = margin + 12; // Leave space for top header
  let maxRowHeight = 0;

  return instances.map((inst) => {
    // Check if stamp fits in current row
    if (currentX + inst.widthMm > pageW - margin && currentX > margin) {
      currentX = margin;
      currentY += maxRowHeight + gap;
      maxRowHeight = 0;
    }

    const placedX = currentX;
    const placedY = currentY;

    maxRowHeight = Math.max(maxRowHeight, inst.heightMm);
    currentX += inst.widthMm + gap;

    return {
      ...inst,
      xMm: Number(placedX.toFixed(1)),
      yMm: Number(placedY.toFixed(1)),
    };
  });
}

/**
 * Proportionally scales a stamp design to a new target dimension and shape
 */
export function cloneStampToSize(
  baseElements: StampElement[],
  baseW: number,
  baseH: number,
  targetW: number,
  targetH: number,
  targetShape: StampShapeType,
  name: string,
  inkColor: string,
  mountName?: string
): A4StampInstance {
  const scaleX = targetW / baseW;
  const scaleY = targetH / baseH;
  const scaleMin = Math.min(targetW, targetH) / Math.min(baseW, baseH);

  const oldCenterX = baseW / 2;
  const oldCenterY = baseH / 2;
  const newCenterX = targetW / 2;
  const newCenterY = targetH / 2;

  const scaledElements: StampElement[] = baseElements.map((el) => {
    switch (el.type) {
      case 'arc-text': {
        const arc = el as ArcTextElement;
        const newFontSize = Math.max(1, Number((arc.fontSize * scaleMin).toFixed(2)));
        const newSpacing = (arc.letterSpacing || 0) * scaleMin;
        const newCx = newCenterX + (arc.cx - oldCenterX) * scaleMin;
        const newCy = newCenterY + (arc.cy - oldCenterY) * scaleMin;

        if (targetShape === 'OVAL') {
          const baseR = (arc as any).radius || 15;
          const newRx = Math.max(2, Number((((arc as any).rx || baseR) * scaleX).toFixed(2)));
          const newRy = Math.max(2, Number((((arc as any).ry || baseR) * scaleY).toFixed(2)));
          return {
            ...arc,
            id: `arc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            cx: Number(newCx.toFixed(2)),
            cy: Number(newCy.toFixed(2)),
            rx: newRx,
            ry: newRy,
            radius: Math.min(newRx, newRy),
            fontSize: newFontSize,
            letterSpacing: Number(newSpacing.toFixed(2)),
          } as any;
        }

        const newRadius = Math.max(2, Number((arc.radius * scaleMin).toFixed(2)));
        const { rx, ry, ...cleanArc } = arc as any;
        return {
          ...cleanArc,
          id: `arc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          cx: Number(newCx.toFixed(2)),
          cy: Number(newCy.toFixed(2)),
          radius: newRadius,
          fontSize: newFontSize,
          letterSpacing: Number(newSpacing.toFixed(2)),
        };
      }

      case 'text': {
        const txt = el as StraightTextElement;
        const newX = newCenterX + (txt.x - oldCenterX) * scaleX;
        const newY = newCenterY + (txt.y - oldCenterY) * scaleY;
        const newFontSize = Math.max(1, Number((txt.fontSize * scaleMin).toFixed(2)));

        return {
          ...txt,
          id: `txt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          x: Number(newX.toFixed(2)),
          y: Number(newY.toFixed(2)),
          fontSize: newFontSize,
        };
      }

      case 'ring': {
        const r = el as RingElement;
        const newStroke = Math.max(0.2, Number((r.strokeWidth * Math.sqrt(scaleMin)).toFixed(2)));
        const newCx = newCenterX + (r.cx - oldCenterX) * scaleX;
        const newCy = newCenterY + (r.cy - oldCenterY) * scaleY;

        if (targetShape === 'OVAL') {
          const newRx = Math.max(1, Number((r.radius * scaleX).toFixed(2)));
          const newRy = Math.max(1, Number((r.radius * scaleY).toFixed(2)));
          return {
            ...r,
            id: `ring-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: 'oval',
            cx: Number(newCx.toFixed(2)),
            cy: Number(newCy.toFixed(2)),
            rx: newRx,
            ry: newRy,
            strokeWidth: newStroke,
          } as any;
        }

        if (targetShape === 'SQUARE' || targetShape === 'RECTANGULAR') {
          const margin = Math.max(0.8, Number(((1 - (r.radius / (Math.min(baseW, baseH) / 2))) * Math.min(targetW, targetH)).toFixed(2)));
          return {
            id: `rect-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: 'Border Frame',
            type: 'rect',
            x: Number(margin.toFixed(2)),
            y: Number(margin.toFixed(2)),
            width: Number((targetW - margin * 2).toFixed(2)),
            height: Number((targetH - margin * 2).toFixed(2)),
            rx: 1.5,
            ry: 1.5,
            strokeWidth: newStroke,
            strokeType: r.strokeType || 'solid',
          } as any;
        }

        const newRadius = Math.max(1, Number((r.radius * scaleMin).toFixed(2)));
        return {
          ...r,
          id: `ring-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          cx: Number(newCx.toFixed(2)),
          cy: Number(newCy.toFixed(2)),
          radius: newRadius,
          strokeWidth: newStroke,
        };
      }

      case 'oval': {
        const ov = el as OvalElement;
        const newStroke = Math.max(0.2, Number((ov.strokeWidth * Math.sqrt(scaleMin)).toFixed(2)));
        const newCx = newCenterX + (ov.cx - oldCenterX) * scaleX;
        const newCy = newCenterY + (ov.cy - oldCenterY) * scaleY;

        if (targetShape === 'ROUND') {
          const maxSafeR = (targetW / 2) - 0.5;
          const newRadius = Math.min(maxSafeR, Math.max(1, Number((Math.min(ov.rx, ov.ry) * scaleMin).toFixed(2))));
          return {
            id: `ring-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: ov.name,
            type: 'ring',
            cx: Number(newCx.toFixed(2)),
            cy: Number(newCy.toFixed(2)),
            radius: newRadius,
            strokeWidth: newStroke,
            strokeType: ov.strokeType || 'solid',
          } as any;
        }

        const newRx = Math.max(1, Number((ov.rx * scaleX).toFixed(2)));
        const newRy = Math.max(1, Number((ov.ry * scaleY).toFixed(2)));
        return {
          ...ov,
          id: `oval-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          cx: Number(newCx.toFixed(2)),
          cy: Number(newCy.toFixed(2)),
          rx: newRx,
          ry: newRy,
          strokeWidth: newStroke,
        };
      }

      case 'rect': {
        const rc = el as RectElement;
        const newStroke = Math.max(0.2, Number((rc.strokeWidth * Math.sqrt(scaleMin)).toFixed(2)));
        const newX = (rc.x / baseW) * targetW;
        const newY = (rc.y / baseH) * targetH;
        const newWidth = (rc.width / baseW) * targetW;
        const newHeight = (rc.height / baseH) * targetH;

        return {
          ...rc,
          id: `rect-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          x: Number(newX.toFixed(2)),
          y: Number(newY.toFixed(2)),
          width: Number(newWidth.toFixed(2)),
          height: Number(newHeight.toFixed(2)),
          strokeWidth: newStroke,
        };
      }

      case 'serrated-ring': {
        const sr = el as SerratedRingElement;
        const newOuter = Math.max(2, Number((sr.outerRadius * scaleMin).toFixed(2)));
        const newInner = Math.max(1, Number((sr.innerRadius * scaleMin).toFixed(2)));
        const newCx = newCenterX + (sr.cx - oldCenterX) * scaleMin;
        const newCy = newCenterY + (sr.cy - oldCenterY) * scaleMin;

        return {
          ...sr,
          id: `serrated-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          cx: Number(newCx.toFixed(2)),
          cy: Number(newCy.toFixed(2)),
          outerRadius: newOuter,
          innerRadius: newInner,
        };
      }

      case 'clipart': {
        const cp = el as any;
        const newCx = newCenterX + (cp.cx - oldCenterX) * scaleMin;
        const newCy = newCenterY + (cp.cy - oldCenterY) * scaleMin;
        const newSize = Math.max(2, Number(((cp.size || 10) * scaleMin).toFixed(2)));

        return {
          ...cp,
          id: `clipart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          cx: Number(newCx.toFixed(2)),
          cy: Number(newCy.toFixed(2)),
          size: newSize,
          width: newSize,
          height: newSize,
        };
      }

      default:
        return {
          ...el,
          id: `${el.type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        };
    }
  });

  return {
    instanceId: `inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name,
    xMm: 15,
    yMm: 25,
    widthMm: targetW,
    heightMm: targetH,
    shape: targetShape,
    elements: scaledElements,
    inkColor,
    mountName,
  };
}

/**
 * Generates unified vector SVG of the full A4 Sheet (210 x 297 mm) with all placed stamps
 */
export function generateA4SheetSvg(
  instances: A4StampInstance[],
  config: A4SheetConfig
): string {
  const { widthMm: pageW, heightMm: pageH } = getA4PageDimensions(config.orientation);
  const bgColor = config.laserInvert ? '#000000' : '#ffffff';
  const strokeColor = config.laserInvert ? '#ffffff' : '#111827';
  const guideColor = config.laserInvert ? '#4ade80' : '#0d99ff';

  const stampsSvg = instances.map((inst, index) => {
    const stampSvgRaw = generateStampSvg({
      widthMm: inst.widthMm,
      heightMm: inst.heightMm,
      inkColor: config.laserInvert ? '#ffffff' : inst.inkColor,
      elements: inst.elements,
      shape: inst.shape,
      invert: config.laserInvert,
      mirror: config.laserMirror,
      distressEffect: false,
    });

    // Extract internal content from stamp SVG (strip outer <svg> tags)
    const contentMatch = stampSvgRaw.match(/<g id="stamp-content"[\s\S]*?<\/g>/);
    const innerContent = contentMatch ? contentMatch[0] : stampSvgRaw;

    // Corner tick marks (Crop Marks) for physical cutting
    const tickLen = 2.5;
    const cropMarks = config.showCropMarks ? `
      <!-- Top-Left Crop Mark -->
      <line x1="${inst.xMm - tickLen}" y1="${inst.yMm}" x2="${inst.xMm}" y2="${inst.yMm}" stroke="${guideColor}" stroke-width="0.2" />
      <line x1="${inst.xMm}" y1="${inst.yMm - tickLen}" x2="${inst.xMm}" y2="${inst.yMm}" stroke="${guideColor}" stroke-width="0.2" />
      <!-- Top-Right Crop Mark -->
      <line x1="${inst.xMm + inst.widthMm}" y1="${inst.yMm}" x2="${inst.xMm + inst.widthMm + tickLen}" y2="${inst.yMm}" stroke="${guideColor}" stroke-width="0.2" />
      <line x1="${inst.xMm + inst.widthMm}" y1="${inst.yMm - tickLen}" x2="${inst.xMm + inst.widthMm}" y2="${inst.yMm}" stroke="${guideColor}" stroke-width="0.2" />
      <!-- Bottom-Left Crop Mark -->
      <line x1="${inst.xMm - tickLen}" y1="${inst.yMm + inst.heightMm}" x2="${inst.xMm}" y2="${inst.yMm + inst.heightMm}" stroke="${guideColor}" stroke-width="0.2" />
      <line x1="${inst.xMm}" y1="${inst.yMm + inst.heightMm}" x2="${inst.xMm}" y2="${inst.yMm + inst.heightMm + tickLen}" stroke="${guideColor}" stroke-width="0.2" />
      <!-- Bottom-Right Crop Mark -->
      <line x1="${inst.xMm + inst.widthMm}" y1="${inst.yMm + inst.heightMm}" x2="${inst.xMm + inst.widthMm + tickLen}" y2="${inst.yMm + inst.heightMm}" stroke="${guideColor}" stroke-width="0.2" />
      <line x1="${inst.xMm + inst.widthMm}" y1="${inst.yMm + inst.heightMm}" x2="${inst.xMm + inst.widthMm}" y2="${inst.yMm + inst.heightMm + tickLen}" stroke="${guideColor}" stroke-width="0.2" />
    ` : '';

    // Cutting Outline (Dashed boundary)
    const cutOutline = config.showCutLines ? `
      <rect 
        x="${inst.xMm}" 
        y="${inst.yMm}" 
        width="${inst.widthMm}" 
        height="${inst.heightMm}" 
        fill="none" 
        stroke="${guideColor}" 
        stroke-width="0.15" 
        stroke-dasharray="1.5, 1.5" 
      />
    ` : '';

    // Dimension Tag Label
    const dimLabel = config.showDimensions ? `
      <text 
        x="${inst.xMm + inst.widthMm / 2}" 
        y="${inst.yMm + inst.heightMm + 2.8}" 
        font-family="Arial, sans-serif" 
        font-size="1.8" 
        font-weight="bold" 
        text-anchor="middle" 
        fill="${config.laserInvert ? '#888888' : '#64748b'}"
      >
        #${index + 1}: ${inst.name || 'Stamp'} (${Math.round(inst.widthMm)}×${Math.round(inst.heightMm)}mm)
      </text>
    ` : '';

    return `
      <!-- Stamp Instance #${index + 1}: ${inst.name} -->
      <g id="a4-stamp-${inst.instanceId}">
        ${cropMarks}
        ${cutOutline}
        <g transform="translate(${inst.xMm}, ${inst.yMm})">
          ${innerContent}
        </g>
        ${dimLabel}
      </g>
    `;
  }).join('\n');

  // Exact 50mm Calibration Ruler for physical printer verification
  const rulerX = pageW - 65;
  const rulerY = pageH - 12;
  const calibrationRuler = `
    <!-- 50mm Scale Calibration Ruler -->
    <g id="a4-calibration-ruler" transform="translate(${rulerX}, ${rulerY})">
      <rect x="0" y="0" width="50" height="3.5" fill="none" stroke="${strokeColor}" stroke-width="0.3" />
      <line x1="0" y1="0" x2="0" y2="3.5" stroke="${strokeColor}" stroke-width="0.6" />
      <line x1="25" y1="0" x2="25" y2="3.5" stroke="${strokeColor}" stroke-width="0.3" />
      <line x1="50" y1="0" x2="50" y2="3.5" stroke="${strokeColor}" stroke-width="0.6" />
      <text x="25" y="-1.5" font-family="Arial, sans-serif" font-size="1.8" font-weight="bold" text-anchor="middle" fill="${strokeColor}">
        1:1 EXACT SCALE VERIFICATION (50 mm)
      </text>
      <text x="0" y="5.5" font-family="Arial, monospace" font-size="1.4" text-anchor="middle" fill="${strokeColor}">0</text>
      <text x="25" y="5.5" font-family="Arial, monospace" font-size="1.4" text-anchor="middle" fill="${strokeColor}">25mm</text>
      <text x="50" y="5.5" font-family="Arial, monospace" font-size="1.4" text-anchor="middle" fill="${strokeColor}">50mm</text>
    </g>
  `;

  return `
    <svg xmlns="http://www.w3.org/2000/svg"
      width="${pageW}mm"
      height="${pageH}mm"
      viewBox="0 0 ${pageW} ${pageH}"
      style="background-color: ${bgColor};"
    >
      ${config.laserInvert ? `<rect width="${pageW}" height="${pageH}" fill="#000000" />` : ''}

      <!-- A4 Sheet Header Info -->
      <g id="a4-sheet-meta" transform="translate(10, 8)">
        <text x="0" y="0" font-family="Arial, sans-serif" font-size="2.4" font-weight="bold" fill="${strokeColor}">
          STAMIOX A4 GANG-SHEET PRODUCTION LAYOUT
        </text>
        <text x="0" y="3.2" font-family="Arial, sans-serif" font-size="1.6" fill="${config.laserInvert ? '#888' : '#666'}">
          Total Stamps: ${instances.length} | Format: A4 (210×297mm) | Mode: ${config.laserInvert ? 'Laser Invert (Negative)' : 'Positive'} ${config.laserMirror ? '+ Mirrored' : ''}
        </text>
      </g>

      <!-- Placed Stamps -->
      <g id="a4-stamps-group">
        ${stampsSvg}
      </g>

      ${calibrationRuler}
    </svg>
  `.trim();
}

/**
 * Launches high-precision direct 1:1 physical scale printing of the entire A4 sheet
 */
export function printA4Sheet(
  instances: A4StampInstance[],
  config: A4SheetConfig,
  title: string = 'A4 Stamp Production Sheet'
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the A4 print sheet');
    return;
  }

  const { widthMm: pageW, heightMm: pageH } = getA4PageDimensions(config.orientation);
  const svgContent = generateA4SheetSvg(instances, config);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - A4 1:1 Scale Print Sheet</title>
        <style>
          @page {
            size: A4 ${config.orientation};
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
          html, body {
            width: ${pageW}mm;
            height: ${pageH}mm;
            margin: 0;
            padding: 0;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            overflow: hidden;
          }
          .a4-print-container {
            width: ${pageW}mm;
            height: ${pageH}mm;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .a4-print-container svg {
            width: ${pageW}mm;
            height: ${pageH}mm;
            display: block;
          }
          @media screen {
            body {
              background: #e2e8f0;
              padding: 20px;
              display: flex;
              justify-content: center;
            }
            .a4-print-container {
              background: white;
              box-shadow: 0 10px 25px rgba(0,0,0,0.15);
            }
          }
        </style>
      </head>
      <body>
        <div class="a4-print-container">
          ${svgContent}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}

/**
 * Downloads the complete A4 Production Sheet as an SVG file
 */
export function downloadA4Svg(
  instances: A4StampInstance[],
  config: A4SheetConfig,
  fileName: string = 'stamiox_a4_gang_sheet.svg'
): void {
  const svgData = generateA4SheetSvg(instances, config);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.svg') ? fileName : `${fileName}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads the complete A4 Production Sheet as a Vector PDF (1:1 physical millimeter scale)
 */
export async function downloadA4Pdf(
  instances: A4StampInstance[],
  config: A4SheetConfig,
  fileName: string = 'stamiox_a4_gang_sheet.pdf'
): Promise<void> {
  const { widthMm: pageW, heightMm: pageH } = getA4PageDimensions(config.orientation);
  const pdf = new jsPDF({
    orientation: config.orientation,
    unit: 'mm',
    format: 'a4',
  });

  const svgString = generateA4SheetSvg(instances, config);

  const canvas = document.createElement('canvas');
  const scale = 4; // 4x high-res
  canvas.width = ((pageW * 96) / 25.4) * scale;
  canvas.height = ((pageH * 96) / 25.4) * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  await new Promise<void>((resolve) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH);
      pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.src = url;
  });
}
