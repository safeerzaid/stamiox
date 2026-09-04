import { StampMountPreset } from '../types/stamp';

// Base conversion constants
export const MM_TO_PX = 3.7795275591; // 96 DPI: 1 inch = 25.4mm = 96px => 1mm ≈ 3.7795px
export const PX_TO_MM = 1 / MM_TO_PX;
export const MM_TO_PT = 2.83464567; // 1 pt = 1/72 inch => 1mm = 72/25.4 pt ≈ 2.8346 pt
export const INCH_TO_MM = 25.4;

export const mmToPx = (mm: number, zoom = 1): number => mm * MM_TO_PX * zoom;
export const pxToMm = (px: number, zoom = 1): number => px / (MM_TO_PX * zoom);

// Standard Stamp Mount Presets (Real-world brand sizes)
export const STAMP_MOUNT_PRESETS: StampMountPreset[] = [
  // Round Seals
  {
    id: 'colop-r40',
    brand: 'Colop',
    name: 'Colop Printer R40 (Ø 40mm)',
    shape: 'ROUND',
    widthMm: 40,
    heightMm: 40,
    category: 'round',
  },
  {
    id: 'trodat-46040',
    brand: 'Trodat',
    name: 'Trodat Printy 46040 (Ø 40mm)',
    shape: 'ROUND',
    widthMm: 40,
    heightMm: 40,
    category: 'round',
  },
  {
    id: 'colop-r30',
    brand: 'Colop',
    name: 'Colop Printer R30 (Ø 30mm)',
    shape: 'ROUND',
    widthMm: 30,
    heightMm: 30,
    category: 'round',
  },
  {
    id: 'colop-r50',
    brand: 'Colop',
    name: 'Colop Printer R50 (Ø 50mm)',
    shape: 'ROUND',
    widthMm: 50,
    heightMm: 50,
    category: 'round',
  },
  {
    id: 'trodat-46045',
    brand: 'Trodat',
    name: 'Trodat Printy 46045 (Ø 45mm)',
    shape: 'ROUND',
    widthMm: 45,
    heightMm: 45,
    category: 'round',
  },
  {
    id: 'trodat-46025',
    brand: 'Trodat',
    name: 'Trodat Printy 46025 (Ø 25mm)',
    shape: 'ROUND',
    widthMm: 25,
    heightMm: 25,
    category: 'round',
  },

  // Rectangular Address / Text Stamps
  {
    id: 'trodat-4913',
    brand: 'Trodat',
    name: 'Trodat Printy 4913 (58 × 22mm)',
    shape: 'RECTANGULAR',
    widthMm: 58,
    heightMm: 22,
    category: 'rectangular',
  },
  {
    id: 'trodat-4912',
    brand: 'Trodat',
    name: 'Trodat Printy 4912 (47 × 18mm)',
    shape: 'RECTANGULAR',
    widthMm: 47,
    heightMm: 18,
    category: 'rectangular',
  },
  {
    id: 'trodat-4911',
    brand: 'Trodat',
    name: 'Trodat Printy 4911 (38 × 14mm)',
    shape: 'RECTANGULAR',
    widthMm: 38,
    heightMm: 14,
    category: 'rectangular',
  },
  {
    id: 'trodat-4915',
    brand: 'Trodat',
    name: 'Trodat Printy 4915 (70 × 25mm)',
    shape: 'RECTANGULAR',
    widthMm: 70,
    heightMm: 25,
    category: 'rectangular',
  },
  {
    id: 'colop-p60',
    brand: 'Colop',
    name: 'Colop Printer 60 (76 × 37mm)',
    shape: 'RECTANGULAR',
    widthMm: 76,
    heightMm: 37,
    category: 'rectangular',
  },

  // Oval Stamps
  {
    id: 'colop-oval-44',
    brand: 'Colop',
    name: 'Colop Oval 44 (44 × 30mm)',
    shape: 'OVAL',
    widthMm: 44,
    heightMm: 30,
    category: 'oval',
  },
  {
    id: 'colop-oval-55',
    brand: 'Colop',
    name: 'Colop Oval 55 (55 × 35mm)',
    shape: 'OVAL',
    widthMm: 55,
    heightMm: 35,
    category: 'oval',
  },

  // Square Stamps
  {
    id: 'colop-q30',
    brand: 'Colop',
    name: 'Colop Square Q30 (30 × 30mm)',
    shape: 'SQUARE',
    widthMm: 30,
    heightMm: 30,
    category: 'square',
  },
  {
    id: 'trodat-4924',
    brand: 'Trodat',
    name: 'Trodat Printy 4924 (40 × 40mm)',
    shape: 'SQUARE',
    widthMm: 40,
    heightMm: 40,
    category: 'square',
  },
];

// Standard Rubber Stamp Inks (Official Black Only)
export const STAMP_INK_COLORS = [
  { id: 'stamp-black', name: 'Stamp Black (Official)', hex: '#111827', label: 'Black' },
];

