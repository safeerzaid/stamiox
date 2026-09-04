import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';

const uuidv4 = () => crypto.randomUUID();

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
  elements?: any[];
}

/**
 * Intelligent Stamp Design Heuristic & Gemini AI Engine
 */
export class AiStampService {
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

    // 1. Try Antigravity-Level Agentic Gemini Engine First (for EVERYTHING: conversation, generation, and editing)
    if (geminiKey) {
      try {
        const hasExistingElements = currentDesign && Array.isArray(currentDesign.elements) && currentDesign.elements.length > 0;
        const geminiResult = await this.callGeminiUnifiedApi(rawPrompt, currentDesign, history, geminiKey, viewMode, a4Config, language);
        console.log("💎 Gemini RAW Result:", geminiResult);
        
        if (geminiResult && geminiResult.reply) {
          const hasWeirdElements = geminiResult.elements && geminiResult.elements.some((e: any) => 
            e.type === 'BORDER' || e.type === 'TEXT_ARC' || e.type === 'TEXT_LINE'
          );
          
          // Force handover to Neural Engine if it's a completely new design or hallucinated element types
          if (geminiResult.action === 'GENERATE_NEW' || (!hasExistingElements && geminiResult.elements && geminiResult.elements.length > 0) || hasWeirdElements) {
            console.log("💎 Gemini triggered GENERATE_NEW or hallucinated geometry, handing over to Neural CAD Engine...");
            // Run neural engine to generate perfect geometry based on Gemini's derived shape & properties
            const neuralFallback = this.heuristicSemanticGenerator(
              rawPrompt,
              rawPrompt.toLowerCase(),
              language,
              geminiResult.shape,
              geminiResult.inkColor,
              geminiResult.widthMm,
              geminiResult.heightMm
            );
            // Inject Gemini's reply, title, inkColor, and shape choices into the neural output
            neuralFallback.reply = geminiResult.reply;
            if (geminiResult.title) neuralFallback.title = geminiResult.title;
            if (geminiResult.shape) neuralFallback.shape = geminiResult.shape;
            if (geminiResult.inkColor) neuralFallback.inkColor = geminiResult.inkColor;
            if (geminiResult.widthMm) neuralFallback.widthMm = geminiResult.widthMm;
            if (geminiResult.heightMm) neuralFallback.heightMm = geminiResult.heightMm;
            return neuralFallback;
          }
          
          return geminiResult; // Return Gemini's dynamic response (which contains elements and intelligent reply)
        }
      } catch (err) {
        console.warn('Gemini Unified API fallback to Neural Engine:', err);
      }
    }

    // 2. FALLBACK: If Gemini API fails (or Rate Limit hit), fallback to Regex heuristics
    if (this.isConversationalPrompt(rawPrompt)) {
      return this.handleConversationalReply(rawPrompt, currentDesign, language);
    }

    if (currentDesign && currentDesign.elements && currentDesign.elements.length > 0) {
      return this.heuristicRefineEngine(rawPrompt, currentDesign, language);
    }
    return this.heuristicSemanticGenerator(rawPrompt, rawPrompt.toLowerCase(), language);
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
    const isExplicitEnglish = language === 'ENGLISH' || (!language && !/(?:aaku|aakku|maattu|maatti|cheyyu|nokk|venam|chuvapp|pacha|vattam|chathuram|katti|idumo|para|ini|ith|sugam|enthokke|nanni|kollam|adipoli|ethra|nallath|aano|machane)/i.test(prompt));
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

