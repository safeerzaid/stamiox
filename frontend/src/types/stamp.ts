export type StampShapeType = 'ROUND' | 'RECTANGULAR' | 'OVAL' | 'SQUARE' | 'CUSTOM';

export type ElementType =
  | 'arc-text'
  | 'text'
  | 'ring'
  | 'serrated-ring'
  | 'rect'
  | 'oval'
  | 'line'
  | 'clipart'
  | 'image'
  | 'qrcode';

export interface BaseElement {
  id: string;
  type: ElementType;
  name?: string;
  locked?: boolean;
  visible?: boolean;
  opacity?: number;
  rotation?: number; // degrees
  groupId?: string;
}

export interface ArcTextElement extends BaseElement {
  type: 'arc-text';
  text: string;
  cx: number; // center X in mm
  cy: number; // center Y in mm
  radius: number; // radius in mm
  rx?: number; // optional elliptical X radius in mm
  ry?: number; // optional elliptical Y radius in mm
  startAngle: number; // in degrees (-180 to 180)
  sweepAngle: number; // in degrees
  fontSize: number; // in mm
  fontFamily: string;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  letterSpacing?: number; // in mm
  isReversed?: boolean; // inward facing vs outward
  baseline?: 'auto' | 'inside' | 'outside' | 'center';
  angleOffset?: number; // rotation offset in degrees along circular path (-180 to 180)
}

export interface StraightTextElement extends BaseElement {
  type: 'text';
  text: string;
  x: number; // in mm
  y: number; // in mm
  fontSize: number; // in mm
  fontFamily: string;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  letterSpacing?: number;
  lineHeight?: number;
  align: 'left' | 'center' | 'right';
  width?: number;
}

export interface RingElement extends BaseElement {
  type: 'ring';
  cx: number; // in mm
  cy: number; // in mm
  radius: number; // in mm
  strokeWidth: number; // in mm
  strokeType: 'solid' | 'dashed' | 'dotted' | 'double';
  dashArray?: string;
}

export interface SerratedRingElement extends BaseElement {
  type: 'serrated-ring';
  cx: number;
  cy: number;
  outerRadius: number; // in mm
  innerRadius: number; // in mm
  teeth: number; // e.g. 48, 64
  strokeWidth: number;
}

export interface RectElement extends BaseElement {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number; // corner radius mm
  ry?: number;
  strokeWidth: number;
  strokeType?: 'solid' | 'dashed' | 'dotted';
}

export interface OvalElement extends BaseElement {
  type: 'oval';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  strokeWidth: number;
  strokeType?: 'solid' | 'dashed' | 'dotted';
}

export interface LineElement extends BaseElement {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeWidth: number;
  strokeType?: 'solid' | 'dashed' | 'dotted';
}

export interface ClipartElement extends BaseElement {
  type: 'clipart';
  name: string;
  cx: number;
  cy: number;
  width: number;
  height: number;
  svgPath?: string;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string; // base64 or url (original upload)
  maskSrc?: string; // processed 1-bit silhouette (white-on-transparent PNG) rendered in ink colour
  x: number;
  y: number;
  width: number;
  height: number;
  threshold?: number; // 0-255 binarization for 1-bit rubber stamp
  invert?: boolean;
}

export interface QRCodeElement extends BaseElement {
  type: 'qrcode';
  content: string;
  cx: number;
  cy: number;
  size: number; // in mm
}

export type StampElement =
  | ArcTextElement
  | StraightTextElement
  | RingElement
  | SerratedRingElement
  | RectElement
  | OvalElement
  | LineElement
  | ClipartElement
  | ImageElement
  | QRCodeElement;

export type StampElementInput =
  | Omit<ArcTextElement, 'id'>
  | Omit<StraightTextElement, 'id'>
  | Omit<RingElement, 'id'>
  | Omit<SerratedRingElement, 'id'>
  | Omit<RectElement, 'id'>
  | Omit<OvalElement, 'id'>
  | Omit<LineElement, 'id'>
  | Omit<ClipartElement, 'id'>
  | Omit<ImageElement, 'id'>
  | Omit<QRCodeElement, 'id'>;

export interface StampMountPreset {
  id: string;
  brand: 'Colop' | 'Trodat' | 'Shiny' | 'Standard' | 'Custom';
  name: string;
  shape: StampShapeType;
  widthMm: number;
  heightMm: number;
  category: 'round' | 'rectangular' | 'oval' | 'square' | 'dater';
}

export interface StampTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  shape: StampShapeType;
  widthMm: number;
  heightMm: number;
  tags: string[];
  isPremium?: boolean;
  defaultData: {
    inkColor: string;
    fields: { [key: string]: string };
    elements: StampElement[];
  };
}

export interface UserSubscription {
  plan: 'FREE_TRIAL' | 'MONTHLY_PRO' | 'YEARLY_PRO' | 'ENTERPRISE';
  status: 'TRIALING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  trialDaysLeft: number;
  isTrialActive: boolean;
  isProActive?: boolean;
  trialStartDate?: string;
  trialEndDate?: string;
  currentPeriodEnd?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  company?: string;
  role: string;
}