export interface FontOption {
  label: string;
  name: string;
  value: string;
  family: string;
  category: 'sans' | 'serif' | 'bold' | 'script' | 'mono' | 'vintage';
  tag: string;
}

export const FONT_OPTIONS: FontOption[] = [
  // --- Modern Clean Sans ---
  { label: 'Plus Jakarta Sans (Modern Geometric)', name: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', Montserrat, sans-serif", family: "'Plus Jakarta Sans', Montserrat, sans-serif", category: 'sans', tag: 'Geometric Sans' },
  { label: 'Inter (Ultra Clean Standard)', name: 'Inter', value: "'Inter', sans-serif", family: "'Inter', sans-serif", category: 'sans', tag: 'Standard Sans' },
  { label: 'Outfit (Contemporary Clean)', name: 'Outfit', value: "'Outfit', sans-serif", family: "'Outfit', sans-serif", category: 'sans', tag: 'Clean Sans' },
  { label: 'Montserrat (Classic Business Sans)', name: 'Montserrat', value: 'Montserrat, Arial, sans-serif', family: 'Montserrat, Arial, sans-serif', category: 'sans', tag: 'Business Sans' },
  { label: 'Poppins (Soft Modern Sans)', name: 'Poppins', value: "'Poppins', sans-serif", family: "'Poppins', sans-serif", category: 'sans', tag: 'Modern Sans' },
  { label: 'DM Sans (Corporate Geometric)', name: 'DM Sans', value: "'DM Sans', sans-serif", family: "'DM Sans', sans-serif", category: 'sans', tag: 'Corporate Sans' },
  { label: 'Work Sans (Architectural Clean)', name: 'Work Sans', value: "'Work Sans', sans-serif", family: "'Work Sans', sans-serif", category: 'sans', tag: 'Architectural' },
  { label: 'Raleway (Elegant Thin/Bold)', name: 'Raleway', value: "'Raleway', sans-serif", family: "'Raleway', sans-serif", category: 'sans', tag: 'Elegant Sans' },
  { label: 'Space Grotesk (Modern Tech)', name: 'Space Grotesk', value: "'Space Grotesk', sans-serif", family: "'Space Grotesk', sans-serif", category: 'sans', tag: 'Tech Sans' },
  { label: 'Arial / Helvetica (Neutral Clean)', name: 'Arial / Helvetica', value: 'Arial, Helvetica, sans-serif', family: 'Arial, Helvetica, sans-serif', category: 'sans', tag: 'Neutral Standard' },

  // --- Official & Luxury Serifs ---
  { label: 'Cinzel (Official Seal / Roman Serif)', name: 'Cinzel', value: "'Cinzel', Georgia, serif", family: "'Cinzel', Georgia, serif", category: 'serif', tag: 'Official Seal' },
  { label: 'Cinzel Decorative (Ornate Seal Serif)', name: 'Cinzel Decorative', value: "'Cinzel Decorative', Georgia, serif", family: "'Cinzel Decorative', Georgia, serif", category: 'serif', tag: 'Ornate Seal' },
  { label: 'Playfair Display (Luxury Serif)', name: 'Playfair Display', value: "'Playfair Display', Georgia, serif", family: "'Playfair Display', Georgia, serif", category: 'serif', tag: 'Luxury Serif' },
  { label: 'Cormorant Garamond (Classical Royal)', name: 'Cormorant Garamond', value: "'Cormorant Garamond', serif", family: "'Cormorant Garamond', serif", category: 'serif', tag: 'Classical Royal' },
  { label: 'EB Garamond (Traditional Heritage)', name: 'EB Garamond', value: "'EB Garamond', serif", family: "'EB Garamond', serif", category: 'serif', tag: 'Heritage Serif' },
  { label: 'DM Serif Display (Sharp Editorial)', name: 'DM Serif Display', value: "'DM Serif Display', serif", family: "'DM Serif Display', serif", category: 'serif', tag: 'Editorial Serif' },
  { label: 'Bodoni Moda (Vogue Luxury)', name: 'Bodoni Moda', value: "'Bodoni Moda', serif", family: "'Bodoni Moda', serif", category: 'serif', tag: 'High Luxury' },
  { label: 'Merriweather (Bold Authority Serif)', name: 'Merriweather', value: "'Merriweather', serif", family: "'Merriweather', serif", category: 'serif', tag: 'Legal Authority' },
  { label: 'Lora (Contemporary Book Serif)', name: 'Lora', value: "'Lora', serif", family: "'Lora', serif", category: 'serif', tag: 'Contemporary' },
  { label: 'Prata (Refined Elegant Serif)', name: 'Prata', value: "'Prata', serif", family: "'Prata', serif", category: 'serif', tag: 'Refined Serif' },
  { label: 'Georgia (Traditional Legal Serif)', name: 'Georgia', value: 'Georgia, serif', family: 'Georgia, serif', category: 'serif', tag: 'Legal Serif' },

  // --- Bold Stamp & Heavy Impact ---
  { label: 'Bebas Neue (Condensed Impact Header)', name: 'Bebas Neue', value: "'Bebas Neue', Impact, sans-serif", family: "'Bebas Neue', Impact, sans-serif", category: 'bold', tag: 'Impact Header' },
  { label: 'Oswald (Heavy Block Accounting)', name: 'Oswald', value: "'Oswald', Arial, sans-serif", family: "'Oswald', Arial, sans-serif", category: 'bold', tag: 'Heavy Accounting' },
  { label: 'Anton (Ultra Bold Stamp Block)', name: 'Anton', value: "'Anton', sans-serif", family: "'Anton', sans-serif", category: 'bold', tag: 'Ultra Bold' },
  { label: 'Archivo Black (Solid Industrial)', name: 'Archivo Black', value: "'Archivo Black', sans-serif", family: "'Archivo Black', sans-serif", category: 'bold', tag: 'Industrial Block' },
  { label: 'Barlow Condensed (Industrial Bold)', name: 'Barlow Condensed', value: "'Barlow Condensed', sans-serif", family: "'Barlow Condensed', sans-serif", category: 'bold', tag: 'Condensed Bold' },
  { label: 'Russo One (Heavy Geometric Stamp)', name: 'Russo One', value: "'Russo One', sans-serif", family: "'Russo One', sans-serif", category: 'bold', tag: 'Heavy Stamp' },
  { label: 'Teko (Tall Condensed Header)', name: 'Teko', value: "'Teko', sans-serif", family: "'Teko', sans-serif", category: 'bold', tag: 'Tall Condensed' },
  { label: 'Staatliches (Retro Industrial Title)', name: 'Staatliches', value: "'Staatliches', cursive", family: "'Staatliches', cursive", category: 'bold', tag: 'Retro Industrial' },
  { label: 'Righteous (Modern Heavy Display)', name: 'Righteous', value: "'Righteous', cursive", family: "'Righteous', cursive", category: 'bold', tag: 'Heavy Display' },

  // --- Calligraphy & Script Signatures ---
  { label: 'Great Vibes (Ornate Calligraphy Script)', name: 'Great Vibes', value: "'Great Vibes', cursive", family: "'Great Vibes', cursive", category: 'script', tag: 'Royal Calligraphy' },
  { label: 'Dancing Script (Casual Hand Signature)', name: 'Dancing Script', value: "'Dancing Script', cursive", family: "'Dancing Script', cursive", category: 'script', tag: 'Signature Script' },
  { label: 'Alex Brush (Classic Cursive Script)', name: 'Alex Brush', value: "'Alex Brush', cursive", family: "'Alex Brush', cursive", category: 'script', tag: 'Classic Script' },
  { label: 'Allura (Flowing Ribbon Signature)', name: 'Allura', value: "'Allura', cursive", family: "'Allura', cursive", category: 'script', tag: 'Flowing Script' },
  { label: 'Pinyon Script (Victorian Elegance)', name: 'Pinyon Script', value: "'Pinyon Script', cursive", family: "'Pinyon Script', cursive", category: 'script', tag: 'Victorian Script' },
  { label: 'Sacramento (Delicate Monoline)', name: 'Sacramento', value: "'Sacramento', cursive", family: "'Sacramento', cursive", category: 'script', tag: 'Monoline Script' },
  { label: 'Pacifico (Retro Brush Casual)', name: 'Pacifico', value: "'Pacifico', cursive", family: "'Pacifico', cursive", category: 'script', tag: 'Retro Brush' },

  // --- Technical & Dater Monospace ---
  { label: 'JetBrains Mono (Technical / Dater)', name: 'JetBrains Mono', value: "'JetBrains Mono', monospace", family: "'JetBrains Mono', monospace", category: 'mono', tag: 'Technical Dater' },
  { label: 'Space Mono (Clean Dater Code)', name: 'Space Mono', value: "'Space Mono', monospace", family: "'Space Mono', monospace", category: 'mono', tag: 'Dater Monospace' },
  { label: 'Fira Code (Precision Numeric Dater)', name: 'Fira Code', value: "'Fira Code', monospace", family: "'Fira Code', monospace", category: 'mono', tag: 'Numeric Dater' },
  { label: 'Share Tech Mono (Futuristic Registry)', name: 'Share Tech Mono', value: "'Share Tech Mono', monospace", family: "'Share Tech Mono', monospace", category: 'mono', tag: 'Registry Mono' },

  // --- Vintage & Gothic Seals ---
  { label: 'MedievalSharp (Gothic Heritage Seal)', name: 'MedievalSharp', value: "'MedievalSharp', cursive", family: "'MedievalSharp', cursive", category: 'vintage', tag: 'Gothic Seal' },
];
