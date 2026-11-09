import { EXTRA_FONTS } from './fonts-extra';
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
  category: 'sans' | 'serif' | 'bold' | 'script' | 'mono' | 'vintage' | 'indian';
  tag: string;
}

const BASE_FONT_OPTIONS: FontOption[] = [
  // ==========================================
  // 1. MODERN & CLEAN SANS-SERIF (25 Fonts)
  // Perfect for Stamp Outer Rings, Company Names, Legal Seals, Subtext
  // ==========================================
  { label: 'Plus Jakarta Sans (Modern Geometric)', name: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', Montserrat, sans-serif", family: "'Plus Jakarta Sans', Montserrat, sans-serif", category: 'sans', tag: 'Geometric Sans' },
  { label: 'Inter (Ultra Clean Standard)', name: 'Inter', value: "'Inter', sans-serif", family: "'Inter', sans-serif", category: 'sans', tag: 'Standard Sans' },
  { label: 'Outfit (Contemporary Clean)', name: 'Outfit', value: "'Outfit', sans-serif", family: "'Outfit', sans-serif", category: 'sans', tag: 'Clean Sans' },
  { label: 'Montserrat (Classic Business Sans)', name: 'Montserrat', value: 'Montserrat, Arial, sans-serif', family: 'Montserrat, Arial, sans-serif', category: 'sans', tag: 'Business Sans' },
  { label: 'Poppins (Soft Modern Sans)', name: 'Poppins', value: "'Poppins', sans-serif", family: "'Poppins', sans-serif", category: 'sans', tag: 'Modern Sans' },
  { label: 'DM Sans (Corporate Geometric)', name: 'DM Sans', value: "'DM Sans', sans-serif", family: "'DM Sans', sans-serif", category: 'sans', tag: 'Corporate Sans' },
  { label: 'Work Sans (Architectural Clean)', name: 'Work Sans', value: "'Work Sans', sans-serif", family: "'Work Sans', sans-serif", category: 'sans', tag: 'Architectural' },
  { label: 'Raleway (Elegant Thin/Bold)', name: 'Raleway', value: "'Raleway', sans-serif", family: "'Raleway', sans-serif", category: 'sans', tag: 'Elegant Sans' },
  { label: 'Space Grotesk (Modern Tech)', name: 'Space Grotesk', value: "'Space Grotesk', sans-serif", family: "'Space Grotesk', sans-serif", category: 'sans', tag: 'Tech Sans' },
  { label: 'Manrope (Crisp Modern Sans)', name: 'Manrope', value: "'Manrope', sans-serif", family: "'Manrope', sans-serif", category: 'sans', tag: 'Crisp Modern' },
  { label: 'Sora (Wide Tech Geometric)', name: 'Sora', value: "'Sora', sans-serif", family: "'Sora', sans-serif", category: 'sans', tag: 'Wide Tech' },
  { label: 'Lexend (High Readability)', name: 'Lexend', value: "'Lexend', sans-serif", family: "'Lexend', sans-serif", category: 'sans', tag: 'High Readability' },
  { label: 'Urbanist (Urban Geometric)', name: 'Urbanist', value: "'Urbanist', sans-serif", family: "'Urbanist', sans-serif", category: 'sans', tag: 'Urban Geometric' },
  { label: 'Figtree (Friendly Clean)', name: 'Figtree', value: "'Figtree', sans-serif", family: "'Figtree', sans-serif", category: 'sans', tag: 'Friendly Clean' },
  { label: 'Rubik (Rounded Corporate)', name: 'Rubik', value: "'Rubik', sans-serif", family: "'Rubik', sans-serif", category: 'sans', tag: 'Rounded Corp' },
  { label: 'Nunito Sans (Soft Humanist)', name: 'Nunito Sans', value: "'Nunito Sans', sans-serif", family: "'Nunito Sans', sans-serif", category: 'sans', tag: 'Soft Humanist' },
  { label: 'Josefin Sans (Vintage Geometric)', name: 'Josefin Sans', value: "'Josefin Sans', sans-serif", family: "'Josefin Sans', sans-serif", category: 'sans', tag: 'Vintage Geo' },
  { label: 'Quicksand (Rounded Display)', name: 'Quicksand', value: "'Quicksand', sans-serif", family: "'Quicksand', sans-serif", category: 'sans', tag: 'Rounded Display' },
  { label: 'Exo 2 (Futuristic Brand)', name: 'Exo 2', value: "'Exo 2', sans-serif", family: "'Exo 2', sans-serif", category: 'sans', tag: 'Futuristic' },
  { label: 'Cabin (Humanist Proportion)', name: 'Cabin', value: "'Cabin', sans-serif", family: "'Cabin', sans-serif", category: 'sans', tag: 'Humanist Sans' },
  { label: 'Barlow (Clean Signal Sans)', name: 'Barlow', value: "'Barlow', sans-serif", family: "'Barlow', sans-serif", category: 'sans', tag: 'Signal Sans' },
  { label: 'Overpass (Transit Standard)', name: 'Overpass', value: "'Overpass', sans-serif", family: "'Overpass', sans-serif", category: 'sans', tag: 'Transit Sans' },
  { label: 'Kanit (Modern Bold Sans)', name: 'Kanit', value: "'Kanit', sans-serif", family: "'Kanit', sans-serif", category: 'sans', tag: 'Modern Bold Sans' },
  { label: 'Archivo (Sharp Editorial Sans)', name: 'Archivo', value: "'Archivo', sans-serif", family: "'Archivo', sans-serif", category: 'sans', tag: 'Editorial Sans' },
  { label: 'Arial / Helvetica (Neutral Clean)', name: 'Arial / Helvetica', value: 'Arial, Helvetica, sans-serif', family: 'Arial, Helvetica, sans-serif', category: 'sans', tag: 'Neutral Standard' },

  // ==========================================
  // 2. OFFICIAL & LUXURY SERIFS (21 Fonts)
  // Notary Public, Company Seals, Royal Emblems, Embossings, Legal Advocates
  // ==========================================
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
  { label: 'Libre Baskerville (Classic Book)', name: 'Libre Baskerville', value: "'Libre Baskerville', serif", family: "'Libre Baskerville', serif", category: 'serif', tag: 'Classic Book' },
  { label: 'Crimson Pro (Scholarly Serif)', name: 'Crimson Pro', value: "'Crimson Pro', serif", family: "'Crimson Pro', serif", category: 'serif', tag: 'Scholarly' },
  { label: 'Spectral (Refined Screen Serif)', name: 'Spectral', value: "'Spectral', serif", family: "'Spectral', serif", category: 'serif', tag: 'Refined' },
  { label: 'Abril Fatface (Bold Poster Serif)', name: 'Abril Fatface', value: "'Abril Fatface', serif", family: "'Abril Fatface', serif", category: 'serif', tag: 'Poster Serif' },
  { label: 'Marcellus (Roman Inscription)', name: 'Marcellus', value: "'Marcellus', serif", family: "'Marcellus', serif", category: 'serif', tag: 'Roman Inscription' },
  { label: 'Forum (Antique Classical Capitals)', name: 'Forum', value: "'Forum', serif", family: "'Forum', serif", category: 'serif', tag: 'Antique Caps' },
  { label: 'Castoro (Scholastic Academic)', name: 'Castoro', value: "'Castoro', serif", family: "'Castoro', serif", category: 'serif', tag: 'Academic Serif' },
  { label: 'Faustina (Diplomatic Serif)', name: 'Faustina', value: "'Faustina', serif", family: "'Faustina', serif", category: 'serif', tag: 'Diplomatic Serif' },
  { label: 'Gilda Display (Delicate Royal)', name: 'Gilda Display', value: "'Gilda Display', serif", family: "'Gilda Display', serif", category: 'serif', tag: 'Delicate Royal' },
  { label: 'Yeseva One (Graceful Display)', name: 'Yeseva One', value: "'Yeseva One', serif", family: "'Yeseva One', serif", category: 'serif', tag: 'Graceful Display' },
  { label: 'Georgia (Traditional Legal Serif)', name: 'Georgia', value: 'Georgia, serif', family: 'Georgia, serif', category: 'serif', tag: 'Legal Serif' },

  // ==========================================
  // 3. BOLD STAMP & HEAVY IMPACT (19 Fonts)
  // Passed / Approved / Rejected, Inspection Stamps, Warehouse, Heavy Block Seals
  // ==========================================
  { label: 'Bebas Neue (Condensed Impact Header)', name: 'Bebas Neue', value: "'Bebas Neue', Impact, sans-serif", family: "'Bebas Neue', Impact, sans-serif", category: 'bold', tag: 'Impact Header' },
  { label: 'Oswald (Heavy Block Accounting)', name: 'Oswald', value: "'Oswald', Arial, sans-serif", family: "'Oswald', Arial, sans-serif", category: 'bold', tag: 'Heavy Accounting' },
  { label: 'Anton (Ultra Bold Stamp Block)', name: 'Anton', value: "'Anton', sans-serif", family: "'Anton', sans-serif", category: 'bold', tag: 'Ultra Bold' },
  { label: 'Archivo Black (Solid Industrial)', name: 'Archivo Black', value: "'Archivo Black', sans-serif", family: "'Archivo Black', sans-serif", category: 'bold', tag: 'Industrial Block' },
  { label: 'Barlow Condensed (Industrial Bold)', name: 'Barlow Condensed', value: "'Barlow Condensed', sans-serif", family: "'Barlow Condensed', sans-serif", category: 'bold', tag: 'Condensed Bold' },
  { label: 'Russo One (Heavy Geometric Stamp)', name: 'Russo One', value: "'Russo One', sans-serif", family: "'Russo One', sans-serif", category: 'bold', tag: 'Heavy Stamp' },
  { label: 'Teko (Tall Condensed Header)', name: 'Teko', value: "'Teko', sans-serif", family: "'Teko', sans-serif", category: 'bold', tag: 'Tall Condensed' },
  { label: 'Staatliches (Retro Industrial Title)', name: 'Staatliches', value: "'Staatliches', cursive", family: "'Staatliches', cursive", category: 'bold', tag: 'Retro Industrial' },
  { label: 'Righteous (Modern Heavy Display)', name: 'Righteous', value: "'Righteous', cursive", family: "'Righteous', cursive", category: 'bold', tag: 'Heavy Display' },
  { label: 'Black Ops One (Military Stencil)', name: 'Black Ops One', value: "'Black Ops One', sans-serif", family: "'Black Ops One', sans-serif", category: 'bold', tag: 'Military Stencil' },
  { label: 'Bungee (Signage Block)', name: 'Bungee', value: "'Bungee', sans-serif", family: "'Bungee', sans-serif", category: 'bold', tag: 'Signage Block' },
  { label: 'Passion One (Heavy Rounded)', name: 'Passion One', value: "'Passion One', sans-serif", family: "'Passion One', sans-serif", category: 'bold', tag: 'Heavy Rounded' },
  { label: 'Alfa Slab One (Bold Slab Serif)', name: 'Alfa Slab One', value: "'Alfa Slab One', serif", family: "'Alfa Slab One', serif", category: 'bold', tag: 'Bold Slab' },
  { label: 'Big Shoulders Display (Tall Industrial)', name: 'Big Shoulders Display', value: "'Big Shoulders Display', sans-serif", family: "'Big Shoulders Display', sans-serif", category: 'bold', tag: 'Tall Industrial' },
  { label: 'Fjalla One (Condensed News Header)', name: 'Fjalla One', value: "'Fjalla One', sans-serif", family: "'Fjalla One', sans-serif", category: 'bold', tag: 'Condensed News' },
  { label: 'Saira Condensed (Sport Condensed)', name: 'Saira Condensed', value: "'Saira Condensed', sans-serif", family: "'Saira Condensed', sans-serif", category: 'bold', tag: 'Sport Condensed' },
  { label: 'Titan One (Chunky Rounded Block)', name: 'Titan One', value: "'Titan One', sans-serif", family: "'Titan One', sans-serif", category: 'bold', tag: 'Chunky Stamp' },
  { label: 'Squada One (Square Block)', name: 'Squada One', value: "'Squada One', sans-serif", family: "'Squada One', sans-serif", category: 'bold', tag: 'Square Block' },
  { label: 'Chango (Ultra Heavy Block)', name: 'Chango', value: "'Chango', cursive", family: "'Chango', cursive", category: 'bold', tag: 'Ultra Heavy' },

  // ==========================================
  // 4. CALLIGRAPHY & SCRIPT SIGNATURES (18 Fonts)
  // Signatures, Authorized Signatory, Medical Doctors, Monograms, Crests
  // ==========================================
  { label: 'Great Vibes (Ornate Calligraphy Script)', name: 'Great Vibes', value: "'Great Vibes', cursive", family: "'Great Vibes', cursive", category: 'script', tag: 'Royal Calligraphy' },
  { label: 'Dancing Script (Casual Hand Signature)', name: 'Dancing Script', value: "'Dancing Script', cursive", family: "'Dancing Script', cursive", category: 'script', tag: 'Signature Script' },
  { label: 'Alex Brush (Classic Cursive Script)', name: 'Alex Brush', value: "'Alex Brush', cursive", family: "'Alex Brush', cursive", category: 'script', tag: 'Classic Script' },
  { label: 'Allura (Flowing Ribbon Signature)', name: 'Allura', value: "'Allura', cursive", family: "'Allura', cursive", category: 'script', tag: 'Flowing Script' },
  { label: 'Pinyon Script (Victorian Elegance)', name: 'Pinyon Script', value: "'Pinyon Script', cursive", family: "'Pinyon Script', cursive", category: 'script', tag: 'Victorian Script' },
  { label: 'Sacramento (Delicate Monoline)', name: 'Sacramento', value: "'Sacramento', cursive", family: "'Sacramento', cursive", category: 'script', tag: 'Monoline Script' },
  { label: 'Pacifico (Retro Brush Casual)', name: 'Pacifico', value: "'Pacifico', cursive", family: "'Pacifico', cursive", category: 'script', tag: 'Retro Brush' },
  { label: 'Parisienne (French Elegance)', name: 'Parisienne', value: "'Parisienne', cursive", family: "'Parisienne', cursive", category: 'script', tag: 'French Script' },
  { label: 'Satisfy (Brush Signature)', name: 'Satisfy', value: "'Satisfy', cursive", family: "'Satisfy', cursive", category: 'script', tag: 'Brush Signature' },
  { label: 'Kaushan Script (Bold Marker Brush)', name: 'Kaushan Script', value: "'Kaushan Script', cursive", family: "'Kaushan Script', cursive", category: 'script', tag: 'Bold Marker' },
  { label: 'Yellowtail (Retro Signboard Script)', name: 'Yellowtail', value: "'Yellowtail', cursive", family: "'Yellowtail', cursive", category: 'script', tag: 'Retro Script' },
  { label: 'Tangerine (Fine Tall Calligraphy)', name: 'Tangerine', value: "'Tangerine', cursive", family: "'Tangerine', cursive", category: 'script', tag: 'Fine Calligraphy' },
  { label: 'Italianno (Italian Cursive Hand)', name: 'Italianno', value: "'Italianno', cursive", family: "'Italianno', cursive", category: 'script', tag: 'Italian Hand' },
  { label: 'Herr Von Muellerhoff (Real Autograph)', name: 'Herr Von Muellerhoff', value: "'Herr Von Muellerhoff', cursive", family: "'Herr Von Muellerhoff', cursive", category: 'script', tag: 'Real Signature' },
  { label: 'Marck Script (Fluid Ink Signature)', name: 'Marck Script', value: "'Marck Script', cursive", family: "'Marck Script', cursive", category: 'script', tag: 'Fluid Signature' },
  { label: 'Homemade Apple (Authentic Pen Script)', name: 'Homemade Apple', value: "'Homemade Apple', cursive", family: "'Homemade Apple', cursive", category: 'script', tag: 'Authentic Pen' },
  { label: 'Bad Script (Casual Quick Sign)', name: 'Bad Script', value: "'Bad Script', cursive", family: "'Bad Script', cursive", category: 'script', tag: 'Quick Signature' },
  { label: 'Caveat (Natural Ink Handwriting)', name: 'Caveat', value: "'Caveat', cursive", family: "'Caveat', cursive", category: 'script', tag: 'Natural Hand' },

  // ==========================================
  // 5. TECHNICAL & DATER MONOSPACE (10 Fonts)
  // Date Stamps, Serial Numbers, Quality Assurance Codes, Registry
  // ==========================================
  { label: 'JetBrains Mono (Technical / Dater)', name: 'JetBrains Mono', value: "'JetBrains Mono', monospace", family: "'JetBrains Mono', monospace", category: 'mono', tag: 'Technical Dater' },
  { label: 'Space Mono (Clean Dater Code)', name: 'Space Mono', value: "'Space Mono', monospace", family: "'Space Mono', monospace", category: 'mono', tag: 'Dater Monospace' },
  { label: 'Fira Code (Precision Numeric Dater)', name: 'Fira Code', value: "'Fira Code', monospace", family: "'Fira Code', monospace", category: 'mono', tag: 'Numeric Dater' },
  { label: 'Share Tech Mono (Futuristic Registry)', name: 'Share Tech Mono', value: "'Share Tech Mono', monospace", family: "'Share Tech Mono', monospace", category: 'mono', tag: 'Registry Mono' },
  { label: 'IBM Plex Mono (Corporate Dater)', name: 'IBM Plex Mono', value: "'IBM Plex Mono', monospace", family: "'IBM Plex Mono', monospace", category: 'mono', tag: 'Corporate Dater' },
  { label: 'Courier Prime (Typewriter Dater)', name: 'Courier Prime', value: "'Courier Prime', monospace", family: "'Courier Prime', monospace", category: 'mono', tag: 'Typewriter Dater' },
  { label: 'Roboto Mono (Clean Numbering)', name: 'Roboto Mono', value: "'Roboto Mono', monospace", family: "'Roboto Mono', monospace", category: 'mono', tag: 'Clean Numbering' },
  { label: 'Major Mono Display (Geometric Mono)', name: 'Major Mono Display', value: "'Major Mono Display', monospace", family: "'Major Mono Display', monospace", category: 'mono', tag: 'Geometric Mono' },
  { label: 'Overpass Mono (Standard Stamp Dater)', name: 'Overpass Mono', value: "'Overpass Mono', monospace", family: "'Overpass Mono', monospace", category: 'mono', tag: 'Standard Dater' },
  { label: 'Anonymous Pro (Fixed Width Dater)', name: 'Anonymous Pro', value: "'Anonymous Pro', monospace", family: "'Anonymous Pro', monospace", category: 'mono', tag: 'Fixed Width' },

  // ==========================================
  // 6. VINTAGE, WESTERN, GOTHIC & CRESTS (10 Fonts)
  // Antique Seals, Vintage Brands, Coat of Arms, Historic Badges
  // ==========================================
  { label: 'MedievalSharp (Gothic Heritage Seal)', name: 'MedievalSharp', value: "'MedievalSharp', cursive", family: "'MedievalSharp', cursive", category: 'vintage', tag: 'Gothic Seal' },
  { label: 'UnifrakturMaguntia (Blackletter Fraktur)', name: 'UnifrakturMaguntia', value: "'UnifrakturMaguntia', cursive", family: "'UnifrakturMaguntia', cursive", category: 'vintage', tag: 'Blackletter' },
  { label: 'Pirata One (Gothic Display)', name: 'Pirata One', value: "'Pirata One', cursive", family: "'Pirata One', cursive", category: 'vintage', tag: 'Gothic Display' },
  { label: 'Uncial Antiqua (Celtic Manuscript)', name: 'Uncial Antiqua', value: "'Uncial Antiqua', cursive", family: "'Uncial Antiqua', cursive", category: 'vintage', tag: 'Celtic Seal' },
  { label: 'IM Fell English SC (Old Antique Print)', name: 'IM Fell English SC', value: "'IM Fell English SC', serif", family: "'IM Fell English SC', serif", category: 'vintage', tag: 'Old Antique Print' },
  { label: 'Special Elite (Typewriter Ink Stamp)', name: 'Special Elite', value: "'Special Elite', cursive", family: "'Special Elite', cursive", category: 'vintage', tag: 'Typewriter Stamp' },
  { label: 'Rye (Western Saloon Brand)', name: 'Rye', value: "'Rye', cursive", family: "'Rye', cursive", category: 'vintage', tag: 'Western Brand' },
  { label: 'Sancreek (Vintage Wooden Type)', name: 'Sancreek', value: "'Sancreek', cursive", family: "'Sancreek', cursive", category: 'vintage', tag: 'Wood Type' },
  { label: 'Trade Winds (Nautical Crest)', name: 'Trade Winds', value: "'Trade Winds', cursive", family: "'Trade Winds', cursive", category: 'vintage', tag: 'Nautical Crest' },
  { label: 'Caesar Dressing (Ancient Roman Stone)', name: 'Caesar Dressing', value: "'Caesar Dressing', cursive", family: "'Caesar Dressing', cursive", category: 'vintage', tag: 'Ancient Roman' },

  // ==========================================
  // 7. INDIAN REGIONAL SCRIPTS (10 Fonts)
  // Malayalam, Hindi, Tamil Official & Government Stamps
  // ==========================================
  { label: 'Noto Sans Malayalam (മലയാളം Standard)', name: 'Noto Sans Malayalam', value: "'Noto Sans Malayalam', sans-serif", family: "'Noto Sans Malayalam', sans-serif", category: 'indian', tag: 'Malayalam' },
  { label: 'Manjari (മലയാളം Rounded)', name: 'Manjari', value: "'Manjari', sans-serif", family: "'Manjari', sans-serif", category: 'indian', tag: 'Malayalam' },
  { label: 'Gayathri (മലയാളം Clean)', name: 'Gayathri', value: "'Gayathri', sans-serif", family: "'Gayathri', sans-serif", category: 'indian', tag: 'Malayalam' },
  { label: 'Chilanka (മലയാളം Handwritten)', name: 'Chilanka', value: "'Chilanka', cursive", family: "'Chilanka', cursive", category: 'indian', tag: 'Malayalam Hand' },
  { label: 'Baloo Chettan 2 (മലയാളം Bold Seal)', name: 'Baloo Chettan 2', value: "'Baloo Chettan 2', sans-serif", family: "'Baloo Chettan 2', sans-serif", category: 'indian', tag: 'Malayalam Bold' },
  { label: 'Noto Sans Devanagari (हिन्दी Standard)', name: 'Noto Sans Devanagari', value: "'Noto Sans Devanagari', sans-serif", family: "'Noto Sans Devanagari', sans-serif", category: 'indian', tag: 'Hindi' },
  { label: 'Hind (हिन्दी Clean Seal)', name: 'Hind', value: "'Hind', sans-serif", family: "'Hind', sans-serif", category: 'indian', tag: 'Hindi' },
  { label: 'Mukta (हिन्दी Modern)', name: 'Mukta', value: "'Mukta', sans-serif", family: "'Mukta', sans-serif", category: 'indian', tag: 'Hindi' },
  { label: 'Rozha One (हिन्दी Heavy Display)', name: 'Rozha One', value: "'Rozha One', serif", family: "'Rozha One', serif", category: 'indian', tag: 'Hindi Heavy' },
  { label: 'Noto Sans Tamil (தமிழ் Standard)', name: 'Noto Sans Tamil', value: "'Noto Sans Tamil', sans-serif", family: "'Noto Sans Tamil', sans-serif", category: 'indian', tag: 'Tamil' },
];

// base fonts (in the page stylesheet) + hundreds of extra Google Fonts loaded on demand
export const FONT_OPTIONS: FontOption[] = (() => {
  const seen = new Set(BASE_FONT_OPTIONS.map((f) => f.name.toLowerCase()));
  const extra = EXTRA_FONTS.filter((f) => {
    const k = f.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return [...BASE_FONT_OPTIONS, ...extra];
})();

/** Human label for a stamp size that makes the shape obvious: "Ø 40 mm" (round), "40 × 40 mm" (others). */
export function formatStampSize(shape: string, widthMm: number, heightMm: number): string {
  const n = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
  return shape === 'ROUND' ? `Ø ${n(widthMm)} mm` : `${n(widthMm)} × ${n(heightMm)} mm`;
}

export const SHAPE_LABELS: Record<string, string> = {
  ROUND: 'Round',
  SQUARE: 'Square',
  RECTANGULAR: 'Rectangle',
  OVAL: 'Oval',
};
