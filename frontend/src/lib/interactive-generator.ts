import { StampElement, StampShapeType } from '../types/stamp';

export type DesignStyle = 'professional' | 'minimal' | 'bold' | 'classic';
export type ShapeOption = 'rectangle' | 'round' | 'square';
export type ContentPreset = 'company_address' | 'company_logo' | 'name_designation' | 'custom';

export interface InteractiveConfig {
  style: DesignStyle;
  shape: ShapeOption;
  contentPreset: ContentPreset;
  companyName?: string;
  address?: string;
  personName?: string;
  designation?: string;
  phone?: string;
  inkColor?: string;
}

export interface GeneratedInteractiveStamp {
  title: string;
  category: string;
  shape: StampShapeType;
  widthMm: number;
  heightMm: number;
  inkColor: string;
  elements: StampElement[];
}

const uid = () => 'el_' + Math.random().toString(36).substring(2, 9);

function fitFontSize(
  text: string,
  maxAvailableWidthMm: number,
  maxFontSizeMm = 3.6,
  minFontSizeMm = 1.3,
  isAllCapsBold = true
): number {
  if (!text || text.length === 0) return maxFontSizeMm;
  const charWidthRatio = isAllCapsBold ? 0.76 : 0.60;
  const idealFontSize = maxAvailableWidthMm / (text.length * charWidthRatio);
  const computed = Math.min(maxFontSizeMm, idealFontSize);
  return Number(Math.max(minFontSizeMm, computed).toFixed(2));
}

export function generateInteractiveStamp(config: InteractiveConfig): GeneratedInteractiveStamp {
  const company = (config.companyName || 'APEX INFOTECH SOLUTIONS').trim();
  const address = (config.address || 'MG ROAD, KOCHI, KERALA').trim();
  const person = (config.personName || 'DR. ARUN KUMAR').trim();
  const designation = (config.designation || 'MANAGING DIRECTOR').trim();
  const phone = (config.phone || '+91 98470 12345 · GST: 32AAAAA0000A1Z5').trim();
  const ink = config.inkColor || '#1e3a8a';
  const { style, shape, contentPreset } = config;

  // Font family determination based on style
  const fontFamily =
    style === 'classic'
      ? 'Cinzel, Georgia, serif'
      : style === 'bold'
      ? 'Impact, Arial Black, sans-serif'
      : style === 'minimal'
      ? 'Plus Jakarta Sans, Inter, sans-serif'
      : 'Inter, Arial, sans-serif';

  // Border weights based on style
  const borderWeight =
    style === 'bold' ? 0.95 : style === 'minimal' ? 0.35 : style === 'classic' ? 0.65 : 0.55;

  if (shape === 'round') {
    return generateRoundInteractive({
      company,
      address,
      person,
      designation,
      phone,
      ink,
      style,
      contentPreset,
      fontFamily,
      borderWeight,
    });
  } else if (shape === 'square') {
    return generateSquareInteractive({
      company,
      address,
      person,
      designation,
      phone,
      ink,
      style,
      contentPreset,
      fontFamily,
      borderWeight,
    });
  } else {
    // Default: rectangle (50x20mm or 55x25mm for designation)
    return generateRectangleInteractive({
      company,
      address,
      person,
      designation,
      phone,
      ink,
      style,
      contentPreset,
      fontFamily,
      borderWeight,
    });
  }
}

