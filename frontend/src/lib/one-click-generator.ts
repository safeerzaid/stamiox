import { StampElement, StampShapeType } from '../types/stamp';

export interface OneClickInput {
  companyName: string;
  address?: string;
  phone?: string;
  inkColor?: string;
}

export interface GeneratedStampVariation {
  id: string;
  title: string;
  category: string;
  shape: StampShapeType;
  widthMm: number;
  heightMm: number;
  inkColor: string;
  badge: string;
  elements: StampElement[];
}

const uid = () => 'el_' + Math.random().toString(36).substring(2, 9);

/**
 * Intelligent Font Sizer: Calculates maximum font size in millimeters
 * so that a given string fits within maxAvailableWidthMm with safe margins.
 * For bold uppercase text in standard geometric sans fonts (Inter, Arial, Plus Jakarta Sans),
 * average character width is ~0.76 * fontSize.
 * For mixed-case medium/regular text, average character width is ~0.60 * fontSize.
 */
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

/**
 * Split long contact strings (e.g. phone + GSTIN) into 2 balanced lines
 * if length exceeds maxLength and contains a natural separator.
 */
function splitContactString(raw: string, maxSingleLen = 20): { line1: string; line2?: string } {
  const clean = raw.trim();
  if (clean.length <= maxSingleLen) {
    return { line1: clean };
  }

  // Look for natural separators
  const separators = [' · ', ' | ', ' / ', ' - ', ', ', ' GST', ' Ph:', ' TEL:'];
  for (const sep of separators) {
    const idx = clean.indexOf(sep);
    if (idx > 4 && idx < clean.length - 3) {
      const part1 = clean.substring(0, idx).trim();
      const part2 = (sep.startsWith(' ') ? clean.substring(idx + sep.length) : clean.substring(idx)).trim();
      return { line1: part1, line2: part2 };
    }
  }

  // Fallback: split at nearest middle space
  const mid = Math.floor(clean.length / 2);
  const spaceIdx = clean.indexOf(' ', mid - 5);
  if (spaceIdx > 6 && spaceIdx < clean.length - 5) {
    return {
      line1: clean.substring(0, spaceIdx).trim(),
      line2: clean.substring(spaceIdx + 1).trim(),
    };
  }

  return { line1: clean };
}

/**
 * Generate 6 production-grade stamp variations in real-time
 * from Company Name, Address, and Phone.
 */
export function generateOneClickStamps(input: OneClickInput): GeneratedStampVariation[] {
  const company = (input.companyName || 'APEX INFOTECH SOLUTIONS').trim();
  const address = (input.address || 'MG ROAD, KOCHI, KERALA').trim();
  const phone = (input.phone || '+91 98470 12345 · GST: 32AAAAA0000A1Z5').trim();
  const ink = input.inkColor || '#1e3a8a';

  return [
    // 1. Classic Round Official Seal (42mm)
    createClassicRoundSeal(company, address, phone, ink),

    // 2. Commercial Bill & Address Stamp (50x20mm)
    createCommercialAddressStamp(company, address, phone, ink),

    // 3. Authorized Signatory Stamp (55x25mm)
    createAuthorizedSignatoryStamp(company, address, phone, ink),

    // 4. Executive Oval Seal (55x35mm)
    createExecutiveOvalSeal(company, address, phone, ink),

    // 5. Notary & Scalloped Quality Seal (45x45mm)
    createScallopedSeal(company, address, phone, ink),

    // 6. Compact Square Approval Stamp (32x32mm)
    createCompactSquareStamp(company, address, phone, ink),
  ];
}

