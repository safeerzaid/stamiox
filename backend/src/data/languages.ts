/**
 * Languages Clixio AI can reply in — every scheduled language of India (plus a few widely spoken ones),
 * each in its own script and "mixed with English" in English letters (Hinglish, Tanglish, Manglish…).
 * Shared by the backend (prompt instructions) and the frontend (language menu).
 */

export interface AiLanguage {
  /** id for the script form, e.g. 'HINDI' */
  id: string;
  /** id for the English-mixed form; Malayalam keeps the older 'MANGLISH' id */
  mixId: string;
  name: string;
  native: string;
  /** popular name of the English-mixed style, if there is one */
  mixName?: string;
  /** Unicode script block used to recognise it when Auto Detect is on */
  script: 'devanagari' | 'bengali' | 'gurmukhi' | 'gujarati' | 'odia' | 'tamil' | 'telugu' | 'kannada' | 'malayalam' | 'arabic' | 'olchiki' | 'meetei';
}

export const INDIAN_LANGUAGES: AiLanguage[] = [
  { id: 'HINDI', mixId: 'HINDI_EN', name: 'Hindi', native: 'हिन्दी', mixName: 'Hinglish', script: 'devanagari' },
  { id: 'BENGALI', mixId: 'BENGALI_EN', name: 'Bengali', native: 'বাংলা', mixName: 'Benglish', script: 'bengali' },
  { id: 'TELUGU', mixId: 'TELUGU_EN', name: 'Telugu', native: 'తెలుగు', mixName: 'Tenglish', script: 'telugu' },
  { id: 'MARATHI', mixId: 'MARATHI_EN', name: 'Marathi', native: 'मराठी', mixName: 'Minglish', script: 'devanagari' },
  { id: 'TAMIL', mixId: 'TAMIL_EN', name: 'Tamil', native: 'தமிழ்', mixName: 'Tanglish', script: 'tamil' },
  { id: 'URDU', mixId: 'URDU_EN', name: 'Urdu', native: 'اردو', mixName: 'Urdlish', script: 'arabic' },
  { id: 'GUJARATI', mixId: 'GUJARATI_EN', name: 'Gujarati', native: 'ગુજરાતી', mixName: 'Gujlish', script: 'gujarati' },
  { id: 'KANNADA', mixId: 'KANNADA_EN', name: 'Kannada', native: 'ಕನ್ನಡ', mixName: 'Kanglish', script: 'kannada' },
  { id: 'ODIA', mixId: 'ODIA_EN', name: 'Odia', native: 'ଓଡ଼ିଆ', script: 'odia' },
  { id: 'MALAYALAM', mixId: 'MANGLISH', name: 'Malayalam', native: 'മലയാളം', mixName: 'Manglish', script: 'malayalam' },
  { id: 'PUNJABI', mixId: 'PUNJABI_EN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', mixName: 'Punglish', script: 'gurmukhi' },
  { id: 'ASSAMESE', mixId: 'ASSAMESE_EN', name: 'Assamese', native: 'অসমীয়া', script: 'bengali' },
  { id: 'MAITHILI', mixId: 'MAITHILI_EN', name: 'Maithili', native: 'मैथिली', script: 'devanagari' },
  { id: 'SANTALI', mixId: 'SANTALI_EN', name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ', script: 'olchiki' },
  { id: 'KASHMIRI', mixId: 'KASHMIRI_EN', name: 'Kashmiri', native: 'کٲشُر', script: 'arabic' },
  { id: 'NEPALI', mixId: 'NEPALI_EN', name: 'Nepali', native: 'नेपाली', script: 'devanagari' },
  { id: 'SINDHI', mixId: 'SINDHI_EN', name: 'Sindhi', native: 'سنڌي', script: 'arabic' },
  { id: 'KONKANI', mixId: 'KONKANI_EN', name: 'Konkani', native: 'कोंकणी', script: 'devanagari' },
  { id: 'DOGRI', mixId: 'DOGRI_EN', name: 'Dogri', native: 'डोगरी', script: 'devanagari' },
  { id: 'MANIPURI', mixId: 'MANIPURI_EN', name: 'Manipuri (Meitei)', native: 'ꯃꯩꯇꯩꯂꯣꯟ', script: 'meetei' },
  { id: 'BODO', mixId: 'BODO_EN', name: 'Bodo', native: 'बड़ो', script: 'devanagari' },
  { id: 'SANSKRIT', mixId: 'SANSKRIT_EN', name: 'Sanskrit', native: 'संस्कृतम्', script: 'devanagari' },
  { id: 'BHOJPURI', mixId: 'BHOJPURI_EN', name: 'Bhojpuri', native: 'भोजपुरी', script: 'devanagari' },
  { id: 'TULU', mixId: 'TULU_EN', name: 'Tulu', native: 'ತುಳು', script: 'kannada' },
];

const SCRIPT_RANGES: Record<AiLanguage['script'], RegExp> = {
  devanagari: /[ऀ-ॿ]/,
  bengali: /[ঀ-৿]/,
  gurmukhi: /[਀-੿]/,
  gujarati: /[઀-૿]/,
  odia: /[଀-୿]/,
  tamil: /[஀-௿]/,
  telugu: /[ఀ-౿]/,
  kannada: /[ಀ-೿]/,
  malayalam: /[ഀ-ൿ]/,
  arabic: /[؀-ۿ]/,
  olchiki: /[᱐-᱿]/,
  meetei: /[ꯀ-꯿]/,
};

const SCRIPT_NAMES: Record<AiLanguage['script'], string> = {
  devanagari: 'Devanagari',
  bengali: 'Bengali–Assamese',
  gurmukhi: 'Gurmukhi',
  gujarati: 'Gujarati',
  odia: 'Odia',
  tamil: 'Tamil',
  telugu: 'Telugu',
  kannada: 'Kannada',
  malayalam: 'Malayalam',
  arabic: 'Perso-Arabic',
  olchiki: 'Ol Chiki',
  meetei: 'Meetei Mayek',
};

// a few everyday words of each English-mixed style, to guess it when Auto Detect is on
const MIX_HINTS: Array<{ mixId: string; re: RegExp }> = [
  { mixId: 'MANGLISH', re: /\b(?:aaku|aakku|aakki|maattu|maatti|pakaram|cheyyu|cheyyam|cheyy\w*|nokk\w*|venam|venda|vende|chuvapp|pacha|karupp|vattam|chathuram|katti|idumo|njan|ningal|enth\w*|ethu|ithu|athu|aanu|aano|alle|ippo|ippol|onnu|engane|evide|ennu|nallath\w*|kollam|adipoli|nanni|polichu|parayoo|parayu|undo|und|illa|machane|tharu|thaa|kodukk\w*|kittum|kooduthal|kurach\w*|koode|sheri|undakk\w*|undaakk\w*|mathi|vendi|valuthakk\w*|cheruthakk\w*|aakkiyal)\b/i },
  { mixId: 'HINDI_EN', re: /\b(?:hai|kya|karo|kardo|kar do|chahiye|mujhe|banao|bana do|nahi|accha|acha|wala|wali|thoda|zyada|kaise|kyun)\b/i },
  { mixId: 'TAMIL_EN', re: /\b(?:venum|vendum|pannunga|pannu|panni|seri|enna|romba|irukku|konjam|nalla|podu)\b/i },
  { mixId: 'TELUGU_EN', re: /\b(?:kavali|cheyyandi|cheyyi|enti|baagundi|chesi|chala|ledu|undi|ivvandi)\b/i },
  { mixId: 'KANNADA_EN', re: /\b(?:beku|maadi|madi|yenu|chennagide|swalpa|kodi|haaki)\b/i },
  { mixId: 'BENGALI_EN', re: /\b(?:korun|koro|chai|lagbe|kemon|bhalo|ektu|dao|amake)\b/i },
  { mixId: 'MARATHI_EN', re: /\b(?:kara|pahije|kasa|kashi|ahe|nako|thoda|bagha)\b/i },
];

export function findLanguage(id?: string) {
  if (!id) return null;
  for (const l of INDIAN_LANGUAGES) {
    if (l.id === id) return { lang: l, mixed: false };
    if (l.mixId === id) return { lang: l, mixed: true };
  }
  return null;
}

const KEEP_STAMP_TEXT =
  'Only the chat reply follows this language: keep the text that goes ON the stamp exactly as the user asks for it (do not translate names, company names or stamp text unless the user asks you to).';

/**
 * The language rule sent to the model.
 * `label` is a short tag for the prompt; `instruction` is the binding rule.
 */
export function languageRule(language: string | undefined, prompt: string): { label: string; instruction: string } {
  if (language === 'ENGLISH') {
    return {
      label: 'ENGLISH',
      instruction: `CRITICAL MANDATORY INSTRUCTION: Reply in 100% plain, professional ENGLISH only — no words from any other language. ${KEEP_STAMP_TEXT}`,
    };
  }
  const chosen = findLanguage(language);
  if (chosen) {
    const { lang, mixed } = chosen;
    if (mixed) {
      const style = lang.mixName ? `${lang.mixName} (${lang.name} mixed with English)` : `${lang.name} mixed with English`;
      return {
        label: style.toUpperCase(),
        instruction: `CRITICAL MANDATORY INSTRUCTION: Reply in natural, friendly ${style}, written in English (Latin) letters the way people chat on WhatsApp — ${lang.name} sentences with common English words mixed in. Do NOT use the ${lang.native} script. Use ONLY English (Latin) letters — never write any Malayalam, Tamil, Devanagari or other Indian-script characters. ${KEEP_STAMP_TEXT}`,
      };
    }
    return {
      label: lang.name.toUpperCase(),
      instruction: `CRITICAL MANDATORY INSTRUCTION: Reply in ${lang.name}, written in its own script (${lang.native}). Technical words with no common ${lang.name} equivalent (mm, PNG, SVG) may stay in English. ${KEEP_STAMP_TEXT}`,
    };
  }

  // Auto Detect: mirror exactly what the user wrote
  const text = prompt || '';
  for (const lang of INDIAN_LANGUAGES) {
    if (SCRIPT_RANGES[lang.script].test(text)) {
      const shared = INDIAN_LANGUAGES.filter((l) => l.script === lang.script).map((l) => l.name);
      const which = shared.length > 1 ? `the same language the user wrote in (it uses the ${SCRIPT_NAMES[lang.script]} script — one of ${shared.join(', ')})` : lang.name;
      return {
        label: shared.length > 1 ? `SAME AS USER (${lang.script.toUpperCase()} SCRIPT)` : lang.name.toUpperCase(),
        instruction: `CRITICAL MANDATORY INSTRUCTION: Reply in ${which}, in that same script. If the user mixed English words in, you may mix English the same way. ${KEEP_STAMP_TEXT}`,
      };
    }
  }
  const hint = MIX_HINTS.find((h) => h.re.test(text));
  if (hint) {
    const { lang } = findLanguage(hint.mixId)!;
    const style = lang.mixName ? `${lang.mixName} (${lang.name} mixed with English)` : `${lang.name} mixed with English`;
    return {
      label: style.toUpperCase(),
      instruction: `CRITICAL MANDATORY INSTRUCTION: The user writes ${style} in English letters — reply the same way, naturally and friendly, in English letters. Use ONLY English (Latin) letters — never write any Malayalam, Tamil, Devanagari or other Indian-script characters. ${KEEP_STAMP_TEXT}`,
    };
  }
  return {
    label: 'SAME AS USER',
    instruction: `CRITICAL MANDATORY INSTRUCTION: Reply in exactly the language and style the user wrote in. If they wrote plain English, reply in plain professional English only. If they wrote an Indian language in English letters mixed with English (Hinglish, Tanglish, Manglish, Kanglish…), reply in that same mixed style in English letters only (no Indian-script characters at all). If they used an Indian script, reply in that language and script. ${KEEP_STAMP_TEXT}`,
  };
}

/** The offline (no-AI) replies only exist in English and Malayalam / Manglish. */
export function offlineLanguage(language: string | undefined, prompt: string): 'ENGLISH' | 'MANGLISH' | 'MALAYALAM' {
  if (language === 'MANGLISH' || language === 'MALAYALAM') return language;
  if (language && language !== 'AUTO') return 'ENGLISH';
  if (SCRIPT_RANGES.malayalam.test(prompt)) return 'MALAYALAM';
  return MIX_HINTS[0].re.test(prompt) ? 'MANGLISH' : 'ENGLISH';
}
