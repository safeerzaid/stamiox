import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
import { ELEMENT_SCHEMA, normalizeElements, sameDesign, printCheck, enforceProduction, keepLogoProportions, sanitizeStampSize } from './ai-elements';
import { buildCategoryDesign, offlineSpec, specFromBrief, buildVariations, type BuiltDesign } from './stamp-layouts';
import { languageRule, offlineLanguage } from '../data/languages';

const uuidv4 = () => crypto.randomUUID();

/**
 * Final production check on every design the AI hands back (AI behaviour rules 5, 9, 10):
 * elements this answer created or changed get the print minimums (lines ≥ 0.3 mm, text ≥ 2 mm)
 * and are shrunk to fit the stamp; then the print check reports anything still not right.
 * `before` = the design before this answer (an edit) — only what changed is adjusted / reported.
 */
function withPrintCheck<T extends { elements?: any[]; widthMm?: number; heightMm?: number; shape?: string; printWarnings?: string[] }>(r: T, before?: any): T {
  if (Array.isArray(r.elements) && r.elements.length) {
    const W = Number(r.widthMm) || Number(before?.widthMm) || 40;
    const H = Number(r.heightMm) || Number(before?.heightMm) || 40;
    const shape = r.shape || before?.shape;
    let changed: Set<string> | undefined;
    if (Array.isArray(before?.elements) && before.elements.length) {
      const old = new Map(before.elements.map((e: any) => [String(e.id), JSON.stringify(e)]));
      changed = new Set(r.elements.filter((e: any) => old.get(String(e.id)) !== JSON.stringify(e)).map((e: any) => String(e.id)));
    }
    const notes = enforceProduction(r.elements, W, H, shape, changed);
    let warnings = printCheck(r.elements, W, H, shape);
    // only problems this answer created — the same warning isn't repeated after every message
    if (Array.isArray(before?.elements) && before.elements.length) {
      const old = new Set(printCheck(before.elements, Number(before.widthMm) || 40, Number(before.heightMm) || 40, before.shape));
      warnings = warnings.filter((w) => !old.has(w));
    }
    warnings = [...notes, ...warnings];
    if (warnings.length) r.printWarnings = warnings;
  }
  return r;
}

/**
 * Is this message asking to change the stamp SHAPE ("make it round", "ee square shape ne round
 * akuka", "oval aakku", "change to rectangle")? Returns the shape it should become, or null.
 * The last shape word is the target ("square ne round akuka" → ROUND, "square to round" → ROUND).
 * A request for a new stamp ("create a round seal for …") is not a shape change.
 */
const SHAPE_WORDS: Array<[RegExp, 'ROUND' | 'OVAL' | 'SQUARE' | 'RECTANGULAR']> = [
  [/\b(?:round|rownd|circle|circular|vattam|vatta|urunda)\b|വട്ട/gi, 'ROUND'],
  [/\b(?:oval|ovel|ovle|ellipse|mutta)\b|ഓവൽ/gi, 'OVAL'],
  [/\b(?:square|sqaure|sqare|squre|samachathuram)\b|സമചതുര/gi, 'SQUARE'],
  [/\b(?:rect|rectangle|rectangular|neelam|neela\s*chathuram|chathuram)\b|ചതുര/gi, 'RECTANGULAR'],
];
export function detectShapeChange(prompt: string, understood?: string): 'ROUND' | 'OVAL' | 'SQUARE' | 'RECTANGULAR' | null {
  const text = `${prompt || ''}`;
  const lower = text.toLowerCase();
  // asking for a whole new stamp, or about something else that happens to be round (a round logo, a circle around text…)
  if (/\b(?:new|create|puthiya|puthiyath|generate|design\s+a|make\s+a|oru)\b/i.test(lower) && !/\bshape\b/i.test(lower)) return null;
  if (/\b(?:logo|text|star|icon|border|ring|line)\b/i.test(lower) && !/\b(?:stamp|shape|seal|it|ith|ithine|athine)\b/i.test(lower)) return null;
  const verb = /\b(?:shape|make|change|convert|turn|switch|to|into|aakk\w*|akk\w*|aaku\w*|aku\w*|maatt\w*|matt\w*|venam|cheyy\w*)\b|ആക്ക|മാറ്റ/i;
  const find = (s: string) => {
    let best: { at: number; shape: 'ROUND' | 'OVAL' | 'SQUARE' | 'RECTANGULAR' } | null = null;
    for (const [re, shape] of SHAPE_WORDS) {
      for (const m of s.matchAll(re)) if (!best || (m.index ?? 0) > best.at) best = { at: m.index ?? 0, shape };
    }
    return best?.shape ?? null;
  };
  if (!verb.test(text)) return null;
  const fromPrompt = find(text);
  if (fromPrompt) return fromPrompt;
  // a message the AI had to decode (typos / other scripts): trust its clean English version
  if (understood && /\bshape\b/i.test(understood)) return find(understood);
  return null;
}

/**
 * Removes lines from a new-stamp spec that the user never gave: every word of a line (3+ letters,
 * ignoring common labels) must appear in what the user wrote. The main name, the "For …" line,
 * the designation and the status word are kept (the AI may tidy their spelling / case). Returns
 * the dropped lines.
 */
const LABEL_WORDS = new Set(['GST', 'GSTIN', 'CIN', 'REG', 'REGD', 'NO', 'PH', 'PHONE', 'MOB', 'TEL', 'EMAIL', 'MAIL', 'WEB', 'PIN', 'DATE', 'SIGN', 'SEAL', 'THE', 'AND', 'FOR', 'LTD', 'PVT', 'LLP', 'INC', 'CO']);
function dropInventedTexts(spec: any, said: string): string[] {
  const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9ऀ-෿]+/g, ' ');
  const source = ` ${norm(said)} `;
  // a word counts as given if it (or its first 4 letters, for small spelling fixes) is in the user's text
  const given = (w: string) => source.includes(` ${w} `) || (w.length >= 5 && source.includes(w.slice(0, 4))) || /^\d+$/.test(w) && source.includes(w);
  const invented = (line: string) => {
    const words = norm(line).split(' ').filter((w) => w.length >= 3 && !LABEL_WORDS.has(w));
    return words.length > 0 && words.every((w) => !given(w));
  };
  const dropped: string[] = [];
  const keep = (v: any) => {
    if (typeof v !== 'string' || !v.trim()) return true;
    if (invented(v)) { dropped.push(v); return false; }
    return true;
  };
  if (Array.isArray(spec.centerLines)) spec.centerLines = spec.centerLines.filter(keep);
  if (Array.isArray(spec.lines)) spec.lines = [spec.lines[0], ...spec.lines.slice(1).filter(keep)].filter((x) => x !== undefined);
  if (typeof spec.bottomText === 'string' && !keep(spec.bottomText)) spec.bottomText = '';
  if (typeof spec.extraLine === 'string' && !keep(spec.extraLine)) delete spec.extraLine;
  return dropped;
}

/** Ink colours a user can name in one word (English / Manglish). */
const INK_WORDS: Array<[RegExp, string, string]> = [
  [/\b(?:red|chuvapp\w*|chuvanna)\b/i, '#990000', 'red'],
  [/\b(?:blue|neela|neelam|neelayil)\b/i, '#003399', 'blue'],
  [/\b(?:black|karupp\w*|karutha)\b/i, '#111827', 'black'],
  [/\b(?:green|pacha)\b/i, '#007A3D', 'green'],
  [/\b(?:violet|purple|vayalet)\b/i, '#5b21b6', 'violet'],
  [/\b(?:brown|coffee)\b/i, '#7c2d12', 'brown'],
];
// a request about the whole layout's alignment (not "shari / sheri" alone — in Manglish that also means "ok / correct")
// (typos included: "aligment", "alinment", "allignment", "alignmnet")
const ALIGN_WORDS = /\b(?:al+ig?n\w*|al+igm\w*|al+ain\w*|layout|lay\s*out|arrange\w*|arrang\w*)\b/i;

/**
 * Instant answers — no AI call at all — for the simple commands the editor can carry out by
 * itself: a shape change, "fix the alignment", a one-word ink colour. Only for English / Manglish
 * (other languages go to the AI so the reply is in their language). Null = ask the AI.
 */
function instantAnswer(prompt: string, currentDesign: any, language: string | undefined): AiStampGeneratedPayload | null {
  const els = currentDesign?.elements;
  if (!Array.isArray(els) || !els.length) return null;
  if (language && !['AUTO', 'ENGLISH', 'MANGLISH'].includes(language)) return null;
  const lang = offlineLanguage(language, prompt);
  if (lang === 'MALAYALAM') return null;
  // Manglish also when typed loosely ("akuka", "shariyaakku", "ne", "venam")
  const manglishHint = /\b(?:aak\w*|akk\w*|aku\w*|ak[ui]ka|cheyy\w*|venam|ne|nte|ithu|ith|athu|ee|maatt\w*|matt\w*|shari\w*|sheri\w*|niram|vattam|mutta)\b/i;
  const ml = lang === 'MANGLISH' || (language !== 'ENGLISH' && manglishHint.test(prompt));
  const p = prompt.trim();
  const words = p.split(/\s+/).length;
  // anything that also asks for something else (text, size, adding / removing…) needs the AI
  const otherEdit = /\b(?:text|name|add|remove|delete|bigger|smaller|size|font|logo|star|border|thick|thin|move|mm|save|export|download|pdf|png|svg)\b/i;

  const target = detectShapeChange(p);
  if (target && words <= 10 && !/\d/.test(p) && !otherEdit.test(p.replace(/\b(?:shape|stamp)\b/gi, ''))) {
    const name = { ROUND: 'round', OVAL: 'oval', SQUARE: 'square', RECTANGULAR: 'rectangle' }[target];
    return {
      action: 'SURGICAL_EDIT', shape: target, elements: els,
      reply: ml ? `Done! Stamp ${name} shape aakki.` : `Done! The stamp is ${name} now.`,
      summary: `Shape changed to ${name}`, understood: `Change the stamp shape to ${name}`,
      suggestedFollowUps: ml ? ['Ink colour maattu', 'Alignment shariyaakku'] : ['Change ink colour', 'Fix the alignment'],
    };
  }
  if (ALIGN_WORDS.test(p) && words <= 10 && !otherEdit.test(p.replace(/\b(?:text|name)\b/gi, '')) && !/\b(?:left|right|edath\w*|valath\w*)\b/i.test(p)) {
    return {
      action: 'SURGICAL_EDIT', doRealign: true, elements: els,
      reply: ml ? 'Done! Alignment shariyaakki.' : 'Done! The layout is re-aligned.',
      summary: 'Layout re-aligned', understood: 'Fix the alignment of the stamp',
      suggestedFollowUps: [],
    };
  }
  const inks = INK_WORDS.filter(([re]) => re.test(p));
  if (inks.length === 1 && words <= 6 && /\b(?:ink|colou?r|niram|aakk\w*|akk\w*|aaku\w*|make|change|maatt\w*|to)\b/i.test(p) && !otherEdit.test(p)) {
    const [, hex, name] = inks[0];
    return {
      action: 'SURGICAL_EDIT', inkColor: hex, elements: els,
      reply: ml ? `Done! Ink ${name} aakki.` : `Done! The ink is ${name} now.`,
      summary: `Ink ${name}`, understood: `Make the ink ${name}`,
      suggestedFollowUps: [],
    };
  }
  return null;
}

/** Logo stamp: put the logo already on the canvas into the centre of a new seal, undistorted. */
function placeExistingLogo(built: BuiltDesign, currentDesign: any) {
  const logo = (currentDesign?.elements || []).find((e: any) => e?.type === 'image' && e.src);
  if (!logo) return;
  const box = Math.min(built.widthMm, built.heightMm) * 0.34;
  const ratio = (Number(logo.width) || 1) / (Number(logo.height) || 1);
  const w = ratio >= 1 ? box : box * ratio;
  const h = ratio >= 1 ? box / ratio : box;
  built.elements.push({ ...logo, x: +((built.widthMm - w) / 2).toFixed(2), y: +((built.heightMm - h) / 2).toFixed(2), width: +w.toFixed(2), height: +h.toFixed(2) });
}

/**
 * Applies the AI's edit patch to the current design: { update: [{id, ...changed props}],
 * add: [new elements], remove: [ids] }. Elements it doesn't mention are kept exactly as they are.
 */
function applyDesignChanges(current: any[], changes: any): any[] {
  const asList = (v: any) => (Array.isArray(v) ? v : v ? [v] : []);
  const removeIds = new Set(asList(changes?.remove).map((x: any) => String(typeof x === 'object' && x ? x.id : x)));
  const updates = new Map<string, any>();
  for (const u of asList(changes?.update)) {
    if (u && u.id != null) updates.set(String(u.id), { ...(updates.get(String(u.id)) || {}), ...u });
  }
  const out = current
    .filter((el) => !removeIds.has(String(el.id)))
    .map((el) => {
      const u = updates.get(String(el.id));
      if (!u) return el;
      const { id: _id, type: _type, note: _note, src: _src, maskSrc: _mask, ...props } = u; // never the id, type or the picture itself
      return keepLogoProportions(el, { ...el, ...props }); // a logo is never stretched
    });
  const used = new Set(out.map((el) => String(el.id)));
  for (const a of asList(changes?.add)) {
    if (!a || typeof a !== 'object' || !a.type) continue;
    let id = a.id != null ? String(a.id) : '';
    if (!id || used.has(id)) id = `${a.type}-${uuidv4().slice(0, 8)}`; // keep ids unique
    used.add(id);
    out.push({ ...a, id });
  }
  return JSON.parse(JSON.stringify(out));
}

export interface AiStampGeneratedPayload {
  action?: 'CONVERSATION' | 'SURGICAL_EDIT' | 'GENERATE_NEW' | 'UPDATE_A4_SETTINGS' | 'ADD_A4_COPIES';
  a4Config?: any;
  copies?: number;
  title?: string;
  shape?: 'ROUND' | 'RECTANGULAR' | 'OVAL' | 'SQUARE';
  widthMm?: number;
  heightMm?: number;
  inkColor?: string;
  reply?: string;
  summary?: string;
  suggestedFollowUps?: string[];
  /** the user's request as the AI understood it (spelling fixed) — shown under the message */
  understood?: string;
  /** the user asked to fix the alignment — the editor re-aligns the layout itself */
  doRealign?: boolean;
  /** the user asked to save to the account / download a file — the editor does it */
  doSave?: boolean;
  doExport?: 'pdf' | 'png' | 'svg';
  /** negative stamp (white text on solid ink) / mirrored artwork for engraving — only when asked */
  laserInvert?: boolean;
  laserMirror?: boolean;
  /** plain-language print problems found on the real stamp size */
  printWarnings?: string[];
  /** new designs: professional alternatives with the same texts (the user picks one) */
  variations?: Array<{ label: string; shape: string; widthMm: number; heightMm: number; inkColor: string; elements: any[] }>;
  elements?: any[];
  /** edit patch from the model — merged into `elements` before the reply leaves the server */
  changes?: { update?: any[]; add?: any[]; remove?: any[] };
}