/** 1. Classic Round Official Seal (42x42mm) */
function createClassicRoundSeal(company: string, address: string, phone: string, ink: string): GeneratedStampVariation {
  const widthMm = 42;
  const heightMm = 42;
  const cx = 21;
  const cy = 21;

  // Auto font size for top arc text (perimeter ~36mm safe span)
  const topFontSize = fitFontSize(company, 36, 2.8, 1.8, true);

  // Auto font size for bottom arc text (perimeter ~32mm safe span)
  const bottomFontSize = fitFontSize(address, 32, 2.4, 1.6, false);

  // Center core max safe width inside 23mm circle is 18mm
  const contact = splitContactString(phone, 16);
  const centerFontSize = fitFontSize(contact.line1, 18, 1.9, 1.2, false);
  const centerLine2FontSize = contact.line2 ? fitFontSize(contact.line2, 18, 1.7, 1.1, false) : 0;

  const elements: StampElement[] = [
    // Outer Thick Ring
    {
      id: uid(),
      type: 'ring',
      name: 'Outer Border Ring',
      cx,
      cy,
      radius: 19.8,
      strokeWidth: 0.85,
      strokeType: 'solid',
      visible: true,
    },
    // Inner Thin Decorative Ring
    {
      id: uid(),
      type: 'ring',
      name: 'Inner Decorative Ring',
      cx,
      cy,
      radius: 18.2,
      strokeWidth: 0.35,
      strokeType: 'solid',
      visible: true,
    },
    // Center Core Ring (diameter 23mm, radius 11.5mm)
    {
      id: uid(),
      type: 'ring',
      name: 'Center Core Ring',
      cx,
      cy,
      radius: 11.5,
      strokeWidth: 0.45,
      strokeType: 'solid',
      visible: true,
    },
    // Top Arc: Company Name
    {
      id: uid(),
      type: 'arc-text',
      name: 'Company Name Arc',
      text: company.toUpperCase(),
      cx,
      cy,
      radius: 14.8,
      startAngle: -140,
      sweepAngle: 100,
      fontSize: Number(topFontSize.toFixed(2)),
      fontFamily: 'Inter',
      fontWeight: 'bold',
      isReversed: false,
      letterSpacing: 0.08,
      visible: true,
    },
    // Bottom Arc: Address
    {
      id: uid(),
      type: 'arc-text',
      name: 'Address Arc',
      text: address.toUpperCase(),
      cx,
      cy,
      radius: 14.8,
      startAngle: 40,
      sweepAngle: 100,
      fontSize: Number(bottomFontSize.toFixed(2)),
      fontFamily: 'Inter',
      fontWeight: '600',
      isReversed: true,
      letterSpacing: 0.05,
      visible: true,
    },
    // Center Top Stars
    {
      id: uid(),
      type: 'text',
      name: 'Center Stars',
      text: '★ ★ ★',
      x: cx,
      y: contact.line2 ? cy - 3.8 : cy - 2.8,
      fontSize: 2.1,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      align: 'center',
      visible: true,
    },
    // Center Contact Line 1
    {
      id: uid(),
      type: 'text',
      name: 'Center Contact 1',
      text: contact.line1.toUpperCase(),
      x: cx,
      y: contact.line2 ? cy - 0.6 : cy + 0.8,
      fontSize: centerFontSize,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      align: 'center',
      visible: true,
    },
  ];

  if (contact.line2) {
    elements.push({
      id: uid(),
      type: 'text',
      name: 'Center Contact 2',
      text: contact.line2.toUpperCase(),
      x: cx,
      y: cy + 2.4,
      fontSize: centerLine2FontSize,
      fontFamily: 'Inter',
      fontWeight: '600',
      align: 'center',
      visible: true,
    });
    elements.push({
      id: uid(),
      type: 'text',
      name: 'Official Tag',
      text: 'OFFICIAL SEAL',
      x: cx,
      y: cy + 5.2,
      fontSize: 1.4,
      fontFamily: 'Inter',
      fontWeight: '600',
      align: 'center',
      letterSpacing: 0.1,
      visible: true,
    });
  } else {
    elements.push({
      id: uid(),
      type: 'text',
      name: 'Official Tag',
      text: 'OFFICIAL SEAL',
      x: cx,
      y: cy + 4.2,
      fontSize: 1.6,
      fontFamily: 'Inter',
      fontWeight: '600',
      align: 'center',
      letterSpacing: 0.12,
      visible: true,
    });
  }

  return {
    id: 'oneclick_round_seal',
    title: `${company} — Official Round Seal`,
    category: 'Round Seal',
    shape: 'ROUND',
    widthMm,
    heightMm,
    inkColor: ink,
    badge: 'Official Seal · Ø 42 mm',
    elements,
  };
}