    const systemInstruction = `You are Clixio AI — the ultimate advanced conversational CAD AI agent for vector rubber stamps.
    
    1. Respond exclusively in valid JSON format. Do not use Markdown backticks.
    2. Act as a highly intelligent, empathetic human expert rubber stamp designer named Clixio. 

CRITICAL CONVERSATIONAL & PERSONA RULES:
1. STRICT MULTILINGUAL & LANGUAGE MIRRORING RULE:
   - You MUST detect the language/style of the user's prompt and reply in that EXACT SAME LANGUAGE:
     * If the user asks in ENGLISH (e.g. "Create a round notary seal for John", "Make border thicker", "What shape is best?"): You MUST reply in fluent, professional, friendly ENGLISH.
     * If the user asks in MANGLISH (Malayalam written in Latin script, e.g. "Doctor stamp set aakku", "Oru school seal venam", "Border katti kootto"): You MUST reply in natural, fluent, friendly MANGLISH (using friendly words like "set aakkam", "adipoli", "super aayittund").
     * If the user asks in MALAYALAM SCRIPT (e.g. "ഒരു ഡോക്ടർ സീൽ വേണം"): Reply in MALAYALAM SCRIPT.
     * If the user asks in HINDI or any other language: Reply in that EXACT LANGUAGE.
   - NEVER force Manglish if the user is asking in English, and NEVER force English if the user is asking in Manglish!
2. Act as a highly intelligent, empathetic human expert rubber stamp designer named Clixio. 
3. ADVANCED INTELLIGENCE & REASONING: 
   - Deeply analyze vague or simple user prompts. (e.g., if the user just says "school", don't just make a blank stamp. Reason that a school needs a Principal seal, Office seal, or Admission seal. Suggest these options!)
   - Anticipate the user's unstated needs. If they ask for a "company stamp", remind them that they might need their Registration Number (CIN/GST) or Logo on it.
4. If the user asks a question, seeks advice (e.g. "which stamp shape is best for an agency" or "oru agencykk enth type stamp anu nallath"), or provides feedback, provide a detailed, intelligent consultation in the user's language in the "reply" field. DO NOT create a random stamp or overwrite the canvas if they are just asking for advice! Treat existing elements as IMMUTABLE GROUND TRUTH in this case.

CRITICAL SURGICAL EDITING PRINCIPLES:
1. IMMUTABLE GROUND TRUTH:
   - When the canvas is NOT empty (Current Canvas Snapshot has elements):
   - You MUST treat all existing elements as IMMUTABLE GROUND TRUTH unless explicitly asked to change them.
   - DO NOT re-generate, re-invent, delete, or randomize any element that the user did not ask to change.
   - Output EVERY existing element back in the "elements" array with its EXACT existing 'id', 'type', coordinates, font sizes, and texts, ONLY altering the single specific property or element the user requested!

2. SURGICAL ACTION EXAMPLES:
   - "change official to rashad" -> Find the element with "OFFICIAL", change text to "RASHAD". Keep ALL other elements 100% untouched.
   - "make ink red" -> Update inkColor to "#990000". Keep ALL elements 100% untouched.
   - "add two stars" -> Keep all existing elements intact and APPEND two 5-point star clipart elements on left and right.
   - "make border thicker" -> Increase strokeWidth on the existing border element only.

3. NEW STAMP CREATION (GENERATE_NEW):
   - If the canvas is empty OR if the user explicitly says "create a new stamp", "make a hospital stamp", "need ovel shape for hospital" or provides a completely new business description, you MUST set "action" to "GENERATE_NEW". 
   - When action is "GENERATE_NEW", you DO NOT need to output the "elements" array. The backend CAD Neural Engine will perfectly generate the geometric elements based on the prompt! Provide your response in the EXACT language used by the user.

4. VIEW CONTEXT AND A4 SHEET SETTINGS (UPDATE_A4_SETTINGS & ADD_A4_COPIES):
   - You will receive a "viewMode" property which can be "SINGLE" or "A4_SHEET".
   - If viewMode is "A4_SHEET", the user is currently looking at the A4 production page.
   - If the user asks to change A4 settings (e.g., "turn on laser invert", "mirror flip the sheet", "crop marks on aakku", "cut outlines off cheyyu"):
     - You MUST set "action" to "UPDATE_A4_SETTINGS".
     - Return the updated settings in an "a4Config" object inside the JSON root. (Use the existing a4Config provided to you as a base, toggle the boolean fields requested).
     - DO NOT output the "elements" array for this action.
   - If the user asks to add multiple copies of the stamp to the A4 sheet (e.g., "a4 il 10 copies arrange cheyyu", "add 5 stamps", "auto pack 20 copies"):
     - You MUST set "action" to "ADD_A4_COPIES".
     - Provide the number of copies requested in a "copies" integer field.
     - DO NOT output the "elements" array for this action.
   - However, if the user asks to change the *stamp design itself* while in A4 view (e.g., "change name to RASHAD"), treat it as a SURGICAL_EDIT normally.

OUTPUT FORMAT: Strict valid JSON only without markdown or backticks.
{
  "action": "CONVERSATION" | "SURGICAL_EDIT" | "GENERATE_NEW" | "UPDATE_A4_SETTINGS" | "ADD_A4_COPIES",
  "a4Config": { "laserInvert": boolean, "laserMirror": boolean, "showCropMarks": boolean, "showCutLines": boolean },
  "copies": number,
  "title": "Stamp Title",
  "shape": "ROUND" | "RECTANGULAR" | "OVAL" | "SQUARE",
  "widthMm": number,
  "heightMm": number,
  "inkColor": string,
  "reply": "Your intelligent response in the EXACT language of the user's prompt (English if user wrote English, Manglish if user wrote Manglish) as Clixio AI",
  "summary": "Concise explanation of exact surgical changes made",
  "suggestedFollowUps": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
  "elements": [...] // Only provide this if action is SURGICAL_EDIT or CONVERSATION (preserve original)
}`;

