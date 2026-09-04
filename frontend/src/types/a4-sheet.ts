import { StampElement, StampShapeType } from './stamp';

export interface A4StampInstance {
  instanceId: string;
  name: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  shape: StampShapeType;
  elements: StampElement[];
  inkColor: string;
  mountName?: string;
  rotationDeg?: number;
}

export interface A4SheetConfig {
  orientation: 'portrait' | 'landscape';
  marginMm: number;
  spacingMm: number;
  showCropMarks: boolean;
  laserInvert: boolean;
  laserMirror: boolean;
  showDimensions: boolean;
  showCutLines: boolean;
}

export interface A4SizePreset {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
  shape: StampShapeType;
  mountName: string;
}

export const COMMON_A4_PRESET_SIZES: A4SizePreset[] = [
  { id: 'round-40', label: 'Ø 40 mm (Standard Seal)', widthMm: 40, heightMm: 40, shape: 'ROUND', mountName: 'Colop Printer R40' },
  { id: 'round-35', label: 'Ø 35 mm (Medium Round)', widthMm: 35, heightMm: 35, shape: 'ROUND', mountName: 'Colop Printer R35' },
  { id: 'round-30', label: 'Ø 30 mm (Compact Round)', widthMm: 30, heightMm: 30, shape: 'ROUND', mountName: 'Colop Printer R30' },
  { id: 'round-25', label: 'Ø 25 mm (Small Mini)', widthMm: 25, heightMm: 25, shape: 'ROUND', mountName: 'Trodat Printy 46025' },
  { id: 'oval-44', label: '44 × 30 mm (Official Oval)', widthMm: 44, heightMm: 30, shape: 'OVAL', mountName: 'Colop Oval 44' },
  { id: 'square-30', label: '30 × 30 mm (Square)', widthMm: 30, heightMm: 30, shape: 'SQUARE', mountName: 'Colop Square Q30' },
  { id: 'rect-47', label: '47 × 18 mm (Address Box)', widthMm: 47, heightMm: 18, shape: 'RECTANGULAR', mountName: 'Trodat Printy 4912' },
];