/** 2. Commercial Bill & Address Stamp (50x20mm) */
function createCommercialAddressStamp(company: string, address: string, phone: string, ink: string): GeneratedStampVariation {
  const widthMm = 50;
  const heightMm = 20;
  const cx = widthMm / 2;

  // Max safe width inside 50mm box is 38mm (guarantees generous 6mm margin on both sides!)
  const maxW = 38;
  const headerFontSize = fitFontSize(company, maxW, 2.5, 1.3, true);
  const addressFontSize = fitFontSize(address, maxW, 2.0, 1.3, false);

  // Split contact into 2 clean lines if it has phone + GSTIN
  const contact = splitContactString(phone, 20);
  const phoneFontSize = fitFontSize(contact.line1, maxW, 1.9, 1.2, false);
  const phone2FontSize = contact.line2 ? fitFontSize(contact.line2, maxW, 1.8, 1.2, false) : 0;

  // Dynamic Divider Line: matches header width with clean 1.5mm overhang on each side, capped at 38mm
  const estHeaderWidth = Math.min(38, Math.max(20, company.length * headerFontSize * 0.76));
  const dividerHalf = Math.min(19, (estHeaderWidth / 2) + 1.5);
  const dividerX1 = Number((cx - dividerHalf).toFixed(2));
  const dividerX2 = Number((cx + dividerHalf).toFixed(2));

  const elements: StampElement[] = [
    // Outer Border Box (1.0mm inset from 50x20 boundary)
    {
      id: uid(),
      type: 'rect',
      name: 'Outer Border',
      x: 1.0,
      y: 1.0,
      width: widthMm - 2.0,
      height: heightMm - 2.0,
      rx: 1.5,
      ry: 1.5,
      strokeWidth: 0.65,
      strokeType: 'solid',
      visible: true,
    },
    // Line 1: Company Header (Guaranteed 5-6mm margin on both sides, NEVER touches border!)
    {
      id: uid(),
      type: 'text',
      name: 'Company Header',
      text: company.toUpperCase(),
      x: cx,
      y: contact.line2 ? 4.4 : 5.0,
      fontSize: headerFontSize,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      align: 'center',
      visible: true,
    },
    // Hairline Separator (Dynamically spans header width)
    {
      id: uid(),
      type: 'line',
      name: 'Divider Line',
      x1: dividerX1,
      y1: contact.line2 ? 6.7 : 7.6,
      x2: dividerX2,
      y2: contact.line2 ? 6.7 : 7.6,
      strokeWidth: 0.35,
      strokeType: 'solid',
      visible: true,
    },
    // Line 2: Address
    {
      id: uid(),
      type: 'text',
      name: 'Address Line',
      text: address,
      x: cx,
      y: contact.line2 ? 9.8 : 11.4,
      fontSize: addressFontSize,
      fontFamily: 'Inter',
      fontWeight: '500',
      align: 'center',
      visible: true,
    },
    // Line 3: Contact Line 1
    {
      id: uid(),
      type: 'text',
      name: 'Contact Line 1',
      text: contact.line1,
      x: cx,
      y: contact.line2 ? 13.1 : 15.4,
      fontSize: phoneFontSize,
      fontFamily: 'Inter',
      fontWeight: '600',
      align: 'center',
      visible: true,
    },
  ];

  if (contact.line2) {
    elements.push({
      id: uid(),
      type: 'text',
      name: 'Contact Line 2',
      text: contact.line2,
      x: cx,
      y: 16.3,
      fontSize: phone2FontSize,
      fontFamily: 'Inter',
      fontWeight: '600',
      align: 'center',
      visible: true,
    });
  }

  return {
    id: 'oneclick_address_stamp',
    title: `${company} — Invoice & Address Stamp`,
    category: 'Rectangular',
    shape: 'RECTANGULAR',
    widthMm,
    heightMm,
    inkColor: ink,
    badge: 'Bill & Address · 50 × 20 mm',
    elements,
  };
}

/** 3. Authorized Signatory Stamp (55x25mm) */
function createAuthorizedSignatoryStamp(company: string, address: string, phone: string, ink: string): GeneratedStampVariation {
  const widthMm = 55;
  const heightMm = 25;
  const cx = widthMm / 2;
  const maxW = 44; // 55 - 11mm safe margins

  const companyHeader = `For ${company.toUpperCase()}`;
  const headerFontSize = fitFontSize(companyHeader, maxW, 2.7, 1.4, true);
  const addressFontSize = fitFontSize(address, maxW, 2.0, 1.3, false);
  const phoneFontSize = fitFontSize(phone, maxW, 1.8, 1.2, false);

  const elements: StampElement[] = [
    // Line 1: For [Company Name]
    {
      id: uid(),
      type: 'text',
      name: 'For Company Header',
      text: companyHeader,
      x: cx,
      y: 4.8,
      fontSize: headerFontSize,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      align: 'center',
      visible: true,
    },
    // Line 2: Authorized Signatory (with clean 8mm physical signing space above it)
    {
      id: uid(),
      type: 'text',
      name: 'Signatory Title',
      text: 'AUTHORIZED SIGNATORY',
      x: cx,
      y: 16.2,
      fontSize: 2.8,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      align: 'center',
      letterSpacing: 0.08,
      visible: true,
    },
    // Line 3: Location Footer
    {
      id: uid(),
      type: 'text',
      name: 'Location Footer',
      text: address,
      x: cx,
      y: 19.8,
      fontSize: addressFontSize,
      fontFamily: 'Inter',
      fontWeight: '500',
      align: 'center',
      visible: true,
    },
    // Line 4: Phone Footer
    {
      id: uid(),
      type: 'text',
      name: 'Phone Footer',
      text: phone,
      x: cx,
      y: 22.8,
      fontSize: phoneFontSize,
      fontFamily: 'Inter',
      fontWeight: '500',
      align: 'center',
      visible: true,
    },
  ];

  return {
    id: 'oneclick_signatory_stamp',
    title: `${company} — Authorized Signatory`,
    category: 'Signatory',
    shape: 'RECTANGULAR',
    widthMm,
    heightMm,
    inkColor: ink,
    badge: 'Signatory · 55 × 25 mm',
    elements,
  };
}