    const formattedContents: any[] = [];

    // Add previous multi-turn conversation memory if present
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6); // Keep last 6 turns for ultra-fast context
      for (const msg of recentHistory) {
        if (!msg.text) continue;
        const cleanText = msg.text.replace(/kadeeja/gi, 'Clixio').replace(/euyra/gi, 'Clixio').replace(/inkora/gi, 'Clixio');
        formattedContents.push({
          role: msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: cleanText }],
        });
      }
    }

    let detectedLanguage = 'ENGLISH';
    if (language === 'ENGLISH') {
      detectedLanguage = 'ENGLISH';
    } else if (language === 'MANGLISH') {
      detectedLanguage = 'MANGLISH';
    } else if (language === 'MALAYALAM') {
      detectedLanguage = 'MALAYALAM';
    } else {
      const isMalayalamScript = /[\u0D00-\u0D7F]/.test(prompt);
      const isHindiScript = /[\u0900-\u097F]/.test(prompt);
      const isManglish = /(?:aaku|aakku|maattu|maatti|pakaram|cheyyu|nokk|venam|chuvapp|pacha|karupp|vattam|chathuram|katti|idumo|para|ini|ith|njan|ningal|enth|enthokke|nallath|kollam|adipoli|sugam|nanni|polichu|para|parayoo|paranja|venda|aano|ano|undo|machane)/i.test(prompt);
      detectedLanguage = isMalayalamScript ? 'MALAYALAM' : isHindiScript ? 'HINDI' : isManglish ? 'MANGLISH' : 'ENGLISH';
    }

    const languageInstruction = detectedLanguage === 'ENGLISH'
      ? 'CRITICAL MANDATORY INSTRUCTION: You MUST reply in 100% PURE, PROFESSIONAL ENGLISH ONLY. DO NOT use ANY Malayalam or Manglish words (never use words like "machane", "njan", "adipoli", "set aakkam", "parayu").'
      : detectedLanguage === 'MANGLISH'
      ? 'CRITICAL MANDATORY INSTRUCTION: Reply in natural, friendly Manglish.'
      : `CRITICAL MANDATORY INSTRUCTION: Reply in ${detectedLanguage}.`;

    // Add current user prompt with live canvas snapshot
    formattedContents.push({
      role: 'user',
      parts: [
        {
          text: `[Active Canvas Snapshot: ${hasExistingElements ? JSON.stringify(currentDesign) : 'EMPTY'}]\n[Active View Mode: ${viewMode || 'SINGLE'}]\n[Active A4 Config: ${JSON.stringify(a4Config || {})}]\n[LANGUAGE REQUIREMENT: ${detectedLanguage}]\n${languageInstruction}\n\nUser Request: ${prompt}`,
        },
      ],
    });

    const fastModels = ['gemini-3.6-flash', 'gemini-flash-latest'];
    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of fastModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        });

        const result = await model.generateContent({ contents: formattedContents });
        const response = result.response;
        const text = response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed && typeof parsed.reply === 'string') {
              parsed.reply = parsed.reply.replace(/kadeeja/gi, 'Clixio').replace(/euyra/gi, 'Clixio').replace(/inkora/gi, 'Clixio');
            }
            if (parsed && typeof parsed.summary === 'string') {
              parsed.summary = parsed.summary.replace(/kadeeja/gi, 'Clixio').replace(/euyra/gi, 'Clixio').replace(/inkora/gi, 'Clixio');
            }
            return parsed;
          } catch (e) {
            console.error('Failed to parse Gemini JSON output:', e);
            continue;
          }
        }
      } catch (e: any) {
        console.warn(`Fast model ${modelName} error:`, e.message || e);
        continue;
      }
    }

    return null;
  }

  /**
   * High-Speed Neural Refinement & Geometric Morphing Engine with Human-Like Conversational Responses
   */
  private static heuristicRefineEngine(prompt: string, currentDesign: any, language?: string): AiStampGeneratedPayload {
    const lower = prompt.toLowerCase();
    const isExplicitEnglish = language === 'ENGLISH' || (!language && !/(?:aaku|aakku|maattu|maatti|pakaram|cheyyu|nokk|venam|chuvapp|pacha|karupp|vattam|chathuram|katti|idumo|para|ini|ith)/i.test(prompt));
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

    const isExplicitEnglish = language === 'ENGLISH' || (!language && !/(?:aaku|aakku|maattu|maatti|pakaram|cheyyu|nokk|venam|chuvapp|pacha|karupp|vattam|chathuram|katti|idumo|para|ini|ith|njan|ningal|enth|enthokke|nallath|kollam|adipoli|sugam|nanni|polichu|para|parayoo|paranja|venda)/i.test(rawPrompt));
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