// -------------------------------------------------------------
// RECTANGLE GENERATOR
// -------------------------------------------------------------
function generateRectangleInteractive(args: {
  company: string;
  address: string;
  person: string;
  designation: string;
  phone: string;
  ink: string;
  style: DesignStyle;
  contentPreset: ContentPreset;
  fontFamily: string;
  borderWeight: number;
}): GeneratedInteractiveStamp {
  const isDesignation = args.contentPreset === 'name_designation';
  const widthMm = isDesignation ? 55 : 50;
  const heightMm = isDesignation ? 25 : 20;
  const cx = widthMm / 2;
  const maxW = widthMm - 12; // 6mm margin on each side

  const elements: StampElement[] = [];

  // Outer Border Box (unless style is minimal borderless, or minimal thin)
  if (args.style !== 'minimal') {
    elements.push({
      id: uid(),
      type: 'rect',
      name: 'Outer Border',
      x: 1.0,
      y: 1.0,
      width: widthMm - 2.0,
      height: heightMm - 2.0,
      rx: args.style === 'classic' ? 0.8 : 1.5,
      ry: args.style === 'classic' ? 0.8 : 1.5,
      strokeWidth: args.borderWeight,
      strokeType: 'solid',
      visible: true,
    });

    if (args.style === 'classic') {
      elements.push({
        id: uid(),
        type: 'rect',
        name: 'Inner Decorative Border',
        x: 2.2,
        y: 2.2,
        width: widthMm - 4.4,
        height: heightMm - 4.4,
        rx: 0.5,
        ry: 0.5,
        strokeWidth: 0.25,
        strokeType: 'solid',
        visible: true,
      });
    }
  } else {
    // Minimal style: hairline rounded rectangle
    elements.push({
      id: uid(),
      type: 'rect',
      name: 'Minimal Border',
      x: 1.2,
      y: 1.2,
      width: widthMm - 2.4,
      height: heightMm - 2.4,
      rx: 2.0,
      ry: 2.0,
      strokeWidth: 0.35,
      strokeType: 'solid',
      visible: true,
    });
  }

  if (args.contentPreset === 'company_address') {
    const headerFontSize = fitFontSize(args.company, maxW, 2.5, 1.4, true);
    const addressFontSize = fitFontSize(args.address, maxW, 2.0, 1.3, false);

    const estHeaderW = Math.min(38, Math.max(20, args.company.length * headerFontSize * 0.76));
    const dividerHalf = Math.min(19, estHeaderW / 2 + 1.5);

    elements.push(
      {
        id: uid(),
        type: 'text',
        name: 'Company Header',
        text: args.company.toUpperCase(),
        x: cx,
        y: 5.2,
        fontSize: headerFontSize,
        fontFamily: args.fontFamily,
        fontWeight: args.style === 'minimal' ? '600' : 'bold',
        align: 'center',
        visible: true,
      },
      {
        id: uid(),
        type: 'line',
        name: 'Divider Line',
        x1: Number((cx - dividerHalf).toFixed(2)),
        y1: 7.8,
        x2: Number((cx + dividerHalf).toFixed(2)),
        y2: 7.8,
        strokeWidth: args.style === 'bold' ? 0.5 : 0.3,
        strokeType: 'solid',
        visible: true,
      },
      {
        id: uid(),
        type: 'text',
        name: 'Address Line',
        text: args.address,
        x: cx,
        y: 12.0,
        fontSize: addressFontSize,
        fontFamily: args.fontFamily,
        fontWeight: '500',
        align: 'center',
        visible: true,
      },
      {
        id: uid(),
        type: 'text',
        name: 'Tag / City',
        text: '★ OFFICIAL STAMP ★',
        x: cx,
        y: 16.0,
        fontSize: 1.6,
        fontFamily: args.fontFamily,
        fontWeight: 'bold',
        align: 'center',
        visible: true,
      }
    );
  } else if (args.contentPreset === 'company_logo') {
    const headerFontSize = fitFontSize(args.company, maxW, 2.4, 1.4, true);
    const addressFontSize = fitFontSize(args.address, maxW, 1.9, 1.3, false);

    elements.push(
      {
        id: uid(),
        type: 'text',
        name: 'Company Header',
        text: args.company.toUpperCase(),
        x: cx,
        y: 4.8,
        fontSize: headerFontSize,
        fontFamily: args.fontFamily,
        fontWeight: 'bold',
        align: 'center',
        visible: true,
      },
      {
        id: uid(),
        type: 'text',
        name: 'Logo Emblem',
        text: '★ ❖ ★',
        x: cx,
        y: 9.6,
        fontSize: 3.2,
        fontFamily: args.fontFamily,
        fontWeight: 'bold',
        align: 'center',
        visible: true,
      },
      {
        id: uid(),
        type: 'text',
        name: 'Address Line',
        text: args.address,
        x: cx,
        y: 14.8,
        fontSize: addressFontSize,
        fontFamily: args.fontFamily,
        fontWeight: '500',
        align: 'center',
        visible: true,
      }
    );
  } else if (args.contentPreset === 'name_designation') {
    const compHeader = `For ${args.company.toUpperCase()}`;
    const compFontSize = fitFontSize(compHeader, maxW, 2.5, 1.4, true);
    const nameFontSize = fitFontSize(args.person, maxW, 2.7, 1.5, true);
    const desigFontSize = fitFontSize(args.designation, maxW, 2.0, 1.3, false);

    elements.push(
      {
        id: uid(),
        type: 'text',
        name: 'For Company',
        text: compHeader,
        x: cx,
        y: 4.8,
        fontSize: compFontSize,
        fontFamily: args.fontFamily,
        fontWeight: 'bold',
        align: 'center',
        visible: true,
      },
      {
        id: uid(),
        type: 'text',
        name: 'Person Name',
        text: args.person.toUpperCase(),
        x: cx,
        y: 16.0,
        fontSize: nameFontSize,
        fontFamily: args.fontFamily,
        fontWeight: 'bold',
        align: 'center',
        visible: true,
      },
      {
        id: uid(),
        type: 'text',
        name: 'Designation',
        text: args.designation.toUpperCase(),
        x: cx,
        y: 19.8,
        fontSize: desigFontSize,
        fontFamily: args.fontFamily,
        fontWeight: '600',
        align: 'center',
        visible: true,
      },
      {
        id: uid(),
        type: 'text',
        name: 'Signatory Tag',
        text: '(AUTHORIZED SIGNATORY)',
        x: cx,
        y: 22.8,
        fontSize: 1.5,
        fontFamily: args.fontFamily,
        fontWeight: '500',
        align: 'center',
        visible: true,
      }
    );
  } else {
    // Custom content (Company, Address, Phone, GST)
    const headerFontSize = fitFontSize(args.company, maxW, 2.4, 1.4, true);
    const addressFontSize = fitFontSize(args.address, maxW, 1.9, 1.3, false);
    const phoneFontSize = fitFontSize(args.phone, maxW, 1.8, 1.2, false);

    elements.push(
      {
        id: uid(),
        type: 'text',
        name: 'Company Header',
        text: args.company.toUpperCase(),
        x: cx,
        y: 4.4,
        fontSize: headerFontSize,
        fontFamily: args.fontFamily,
        fontWeight: 'bold',
        align: 'center',
        visible: true,
      },
      {
        id: uid(),
        type: 'line',
        name: 'Divider Line',
        x1: 6.0,
        y1: 6.7,
        x2: widthMm - 6.0,
        y2: 6.7,
        strokeWidth: 0.35,
        strokeType: 'solid',
        visible: true,
      },
      {
        id: uid(),
        type: 'text',
        name: 'Address Line',
        text: args.address,
        x: cx,
        y: 9.8,
        fontSize: addressFontSize,
        fontFamily: args.fontFamily,
        fontWeight: '500',
        align: 'center',
        visible: true,
      },
      {
        id: uid(),
        type: 'text',
        name: 'Phone / GST Line',
        text: args.phone,
        x: cx,
        y: 14.5,
        fontSize: phoneFontSize,
        fontFamily: args.fontFamily,
        fontWeight: '600',
        align: 'center',
        visible: true,
      }
    );
  }

  return {
    title: `${args.company} — ${capitalize(args.style)} Rectangle`,
    category: `${capitalize(args.style)} Rectangle`,
    shape: 'RECTANGULAR',
    widthMm,
    heightMm,
    inkColor: args.ink,
    elements,
  };
}