/**
 * Intelligent Stamp Design Heuristic & Gemini AI Engine
 */
export class AiStampService {
  /** Why the last Gemini call failed (for an honest message to the user). */
  private static lastAiFailure: 'quota' | 'busy' | 'other' | null = null;
  /** model → time until which it is skipped (its quota ran out) */
  private static quotaUntil = new Map<string, number>();

  /**
   * Unified Antigravity-Level Agentic Reasoning Processor with Multi-Turn Conversational Memory
   */
  public static async processPrompt(
    prompt: string,
    currentDesign?: any,
    history?: Array<{ role: 'user' | 'model' | 'assistant'; text: string }>,
    viewMode?: string,
    a4Config?: any,
    language?: string
  ): Promise<AiStampGeneratedPayload> {
    const rawPrompt = prompt.trim();
    const geminiKey = process.env.GEMINI_API_KEY;
    const offline = offlineLanguage(language, rawPrompt);

    console.log('💬 request:', JSON.stringify(rawPrompt.slice(0, 100)));
    // development aid: the design the last request was made on (to trace "it didn't change" reports)
    if (process.env.NODE_ENV !== 'production') {
      try {
        const { src: _s, ...lite } = currentDesign || ({} as any);
        const els = (currentDesign?.elements || []).map(({ src: _a, maskSrc: _b, svgPath: _c, ...e }: any) => e);
        require('fs').writeFileSync(require('path').join(require('os').tmpdir(), 'stamiox-last-request.json'), JSON.stringify({ prompt: rawPrompt, at: new Date().toISOString(), design: { ...lite, elements: els } }, null, 1));
      } catch { /* ignore */ }
    }
    // 0. Simple commands the editor carries out itself (shape, alignment, ink) — answered at once
    const instant = instantAnswer(rawPrompt, currentDesign, language);
    if (instant) {
      console.log('⚡ instant answer (no AI):', instant.summary, '←', JSON.stringify(rawPrompt.slice(0, 80)));
      return instant;
    }

    // 1. Try Antigravity-Level Agentic Gemini Engine First (for EVERYTHING: conversation, generation, and editing)
    if (geminiKey) {
      try {
        const hasExistingElements = currentDesign && Array.isArray(currentDesign.elements) && currentDesign.elements.length > 0;
        const geminiResult = await this.callGeminiUnifiedApi(rawPrompt, currentDesign, history, geminiKey, viewMode, a4Config, language);
        console.log("💎 Gemini RAW Result:", geminiResult);
        
        if (geminiResult && geminiResult.reply) {
          // A reply that must be in English letters (English, Manglish, Hinglish…) sometimes picks up a
          // stray letter from another script ("kootي") — remove those
          const replyRule = languageRule(language, rawPrompt).label;
          if (replyRule === 'ENGLISH' || /MIXED WITH ENGLISH/.test(replyRule)) {
            const stray = /[؀-ۿऀ-෿]/g;
            // also plain letters for transliteration marks ("aakkiyiṭṭuṇḍu" → "aakkiyittundu")
            const plain = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
            geminiResult.reply = plain(geminiResult.reply).replace(stray, '').replace(/\s{2,}/g, ' ').trim();
            if (typeof geminiResult.summary === 'string') geminiResult.summary = geminiResult.summary.replace(stray, '').trim();
          }
          // save / export requests: only real values get through
          if (geminiResult.doSave !== true) delete geminiResult.doSave;
          const fmt = String(geminiResult.doExport || '').toLowerCase();
          if (fmt === 'pdf' || fmt === 'png' || fmt === 'svg') geminiResult.doExport = fmt;
          else delete geminiResult.doExport;
          if (typeof geminiResult.laserInvert !== 'boolean') delete geminiResult.laserInvert;
          if (typeof geminiResult.laserMirror !== 'boolean') delete geminiResult.laserMirror;
          // real stamp sizes only (a round stamp is as tall as it is wide)
          sanitizeStampSize(geminiResult);
          if ((geminiResult as any).design && typeof (geminiResult as any).design === 'object') sanitizeStampSize((geminiResult as any).design);
          // "Make it round" on an existing design is a SHAPE CHANGE, never a new stamp: the model
          // sometimes answers it with GENERATE_NEW, which threw the user's design away. The editor
          // converts the design itself (borders, inner rings, text) — the server only passes the shape.
          const hasDesign = !!(currentDesign && Array.isArray(currentDesign.elements) && currentDesign.elements.length);
          const target = hasDesign ? detectShapeChange(rawPrompt, geminiResult.understood) : null;
          // "correct the alignment" / "align properly" / "layout shariyaakku": the editor re-aligns
          // the whole layout with its own rules (frames, top & bottom lines, centre) — no new design
          // Only a request about the WHOLE layout — never a message that just contains "centre" or the
          // Manglish "shari / sheri" (= ok / correct), and never when the AI already made a real edit
          // ("logo centre-il vekku", "sheri, name maattu" must keep the AI's changes)
          const aiEdit = geminiResult.changes && ['update', 'add', 'remove'].some((k) => Array.isArray((geminiResult.changes as any)[k]) && (geminiResult.changes as any)[k].length);
          // the alignment request is recognised from the message OR from how the AI understood it
          // (it decodes typos and Manglish), unless it is about one side ("logo left-il")
          const asksAlign = ALIGN_WORDS.test(rawPrompt) || (typeof geminiResult.understood === 'string' && /\b(?:align\w*|layout|arrange\w*)\b/i.test(geminiResult.understood));
          if (hasDesign && !target && !aiEdit && geminiResult.action !== 'GENERATE_NEW' && asksAlign &&
              !/\b(?:left|right|edath\w*|valath\w*)\b/i.test(rawPrompt)) {
            geminiResult.reply = /[a-z]/i.test(geminiResult.reply || '') && /aakk|akk|cheyy|venam|shari|sheri/i.test(rawPrompt)
              ? 'Done! Alignment shariyaakki.'
              : 'Done! The layout is re-aligned.';
            geminiResult.summary = 'Layout re-aligned';
            geminiResult.action = 'SURGICAL_EDIT';
            (geminiResult as any).doRealign = true;
            delete (geminiResult as any).design;
            delete (geminiResult as any).designBrief;
            delete (geminiResult as any).elements;
            delete geminiResult.changes;
            delete geminiResult.inkColor;
            delete geminiResult.shape;
            delete geminiResult.widthMm;
            delete geminiResult.heightMm;
          }
          if (target) {
            geminiResult.action = 'SURGICAL_EDIT';
            geminiResult.shape = target;
            delete (geminiResult as any).design;
            delete (geminiResult as any).designBrief;
            delete (geminiResult as any).elements;
            // only the shape was asked for: the ink stays unless a colour was named too
            if (!/\b(?:ink|colou?r|red|blue|black|green|violet|purple|brown|orange|pink|navy|neela|chuvapp\w*|karupp\w*|pacha)\b/i.test(rawPrompt)) {
              delete geminiResult.inkColor;
            }
            // keep a size only when the user actually gave one
            if (!/\d\s*(?:mm|x|×)/i.test(rawPrompt)) {
              delete geminiResult.widthMm;
              delete geminiResult.heightMm;
            }
            if (geminiResult.changes && typeof geminiResult.changes === 'object') {
              // the shape change itself needs no element edits; keep only edits that were asked for too
              delete (geminiResult.changes as any).remove;
              delete (geminiResult.changes as any).add;
            }
          }
          // Edits come back as a small "changes" patch (much faster than the model re-writing the
          // whole design) — apply it to the current design so the editor still gets the full list
          // (an ink / size-only edit has no patch: it still returns the current elements, so the
          // editor applies the new ink colour along with them)
          const isEdit = geminiResult.action === 'SURGICAL_EDIT' || (geminiResult.changes && geminiResult.action !== 'GENERATE_NEW');
          if (isEdit && hasExistingElements && !Array.isArray(geminiResult.elements)) {
            geminiResult.elements = applyDesignChanges(currentDesign.elements, geminiResult.changes || {});
            geminiResult.action = 'SURGICAL_EDIT';
          }
          delete geminiResult.changes;
          // Repair / validate what the model returned so the editor always gets drawable elements
          const rawCount = Array.isArray(geminiResult.elements) ? geminiResult.elements.length : 0;
          if (Array.isArray(geminiResult.elements)) {
            geminiResult.elements = normalizeElements(geminiResult.elements, {
              widthMm: geminiResult.widthMm || currentDesign?.widthMm,
              heightMm: geminiResult.heightMm || currentDesign?.heightMm,
            });
          }
          // A chat answer never changes the design
          if (geminiResult.action === 'CONVERSATION' && hasExistingElements) {
            delete geminiResult.elements;
          }
          // An edit that came back empty (or lost elements it can't draw) keeps the current design
          if (geminiResult.action === 'SURGICAL_EDIT' && hasExistingElements && (!geminiResult.elements || geminiResult.elements.length === 0)) {
            delete geminiResult.elements;
          }
          const hasWeirdElements = rawCount > 0 && Array.isArray(geminiResult.elements) && geminiResult.elements.length === 0;

          // New design → the category layout engine builds it exactly. The AI's "design" spec is
          // used; if it forgot it, the spec is read from its one-line brief instead.
          if (geminiResult.action === 'GENERATE_NEW') {
            let spec: any = (geminiResult as any).design;
            // behaviour rule 1: no words on the stamp that the user never gave (e.g. "MAIN BRANCH")
            if (spec && typeof spec === 'object') {
              const said = [rawPrompt, ...(Array.isArray(history) ? history.filter((h) => h.role === 'user').map((h) => h.text || '') : [])].join(' ');
              const dropped = dropInventedTexts(spec, said);
              if (dropped.length) console.log('🧹 dropped invented text:', dropped.join(' | '));
            }
            let built = spec ? buildCategoryDesign(spec) : null;
            if (!built) {
              spec = specFromBrief(String((geminiResult as any).designBrief || ''), rawPrompt);
              built = spec ? buildCategoryDesign(spec) : null;
              if (built) console.log('🏷️ layout from brief (no design spec from the AI)');
            }
            if (built && spec && geminiResult.shape && !spec.shape) spec.shape = geminiResult.shape;
            if (built) {
              // logo stamp: keep the logo already uploaded and centre it in the new seal
              const isLogoStamp = String(spec.category).toLowerCase() === 'logo';
              if (isLogoStamp) placeExistingLogo(built, currentDesign);
              // 2 professional alternatives with the same texts — only ones that pass the print check
              const variations = buildVariations(spec)
                .map((v) => {
                  if (isLogoStamp) placeExistingLogo(v, currentDesign);
                  const checked = withPrintCheck<BuiltDesign & { printWarnings?: string[] }>({ ...v, elements: normalizeElements(v.elements, { widthMm: v.widthMm, heightMm: v.heightMm }) });
                  const inkColor = (spec.inkColor && /^#[0-9a-f]{3,8}$/i.test(spec.inkColor) ? spec.inkColor : null) || v.inkColor;
                  return printCheck(checked.elements!, v.widthMm, v.heightMm, v.shape).length ? null : { label: v.label, shape: v.shape, widthMm: v.widthMm, heightMm: v.heightMm, inkColor, elements: checked.elements! };
                })
                .filter((v): v is NonNullable<typeof v> => !!v);
              const out: AiStampGeneratedPayload = {
                action: 'GENERATE_NEW',
                title: geminiResult.title,
                shape: built.shape,
                widthMm: built.widthMm,
                heightMm: built.heightMm,
                inkColor: (spec.inkColor && /^#[0-9a-f]{3,8}$/i.test(spec.inkColor) ? spec.inkColor : null) || built.inkColor,
                reply: geminiResult.reply,
                summary: geminiResult.summary,
                suggestedFollowUps: geminiResult.suggestedFollowUps,
                understood: geminiResult.understood,
                doSave: geminiResult.doSave,
                doExport: geminiResult.doExport,
                laserInvert: geminiResult.laserInvert,
                laserMirror: geminiResult.laserMirror,
                elements: normalizeElements(built.elements, { widthMm: built.widthMm, heightMm: built.heightMm }),
                variations: variations.length ? variations : undefined,
              };
              console.log('🏷️ category layout:', spec.category, `${built.widthMm}×${built.heightMm}`, `+${variations.length} variations`);
              return withPrintCheck(out);
            }
          }

          // Force handover to Neural Engine if it's a completely new design or hallucinated element types
          if (geminiResult.action === 'GENERATE_NEW' || (!hasExistingElements && geminiResult.elements && geminiResult.elements.length > 0) || hasWeirdElements) {
            console.log("💎 Gemini triggered GENERATE_NEW or hallucinated geometry, handing over to Neural CAD Engine...");
            // Run neural engine to generate perfect geometry based on Gemini's derived shape & properties
            // Build from the AI's clean brief (it gathers the texts from the whole conversation and
            // drops chat words) — the raw message alone may be just "seri, undakku" or miss details
            const brief =
              typeof (geminiResult as any).designBrief === 'string' && (geminiResult as any).designBrief.trim().length > 3
                ? (geminiResult as any).designBrief.trim()
                : rawPrompt;
            console.log('🧾 design brief:', brief);
            const neuralFallback = this.heuristicSemanticGenerator(
              brief,
              brief.toLowerCase(),
              offline,
              geminiResult.shape,
              geminiResult.inkColor,
              geminiResult.widthMm,
              geminiResult.heightMm
            );
            // The engine keeps the brief's label ("doctor :", "COMPANY :") on the first line —
            // strip it, so only the real texts end up on the stamp
            const colon = brief.indexOf(':');
            if (colon > 0 && Array.isArray(neuralFallback.elements)) {
              const labelWords = new Set(brief.slice(0, colon).toLowerCase().split(/[^a-z]+/).filter(Boolean));
              for (const el of neuralFallback.elements) {
                if (typeof el?.text !== 'string') continue;
                el.text = el.text.replace(/^\s*([A-Za-z][A-Za-z\s]*?)\s*(?::|-|–|for)\s+/, (whole: string, words: string) =>
                  words.toLowerCase().split(/\s+/).every((w: string) => labelWords.has(w)) ? '' : whole
                );
              }
              neuralFallback.elements = neuralFallback.elements.filter((el: any) => typeof el?.text !== 'string' || el.text.trim());
            }
            // Inject Gemini's reply, title, inkColor, and shape choices into the neural output
            neuralFallback.reply = geminiResult.reply;
            if (typeof geminiResult.understood === 'string') neuralFallback.understood = geminiResult.understood;
            if (geminiResult.doSave) neuralFallback.doSave = true;
            if (geminiResult.doExport) neuralFallback.doExport = geminiResult.doExport;
            if (geminiResult.title) neuralFallback.title = geminiResult.title;
            if (geminiResult.shape) neuralFallback.shape = geminiResult.shape;
            if (geminiResult.inkColor) neuralFallback.inkColor = geminiResult.inkColor;
            if (geminiResult.widthMm) neuralFallback.widthMm = geminiResult.widthMm;
            if (geminiResult.heightMm) neuralFallback.heightMm = geminiResult.heightMm;
            if (typeof geminiResult.laserInvert === 'boolean') neuralFallback.laserInvert = geminiResult.laserInvert;
            if (typeof geminiResult.laserMirror === 'boolean') neuralFallback.laserMirror = geminiResult.laserMirror;
            return withPrintCheck(neuralFallback); // a new design: all of its problems
          }

          return withPrintCheck(geminiResult, currentDesign); // Return Gemini's dynamic response (which contains elements and intelligent reply)
        }
      } catch (err) {
        console.warn('Gemini Unified API fallback to Neural Engine:', err);
      }
    }

    // 2. FALLBACK: If Gemini API fails (or Rate Limit hit), fallback to Regex heuristics
    if (this.isConversationalPrompt(rawPrompt)) {
      // The AI is set up but didn't answer (Google busy / limit): the canned answers don't fit the
      // question, so say simply that the AI is busy. Canned answers are only for setups with no AI.
      if (geminiKey) {
        const manglish = offline === 'MANGLISH';
        const quota = this.lastAiFailure === 'quota';
        return {
          action: 'CONVERSATION',
          reply: manglish
            ? quota
              ? 'Sorry, AI limit ippol theernnu. Oru minute kazhinju chodikkamo?'
              : 'Sorry, AI ippol busy aanu. Onnu koodi chodikkamo?'
            : quota
            ? 'Sorry, the AI limit is reached for now. Please ask again in a minute.'
            : 'Sorry, the AI is busy right now. Please ask again.',
          summary: 'AI busy',
          suggestedFollowUps: [],
        };
      }
      return this.handleConversationalReply(rawPrompt, currentDesign, offline);
    }

    // Editing an existing design needs the real AI: the offline rules guessed wrong (removed the
    // wrong border, pasted the whole sentence as text). Never touch the design without it —
    // say clearly why, in the user's language, and leave everything as it is.
    if (currentDesign && currentDesign.elements && currentDesign.elements.length > 0) {
      const manglish = offline === 'MANGLISH';
      const quota = this.lastAiFailure === 'quota';
      return {
        action: 'CONVERSATION',
        reply: manglish
          ? quota
            ? 'Sorry, AI-yude ippozhathe limit theernnu. Oru minute kazhinju onnu koodi try cheyyamo? Design-il onnum maattiyittilla.'
            : 'Sorry, AI ippol busy aanu — ee change ippol cheyyan pattiyilla. Onnu koodi try cheyyamo? Design-il onnum maattiyittilla.'
          : quota
          ? "Sorry — the AI usage limit has been reached for the moment. Please try again in about a minute. Your design has not been changed."
          : "Sorry — the AI service is busy right now, so I couldn't make that change. Please try again in a moment. Your design has not been changed.",
        summary: 'No changes made',
        suggestedFollowUps: [],
      };
    }
    // Office stamps (PAID / RECEIVED / APPROVED…) are recognised and built properly even without the AI
    const officeSpec = offlineSpec(rawPrompt);
    const officeBuilt = officeSpec ? buildCategoryDesign(officeSpec) : null;
    if (officeBuilt) {
      const manglish = offline === 'MANGLISH';
      return withPrintCheck<AiStampGeneratedPayload>({
        action: 'GENERATE_NEW',
        title: `${officeSpec!.statusWord} stamp`,
        shape: officeBuilt.shape,
        widthMm: officeBuilt.widthMm,
        heightMm: officeBuilt.heightMm,
        inkColor: officeBuilt.inkColor,
        reply: manglish ? `${officeSpec!.statusWord} stamp ready aakkittund!` : `Done! Here is your ${officeSpec!.statusWord} stamp.`,
        summary: `${officeSpec!.statusWord} office stamp`,
        suggestedFollowUps: [],
        elements: normalizeElements(officeBuilt.elements, { widthMm: officeBuilt.widthMm, heightMm: officeBuilt.heightMm }),
      });
    }
    // AI not available for a new stamp: read the stamp type and its texts from the message itself
    // ("oval seal for KERALA BANK LTD, TRIVANDRUM" / "doctor stamp: DR. ANU, MBBS, REG 45213") and
    // build it with the same layout engine as an AI design — properly aligned, only the user's words
    {
      const p = rawPrompt.replace(/\s+/g, ' ').trim();
      const m = p.match(/^(.*?\b(?:seal|stamp)\b[^,:]*?)(?:\s*:\s*|\s+for\s+)(.+)$/i);
      const brief = m ? `${m[1]}: ${m[2]}` : '';
      const spec = brief ? specFromBrief(brief, p) : null;
      const built = spec ? buildCategoryDesign(spec) : null;
      if (built) {
        const manglish = offline === 'MANGLISH';
        return withPrintCheck<AiStampGeneratedPayload>({
          action: 'GENERATE_NEW',
          title: (spec!.topText || (spec!.lines || [])[0] || 'Stamp').slice(0, 40),
          shape: built.shape,
          widthMm: built.widthMm,
          heightMm: built.heightMm,
          inkColor: built.inkColor,
          reply: manglish ? 'Stamp ready aakkittund! Ishtamullath maattaan parayoo.' : 'Here is your stamp. Tell me anything you would like to change.',
          summary: 'New stamp',
          suggestedFollowUps: [],
          elements: normalizeElements(built.elements, { widthMm: built.widthMm, heightMm: built.heightMm }),
        });
      }
    }
    return this.heuristicSemanticGenerator(rawPrompt, rawPrompt.toLowerCase(), offline);
  }

  /**
   * Detect purely conversational chit-chat, greetings, questions, feedback & general inquiries
   */
  private static isConversationalPrompt(prompt: string): boolean {
    const clean = prompt.trim().toLowerCase();

    // 1. Question Mark
    if (clean.includes('?')) return true;

    // 2. Interrogative Words in Malayalam & Manglish
    // enth, entha, enthanu, enthaanu, eth, ethu, ethanu, ethaanu, engane, enganeya, eppol, evide, aano, ano, undo, pattumo, cheyyumo, parayamo, parayumo, nallath, nallathu, nallatha, ethra, enthokke, enthinaanu, type, format, venam, upayogikkam
    const isManglishQuestion = /\b(?:enth|entha|enthanu|enthaanu|eth|ethu|ethanu|ethaanu|engane|enganeya|eppol|evide|aano|ano|undo|pattumo|cheyyumo|parayamo|parayumo|nallath|nallathu|nallatha|ethra|enthokke|enthinaanu|options|suggest|recommend|explain|parayu|para|type|format|aano|venam|aavashyam|cherunnath)\b/i.test(clean);
    if (isManglishQuestion) return true;

    // 3. Interrogative Words in English
    const isEnglishQuestion = /\b(?:what|which|how|why|when|where|is\s*it|can\s*you\s*(?:suggest|tell|explain|recommend)|should\s*i|recommend|advice|suggestion|what\s*type|which\s*type|best\s*type|what\s*kind|difference)\b/i.test(clean);
    if (isEnglishQuestion) return true;

    // 4. Greetings
    if (/\b(?:hi|hyy|hey|hello|helo|hii|hai|hola|namaskaram|sugam|sugamano|halo|yo|good\s*(?:morning|evening|afternoon)|machane|bro|dude)\b/i.test(clean)) {
      return true;
    }

    // 5. Appreciation & acknowledgments
    if (/\b(?:thanks|thank\s*you|nanni|super|kollam|adipoli|polichu|nalla\s*design|ok|okay|shari|sure|fine|cool|great|nice|perfect|wow|valare\s*nannayi)\b/i.test(clean)) {
      return true;
    }

    // 6. Feedback / System instructions
    if (clean.includes('manushyan') || clean.includes('think') || clean.includes('reply') || clean.includes('parayunne') || clean.includes('undrstand') || clean.includes('planning')) {
      return true;
    }

    return false;
  }

  /**
   * Generate intelligent, friendly, human-designer conversational responses while preserving canvas
  */
  private static handleConversationalReply(prompt: string, currentDesign?: any, language?: string): AiStampGeneratedPayload {
    const clean = prompt.trim().toLowerCase();
    
    // Explicit Language Override
    const isExplicitEnglish = language === 'ENGLISH' || (!language && !/\b(?:aaku|aakku|maattu|maatti|cheyyu|nokk|venam|chuvapp|pacha|vattam|chathuram|katti|idumo|para|ini|ith|sugam|enthokke|nanni|kollam|adipoli|ethra|nallath|aano|machane)/i.test(prompt));
    const isManglish = language === 'MANGLISH' || (!isExplicitEnglish && language !== 'MALAYALAM');

    const existingElements = Array.isArray(currentDesign?.elements) ? JSON.parse(JSON.stringify(currentDesign.elements)) : [];
    const shape = currentDesign?.shape || 'ROUND';
    const widthMm = currentDesign?.widthMm || 42;
    const heightMm = currentDesign?.heightMm || 42;
    const inkColor = currentDesign?.inkColor || '#003399';

    let reply = isManglish 
      ? `Hyy! Njan Clixio AI, ningalude stamp design assistant. Enthanu njan cheyyendath?`
      : `Hello! I'm Clixio AI, your stamp design assistant. How can I help with your design?`;

    // 0. How are you / Wellbeing
    if (clean.includes('how are you') || clean.includes('how r u') || clean.includes('how are u') || clean.includes('sugamano') || clean.includes('sugam') || clean.includes('vishesham')) {
      reply = isManglish
        ? `Njan adipoli aayi irikkunnu, chodichathil santhosham! Ningalkku enthokke und vishesham? Innu namukku enthu stamp aanu design cheyyendath? Parayoo!`
        : `I'm doing great, thank you for asking! How are you doing? Tell me what kind of stamp you'd like to create today, and I'll design it for you!`;
    }
    // 1. User feedback on AI personality / intelligence / planning
    else if (clean.includes('manushyan') || clean.includes('think') || clean.includes('undrstand') || clean.includes('parayunne') || clean.includes('planning')) {
      reply = isManglish
        ? `Njan manassilakki! Ini muthal chinthichu matrame reply tharoo. Veruthe blind aayi stamp create cheyyilla, ningalude requirement discuss cheythu nalla standard-il suggest cheyyam. Parayoo, enthanu namukku cheyyendath?`
        : `Understood! I will analyze and consult with you thoughtfully before creating or modifying any design. Tell me your project details!`;
    }
    // 2. Agency Consultation (Travels / Marketing / Manpower / Tech / Real Estate Agency)
    else if (clean.includes('agency')) {
      reply = isManglish
        ? `Oru Agency-kku standard aayi 2 main types stamps aanu use cheyyarullath:\n1. 🔵 42mm Round Official Seal: Agency Name, Reg No, Center-il Emblem, Authorized Signatory — official agreements & contracts-inu.\n2. 🟦 47x18mm Rectangular Stamp: 'For [Agency Name]', 'Authorized Signatory / Managing Partner' — daily bills & invoice signing-inu.\n\nNingalude Agency-ude name enthaanu? Paranjaal njan match aayath super aayi design cheythu tharaam!`
        : `For an Agency, two stamp types are industry standards:\n1. 42mm Round Seal (with agency name, emblem, and registration details for agreements)\n2. 47x18mm Rectangular Stamp ('For Agency Name, Authorized Signatory' for daily bill signing).\nWhat is your agency's name? I can design it right away!`;
    }
    // 3. Shop / Store / Retail Consultation
    else if (clean.includes('shop') || clean.includes('store') || clean.includes('bakery') || clean.includes('hotel') || clean.includes('restaurant')) {
      reply = isManglish
        ? `Shops & Commercial Stores-inu standard aayi 2 types stamps aanu use cheyyarullath:\n1. 🟦 50x20mm Rectangle Stamp: Shop Name, Address, GSTIN & Phone No — bills & invoices-il print cheyyan.\n2. 🔵 38mm Round Stamp: Center-il 'PAID' / 'DELIVERED' or Shop Logo — cash receipt stamping-inu.\n\nNingalude shop name & location paranjal njan neat aayi design cheythu tharaam!`
        : `For Shops and Stores, two stamps are standard:\n1. 50x20mm Rectangular Address/GSTIN stamp for bills\n2. 38mm Round 'PAID' or Logo seal for receipts.\nTell me your shop name to design it!`;
    }
    // 4. Company / Firm Consultation
    else if (clean.includes('company') || clean.includes('firm') || clean.includes('business')) {
      reply = isManglish
        ? `Oru Company-kku official aayi 42mm Round Double Border seal (contracts & legal papers-inu) or 55x35mm Oval Stamp (Directors/Partners signing-inu) aanu best. Ningalude Company Name parayoo, njan live aayi CAD layout create cheyyam!`
        : `For a Company, a 42mm Round double-border seal or a 55x35mm Oval Director signature stamp is the standard. Tell me your company name and I will craft the design!`;
    }
    // 5. Greetings & Warm Human Check-in
    else if (/(?:hi|hyy|hey|hello|helo|hii|hai|hola|namaskaram|good\s*morning|good\s*evening)/i.test(clean)) {
      reply = isManglish
        ? `Hyy! Njan Clixio AI — ningalude professional stamp designer. Enthanu njan cheyyendath? Doctor, Hospital, Notary, School, atho Company seal aano create cheyyendath? Paranjoloo, njan manassilakki design cheythu tharaam!`
        : `Hello! I'm Clixio AI, your dedicated stamp designer. What kind of stamp would you like to craft today? Tell me the organization or person's name, and I'll design a precision vector layout for you!`;
    }
    // 5. Appreciation & Feedback
    else if (/^(?:thanks|thank|nanni|super|kollam|adipoli|polichu|ok|okay|shari|perfect|wow|valare)/i.test(clean)) {
      reply = isManglish
        ? `Valare nanni! ❤️ Design ningalkk ishtapettathil santhosham. Ippolulla design-il enthenkilum text maattano, border katti koottano, atho ink color (Red, Green, Black) aakano? Paranjal thalsamayam update cheyyam.`
        : `You're very welcome! I'm glad you love the layout. If you need any fine-tuning (text tweaks, border thickness, ink color, or adding stars), just let me know!`;
    }
    // 6. General Shape Advice ('eth type', 'ethu shape', 'nallath')
    else if (clean.includes('nallath') || clean.includes('better') || clean.includes('recommend') || clean.includes('suggest') || clean.includes('which shape') || clean.includes('ethu shape') || clean.includes('enth type') || clean.includes('eth type')) {
      reply = isManglish
        ? `Stamps standard aayi 3 main types und:\n1. 🔵 42mm Round: Official Seals, Govt, Notary, Institutions\n2. 🟦 47x18mm Rectangle: Doctor Rx, Company Signatory, Address & GST\n3. 🥚 55x35mm Oval: MD / Director Signature Seals\n\nNingalude requirement enthaannu paranjaal athinu match aayath njan recommend cheythu design cheyyam!`
        : `Stamps generally follow 3 standard formats:\n1. 42mm Round: Official Seals & Organizations\n2. 47x18mm Rectangle: Doctor Rx & Signature Stamps\n3. 55x35mm Oval: Executive & Director Seals\nTell me your purpose and I'll craft the ideal stamp for you!`;
    }
    // 7. Doctor Stamps
    else if (clean.includes('doctor') && (clean.includes('size') || clean.includes('ethra') || clean.includes('format'))) {
      reply = isManglish
        ? `Doctor stamps-inu standard aayi 47x18mm or 50x20mm Rectangular format aanu use cheyyarullath (Colop Pocket Stamp 20 or Trodat Printy 4911). Doctor-ude Name, MBBS/MD, Reg No എന്നിവ 3 lines aayi neatly arrange cheyyam. Njan ith create cheyyano?`
        : `For Doctor stamps, the standard is 47x18mm or 50x20mm Rectangular casing (like Colop Pocket 20 or Trodat 4911) with Doctor Name, Degree, and Medical Council Reg No. Would you like me to generate one?`;
    }
    // 8. Notary / Advocate Seals
    else if (clean.includes('notary') || clean.includes('advocate') || clean.includes('vakkil')) {
      reply = isManglish
        ? `Notary / Advocate seals-inu 42mm or 45mm Round Double Border Seal aanu legal standard. Center-il 'ADVOCATE & NOTARY' or Emblem, Top-il Name, Bottom-il Registration District. Ningalude Details parayoo, njan set aakkam!`
        : `For Notary & Advocate seals, the legal standard is a 42mm Round double-border layout. What is the advocate's name and registration jurisdiction?`;
    }
    // 9. General Capabilities / Help
    else {
      reply = isManglish
        ? `Njan oru human designer pole think cheyth ningalude aavashyangal CAD precision-ode design cheyyunnu. Round, Oval, Rectangle, Square layouts, custom texts, ink colors, stars, emblems ellam thalsamayam create cheyyam!`
        : `I design precision vector rubber stamps tailored to your exact industry standards. Ask me to create any stamp or modify existing texts, ink colors, borders, and emblems!`;
    }

    return {
      action: 'CONVERSATION',
      shape,
      widthMm,
      heightMm,
      inkColor,
      elements: existingElements,
      reply,
      summary: reply,
      suggestedFollowUps: isManglish
        ? ['Create Round Notary Seal', 'Create Doctor Stamp (47x18mm)', 'Make Ink Red']
        : ['Create 42mm Round Notary Seal', 'Make Doctor Prescription Stamp', 'Change Ink to Navy Blue'],
    };
  }

  public static async generateFromPrompt(
    prompt: string,
    currentDesign?: any,
    history?: Array<{ role: 'user' | 'model' | 'assistant'; text: string }>,
    viewMode?: string,
    a4Config?: any,
    language?: string
  ): Promise<AiStampGeneratedPayload> {
    return this.processPrompt(prompt, currentDesign, history, viewMode, a4Config, language);
  }

  public static async refineElements(
    prompt: string,
    currentDesign: any,
    history?: Array<{ role: 'user' | 'model' | 'assistant'; text: string }>,
    language?: string
  ): Promise<AiStampGeneratedPayload> {
    return this.processPrompt(prompt, currentDesign, history, undefined, undefined, language);
  }

  /**
   * Gemini 3.6 Flash & Flash Latest Agentic API Caller
   */
  private static async callGeminiUnifiedApi(
    prompt: string,
    currentDesign: any,
    history: Array<{ role: 'user' | 'model' | 'assistant'; text: string }> | undefined,
    apiKey: string,
    viewMode?: string,
    a4Config?: any,
    language?: string
  ): Promise<AiStampGeneratedPayload | null> {
    const models = ['gemini-3.6-flash', 'gemini-flash-latest'];

    const hasExistingElements = currentDesign && Array.isArray(currentDesign.elements) && currentDesign.elements.length > 0;

    const systemInstruction = `You are Clixio AI, an expert commercial rubber-stamp designer (seals, self-inking / pre-inked, office, signature, address, logo stamps). Turn the user's instructions into accurate, balanced, print-ready stamp designs. Reply ONLY with valid JSON (no markdown). Talk like a friendly specialist to a shop owner: short, plain, practical.

NON-NEGOTIABLE RULES (override everything below):
1. No decoration the user didn't ask for (stars, icons, dashed rings, filler words like "ESTD.", "OFFICIAL SEAL"). Only what a category needs (double border on a seal, separator stars between top and bottom text). Never invent texts.
2. Readability over decoration: when space is short drop decoration first, then shorten / shrink text.
3. Never distort an uploaded logo: same factor for width and height, keep its centre; never stretch, crop or redraw.
4. Real stamp sizes: round 25–50 mm (width = height), rectangular ~38×14 to 80×45, oval ~40×25 to 60×40. Change the stamp size only when asked.
5. Text must fit its place (smaller, condensed font, or split a long line); nothing touches a border or leaves the stamp.
6. Texts for the stamp missing (company / person name, address, reg. no.)? Do NOT use placeholders: action "CONVERSATION", ask for what is missing in one short message (max 3 items). Style details (font, border, layout, size) you decide yourself.
7. Use the category's professional layout; "suggestedFollowUps" = category-appropriate next steps (seal → "Add GST number", address stamp → "Add phone number").
8. For every new design ALWAYS return the "design" spec (the server builds alternative styles from it).
9. Lines ≥ 0.3 mm (0.5+ preferred), text ≥ 2 mm (≥ 3 mm for negative text). If asked for less, use the minimum and say so briefly.
10. Check it as a real stamp: one ink colour, no gradients, gaps ≥ 0.5 mm (text ↔ border ≥ 1 mm), nothing outside, readable at real size. If it can't be made well, say so in one line with the fix.

USER'S EXACT WORDS FIRST: texts (word for word, only obvious misspellings of ordinary words fixed), sizes, shape, ink, fonts, positions, what to add / remove — do exactly that, even against your own taste. Your expertise only fills what they didn't say. Change ONLY what was asked. Exception: print minimums (rule 9 / 5).

UNDERSTAND IMPERFECT MESSAGES (typos, short forms, voice typing, Manglish mixed with English) — work out the meaning, never ask to rephrase when it's reasonably clear: "boder thikr aakku" = border thicker, "ovel shap" = oval, "colr red" = ink red, "txt bigr" = text bigger, "adress" = address. On-stamp text: fix clear misspellings of ordinary words (HOSPTAL → HOSPITAL, LIMTED → LIMITED, GOVERMENT → GOVERNMENT) and mention it; NEVER change names, brands, numbers or codes. Always return "understood": the request as one short correct English sentence.

FOLLOW THE CONVERSATION: the new message is usually a follow-up. "it / that / this / same / again / more / athu / ithu / onnu koodi / kurachu koode" = what was just discussed or changed (after a top-text change, "make it bigger" = that text's size, NOT the stamp size). After you gave advice or options, "ok / yes / do it / seri / cheyyu / athu mathi / the first one" = do it now with the details given earlier. Combine details given over several messages. "Undo / go back / pazhaya pole" = reverse your last change. Change widthMm / heightMm only when the user talks about the stamp size.

SPECIALIST KNOWLEDGE:
- What each stamp needs: company seal → registered name on top curve, city / state on bottom curve, optional GST / CIN / reg. no. or logo in the centre; doctor → name, qualification (MBBS, MD), reg. no.; notary → name, "NOTARY", commission details; school / institution → name, place, post (Principal, Office); address → name, address, PIN, phone; signatory → "For <COMPANY>", blank signing space, "Authorised Signatory". Point out important missing details.
- Categories: COMPANY SEAL round 38–45 mm (40 usual) or oval for banks / premium, double border, stars between top and bottom text, blue / violet ink. BUSINESS (rectangular): name (biggest, bold), address with PIN, phone, email, GST, website; max ~6 lines ≥ 2 mm, thin border. SIGNATURE: signatory block (no heavy border) or an uploaded signature cleaned as a logo (simplify 1, smooth 2, thickness +1 if thin; never redraw it). LOGO STAMP: uploaded logo large in the centre (35–45% of inner circle), name on top curve; no logo on canvas → design the seal and ask them to upload it (Logo button). OFFICE (APPROVED, PAID, RECEIVED, URGENT, CONFIDENTIAL, COPY…): rectangular, bold double border, big heavy condensed word, optional DATE / SIGN lines; ink by meaning: PAID / REJECTED / URGENT / CONFIDENTIAL red, APPROVED / VERIFIED green, RECEIVED / DISPATCHED / ENTERED blue (unless a colour is named).
- Stamp types: traditional rubber (cheapest, any size, low use), self-inking (Trodat / Colop; best for daily office use), pre-inked / flash (sharpest, premium seals and logos). Shapes: round = seals; square = logos / QR / monograms 20–40 mm; rectangular = address / signature / office / doctor, ~47×18–58×22; oval = premium / bank / director, ~50×30–55×35. Which to buy: daily office → self-inking; sharp premium → pre-inked; cheapest / large → rubber.
- Vague request: decide the STYLE yourself like an expert, say briefly what you chose, give 2–3 follow-ups. Missing TEXTS → ask (rule 6). Just "school" → suggest Principal / Office / Admission seal and ask for name and place.
- Ink: blue / violet official, black general, red for status words.
- One ink only, artwork is black & white (photos only as "dots"). Negative = solid ink with blank letters (short text, letters ≥ 3 mm): "negative / white text on black" → "laserInvert": true, "normal / positive" → false. Keep small holes (A, B, O, R, logo gaps) open. Small stamps (≤ 30 mm): fewer words, simpler logos.
- Mirror: only when the user engraves the rubber on their OWN laser → "laserMirror": true. Files for a stamp shop, proofs, PDFs → false ("mirror before sending to the shop?" → NO). Set laserInvert / laserMirror only when asked.

LAYOUT (W, H = stamp size, centre = W/2, H/2):
- Rings, curved text and seal parts centred exactly; middle text x = W/2, align "center". Off-centre only if asked.
- Pairs (stars) mirrored: same height, same distance from the centre. Top and bottom curved text: same radius, same size.
- Round seals: outer border radius ≈ min(W,H)/2 − 0.8; text 1–1.2 mm inside the neighbouring ring; equal gaps outer ring → text → inner ring. Rectangular: ≥ 1.5 mm from the border.
- Round seal: name top curve, place bottom curve, 1–3 short middle lines (2 lines at H/2 ± gap/2, 3 at H/2 − gap, H/2, H/2 + gap). Rectangular: lines stacked and vertically centred, name on top, spacing ≈ 1.3 × text size.
- Borders: outer 0.8–1.2 mm, inner 0.4–0.6, gap 0.8–1.5; dashed / dotted only as decoration.
- Logo: round → centre, 35–45% of the inner circle, existing middle text moved just below it (never deleted); rectangular → left square area with text to the right (or centred on top). Never over text or a border.
- After any edit keep the balance: new parts in symmetric spots, re-centre what's left after a removal.

TYPOGRAPHY (only these fontFamily values):
- Companies: "Montserrat, Arial, sans-serif" (default), "'Plus Jakarta Sans', Montserrat, sans-serif", "'Poppins', sans-serif". Official / legal / notary: "'Cinzel', Georgia, serif", "'Playfair Display', Georgia, serif". Condensed (long names, narrow stamps): "'Oswald', Arial, sans-serif", "'Barlow Condensed', sans-serif", "'Bebas Neue', Impact, sans-serif" (capitals). Script (short name / title only): "'Great Vibes', cursive". Malayalam: "'Noto Sans Malayalam', sans-serif", "'Manjari', sans-serif", "'Baloo Chettan 2', sans-serif"; Hindi "'Noto Sans Devanagari', sans-serif"; Tamil "'Noto Sans Tamil', sans-serif".
- Hierarchy: name biggest + bold; second line ~75% normal; details ~60%. Max 2 families. Text under 3 mm: clean sans only. A "font style" change applies to names / headings; detail lines (GST, phone, reg. no.) stay clean sans.
- Letter spacing: curved capitals 0.2–0.6, long names 0–0.15, straight 0–0.2, never negative. Curved text: top isReversed false, bottom true; leave a gap or star where they meet; too long → smaller or condensed, never squeezed.
- Malayalam text MUST use a Malayalam font, ~10–15% larger than English, letterSpacing 0–0.1.

LOGOS (uploaded logos are "image" elements; the editor re-traces them from your settings):
- "stamp-friendly / simple / clean / remove small details" → "simplify": 2 (3 very busy), "smooth": 1. "Lines too thin / faint / bolder" → "thickness": +1 (max +2). "Too heavy / blobby" → "thickness": -1 or "simplify": 1 + lower "threshold". "More / less should print, too light / dark" → "threshold" ± 20–30. Photo-like / shaded → "style": "dots" or "outline"; white logo on dark → "invert": true.
- "Remove the background / background venda", logo on a coloured box or photographed on paper → "removeBg": true; "keep the background" → false.
- Under ~8 mm wide fine details vanish: suggest bigger or more simplify. You can't redraw or replace the picture; a new logo is uploaded with the Logo button.

SAVE / EXPORT (only when really asked): "save / save cheyyu / store it" → "doSave": true. "export / download / pdf / png / svg / file venam / print file" → "doExport" = the format named ("print" → "pdf"; none named → "svg" for laser, else "pdf"). Works with any action ("make ink red and save" = the edit AND doSave; "export as png" alone = CONVERSATION + doExport). One short reply line.

LANGUAGE: reply in the user's exact language and style — English → English; Manglish (Malayalam in Latin letters) → natural friendly Manglish ("set aakkam", "adipoli"); Malayalam script → Malayalam script; Hindi / Tamil / Telugu / Kannada / Bengali or their English-mixed forms → that language and style. The [LANGUAGE REQUIREMENT] line is binding. Never force Manglish on English or English on Manglish.

REPLY STYLE: after an edit / new design ONE short sentence (~15 words) saying what changed ("Done! The border is thicker now." / "Done! Ink red aakki."). Plain words: "border", "top text", "bottom text", "middle text", "text size" — never "stroke width", "arc text", "vector", "element", "radius", "surgical". No praise or filler, no explanations unless asked. Questions / advice: answer first, max 3 short lines (~40 words), and never change the canvas for a question. "summary" max 6 words; "suggestedFollowUps" 2–3 items of 2–4 simple words.

EDITING (canvas NOT empty) — existing elements are ground truth:
- Never re-generate, delete or randomize what wasn't asked. Return ONLY a "changes" patch (the server applies it; omit empty lists):
  "changes": { "update": [ { "id": "<existing id>", ...only changed props } ], "add": [ { full new element, new id } ], "remove": [ "<id>" ] }
- Examples: "change official to rashad" → update that text's "text": "RASHAD". "make ink red" → root "inkColor": "#990000", no changes. "add two stars" → add two star clipart, left and right. "make border thicker" → update the outer ring "strokeWidth": 1.2. "remove the stars" → remove their ids.
- SHAPE CHANGE ("make it round", "square aakku", "oval shape venam", "change to rectangle") → action "SURGICAL_EDIT", root "shape": "ROUND" | "OVAL" | "SQUARE" | "RECTANGULAR", widthMm / heightMm only if a size was given, NO changes — the editor converts the whole design. Never GENERATE_NEW for a shape change.
- "make the stamp 45 mm" → root "widthMm": 45, "heightMm": 45 (round / square), no changes — the editor rescales.
- Match referenced text case-insensitively ("kerala" = "KERALA"); keep UPPERCASE style. "top text" = arc-text isReversed false, "bottom text" = isReversed true, "middle text" = type "text"; "outer border" = largest ring, "inner ring" = smaller. Use exact ids. Only claim changes you actually made; unclear → ask (CONVERSATION). CONVERSATION carries neither elements nor changes.

NEW STAMP (canvas empty, or the user clearly asks for a new / different stamp or business) → "GENERATE_NEW". Don't output elements. Return:
- "design": { "category": "company_seal" | "business" | "signature" | "office" | "logo" | "other", "shape": "ROUND" | "OVAL" | "RECTANGULAR", "widthMm" / "heightMm" (only if given), "inkColor" (only if asked); seals / logo: "topText", "bottomText", "centerLines" (max 3); business: "lines" [name, address, phone, email, GST, website]; signature: "forText", "designation"; office: "statusWord", "withDate", "withSignature", "extraLine"; and your style decisions: "fontStyle": "modern" (companies, shops) | "classic" (government, legal, notary, schools, temples) | "condensed" (very long names), "border": "double" (seals) | "single" (business, address, signature) | "dotted" | "serrated" (notary, official, vintage) | "none", "decoration": "stars" (seals) | "none". A font / border / style the user named wins. Exact texts only, no chat words.
- "designBrief": one clean English line with the stamp type and ALL exact texts from this and earlier messages, e.g. "Round company seal: SUNRISE BAKERY, KOCHI, GST 32ABCDE1234F1Z5".
- Category from the request: "GST, address, phone stamp" → business; "PAID stamp" → office; "company / common seal" → company_seal; "sign stamp for my company" → signature.

A4 SHEET (viewMode "A4_SHEET"): A4 settings ("laser invert on", "mirror the sheet", "crop marks on aakku", "cut lines off") → action "UPDATE_A4_SETTINGS" with the full "a4Config" (current one with the requested booleans toggled). "10 copies", "add 5 stamps", "auto pack 20" → "ADD_A4_COPIES" with "copies". No elements for either. Design changes in A4 view are normal edits.

${ELEMENT_SCHEMA}

OUTPUT (strict JSON, include only the fields that apply):
{
  "action": "CONVERSATION" | "SURGICAL_EDIT" | "GENERATE_NEW" | "UPDATE_A4_SETTINGS" | "ADD_A4_COPIES",
  "reply": "in the user's language",
  "summary": "max 6 words",
  "understood": "the request as one short correct English sentence",
  "suggestedFollowUps": ["2–4 words", "..."],
  "changes": { "update": [], "add": [], "remove": [] },
  "title": "Stamp title", "shape": "...", "widthMm": 0, "heightMm": 0, "inkColor": "#hex",
  "design": { ... }, "designBrief": "...",
  "a4Config": { "laserInvert": false, "laserMirror": false, "showCropMarks": false, "showCutLines": false }, "copies": 0,
  "doSave": true, "doExport": "pdf" | "png" | "svg", "laserInvert": true, "laserMirror": true
}`;

    const formattedContents: any[] = [];

    // Add previous multi-turn conversation memory if present — the new message is usually a
    // follow-up to these turns (short texts, so 10 turns cost little time)
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6); // the last 3 exchanges carry the context; fewer tokens = faster reply
      // an older client also sent the new message as the last history turn — don't send it twice
      const last = recentHistory[recentHistory.length - 1];
      if (last && last.role === 'user' && (last.text || '').trim() === prompt.trim()) recentHistory.pop();
      for (const msg of recentHistory) {
        if (!msg.text) continue;
        const cleanText = msg.text.replace(/kadeeja/gi, 'Clixio').replace(/euyra/gi, 'Clixio').replace(/inkora/gi, 'Clixio');
        const role = msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user';
        const prev = formattedContents[formattedContents.length - 1];
        // keep user / model turns alternating: merge two turns in a row from the same side
        if (prev && prev.role === role) prev.parts[0].text += `\n${cleanText}`;
        else formattedContents.push({ role, parts: [{ text: cleanText }] });
      }
      // the conversation must start with the user
      while (formattedContents.length && formattedContents[0].role === 'model') formattedContents.shift();
    }

    // Which language to reply in: a chosen Indian language (script or English-mixed), English, or Auto Detect
    const rule = languageRule(language, prompt);
    const detectedLanguage = rule.label;
    const languageInstruction = rule.instruction;

    // the previous message got no answer (AI was busy): keep turns alternating
    if (formattedContents.length && formattedContents[formattedContents.length - 1].role === 'user') {
      formattedContents.push({ role: 'model', parts: [{ text: '(I could not answer that message — the AI was busy.)' }] });
    }

    // What "it" / "that" / "athu" most likely means: the elements the AI changed last time, or the
    // ones selected on the canvas (sent by the editor; not part of the design itself)
    const { lastChangedIds, selectedIds, ...designOnly } = currentDesign || ({} as any);
    const describe = (ids: any) =>
      (Array.isArray(ids) ? ids : [])
        .map((id: string) => (designOnly.elements || []).find((e: any) => e.id === id))
        .filter(Boolean)
        .map((e: any) => `${e.id} (${e.type === 'arc-text' ? (e.isReversed ? 'bottom text' : 'top text') : e.type === 'text' ? 'middle text' : e.type}${e.text ? ` "${e.text}"` : ''})`)
        .join(', ');
    // The model never needs the image data of a logo (a logo can be 100+ KB of text = very slow
    // replies) — only where it is and its stamp settings. Vector logos drop their long path too.
    // Compact snapshot (fewer tokens = faster reply): numbers to 2 decimals, default values left out
    const compact = (e: any) => {
      const out: any = {};
      for (const [k, v] of Object.entries(e)) {
        if (v === undefined || v === null || v === '') continue;
        if ((k === 'visible' && v === true) || (k === 'locked' && v === false) || (k === 'strokeType' && v === 'solid')) continue;
        if (k === 'angleOffset' && v === 0) continue;
        out[k] = typeof v === 'number' ? Math.round(v * 100) / 100 : v;
      }
      return out;
    };
    const { projectTitle: _t, ...designFields } = designOnly as any;
    const forModel = {
      ...designFields,
      elements: (designOnly.elements || []).map((e: any) => {
        if (e?.type === 'image') {
          const { src: _src, maskSrc: _mask, ...rest } = e;
          return { ...compact(rest), note: 'uploaded logo — change position / size / stamp settings only' };
        }
        if (e?.type === 'clipart' && e.svgPath) {
          const { svgPath: _p, viewBox: _v, ...rest } = e;
          return { ...compact(rest), note: 'vector logo' };
        }
        return compact(e);
      }),
    };
    const lastChanged = describe(lastChangedIds);
    const selected = describe(selectedIds);
    const focusLine =
      lastChanged || selected
        ? `\n[FOCUS for words like "it", "that", "this", "athu", "ithu": ${lastChanged ? `you last changed ${lastChanged}` : ''}${lastChanged && selected ? '; ' : ''}${selected ? `the user has selected ${selected}` : ''}. Apply follow-ups like "make it bigger / red / move it" to THESE elements, not to the whole stamp.]`
        : '';

    // Add current user prompt with live canvas snapshot
    formattedContents.push({
      role: 'user',
      parts: [
        {
          text: `[Active Canvas Snapshot: ${hasExistingElements ? JSON.stringify(forModel) : 'EMPTY'}]${focusLine}\n[Active View Mode: ${viewMode || 'SINGLE'}]\n[Active A4 Config: ${JSON.stringify(a4Config || {})}]\n[LANGUAGE REQUIREMENT: ${detectedLanguage}]\n${languageInstruction}\n\nNEW MESSAGE (read it together with the conversation above — it is usually a follow-up): ${prompt}`,
        },
      ],
    });

    // Speed: thinking off (it tripled reply time), small edit patches instead of the whole design,
    // and a hedged request: Flash Lite normally answers in ~1.5 s, but when Google's servers are
    // busy it can stall — so if it hasn't answered after HEDGE_MS the backup model is asked too,
    // and whichever answers first wins. A busy (503) error switches to the next model at once.
    // fastest first; the hedge (2nd) is the same fast model again — a second request often lands on
    // a less busy server. A model whose quota ran out (429) is skipped for a minute.
    const attempts: Array<{ model: string; timeoutMs: number; noThinking: boolean }> = [
      { model: 'gemini-flash-lite-latest', timeoutMs: 6000, noThinking: false }, // lite rejects a thinking budget
      { model: 'gemini-flash-lite-latest', timeoutMs: 6000, noThinking: false },
      { model: 'gemini-3.6-flash', timeoutMs: 7000, noThinking: true }, // last resort
    ].filter((a) => (AiStampService.quotaUntil.get(a.model) || 0) < Date.now());
    if (!attempts.length) attempts.push({ model: 'gemini-flash-lite-latest', timeoutMs: 6000, noThinking: false });
    const HEDGE_MS = 1200; // no answer yet → ask the backup model too (whichever answers first wins)
    const TOTAL_BUDGET_MS = 12000;
    this.lastAiFailure = null;
    const genAI = new GoogleGenerativeAI(apiKey);
    const cleanName = (t: string) => t.replace(/kadeeja/gi, 'Clixio').replace(/euyra/gi, 'Clixio').replace(/inkora/gi, 'Clixio');

    const askModel = async ({ model: modelName, timeoutMs, noThinking }: (typeof attempts)[number]): Promise<any> => {
      const generationConfig: any = {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 1536, // replies are short edit patches; a cap keeps a runaway answer from stalling
      };
      if (noThinking) generationConfig.thinkingConfig = { thinkingBudget: 0 };
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction, generationConfig }, { timeout: timeoutMs });
      const t0 = Date.now();
      const result = await model.generateContent({ contents: formattedContents });
      const usage: any = (result.response as any).usageMetadata || {};
      console.log(`⚡ ${modelName} replied in ${Date.now() - t0} ms (in ${usage.promptTokenCount ?? '?'} / out ${usage.candidatesTokenCount ?? '?'} tokens)`);
      const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('no JSON in model reply');
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && typeof parsed.reply === 'string') parsed.reply = cleanName(parsed.reply);
      if (parsed && typeof parsed.summary === 'string') parsed.summary = cleanName(parsed.summary);
      return parsed;
    };

    return await new Promise<any>((resolve) => {
      let settled = false;
      let next = 0; // next attempt to start
      let running = 0;
      const timers: NodeJS.Timeout[] = [];
      const finish = (value: any) => {
        if (settled) return;
        settled = true;
        timers.forEach(clearTimeout);
        resolve(value);
      };
      const launch = () => {
        if (settled || next >= attempts.length) return;
        const attempt = attempts[next++];
        running++;
        askModel(attempt).then(finish, (e: any) => {
          running--;
          const msg = String(e?.message || e);
          const busy = /\b503\b|high demand|overloaded|unavailable/i.test(msg);
          this.lastAiFailure = /\b429\b|quota|rate limit/i.test(msg) ? 'quota' : busy ? 'busy' : 'other';
          if (this.lastAiFailure === 'quota') AiStampService.quotaUntil.set(attempt.model, Date.now() + 60_000);
          console.warn(`Fast model ${attempt.model} error:`, msg.slice(0, 200));
          if (next < attempts.length) launch(); // failed → next model straight away
          else if (running === 0) finish(null);
        });
      };
      launch();
      timers.push(setTimeout(() => { if (running > 0 && next === 1) launch(); }, HEDGE_MS)); // slow → ask the backup too
      timers.push(setTimeout(() => finish(null), TOTAL_BUDGET_MS));
    });
  }

  /**
   * High-Speed Neural Refinement & Geometric Morphing Engine with Human-Like Conversational Responses
   */
  private static heuristicRefineEngine(prompt: string, currentDesign: any, language?: string): AiStampGeneratedPayload {
    const lower = prompt.toLowerCase();
    const isExplicitEnglish = language === 'ENGLISH' || (!language && !/\b(?:aaku|aakku|maattu|maatti|pakaram|cheyyu|nokk|venam|chuvapp|pacha|karupp|vattam|chathuram|katti|idumo|para|ini|ith)/i.test(prompt));
    const isManglish = language === 'MANGLISH' || (!isExplicitEnglish && language !== 'MALAYALAM');

    const existingElements: any[] = Array.isArray(currentDesign?.elements) ? JSON.parse(JSON.stringify(currentDesign.elements)) : [];
    let updatedInkColor = currentDesign?.inkColor || '#003399';
    let updatedShape = currentDesign?.shape || 'ROUND';
    let widthMm = currentDesign?.widthMm || 42;
    let heightMm = currentDesign?.heightMm || 42;
    let actionReply = isManglish
      ? `Ningal paranja reethiyil stamp design update cheythittund!`
      : `I have updated your stamp design as requested.`;

    const actions: string[] = [];

    // 1. Detect Shape Morphing Requests (including Manglish & phonetic typos like 'over shape aku')
    const isOvalRequest = lower.includes('oval') || lower.includes('ovel') || lower.includes('ovle') || lower.includes('over') || lower.includes('avol') || lower.includes('ellipse') || lower.includes('mutta');
    const isRectRequest = lower.includes('rect') || lower.includes('chathuram') || lower.includes('neelam') || lower.includes('box') || lower.includes('doctor') || lower.includes('strip');
    const isRoundRequest = lower.includes('round') || lower.includes('circle') || lower.includes('vattam') || lower.includes('urunda') || lower.includes('seal');
    const isSquareRequest = lower.includes('square') || lower.includes('samachathuram') || lower.includes('chatram');

    let morphedElements = [...existingElements];

    if (isOvalRequest && updatedShape !== 'OVAL') {
      updatedShape = 'OVAL';
      widthMm = 55;
      heightMm = 35;
      const cx = 27.5;
      const cy = 17.5;

      const nonBorderElements = existingElements.filter((el: any) => el.type !== 'ring' && el.type !== 'rect' && el.type !== 'oval');
      nonBorderElements.forEach((el: any) => {
        if (el.type === 'arc-text') {
          el.cx = cx;
          el.cy = cy;
          el.radius = 17.5;
        } else if (el.type === 'text') {
          el.x = cx;
          el.y = cy;
        }
      });

      morphedElements = [
        { id: uuidv4(), type: 'oval', name: 'Outer Oval Border', cx, cy, rx: 26, ry: 16, strokeWidth: 0.8, strokeType: 'solid', visible: true },
        { id: uuidv4(), type: 'oval', name: 'Inner Oval Border', cx, cy, rx: 24, ry: 14, strokeWidth: 0.35, strokeType: 'solid', visible: true },
        ...nonBorderElements,
      ];
      actions.push(isManglish ? `55x35mm Oval shape aakki` : `Morphed to 55x35mm Oval layout`);
    } else if (isRectRequest && updatedShape !== 'RECTANGULAR') {
      updatedShape = 'RECTANGULAR';
      widthMm = 47;
      heightMm = 18;
      const cx = 23.5;

      const textLines: string[] = [];
      existingElements.forEach((el: any) => {
        if (el.text && typeof el.text === 'string' && el.text.trim()) {
          textLines.push(el.text.trim());
        }
      });

      const rectTextElements = textLines.slice(0, 3).map((txt, idx) => ({
        id: uuidv4(),
        type: 'text',
        name: `Line ${idx + 1}`,
        text: txt,
        x: cx,
        y: textLines.length === 1 ? 9.5 : textLines.length === 2 ? 6.5 + idx * 6 : 4.5 + idx * 5,
        fontSize: idx === 0 ? 3.4 : 2.7,
        fontFamily: 'Inter',
        fontWeight: idx === 0 ? 'bold' : '500',
        align: 'center',
        visible: true,
      }));

      morphedElements = [
        { id: uuidv4(), type: 'rect', name: 'Outer Rect Border', x: 1, y: 1, width: 45, height: 16, rx: 1.5, ry: 1.5, strokeWidth: 0.6, strokeType: 'solid', visible: true },
        ...rectTextElements,
      ];
      actions.push(isManglish ? `47x18mm Rectangle layout aakki` : `Converted to 47x18mm Rectangle layout`);
    } else if (isRoundRequest && updatedShape !== 'ROUND') {
      updatedShape = 'ROUND';
      widthMm = 42;
      heightMm = 42;
      const cx = 21;
      const cy = 21;

      const nonBorderElements = existingElements.filter((el: any) => el.type !== 'ring' && el.type !== 'rect' && el.type !== 'oval');
      nonBorderElements.forEach((el: any) => {
        if (el.type === 'arc-text') {
          el.cx = cx;
          el.cy = cy;
          el.radius = 14.5;
        } else if (el.type === 'text') {
          el.x = cx;
          el.y = cy;
        }
      });

      morphedElements = [
        { id: uuidv4(), type: 'ring', name: 'Outer Ring', cx, cy, radius: 19.5, strokeWidth: 0.8, strokeType: 'solid', visible: true },
        { id: uuidv4(), type: 'ring', name: 'Inner Ring', cx, cy, radius: 18.2, strokeWidth: 0.35, strokeType: 'solid', visible: true },
        ...nonBorderElements,
      ];
      actions.push(isManglish ? `42mm Round circular shape aakki` : `Morphed to 42mm Round circular layout`);
    }

    // Check for Negations / Removals in Malayalam, Manglish, and English (e.g. 'red venda', 'star venda', 'no stars', 'kalayu')
    const hasNegation = /\b(?:venda|vendeda|vendaa|vendennu|no|not|remove|delete|kalayu|ozhivakku|don't\s*want|dont\s*want|without|avoid|cancel)\b/i.test(lower);

    // 2. Color Changes and Color Negations
    if (hasNegation && (lower.includes('red') || lower.includes('chuvapp'))) {
      updatedInkColor = '#003399';
      actions.push(isManglish ? `Red ink maatti Classic Blue aakki` : `Switched from Red to Classic Blue ink`);
    } else if (hasNegation && (lower.includes('blue') || lower.includes('neela'))) {
      updatedInkColor = '#111827';
      actions.push(isManglish ? `Blue ink maatti Black aakki` : `Switched from Blue to Black ink`);
    } else if (hasNegation && (lower.includes('black') || lower.includes('karupp'))) {
      updatedInkColor = '#003399';
      actions.push(isManglish ? `Black ink maatti Classic Blue aakki` : `Switched from Black to Classic Blue ink`);
    } else if (hasNegation && (lower.includes('green') || lower.includes('pacha'))) {
      updatedInkColor = '#003399';
      actions.push(isManglish ? `Green ink maatti Classic Blue aakki` : `Switched from Green to Classic Blue ink`);
    } else if (!hasNegation && (lower.includes('red') || lower.includes('chuvapp'))) {
      updatedInkColor = '#990000';
      actions.push(isManglish ? `Ink color Red (#990000) aakki` : `Changed ink color to Red`);
    } else if (!hasNegation && (lower.includes('black') || lower.includes('karupp'))) {
      updatedInkColor = '#111827';
      actions.push(isManglish ? `Ink color Black (#111827) aakki` : `Changed ink color to Black`);
    } else if (!hasNegation && (lower.includes('green') || lower.includes('pacha'))) {
      updatedInkColor = '#007A3D';
      actions.push(isManglish ? `Ink color Green (#007A3D) aakki` : `Changed ink color to Green`);
    } else if (!hasNegation && (lower.includes('purple') || lower.includes('violet'))) {
      updatedInkColor = '#551A8B';
      actions.push(isManglish ? `Ink color Purple (#551A8B) aakki` : `Changed ink color to Purple`);
    } else if (!hasNegation && (lower.includes('blue') || lower.includes('neela'))) {
      updatedInkColor = '#003399';
      actions.push(isManglish ? `Ink color Classic Blue (#003399) aakki` : `Changed ink color to Classic Blue`);
    } else if (!hasNegation && (lower.includes('color') || lower.includes('colour') || lower.includes('ink') || lower.includes('niram'))) {
      // Generic "change color" / "color maattu" toggle cycle
      const currentUpper = (currentDesign?.inkColor || '#003399').toUpperCase();
      if (currentUpper === '#003399') {
        updatedInkColor = '#990000'; // Blue -> Red
        actions.push(isManglish ? `Ink color Red (#990000) aakki` : `Switched ink color to Red`);
      } else if (currentUpper === '#990000') {
        updatedInkColor = '#007A3D'; // Red -> Green
        actions.push(isManglish ? `Ink color Green (#007A3D) aakki` : `Switched ink color to Green`);
      } else if (currentUpper === '#007A3D') {
        updatedInkColor = '#111827'; // Green -> Black
        actions.push(isManglish ? `Ink color Black (#111827) aakki` : `Switched ink color to Black`);
      } else if (currentUpper === '#111827') {
        updatedInkColor = '#551A8B'; // Black -> Purple
        actions.push(isManglish ? `Ink color Purple (#551A8B) aakki` : `Switched ink color to Purple`);
      } else {
        updatedInkColor = '#003399'; // Purple/Other -> Classic Blue
        actions.push(isManglish ? `Ink color Classic Blue (#003399) aakki` : `Switched ink color to Classic Blue`);
      }
    }

    // Sync any clipart icons to matching ink color
    if (updatedInkColor) {
      morphedElements.forEach((el: any) => {
        if (el.type === 'clipart' && el.fillColor) {
          el.fillColor = updatedInkColor;
        }
      });
    }

    // 3. Elements Removal via Negations (e.g. 'star venda', 'border venda')
    if (hasNegation && (lower.includes('star') || lower.includes('nakshathram'))) {
      morphedElements = morphedElements.filter((el: any) => el.clipartId !== 'star-5point' && !el.name?.toLowerCase().includes('star'));
      actions.push(isManglish ? `Stars remove cheythu` : `Removed all star symbols`);
    } else if (hasNegation && (lower.includes('border') || lower.includes('ring'))) {
      morphedElements = morphedElements.filter((el: any) => el.type !== 'ring' && el.type !== 'rect' && el.type !== 'oval');
      actions.push(isManglish ? `Outer border remove cheythu` : `Removed outer borders`);
    } else if (hasNegation && (lower.includes('clipart') || lower.includes('emblem') || lower.includes('symbol'))) {
      morphedElements = morphedElements.filter((el: any) => el.type !== 'clipart');
      actions.push(isManglish ? `Clipart emblem remove cheythu` : `Removed clipart emblem`);
    }

    // 4. Detect Text Replacement Requests
    const replaceMatch = prompt.match(/(?:change|replace|maattu|maatti|pakaram|aaku|aakku)\s+["']?([^"'\s]+)["']?\s+(?:to|with|aayi|enna|pakaram|aakku)?\s*["']?([^"'\n]+)["']?/i);
    if (replaceMatch && !hasNegation) {
      const fromWord = replaceMatch[1].trim().toLowerCase();
      const toWord = (replaceMatch[2] || '').trim();
      if (fromWord && toWord) {
        let replaced = false;
        morphedElements.forEach((el: any) => {
          if (el.text && typeof el.text === 'string' && el.text.toLowerCase().includes(fromWord)) {
            const reg = new RegExp(fromWord, 'gi');
            el.text = el.text.replace(reg, toWord.toUpperCase());
            replaced = true;
          }
        });
        if (replaced) {
          actions.push(isManglish ? `'${fromWord.toUpperCase()}' maatti '${toWord.toUpperCase()}' aakki` : `Replaced '${fromWord.toUpperCase()}' with '${toWord.toUpperCase()}'`);
        }
      }
    }

    // 5. Detect Border Thickness Changes
    if ((lower.includes('thicker') || lower.includes('katti') || lower.includes('thick') || lower.includes('bold border')) && !hasNegation) {
      morphedElements.forEach((el: any) => {
        if (el.type === 'ring' || el.type === 'rect' || el.type === 'oval') {
          el.strokeWidth = Math.min(2.5, (el.strokeWidth || 0.6) + 0.4);
        }
      });
      actions.push(isManglish ? `Border katti kootti` : `Increased border thickness`);
    }

    // 6. Detect Stars Addition (only when NOT negated)
    if ((lower.includes('star') || lower.includes('nakshathram')) && !hasNegation) {
      const hasExistingStars = morphedElements.some((el: any) => el.clipartId === 'star-5point');
      if (!hasExistingStars) {
        const cx = widthMm / 2;
        const cy = heightMm / 2;
        morphedElements.push({
          id: uuidv4(),
          type: 'clipart',
          name: 'Five-Point Star Left',
          clipartId: 'star-5point',
          x: cx - 14,
          y: cy - 2,
          width: 4,
          height: 4,
          fillColor: updatedInkColor,
          visible: true,
        });
        morphedElements.push({
          id: uuidv4(),
          type: 'clipart',
          name: 'Five-Point Star Right',
          clipartId: 'star-5point',
          x: cx + 10,
          y: cy - 2,
          width: 4,
          height: 4,
          fillColor: updatedInkColor,
          visible: true,
        });
        actions.push(isManglish ? `Two 5-point stars add cheythu` : `Added two 5-point decorative stars`);
      }
    }

    // 7. Detect Emblem / Clipart additions
    if (!hasNegation && (lower.includes('scales') || lower.includes('court symbol') || lower.includes('justice symbol'))) {
      const cx = widthMm / 2;
      const cy = heightMm / 2;
      morphedElements.push({
        id: uuidv4(),
        type: 'clipart',
        name: 'Scales of Justice',
        clipartId: 'scales-of-justice',
        x: cx - 4,
        y: cy - 6,
        width: 8,
        height: 8,
        fillColor: updatedInkColor,
        visible: true,
      });
      actions.push(isManglish ? `Scales of Justice symbol add cheythu` : `Added Scales of Justice emblem`);
    } else if (!hasNegation && (lower.includes('shield') || lower.includes('security symbol'))) {
      const cx = widthMm / 2;
      const cy = heightMm / 2;
      morphedElements.push({
        id: uuidv4(),
        type: 'clipart',
        name: 'Shield Emblem',
        clipartId: 'shield-ribbon',
        x: cx - 4,
        y: cy - 6,
        width: 8,
        height: 8,
        fillColor: updatedInkColor,
        visible: true,
      });
      actions.push(isManglish ? `Shield emblem add cheythu` : `Added Shield emblem`);
    }

    const finalReply = actions.length > 0
      ? (isManglish
          ? `Shari! Ningal paranja pole ${actions.join(', ')} — design neat aayi update cheythu. Canvas-il check cheythu nokkoo!`
          : `I've updated your stamp design with ${actions.join(', ')}. Take a look at the canvas!`)
      : (isManglish
          ? `Ningal paranja reethiyil stamp design update cheythittund!`
          : `I have updated your stamp design as requested.`);

    return {
      title: currentDesign?.projectTitle || 'AI Refined Stamp',
      shape: updatedShape,
      widthMm,
      heightMm,
      inkColor: updatedInkColor,
      elements: morphedElements,
      reply: finalReply,
      summary: finalReply,
    };
  }

  /**
   * Built-in Neural Semantic Parser for Malayalam, Manglish & English
   */
  private static heuristicSemanticGenerator(
    rawPrompt: string,
    lower: string,
    language?: string,
    overrideShape?: string,
    overrideInkColor?: string,
    overrideWidth?: number,
    overrideHeight?: number
  ): AiStampGeneratedPayload {
    // 1. Detect Shape
    let shape: 'ROUND' | 'RECTANGULAR' | 'OVAL' | 'SQUARE' = 'ROUND';
    if (overrideShape && ['ROUND', 'RECTANGULAR', 'OVAL', 'SQUARE'].includes(overrideShape.toUpperCase())) {
      shape = overrideShape.toUpperCase() as any;
    } else if (lower.includes('square') || lower.includes('sqaure') || lower.includes('sqare') || lower.includes('squre') || lower.includes('sqr') || lower.includes('chatram') || lower.includes('samachathuram') || lower.includes('qc pass')) {
      shape = 'SQUARE';
    } else if (lower.includes('oval') || lower.includes('ovel') || lower.includes('ovle') || lower.includes('ellipse')) {
      shape = 'OVAL';
    } else if (lower.includes('rect') || lower.includes('doctor') || lower.includes('signatory') || lower.includes('address') || lower.includes('box')) {
      shape = 'RECTANGULAR';
    } else if (lower.includes('round') || lower.includes('circle') || lower.includes('vattam') || lower.includes('seal') || lower.includes('notary')) {
      shape = 'ROUND';
    }

    // 2. Detect Dimension
    let widthMm = overrideWidth || 42;
    let heightMm = overrideHeight || 42;
    const dimMatch = rawPrompt.match(/(\d{2,3})\s*(?:x|×|by)\s*(\d{2,3})\s*(?:mm)?/i);
    const singleDimMatch = rawPrompt.match(/(\d{2,3})\s*(?:mm|millimeter)/i);

    if (!overrideWidth && dimMatch) {
      widthMm = parseInt(dimMatch[1], 10);
      heightMm = parseInt(dimMatch[2], 10);
    } else if (!overrideWidth && singleDimMatch) {
      const s = parseInt(singleDimMatch[1], 10);
      widthMm = s;
      heightMm = shape === 'ROUND' || shape === 'SQUARE' ? s : Math.round(s * 0.4);
    } else if (!overrideWidth) {
      if (shape === 'ROUND') { widthMm = 42; heightMm = 42; }
      else if (shape === 'RECTANGULAR') { widthMm = 47; heightMm = 18; }
      else if (shape === 'OVAL') { widthMm = 55; heightMm = 35; }
      else if (shape === 'SQUARE') { widthMm = 30; heightMm = 30; }
    }

    // 3. Detect Ink Color
    let inkColor = overrideInkColor || '#111827'; // Default official black
    if (!overrideInkColor) {
      if (lower.includes('brown') || lower.includes('coffee') || lower.includes('chocolate') || lower.includes('thavidu')) inkColor = '#78350F';
      else if (lower.includes('red') || lower.includes('chuvapp')) inkColor = '#990000';
      else if (lower.includes('black') || lower.includes('karupp')) inkColor = '#111827';
      else if (lower.includes('green') || lower.includes('pacha')) inkColor = '#007A3D';
      else if (lower.includes('purple') || lower.includes('violet')) inkColor = '#551A8B';
      else if (lower.includes('orange')) inkColor = '#EA580C';
      else if (lower.includes('pink')) inkColor = '#DB2777';
      else if (lower.includes('navy')) inkColor = '#000080';
    }

    // 4. Extract Entity Names & Text Lines from Prompt
    const lines = this.extractTextsFromPrompt(rawPrompt, shape);

    // 5. Generate Elements
    const elements: any[] = [];
    const cx = widthMm / 2;
    const cy = heightMm / 2;

    if (shape === 'ROUND') {
      // Outer Double Concentric Rings
      const outerR = (Math.min(widthMm, heightMm) / 2) - 1.2;
      const innerR = outerR - 1.4;

      elements.push({
        id: uuidv4(),
        type: 'ring',
        name: 'Outer Border Ring',
        cx,
        cy,
        radius: Number(outerR.toFixed(2)),
        strokeWidth: 0.8,
        strokeType: 'solid',
        visible: true,
      });

      elements.push({
        id: uuidv4(),
        type: 'ring',
        name: 'Inner Decorative Ring',
        cx,
        cy,
        radius: Number(innerR.toFixed(2)),
        strokeWidth: 0.35,
        strokeType: 'solid',
        visible: true,
      });

      // Text Auto-Scaling Logic to prevent overlaps
      const arcR = innerR - 3.4;
      const maxArcLengthMm = (Math.PI * arcR); // Full half circumference
      
      const topTextStr = lines.topText.toUpperCase();
      const bottomTextStr = lines.bottomText ? lines.bottomText.toUpperCase() : '';
      
      // Calculate optimal font size for Top Text
      const topEstLength = topTextStr.length * 0.75; // Approx chars width multiplier
      let topFontSize = Math.min(3.8, widthMm * 0.08); // Max bounds
      if (topEstLength * topFontSize > maxArcLengthMm * 0.9) {
        topFontSize = (maxArcLengthMm * 0.9) / topEstLength;
      }
      topFontSize = Math.max(2.2, topFontSize); // Min bounds

      elements.push({
        id: uuidv4(),
        type: 'arc-text',
        name: 'Top Header Arc',
        text: topTextStr,
        cx,
        cy,
        radius: Number(arcR.toFixed(2)),
        startAngle: -140, // Legacy fallback, handled by frontend auto-centering
        sweepAngle: 100, // Legacy fallback
        fontSize: Number(topFontSize.toFixed(2)),
        fontFamily: 'Inter',
        fontWeight: 'bold',
        isReversed: false,
        letterSpacing: 0.15,
        visible: true,
      });

      // Bottom Curved Arc Text
      if (bottomTextStr) {
        // Calculate optimal font size for Bottom Text
        const bottomEstLength = bottomTextStr.length * 0.75;
        let bottomFontSize = Math.min(3.3, widthMm * 0.07); // Max bounds
        if (bottomEstLength * bottomFontSize > maxArcLengthMm * 0.85) {
          bottomFontSize = (maxArcLengthMm * 0.85) / bottomEstLength;
        }
        bottomFontSize = Math.max(2.0, bottomFontSize); // Min bounds

        elements.push({
          id: uuidv4(),
          type: 'arc-text',
          name: 'Bottom Subtitle Arc',
          text: bottomTextStr,
          cx,
          cy,
          radius: Number(arcR.toFixed(2)),
          startAngle: 40,
          sweepAngle: 100,
          fontSize: Number(bottomFontSize.toFixed(2)),
          fontFamily: 'Inter',
          fontWeight: '600',
          isReversed: true,
          letterSpacing: 0.1,
          visible: true,
        });
      }

      // Clipart or Center Lines
      if (lines.clipart) {
        const cSize = Math.max(5, widthMm * 0.18);
        elements.push({
          id: uuidv4(),
          type: 'clipart',
          name: 'Center Emblem Clipart',
          clipartId: lines.clipart,
          x: Number((cx - (cSize / 2)).toFixed(2)),
          y: Number((cy - (cSize / 2) - 1).toFixed(2)),
          width: Number(cSize.toFixed(2)),
          height: Number(cSize.toFixed(2)),
          fillColor: inkColor,
          visible: true,
        });
      }

      // Center Title Text
      if (lines.centerText) {
        const centerTextStr = lines.centerText.toUpperCase();
        const estLen = centerTextStr.length * 0.75;
        const maxInnerWidth = (innerR * 2) * 0.85; // 85% of inner diameter
        let centerFontSize = Math.min(3.6, widthMm * 0.075);
        if (estLen * centerFontSize > maxInnerWidth) {
          centerFontSize = maxInnerWidth / estLen;
        }
        centerFontSize = Math.max(1.8, centerFontSize);

        elements.push({
          id: uuidv4(),
          type: 'text',
          name: 'Center Main Text',
          text: centerTextStr,
          x: cx,
          y: lines.clipart ? cy + 4 : cy - 1,
          fontSize: Number(centerFontSize.toFixed(2)),
          fontFamily: 'Inter',
          fontWeight: 'bold',
          align: 'center',
          visible: true,
        });
      }

      if (lines.subText) {
        const subTextStr = lines.subText;
        const estLen = subTextStr.length * 0.75;
        const maxInnerWidth = (innerR * 2) * 0.75; // 75% of inner diameter for subtext
        let subFontSize = Math.min(2.8, widthMm * 0.06);
        if (estLen * subFontSize > maxInnerWidth) {
          subFontSize = maxInnerWidth / estLen;
        }
        subFontSize = Math.max(1.5, subFontSize);

        elements.push({
          id: uuidv4(),
          type: 'text',
          name: 'Center Subtext',
          text: subTextStr,
          x: cx,
          y: lines.clipart ? cy + 8 : cy + 3.5,
          fontSize: Number(subFontSize.toFixed(2)),
          fontFamily: 'Inter',
          fontWeight: '500',
          align: 'center',
          visible: true,
        });
      }
    } else if (shape === 'RECTANGULAR') {
      // Outer Rectangle Border
      elements.push({
        id: uuidv4(),
        type: 'rect',
        name: 'Outer Border Rect',
        x: 1.2,
        y: 1.2,
        width: widthMm - 2.4,
        height: heightMm - 2.4,
        rx: 1.5,
        ry: 1.5,
        strokeWidth: 0.6,
        strokeType: 'solid',
        visible: true,
      });

      // Text Lines stacked vertically
      const totalLines = [lines.topText, lines.centerText, lines.bottomText, lines.subText].filter(Boolean);
      const startY = 4.5;
      const stepY = (heightMm - 8) / Math.max(1, totalLines.length);

      totalLines.forEach((t, i) => {
        elements.push({
          id: uuidv4(),
          type: 'text',
          name: `Line ${i + 1}`,
          text: t,
          x: cx,
          y: Number((startY + (i * stepY)).toFixed(2)),
          fontSize: i === 0 ? 3.4 : 2.7,
          fontFamily: 'Inter',
          fontWeight: i === 0 ? 'bold' : '500',
          align: 'center',
          visible: true,
        });
      });
    } else if (shape === 'SQUARE') {
      elements.push({
        id: uuidv4(),
        type: 'rect',
        name: 'Square Border Outer',
        x: 1.2,
        y: 1.2,
        width: widthMm - 2.4,
        height: heightMm - 2.4,
        rx: 2,
        ry: 2,
        strokeWidth: 0.7,
        strokeType: 'solid',
        visible: true,
      });

      elements.push({
        id: uuidv4(),
        type: 'text',
        name: 'Square Top Heading',
        text: lines.topText.toUpperCase(),
        x: cx,
        y: cy - 6,
        fontSize: 3.4,
        fontFamily: 'Inter',
        fontWeight: 'bold',
        align: 'center',
        visible: true,
      });

      if (lines.centerText) {
        elements.push({
          id: uuidv4(),
          type: 'text',
          name: 'Square Center Line',
          text: lines.centerText,
          x: cx,
          y: cy,
          fontSize: 3.8,
          fontFamily: 'Inter',
          fontWeight: 'extrabold',
          align: 'center',
          visible: true,
        });
      }

      if (lines.bottomText) {
        elements.push({
          id: uuidv4(),
          type: 'text',
          name: 'Square Bottom Line',
          text: lines.bottomText,
          x: cx,
          y: cy + 6,
          fontSize: 2.6,
          fontFamily: 'Inter',
          fontWeight: '600',
          align: 'center',
          visible: true,
        });
      }
    } else {
      // OVAL
      elements.push({
        id: uuidv4(),
        type: 'oval',
        name: 'Oval Outer Border',
        cx,
        cy,
        rx: (widthMm / 2) - 1.5,
        ry: (heightMm / 2) - 1.5,
        strokeWidth: 0.7,
        strokeType: 'solid',
        visible: true,
      });

      elements.push({
        id: uuidv4(),
        type: 'text',
        name: 'Oval Main Name',
        text: lines.topText.toUpperCase(),
        x: cx,
        y: cy - 3,
        fontSize: 3.5,
        fontFamily: 'Inter',
        fontWeight: 'bold',
        align: 'center',
        visible: true,
      });

      if (lines.centerText) {
        elements.push({
          id: uuidv4(),
          type: 'text',
          name: 'Oval Subtitle',
          text: lines.centerText,
          x: cx,
          y: cy + 3.5,
          fontSize: 2.8,
          fontFamily: 'Inter',
          fontWeight: '600',
          align: 'center',
          visible: true,
        });
      }
    }

    const isExplicitEnglish = language === 'ENGLISH' || (!language && !/\b(?:aaku|aakku|maattu|maatti|pakaram|cheyyu|nokk|venam|chuvapp|pacha|karupp|vattam|chathuram|katti|idumo|para|ini|ith|njan|ningal|enth|enthokke|nallath|kollam|adipoli|sugam|nanni|polichu|para|parayoo|paranja|venda)/i.test(rawPrompt));
    const isManglish = language === 'MANGLISH' || (!isExplicitEnglish && language !== 'MALAYALAM');
    const humanReply = isManglish
      ? `'${lines.topText}'-nu vendi ${widthMm}x${heightMm}mm ${shape.toLowerCase()} stamp design ready aakkiyittund! Typography-um layout-um standard CAD format-il set cheythu.`
      : `Created a professional ${shape.toLowerCase()} stamp (${widthMm}x${heightMm}mm) for "${lines.topText}" with precision vector typography.`;

    return {
      title: lines.topText || 'AI Custom Stamp',
      shape,
      widthMm,
      heightMm,
      inkColor,
      elements,
      reply: humanReply,
      summary: humanReply,
    };
  }

  /**
   * Smart Semantic Entity, Clause & Clipart Parser with Domain Reasoning
   */
  private static extractTextsFromPrompt(raw: string, shape: string): {
    topText: string;
    centerText?: string;
    bottomText?: string;
    subText?: string;
    clipart?: string;
  } {
    const lower = raw.toLowerCase();

    // 0. Explicit Quoted or Center Text extraction (e.g. text "PAID", "APPROVED", 'CANCELLED')
    const quoteMatch = raw.match(/["'“]([^"'“”]+)["'”]/);
    const explicitTextMatch = raw.match(/\b(?:with\s+text|text|saying|having\s+text)\s+["']?([a-zA-Z0-9\s&.-]+?)["']?(?:\s+(?:with|in|and|$)|$)/i);
    const explicitCenterWord = quoteMatch ? quoteMatch[1].trim() : explicitTextMatch ? explicitTextMatch[1].trim() : null;

    // 1. Clipart & Icon Intent Detection across entire prompt
    let clipart: string | undefined;
    if (lower.includes('notary') || lower.includes('advocate') || lower.includes('legal') || lower.includes('scale') || lower.includes('court') || lower.includes('law') || lower.includes('justice')) {
      clipart = 'scales-of-justice';
    } else if (lower.includes('doctor') || lower.includes('medical') || lower.includes('hospital') || lower.includes('clinic') || lower.includes('health') || lower.includes('rx') || lower.includes('pharmacy')) {
      clipart = 'caduceus';
    } else if (lower.includes('qc') || lower.includes('pass') || lower.includes('quality') || lower.includes('inspect') || lower.includes('verified')) {
      clipart = 'verified-badge';
    } else if (lower.includes('shield') || lower.includes('security') || lower.includes('police') || lower.includes('school') || lower.includes('academy') || lower.includes('college')) {
      clipart = 'shield-ribbon';
    } else if (lower.includes('star') || lower.includes('certified')) {
      clipart = 'star-5point';
    }

    // 2. Intelligent Clause Separator: Strip secondary instructions (e.g. "..including hospital icons", "with two stars")
    let primaryText = raw;
    // Strip everything after "..", "including", "with icon", "having icon", "along with", "and add"
    primaryText = primaryText.replace(/(?:\.\.|\bincluding\b|\balong\s+with\b|\band\s+add\b|\bhaving\b|\bwith\b)\s*(?:hospital|doctor|medical|notary|court|quality|star|stars|icon|icons|clipart|symbol|symbols|emblem|logo|border|ink|color).*$/i, '');

    // 3. Clean Primary Text to extract pure Entity Name
    let cleaned = primaryText
      .replace(/["'“][^"'“”]+["'”]/g, '')
      .replace(/\b(?:with\s+text|text|saying|having\s+text)\s+["']?[a-zA-Z0-9\s&.-]+?["']?(?:\s+(?:with|in|and|$)|$)/gi, '')
      .replace(/\b(?:please|kindly|can\s+you|just|simply)\b\s*/gi, '')
      .replace(/\b(?:make|create|generate|design|draw|build|render|oru|puthiya|a|an|the)\b\s*/gi, '')
      .replace(/\b(?:round|circle|vattam|urunda|rectangular|rect|neelam|chathuram|oval|ovel|ovle|over|ellipse|mutta|square|sqaure|sqare|squre|sqr|samachathuram)\b\s*/gi, '')
      .replace(/(?:\d{2,3}\s*(?:x|×|by)?\s*\d{0,3}\s*mm)\s*/gi, '')
      .replace(/\b(?:rubber\s+stamp|seal|stamp|seals)\b\s*/gi, '')
      .replace(/\b(?:with|in|using|having|ulla|ullath|uledh)\b\s*/gi, '')
      .replace(/\b(?:blue|red|black|green|purple|violet|brown|coffee|chocolate|orange|pink|navy|neela|chuvapp|karupp|pacha)\b\s+(?:ink|color|inkpad)?\s*/gi, '')
      .replace(/^(?:for\s+the|for\s+a|for|named|called|title|heading|per|name|enna|vendi|vendiyulla|of|to)\b\s*/gi, '')
      .replace(/\s+\b(?:nu\s+vendi|vendi|vendiyulla|nte|inte|enna\s+peril|aayi|aakku|aaku|cheyyu|vekk)\b$/gi, '')
      .trim();

    const sanitizeName = (str: string): string => {
      return str
        .replace(/^(?:for\s+the|for\s+a|for|named|called|name\s*is|per|heading)\s+/i, '')
        .replace(/\s+(?:nu\s+vendi|vendi|vendiyulla|inte|nte)$/i, '')
        .replace(/^[\s,.;:\-_/\\|]+|[\s,.;:\-_/\\|]+$/g, '')
        .trim();
    };

    // Check for comma separated tokens
    const parts = cleaned.split(/[,;\n]+/).map(s => sanitizeName(s.trim())).filter(Boolean);

    if (parts.length >= 3) {
      return {
        topText: sanitizeName(parts[0]) || 'COMMERCIAL ENTERPRISE',
        centerText: explicitCenterWord ? explicitCenterWord.toUpperCase() : (sanitizeName(parts[1]) || 'OFFICIAL SEAL'),
        bottomText: sanitizeName(parts[2]) || 'GOVT. CERTIFIED',
        subText: parts[3] ? sanitizeName(parts[3]) : undefined,
        clipart,
      };
    } else if (parts.length === 2) {
      return {
        topText: sanitizeName(parts[0]),
        centerText: explicitCenterWord ? explicitCenterWord.toUpperCase() : (clipart ? 'AUTHORIZED SIGNATORY' : undefined),
        bottomText: sanitizeName(parts[1]),
        clipart,
      };
    }

    // 4. Domain Semantic Synthesis
    // Coffee Shop / Cafe / Bakery / Restaurant
    if (lower.includes('coffee') || lower.includes('cafe') || lower.includes('bakery') || lower.includes('restaurant') || lower.includes('food') || lower.includes('hotel') || lower.includes('shop') || lower.includes('store')) {
      const foodName = sanitizeName(cleaned) || (lower.includes('coffee') ? 'COFFEE SHOP' : lower.includes('bakery') ? 'ROYAL BAKERY' : 'COMMERCIAL STORE');
      return {
        topText: foodName.toUpperCase(),
        centerText: explicitCenterWord ? explicitCenterWord.toUpperCase() : 'OFFICIAL SEAL',
        bottomText: 'AUTHENTIC QUALITY',
        subText: 'ESTD. 2024',
        clipart: clipart || 'star-5point',
      };
    }

    // Hospital / Medical Center
    if (lower.includes('hospital') || lower.includes('medical') || lower.includes('healthcare')) {
      const hospitalName = sanitizeName(cleaned);
      const isGeneric = !hospitalName || /^hospital$/i.test(hospitalName) || /^medical$/i.test(hospitalName);
      const finalTop = isGeneric
        ? 'CITY HOSPITAL & RESEARCH CENTER'
        : (hospitalName.toUpperCase().includes('HOSPITAL') ? hospitalName.toUpperCase() : `${hospitalName.toUpperCase()} HOSPITAL`);

      return {
        topText: finalTop,
        centerText: explicitCenterWord ? explicitCenterWord.toUpperCase() : 'HEALTHCARE SERVICES',
        bottomText: 'EMERGENCY & MEDICAL CARE',
        subText: 'DEPT. OF HEALTH',
        clipart: clipart || 'caduceus',
      };
    }

    // Doctor / Clinic / Physician
    if (lower.includes('doctor') || lower.includes('clinic') || lower.includes('physician')) {
      const docMatch = raw.match(/(?:for\s+dr\.|for\s+doctor|for|dr\.|doctor)\s+([A-Za-z\s]+?)(?:,|\.|\breg\b|\bmbbs\b|\$)/i);
      const rawDocName = sanitizeName(docMatch ? docMatch[1].trim() : (cleaned && !/^doctor$/i.test(cleaned) ? cleaned : 'PRIYA NAIR'));
      const cleanDocName = rawDocName.replace(/^dr\.?\s*/i, '').trim();
      return {
        topText: `DR. ${cleanDocName.toUpperCase()}`,
        centerText: explicitCenterWord ? explicitCenterWord.toUpperCase() : 'MBBS, MD (GEN. MED)',
        bottomText: 'REG. NO: KMC 49281',
        subText: 'SENIOR CONSULTANT PHYSICIAN',
        clipart: clipart || 'caduceus',
      };
    }

    // Chartered Accountant (CA) & Auditor
    if (lower.includes('ca ') || lower.includes('chartered accountant') || lower.includes('auditor') || lower.includes('tax consultant')) {
      const caMatch = raw.match(/(?:for\s+ca|for|ca)\s+([A-Za-z\s]+?)(?:,|\.|\bmembership\b|\$)/i);
      const rawCaName = sanitizeName(caMatch ? caMatch[1].trim() : (cleaned && !/^(?:ca|auditor)$/i.test(cleaned) ? cleaned : 'ARUN VARGHESE'));
      const cleanCaName = rawCaName.replace(/^ca\.?\s*/i, '').trim();
      return {
        topText: `CA. ${cleanCaName.toUpperCase()}`,
        centerText: explicitCenterWord ? explicitCenterWord.toUpperCase() : 'CHARTERED ACCOUNTANT',
        bottomText: 'MEMBERSHIP NO: 204918',
        subText: 'ICAI REGISTERED AUDITOR',
        clipart: clipart || 'verified-badge',
      };
    }

    // Notary / Advocate / Legal / High Court
    if (lower.includes('notary') || lower.includes('advocate') || lower.includes('lawyer') || lower.includes('legal')) {
      const nameMatch = raw.match(/(?:for\s+advocate|for\s+adv\.|for|name|advocate|adv\.)\s+([A-Za-z\s]+?)(?:,|\.|\bfor\b|\bwith\b|\bhigh\b|\$)/i);
      const name = sanitizeName(nameMatch ? nameMatch[1].trim() : (cleaned && !/^(?:notary|advocate)$/i.test(cleaned) ? cleaned : 'RAHUL SHARMA'));
      return {
        topText: name.toUpperCase().startsWith('ADV') ? name.toUpperCase() : `ADVOCATE ${name.toUpperCase()}`,
        centerText: explicitCenterWord ? explicitCenterWord.toUpperCase() : 'NOTARY PUBLIC',
        bottomText: 'HIGH COURT OF KERALA',
        subText: 'REG. NO. 4882 / GOVT OF INDIA',
        clipart: clipart || 'scales-of-justice',
      };
    }

    // School / College / Academy / University
    if (lower.includes('school') || lower.includes('college') || lower.includes('academy') || lower.includes('university') || lower.includes('vidyalaya')) {
      const instName = sanitizeName(cleaned) || 'OXFORD PUBLIC SCHOOL';
      return {
        topText: instName.toUpperCase(),
        centerText: explicitCenterWord ? explicitCenterWord.toUpperCase() : 'AFFILIATED & ACCREDITED',
        bottomText: 'CENTRAL BOARD OF EDUCATION',
        subText: 'ESTD. 1995',
        clipart: clipart || 'shield-ribbon',
      };
    }

    // Police / Security Agency
    if (lower.includes('security') || lower.includes('police') || lower.includes('guard') || lower.includes('patrol')) {
      const secName = sanitizeName(cleaned) || 'APEX SECURITY SERVICES';
      return {
        topText: secName.toUpperCase(),
        centerText: explicitCenterWord ? explicitCenterWord.toUpperCase() : 'AUTHORIZED PATROL',
        bottomText: 'GOVT. LICENSED AGENCY',
        subText: 'ISO 9001:2015 CERTIFIED',
        clipart: clipart || 'shield-ribbon',
      };
    }

    // Transport / Logistics / Cargo
    if (lower.includes('logistics') || lower.includes('cargo') || lower.includes('courier') || lower.includes('travels') || lower.includes('transport')) {
      const transName = sanitizeName(cleaned) || 'SPEED CARGO & LOGISTICS';
      return {
        topText: transName.toUpperCase(),
        centerText: explicitCenterWord ? explicitCenterWord.toUpperCase() : 'WORLDWIDE COURIER & CARGO',
        bottomText: 'ALL INDIA PERMIT HOLDER',
        subText: 'TRACKED & DELIVERED',
        clipart: clipart || 'verified-badge',
      };
    }

    // QC / Quality Inspection
    if (lower.includes('qc') || lower.includes('quality') || lower.includes('inspection') || lower.includes('passed')) {
      return {
        topText: sanitizeName(cleaned) || 'QUALITY ASSURANCE DIVISION',
        centerText: explicitCenterWord ? explicitCenterWord.toUpperCase() : 'QC PASSED',
        bottomText: 'INSPECTOR NO. 04',
        subText: 'TESTED & VERIFIED',
        clipart: clipart || 'verified-badge',
      };
    }

    // General fallback
    const finalCleanedName = sanitizeName(cleaned) || 'STAMIOX VECTOR STUDIO';
    return {
      topText: finalCleanedName.toUpperCase(),
      centerText: explicitCenterWord ? explicitCenterWord.toUpperCase() : 'OFFICIAL SEAL',
      bottomText: 'ALL RIGHTS RESERVED',
      clipart,
    };
  }
}

export const generateStampController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, currentDesign, history, viewMode, a4Config, language } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ success: false, message: 'Prompt is required' });
      return;
    }

    const stamp = await AiStampService.generateFromPrompt(prompt, currentDesign, history, viewMode, a4Config, language);
    if (stamp && typeof stamp.reply === 'string') {
      stamp.reply = stamp.reply.replace(/kadeeja/gi, 'Clixio').replace(/euyra/gi, 'Clixio').replace(/inkora/gi, 'Clixio');
    }
    if (stamp && typeof stamp.summary === 'string') {
      stamp.summary = stamp.summary.replace(/kadeeja/gi, 'Clixio').replace(/euyra/gi, 'Clixio').replace(/inkora/gi, 'Clixio');
    }
    res.status(200).json({
      success: true,
      data: stamp,
    });
  } catch (error: any) {
    console.error('Error generating AI stamp:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate AI stamp design',
    });
  }
};

export const refineStampController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, currentDesign, history, language } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ success: false, message: 'Refinement prompt is required' });
      return;
    }

    const refined = await AiStampService.refineElements(prompt, currentDesign, history, language);
    if (refined && typeof refined.reply === 'string') {
      refined.reply = refined.reply.replace(/kadeeja/gi, 'Clixio').replace(/euyra/gi, 'Clixio').replace(/inkora/gi, 'Clixio');
    }
    if (refined && typeof refined.summary === 'string') {
      refined.summary = refined.summary.replace(/kadeeja/gi, 'Clixio').replace(/euyra/gi, 'Clixio').replace(/inkora/gi, 'Clixio');
    }
    res.status(200).json({
      success: true,
      data: refined,
    });
  } catch (error: any) {
    console.error('Error refining AI stamp:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to refine stamp design',
    });
  }
};