/** 4. Executive Oval Seal (55x35mm) */
function createExecutiveOvalSeal(company: string, address: string, phone: string, ink: string): GeneratedStampVariation {
  const widthMm = 55;
  const heightMm = 35;
  const cx = 27.5;
  const cy = 17.5;

  // Max inner horizontal width inside oval core is 24mm
  const contact = splitContactString(phone, 16);
  const phoneFontSize = fitFontSize(contact.line1, 24, 1.9, 1.2, false);
  const phone2FontSize = contact.line2 ? fitFontSize(contact.line2, 24, 1.7, 1.1, false) : 0;

  const topFontSize = fitFontSize(company, 36, 2.6, 1.6, true);
  const bottomFontSize = fitFontSize(address, 32, 2.3, 1.5, false);

  const elements: StampElement[] = [
    // Outer Oval Ring
    {
      id: uid(),
      type: 'oval',
      name: 'Outer Oval Ring',
      cx,
      cy,
      rx: 25.5,
      ry: 15.5,
      strokeWidth: 0.8,
      strokeType: 'solid',
      visible: true,
    },
    // Inner Oval Ring
    {
      id: uid(),
      type: 'oval',
      name: 'Inner Oval Ring',
      cx,
      cy,
      rx: 23.8,
      ry: 13.8,
      strokeWidth: 0.35,
      strokeType: 'solid',
      visible: true,
    },
    // Top Arc: Company Name
    {
      id: uid(),
      type: 'arc-text',
      name: 'Top Company Arc',
      text: company.toUpperCase(),
      cx,
      cy,
      radius: 11.5,
      rx: 18.5,
      ry: 10.5,
      startAngle: -140,
      sweepAngle: 100,
      fontSize: Number(topFontSize.toFixed(2)),
      fontFamily: 'Inter',
      fontWeight: 'bold',
      isReversed: false,
      visible: true,
    },
    // Bottom Arc: Address
    {
      id: uid(),
      type: 'arc-text',
      name: 'Bottom Address Arc',
      text: address.toUpperCase(),
      cx,
      cy,
      radius: 11.5,
      rx: 18.5,
      ry: 10.5,
      startAngle: 40,
      sweepAngle: 100,
      fontSize: Number(bottomFontSize.toFixed(2)),
      fontFamily: 'Inter',
      fontWeight: '600',
      isReversed: true,
      visible: true,
    },
  ];

  if (contact.line2) {
    elements.push({
      id: uid(),
      type: 'text',
      name: 'Center Contact 1',
      text: `★ ${contact.line1} ★`,
      x: cx,
      y: cy - 1.4,
      fontSize: phoneFontSize,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      align: 'center',
      visible: true,
    });
    elements.push({
      id: uid(),
      type: 'text',
      name: 'Center Contact 2',
      text: contact.line2,
      x: cx,
      y: cy + 1.8,
      fontSize: phone2FontSize,
      fontFamily: 'Inter',
      fontWeight: '600',
      align: 'center',
      visible: true,
    });
  } else {
    elements.push({
      id: uid(),
      type: 'text',
      name: 'Center Contact',
      text: `★ ${contact.line1} ★`,
      x: cx,
      y: cy + 0.5,
      fontSize: phoneFontSize,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      align: 'center',
      visible: true,
    });
  }

  return {
    id: 'oneclick_oval_seal',
    title: `${company} — Executive Oval Seal`,
    category: 'Oval Seal',
    shape: 'OVAL',
    widthMm,
    heightMm,
    inkColor: ink,
    badge: 'Executive Oval · 55 × 35 mm',
    elements,
  };
}

