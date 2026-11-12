/**
 * Extra Google Fonts for the font picker. These are NOT in the page's font stylesheet —
 * each one is downloaded only when it is shown in the picker or used in a design
 * (see font-loader.ts), so adding hundreds of fonts costs nothing up front.
 */
import type { FontOption } from './units';

type Cat = FontOption['category'];

const FALLBACK: Record<Cat, string> = {
  sans: 'sans-serif',
  serif: 'serif',
  bold: 'sans-serif',
  script: 'cursive',
  mono: 'monospace',
  vintage: 'serif',
  indian: 'sans-serif',
  custom: 'sans-serif',
};

// [category, tag shown in the picker, font names]
const GROUPS: [Cat, string, string[]][] = [
  ['sans', 'Clean Sans', [
    'Roboto', 'Open Sans', 'Lato', 'Nunito', 'Nunito Sans', 'Source Sans 3', 'Noto Sans', 'Ubuntu', 'Rubik', 'Karla',
    'Manrope', 'Figtree', 'Lexend', 'Urbanist', 'Sora', 'Red Hat Display', 'Public Sans', 'IBM Plex Sans', 'Cabin', 'Quicksand',
    'Josefin Sans', 'Archivo', 'Heebo', 'Assistant', 'Mulish', 'Barlow', 'Exo 2', 'Titillium Web', 'Kanit', 'Fira Sans',
    'PT Sans', 'Oxygen', 'Questrial', 'Varela Round', 'Comfortaa', 'Maven Pro', 'Asap', 'Encode Sans', 'Overpass', 'Jost',
    'Albert Sans', 'Be Vietnam Pro', 'Onest', 'Epilogue', 'Schibsted Grotesk', 'Bricolage Grotesque', 'Instrument Sans',
    'Hanken Grotesk', 'Golos Text', 'Readex Pro', 'Saira', 'Signika', 'Abel', 'Didact Gothic', 'Prompt', 'Chivo',
    'Libre Franklin', 'Gothic A1', 'Tenor Sans', 'League Spartan', 'Commissioner', 'Sarabun', 'Space Grotesk', 'Lexend Deca',
    'M PLUS Rounded 1c', 'Nanum Gothic', 'Arimo', 'Cantarell', 'Hind', 'Mukta',
  ]],
  ['serif', 'Classic Serif', [
    'Merriweather', 'Lora', 'PT Serif', 'Noto Serif', 'Libre Baskerville', 'EB Garamond', 'Crimson Text', 'Crimson Pro',
    'Source Serif 4', 'Bitter', 'Zilla Slab', 'Roboto Slab', 'Arvo', 'Domine', 'Spectral', 'Cardo', 'Alegreya', 'Vollkorn',
    'Old Standard TT', 'Gelasio', 'Frank Ruhl Libre', 'DM Serif Display', 'DM Serif Text', 'Prata', 'Abril Fatface',
    'Bodoni Moda', 'Libre Caslon Text', 'Marcellus', 'Forum', 'Philosopher', 'Yeseva One', 'Antic Didone', 'Newsreader',
    'Fraunces', 'Young Serif', 'Brygada 1918', 'Literata', 'Petrona', 'Noticia Text', 'Rokkitt', 'Slabo 27px', 'Josefin Slab',
    'Coustard', 'Arapey', 'Trirong', 'Sorts Mill Goudy', 'Martel', 'Tinos', 'Gilda Display', 'Bellefair', 'Cormorant',
    'Cormorant SC', 'Playfair Display SC', 'Lusitana', 'Neuton', 'Quattrocento', 'Radley', 'Rufina', 'Tienne', 'Ovo',
  ]],
  ['bold', 'Bold Display', [
    'Black Ops One', 'Bungee', 'Bungee Inline', 'Righteous', 'Passion One', 'Fjalla One', 'Alfa Slab One', 'Teko', 'Staatliches',
    'Big Shoulders Display', 'Chakra Petch', 'Orbitron', 'Audiowide', 'Bowlby One', 'Bowlby One SC', 'Changa One', 'Days One',
    'Dela Gothic One', 'Dosis', 'Fugaz One', 'Graduate', 'Lilita One', 'Luckiest Guy', 'Paytone One', 'Racing Sans One',
    'Rubik Mono One', 'Sigmar One', 'Squada One', 'Titan One', 'Ultra', 'Coda', 'Saira Stencil One', 'Stardos Stencil',
    'Allerta Stencil', 'Black Han Sans', 'Rammetto One', 'Patua One', 'Krona One', 'Michroma', 'Syncopate', 'Unica One',
    'Wallpoet', 'Zen Dots', 'Poller One', 'Gravitas One', 'Viga', 'Secular One', 'Big Shoulders Stencil Display', 'Bungee Shade',
    'Monoton', 'Fredoka', 'Baloo 2', 'Chango', 'Erica One', 'Goblin One', 'Knewave', 'Rubik Mono One', 'Exo', 'Russo One',
  ]],
  ['script', 'Script', [
    'Parisienne', 'Satisfy', 'Kaushan Script', 'Yellowtail', 'Cookie', 'Tangerine', 'Italianno', 'Herr Von Muellerhoff',
    'Mr De Haviland', 'Monsieur La Doulaise', 'Petit Formal Script', 'Rouge Script', 'Marck Script', 'Courgette', 'Lobster',
    'Lobster Two', 'Caveat', 'Kalam', 'Homemade Apple', 'Rock Salt', 'Shadows Into Light', 'Indie Flower', 'Permanent Marker',
    'Amatic SC', 'Handlee', 'Gochi Hand', 'Covered By Your Grace', 'Nothing You Could Do', 'La Belle Aurore',
    'Mrs Saint Delafield', 'Euphoria Script', 'Arizonia', 'Bad Script', 'Niconne', 'Norican', 'Playball', 'Rochester', 'Damion',
    'Qwigley', 'Ruthie', 'Meddon', 'Clicker Script', 'Calligraffitti', 'Cedarville Cursive', 'Dawning of a New Day',
    'Engagement', 'Grand Hotel', 'Kristi', 'League Script', 'Montez', 'Mr Dafoe', 'Birthstone', 'Corinthia', 'Ephesis',
    'Imperial Script', 'Ingrid Darling', 'Ms Madi', 'WindSong', 'Water Brush', 'Allison', 'Fleur De Leah', 'Hurricane',
    'Licorice', 'Love Light', 'Moon Dance', 'The Nautigal', 'Style Script', 'Seaweed Script', 'Cherish', 'Comforter',
  ]],
  ['mono', 'Dater Mono', [
    'Roboto Mono', 'Source Code Pro', 'Inconsolata', 'Ubuntu Mono', 'PT Mono', 'Courier Prime', 'Anonymous Pro',
    'Overpass Mono', 'Red Hat Mono', 'DM Mono', 'Martian Mono', 'Azeret Mono', 'Cutive Mono', 'Major Mono Display',
    'Nova Mono', 'Oxygen Mono', 'Syne Mono', 'VT323', 'Xanh Mono', 'Sometype Mono', 'Chivo Mono', 'Noto Sans Mono',
    'Spline Sans Mono', 'Victor Mono', 'B612 Mono', 'Fira Mono', 'Cousine', 'Lekton', 'Share Tech', 'Silkscreen',
  ]],
  ['vintage', 'Vintage', [
    'Special Elite', 'Rye', 'Ewert', 'Smokum', 'Sancreek', 'Holtwood One SC', 'Fredericka the Great', 'UnifrakturMaguntia',
    'Pirata One', 'New Rocker', 'Metamorphous', 'IM Fell English', 'IM Fell DW Pica', 'IM Fell English SC',
    'Germania One', 'Grenze Gotisch', 'MedievalSharp', 'Almendra', 'Almendra Display', 'Uncial Antiqua', 'Berkshire Swash',
    'Diplomata', 'Diplomata SC', 'Elsie', 'Limelight', 'Poiret One', 'Federo', 'Vast Shadow', 'Wellfleet', 'Emblema One',
    'Cinzel Decorative', 'Macondo', 'Spirax', 'Fruktur', 'Jacques Francois Shadow', 'Bevan', 'Abril Fatface',
  ]],
  ['indian', 'Indian', [
    // Malayalam
    'Noto Serif Malayalam', 'Anek Malayalam',
    // Tamil
    'Noto Sans Tamil', 'Noto Serif Tamil', 'Hind Madurai', 'Mukta Malar', 'Arima', 'Pavanam', 'Kavivanar', 'Meera Inimai',
    'Catamaran',
    // Devanagari (Hindi / Marathi)
    'Noto Sans Devanagari', 'Tiro Devanagari Hindi', 'Rozha One', 'Khand', 'Rajdhani', 'Yatra One', 'Eczar', 'Sura',
    'Amita', 'Arya', 'Laila', 'Sarpanch', 'Vesper Libre', 'Karma', 'Palanquin', 'Kurale', 'Biryani',
    // Kannada / Telugu
    'Noto Sans Kannada', 'Baloo Tamma 2', 'Hubballi', 'Noto Sans Telugu', 'Ramabhadra', 'Mandali', 'NTR', 'Gurajada',
    // Bengali / Gujarati / Punjabi
    'Hind Siliguri', 'Noto Sans Bengali', 'Galada', 'Baloo Da 2', 'Tiro Bangla', 'Noto Sans Gujarati', 'Hind Vadodara',
    'Shrikhand', 'Rasa', 'Baloo Paaji 2', 'Noto Sans Gurmukhi', 'Mukta Mahee',
    // Urdu / Arabic
    'Noto Nastaliq Urdu', 'Amiri', 'Cairo', 'Tajawal', 'Noto Kufi Arabic', 'Reem Kufi', 'Lateef',
  ]],
];

export const EXTRA_FONTS: FontOption[] = GROUPS.flatMap(([category, tag, names]) =>
  names.map((name) => {
    const value = `'${name}', ${FALLBACK[category]}`;
    return { label: `${name} (${tag})`, name, value, family: value, category, tag };
  })
);

/** Names of the fonts that must be fetched on demand. */
export const EXTRA_FONT_NAMES = new Set(EXTRA_FONTS.map((f) => f.name));