// -------------------------------------------------------------
// ROUND GENERATOR
// -------------------------------------------------------------
function generateRoundInteractive(args: {
  company: string;
  address: string;
  person: string;
  designation: string;
  phone: string;
  ink: string;
  style: DesignStyle;
  contentPreset: ContentPreset;
  fontFamily: string;
  borderWeight: number;
}): GeneratedInteractiveStamp {
  const widthMm = 42;
  const heightMm = 42;
  const cx = 21;
  const cy = 21;

  const elements: StampElement[] = [
    // Outer Border Ring
    {
      id: uid(),
      type: 'ring',
      name: 'Outer Ring',
      cx,
      cy,
      radius: 19.8,
      strokeWidth: args.borderWeight,
      strokeType: 'solid',
      visible: true,
    },
  ];

  if (args.style === 'classic' || args.style === 'professional') {
    elements.push({
      id: uid(),
      type: 'ring',
      name: 'Inner Decorative Ring',
      cx,
      cy,
      radius: 18.2,
      strokeWidth: 0.3,
      strokeType: 'solid',
      visible: true,
    });
    elements.push({
      id: uid(),
      type: 'ring',
      name: 'Core Ring',
      cx,
      cy,
      radius: 11.5,
      strokeWidth: 0.4,
      strokeType: 'solid',
      visible: true,
    });
  }

  // Top Arc: Company Name
  const topFontSize = fitFontSize(args.company, 36, 2.7, 1.8, true);
  elements.push({
    id: uid(),
    type: 'arc-text',
    name: 'Top Company Arc',
    text: args.company.toUpperCase(),
    cx,
    cy,
    radius: 14.8,
    startAngle: -140,
    sweepAngle: 100,
    fontSize: topFontSize,
    fontFamily: args.fontFamily,
    fontWeight: args.style === 'minimal' ? '600' : 'bold',
    isReversed: false,
    visible: true,
  });

  // Bottom Arc: Address or Designation
  const bottomText =
    args.contentPreset === 'name_designation'
      ? args.designation.toUpperCase()
      : args.address.toUpperCase();
  const bottomFontSize = fitFontSize(bottomText, 32, 2.3, 1.5, false);

  elements.push({
    id: uid(),
    type: 'arc-text',
    name: 'Bottom Arc',
    text: bottomText,
    cx,
    cy,
    radius: 14.8,
    startAngle: 40,
    sweepAngle: 100,
    fontSize: bottomFontSize,
    fontFamily: args.fontFamily,
    fontWeight: '600',
    isReversed: true,
    visible: true,
  });

  // Center Core Content based on preset
  if (args.contentPreset === 'name_designation') {
    const nameFontSize = fitFontSize(args.person, 18, 2.2, 1.4, true);
    elements.push(
      {
        id: uid(),
        type: 'text',
        name: 'Person Name',
        text: args.person.toUpperCase(),
        x: cx,
        y: cy - 0.8,
        fontSize: nameFontSize,
        fontFamily: args.fontFamily,
        fontWeight: 'bold',
        align: 'center',
        visible: true,
      },
      {
        id: uid(),
        type: 'text',
        name: 'Designation Tag',
        text: 'OFFICIAL SEAL',
        x: cx,
        y: cy + 3.8,
        fontSize: 1.5,
        fontFamily: args.fontFamily,
        fontWeight: '600',
        align: 'center',
        visible: true,
      }
    );
  } else if (args.contentPreset === 'company_logo') {
    elements.push(
      {
        id: uid(),
        type: 'text',
        name: 'Center Emblem',
        text: '★ ❖ ★',
        x: cx,
        y: cy - 0.5,
        fontSize: 3.8,
        fontFamily: args.fontFamily,
        fontWeight: 'bold',
        align: 'center',
        visible: true,
      },
      {
        id: uid(),
        type: 'text',
        name: 'Official Tag',
        text: 'VERIFIED',
        x: cx,
        y: cy + 4.2,
        fontSize: 1.6,
        fontFamily: args.fontFamily,
        fontWeight: '600',
        align: 'center',
        visible: true,
      }
    );
  } else {
    elements.push(
      {
        id: uid(),
        type: 'text',
        name: 'Stars',
        text: '★ ★ ★',
        x: cx,
        y: cy - 2.8,
        fontSize: 2.1,
        fontFamily: args.fontFamily,
        fontWeight: 'bold',
        align: 'center',
        visible: true,
      },
      {
        id: uid(),
        type: 'text',
        name: 'Official Seal Tag',
        text: 'OFFICIAL SEAL',
        x: cx,
        y: cy + 1.2,
        fontSize: 1.8,
        fontFamily: args.fontFamily,
        fontWeight: 'bold',
        align: 'center',
        visible: true,
      }
    );
  }

  return {
    title: `${args.company} — ${capitalize(args.style)} Round Seal`,
    category: `${capitalize(args.style)} Round`,
    shape: 'ROUND',
    widthMm,
    heightMm,
    inkColor: args.ink,
    elements,
  };
}