/** 5. Notary & Scalloped Quality Seal (45x45mm) */
function createScallopedSeal(company: string, address: string, phone: string, ink: string): GeneratedStampVariation {
  const widthMm = 45;
  const heightMm = 45;
  const cx = 22.5;
  const cy = 22.5;

  const topFontSize = fitFontSize(company, 34, 2.7, 1.8, true);
  const bottomFontSize = fitFontSize(address, 30, 2.4, 1.5, false);

  const contact = splitContactString(phone, 15);
  const phoneFontSize = fitFontSize(contact.line1, 17, 1.8, 1.2, false);
  const phone2FontSize = contact.line2 ? fitFontSize(contact.line2, 17, 1.6, 1.1, false) : 0;

  const elements: StampElement[] = [
    // Outer Serrated Gear Edge
    {
      id: uid(),
      type: 'serrated-ring',
      name: 'Outer Scalloped Ring',
      cx,
      cy,
      outerRadius: 21.0,
      innerRadius: 19.2,
      teeth: 48,
      strokeWidth: 0.75,
      visible: true,
    },
    // Inner Solid Circle
    {
      id: uid(),
      type: 'ring',
      name: 'Inner Border Ring',
      cx,
      cy,
      radius: 18.0,
      strokeWidth: 0.55,
      strokeType: 'solid',
      visible: true,
    },
    // Core Decorative Ring (diameter 22mm, radius 11mm)
    {
      id: uid(),
      type: 'ring',
      name: 'Core Center Ring',
      cx,
      cy,
      radius: 11.2,
      strokeWidth: 0.4,
      strokeType: 'solid',
      visible: true,
    },
    // Top Arc: Company Name
    {
      id: uid(),
      type: 'arc-text',
      name: 'Top Company Arc',
      text: company.toUpperCase(),
      cx,
      cy,
      radius: 14.5,
      startAngle: -140,
      sweepAngle: 100,
      fontSize: Number(topFontSize.toFixed(2)),
      fontFamily: 'Inter',
      fontWeight: 'bold',
      isReversed: false,
      visible: true,
    },
    // Bottom Arc: Address
    {
      id: uid(),
      type: 'arc-text',
      name: 'Bottom Address Arc',
      text: address.toUpperCase(),
      cx,
      cy,
      radius: 14.5,
      startAngle: 40,
      sweepAngle: 100,
      fontSize: Number(bottomFontSize.toFixed(2)),
      fontFamily: 'Inter',
      fontWeight: '600',
      isReversed: true,
      visible: true,
    },
    // Center Quality Badge
    {
      id: uid(),
      type: 'text',
      name: 'Center Badge Line 1',
      text: '★ VERIFIED ★',
      x: cx,
      y: contact.line2 ? cy - 3.4 : cy - 2.4,
      fontSize: 2.1,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      align: 'center',
      visible: true,
    },
    // Center Phone Line 1
    {
      id: uid(),
      type: 'text',
      name: 'Center Phone 1',
      text: contact.line1,
      x: cx,
      y: contact.line2 ? cy - 0.4 : cy + 1.2,
      fontSize: phoneFontSize,
      fontFamily: 'Inter',
      fontWeight: '600',
      align: 'center',
      visible: true,
    },
  ];

  if (contact.line2) {
    elements.push({
      id: uid(),
      type: 'text',
      name: 'Center Phone 2',
      text: contact.line2,
      x: cx,
      y: cy + 2.4,
      fontSize: phone2FontSize,
      fontFamily: 'Inter',
      fontWeight: '600',
      align: 'center',
      visible: true,
    });
    elements.push({
      id: uid(),
      type: 'text',
      name: 'Seal Tag',
      text: 'QUALITY DESK',
      x: cx,
      y: cy + 5.2,
      fontSize: 1.4,
      fontFamily: 'Inter',
      fontWeight: '600',
      align: 'center',
      letterSpacing: 0.1,
      visible: true,
    });
  } else {
    elements.push({
      id: uid(),
      type: 'text',
      name: 'Seal Tag',
      text: 'QUALITY DESK',
      x: cx,
      y: cy + 4.6,
      fontSize: 1.5,
      fontFamily: 'Inter',
      fontWeight: '600',
      align: 'center',
      letterSpacing: 0.1,
      visible: true,
    });
  }

  return {
    id: 'oneclick_scalloped_seal',
    title: `${company} — Notary & Scalloped Seal`,
    category: 'Notary Seal',
    shape: 'ROUND',
    widthMm,
    heightMm,
    inkColor: ink,
    badge: 'Scalloped Notary · Ø 45 mm',
    elements,
  };
}

/** 6. Compact Square Approval Stamp (32x32mm) */
function createCompactSquareStamp(company: string, address: string, phone: string, ink: string): GeneratedStampVariation {
  const widthMm = 32;
  const heightMm = 32;
  const cx = 16;
  const maxW = 21; // 32 - 11mm inner margin (guarantees safe margins inside inner ring)

  const headerFontSize = fitFontSize(company, maxW, 2.2, 1.2, true);
  const addressFontSize = fitFontSize(address, maxW, 1.8, 1.2, false);

  const contact = splitContactString(phone, 16);
  const phoneFontSize = fitFontSize(contact.line1, maxW, 1.7, 1.1, false);
  const phone2FontSize = contact.line2 ? fitFontSize(contact.line2, maxW, 1.6, 1.1, false) : 0;

  // Divider Line proportional to header width
  const estHeaderWidth = Math.min(21, Math.max(12, company.length * headerFontSize * 0.76));
  const dividerHalf = Math.min(10.5, (estHeaderWidth / 2) + 1.0);
  const dividerX1 = Number((cx - dividerHalf).toFixed(2));
  const dividerX2 = Number((cx + dividerHalf).toFixed(2));

  const elements: StampElement[] = [
    // Outer Thick Box
    {
      id: uid(),
      type: 'rect',
      name: 'Outer Square Border',
      x: 1.2,
      y: 1.2,
      width: 29.6,
      height: 29.6,
      rx: 1.2,
      ry: 1.2,
      strokeWidth: 0.75,
      strokeType: 'solid',
      visible: true,
    },
    // Inner Thin Box
    {
      id: uid(),
      type: 'rect',
      name: 'Inner Square Ring',
      x: 2.6,
      y: 2.6,
      width: 26.8,
      height: 26.8,
      rx: 0.8,
      ry: 0.8,
      strokeWidth: 0.35,
      strokeType: 'solid',
      visible: true,
    },
    // Top Header: Company Name
    {
      id: uid(),
      type: 'text',
      name: 'Company Name',
      text: company.toUpperCase(),
      x: cx,
      y: 7.2,
      fontSize: headerFontSize,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      align: 'center',
      visible: true,
    },
    // Divider line
    {
      id: uid(),
      type: 'line',
      name: 'Divider Line',
      x1: dividerX1,
      y1: 9.4,
      x2: dividerX2,
      y2: 9.4,
      strokeWidth: 0.3,
      strokeType: 'solid',
      visible: true,
    },
    // Center Line: Approved / Verified
    {
      id: uid(),
      type: 'text',
      name: 'Approved Tag',
      text: '★ APPROVED ★',
      x: cx,
      y: 13.0,
      fontSize: 2.0,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      align: 'center',
      visible: true,
    },
    // Line 3: Address
    {
      id: uid(),
      type: 'text',
      name: 'Address Line',
      text: address,
      x: cx,
      y: contact.line2 ? 17.2 : 18.4,
      fontSize: addressFontSize,
      fontFamily: 'Inter',
      fontWeight: '500',
      align: 'center',
      visible: true,
    },
    // Line 4: Phone Line 1
    {
      id: uid(),
      type: 'text',
      name: 'Phone Line 1',
      text: contact.line1,
      x: cx,
      y: contact.line2 ? 20.8 : 22.8,
      fontSize: phoneFontSize,
      fontFamily: 'Inter',
      fontWeight: '600',
      align: 'center',
      visible: true,
    },
  ];

  if (contact.line2) {
    elements.push({
      id: uid(),
      type: 'text',
      name: 'Phone Line 2',
      text: contact.line2,
      x: cx,
      y: 24.2,
      fontSize: phone2FontSize,
      fontFamily: 'Inter',
      fontWeight: '600',
      align: 'center',
      visible: true,
    });
  }

  return {
    id: 'oneclick_square_stamp',
    title: `${company} — Square Approval Stamp`,
    category: 'Square',
    shape: 'SQUARE',
    widthMm,
    heightMm,
    inkColor: ink,
    badge: 'Square · 32 × 32 mm',
    elements,
  };
}