// -------------------------------------------------------------
// SQUARE GENERATOR
// -------------------------------------------------------------
function generateSquareInteractive(args: {
  company: string;
  address: string;
  person: string;
  designation: string;
  phone: string;
  ink: string;
  style: DesignStyle;
  contentPreset: ContentPreset;
  fontFamily: string;
  borderWeight: number;
}): GeneratedInteractiveStamp {
  const widthMm = 32;
  const heightMm = 32;
  const cx = 16;
  const maxW = 22;

  const elements: StampElement[] = [
    {
      id: uid(),
      type: 'rect',
      name: 'Outer Square Border',
      x: 1.2,
      y: 1.2,
      width: 29.6,
      height: 29.6,
      rx: args.style === 'classic' ? 0.8 : 1.5,
      ry: args.style === 'classic' ? 0.8 : 1.5,
      strokeWidth: args.borderWeight,
      strokeType: 'solid',
      visible: true,
    },
  ];

  if (args.style === 'classic' || args.style === 'professional') {
    elements.push({
      id: uid(),
      type: 'rect',
      name: 'Inner Square Ring',
      x: 2.6,
      y: 2.6,
      width: 26.8,
      height: 26.8,
      rx: 0.6,
      ry: 0.6,
      strokeWidth: 0.35,
      strokeType: 'solid',
      visible: true,
    });
  }

  const headerFontSize = fitFontSize(args.company, maxW, 2.2, 1.2, true);
  elements.push({
    id: uid(),
    type: 'text',
    name: 'Company Name',
    text: args.company.toUpperCase(),
    x: cx,
    y: 7.2,
    fontSize: headerFontSize,
    fontFamily: args.fontFamily,
    fontWeight: 'bold',
    align: 'center',
    visible: true,
  });

  // Divider
  elements.push({
    id: uid(),
    type: 'line',
    name: 'Divider Line',
    x1: 5.5,
    y1: 9.6,
    x2: 26.5,
    y2: 9.6,
    strokeWidth: 0.3,
    strokeType: 'solid',
    visible: true,
  });

  if (args.contentPreset === 'name_designation') {
    const nameFontSize = fitFontSize(args.person, maxW, 2.2, 1.3, true);
    const desigFontSize = fitFontSize(args.designation, maxW, 1.8, 1.2, false);

    elements.push(
      {
        id: uid(),
        type: 'text',
        name: 'Person Name',
        text: args.person.toUpperCase(),
        x: cx,
        y: 15.0,
        fontSize: nameFontSize,
        fontFamily: args.fontFamily,
        fontWeight: 'bold',
        align: 'center',
        visible: true,
      },
      {
        id: uid(),
        type: 'text',
        name: 'Designation',
        text: args.designation.toUpperCase(),
        x: cx,
        y: 19.5,
        fontSize: desigFontSize,
        fontFamily: args.fontFamily,
        fontWeight: '600',
        align: 'center',
        visible: true,
      },
      {
        id: uid(),
        type: 'text',
        name: 'Approved Tag',
        text: '★ APPROVED ★',
        x: cx,
        y: 24.5,
        fontSize: 1.8,
        fontFamily: args.fontFamily,
        fontWeight: 'bold',
        align: 'center',
        visible: true,
      }
    );
  } else if (args.contentPreset === 'company_logo') {
    elements.push(
      {
        id: uid(),
        type: 'text',
        name: 'Center Emblem',
        text: '★ ❖ ★',
        x: cx,
        y: 14.5,
        fontSize: 3.5,
        fontFamily: args.fontFamily,
        fontWeight: 'bold',
        align: 'center',
        visible: true,
      },
      {
        id: uid(),
        type: 'text',
        name: 'Address Line',
        text: args.address,
        x: cx,
        y: 20.5,
        fontSize: fitFontSize(args.address, maxW, 1.7, 1.2, false),
        fontFamily: args.fontFamily,
        fontWeight: '500',
        align: 'center',
        visible: true,
      },
      {
        id: uid(),
        type: 'text',
        name: 'Quality Tag',
        text: 'PASSED',
        x: cx,
        y: 25.0,
        fontSize: 1.8,
        fontFamily: args.fontFamily,
        fontWeight: 'bold',
        align: 'center',
        visible: true,
      }
    );
  } else {
    elements.push(
      {
        id: uid(),
        type: 'text',
        name: 'Approved Tag',
        text: '★ APPROVED ★',
        x: cx,
        y: 14.0,
        fontSize: 2.0,
        fontFamily: args.fontFamily,
        fontWeight: 'bold',
        align: 'center',
        visible: true,
      },
      {
        id: uid(),
        type: 'text',
        name: 'Address Line',
        text: args.address,
        x: cx,
        y: 19.0,
        fontSize: fitFontSize(args.address, maxW, 1.8, 1.2, false),
        fontFamily: args.fontFamily,
        fontWeight: '500',
        align: 'center',
        visible: true,
      },
      {
        id: uid(),
        type: 'text',
        name: 'Official Tag',
        text: 'QUALITY DESK',
        x: cx,
        y: 24.5,
        fontSize: 1.6,
        fontFamily: args.fontFamily,
        fontWeight: '600',
        align: 'center',
        visible: true,
      }
    );
  }

  return {
    title: `${args.company} — ${capitalize(args.style)} Square Stamp`,
    category: `${capitalize(args.style)} Square`,
    shape: 'SQUARE',
    widthMm,
    heightMm,
    inkColor: args.ink,
    elements,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

