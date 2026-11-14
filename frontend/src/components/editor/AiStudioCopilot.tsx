'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { LiquidAiLoader } from '../common/LiquidAiLoader';
import { AiOrbIcon } from './AiOrbIcon';
import {
  ArrowUp,
  Pencil,
  Plus,
  Trash2,
  ChevronDown,
  Sparkles,
  Scale,
  Stethoscope,
  Building2,
  CheckCircle2,
  ArrowUpRight,
  Languages,
  Check,
  BadgeCheck,
} from 'lucide-react';
import { AiLanguagePicker, loadAiLanguage, type LanguageMode } from './AiLanguagePicker';
import { processLogoAdvanced, LOGO_EDIT_KEYS } from '../../lib/logo';
import { exportStamp, type ExportDesign, type ExportFormat } from '../../lib/stamp-export';
import { requireLogin } from '../../lib/require-login';
import { reshapeDesign } from '../../lib/shape-morph';
import { STAMP_MOUNT_PRESETS } from '../../lib/units';
import { useAuth } from '../../context/AuthContext';

export { type LanguageMode } from './AiLanguagePicker';




export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  summary?: string;
  shape?: string;
  widthMm?: number;
  heightMm?: number;
  inkColor?: string;
  suggestedFollowUps?: string[];
  /** AI messages: print problems found on the real stamp size (thin lines, tiny text…) */
  printWarnings?: string[];
  /** AI messages, new designs: the design itself + professional alternatives the user can switch between */
  variations?: Array<{ label: string; shape: any; widthMm: number; heightMm: number; inkColor: string; elements: any[] }>;
  /** AI messages: which of `variations` is on the canvas (0 = the original design) */
  activeVariation?: number;
  /** AI messages: result of a save / export the user asked for ("✓ Saved to your account") */
  actionNote?: string;
  /** user messages: how the AI understood it (spelling / short forms fixed) */
  understood?: string;
  /** user messages: the design as it was when this message was sent — editing the message goes back to it */
  designBefore?: {
    title: string;
    shape: any;
    widthMm: number;
    heightMm: number;
    inkColor: string;
    elements: any[];
  };
}

/**
 * Show "Understood as …" only when the AI really had to fix the message: most of the words in its
 * version are not in what the user typed (typos, short forms, Manglish). A message that was
 * already clear doesn't get a note.
 */
function needsUnderstoodNote(typed: string, understood: string): boolean {
  const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
  const mine = new Set(words(typed));
  const theirs = words(understood).filter((w) => !['the', 'and', 'for', 'with', 'make', 'please', 'this', 'that'].includes(w));
  if (!theirs.length) return false;
  const known = theirs.filter((w) => mine.has(w)).length;
  return known / theirs.length < 0.75;
}

const TypewriterText: React.FC<{ text: string; isLatest: boolean; onComplete?: () => void }> = ({ text, isLatest, onComplete }) => {
  const [displayedText, setDisplayedText] = useState(isLatest ? '' : text);
  const [isTyping, setIsTyping] = useState(isLatest);

  useEffect(() => {
    if (!isLatest) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    let i = 0;
    setDisplayedText('');
    setIsTyping(true);

    // fast: the whole reply is on screen in ~0.2 s, so the typing effect never feels like waiting
    const step = Math.max(3, Math.ceil(text.length / 16));
    const interval = setInterval(() => {
      i += step;
      if (i < text.length) {
        setDisplayedText(text.slice(0, i));
      } else {
        setDisplayedText(text);
        setIsTyping(false);
        if (onComplete) onComplete();
        clearInterval(interval);
      }
    }, 12);

    return () => clearInterval(interval);
  }, [text, isLatest]);

  return (
    <span>
      {displayedText}
      {isTyping && (
        <span className="inline-block w-1.5 h-3.5 ml-0.5 -mb-0.5 bg-indigo-500/80 animate-pulse rounded-xs" />
      )}
    </span>
  );
};

const QUICK_PROMPT_CHIPS = [
  {
    id: 'notary',
    title: 'Notary Seal',
    badge: '42mm Round',
    desc: 'Advocate seal with scales of justice',
    icon: Scale,
    prompt: 'Create a 42mm round notary seal for Advocate Rahul Sharma, High Court of Kerala, Scales of Justice in center, blue ink',
  },
  {
    id: 'doctor',
    title: 'Doctor Rx',
    badge: '47×18mm',
    desc: 'Medical practitioner signature & reg stamp',
    icon: Stethoscope,
    prompt: 'Make a rectangular 47x18mm Doctor stamp for Dr. Sneha Roy, MBBS MD Pediatrics, Reg No: 55421, green ink',
  },
  {
    id: 'corporate',
    title: 'Corporate Oval',
    badge: '55×35mm',
    desc: 'Company seal with authorized signatory',
    icon: Building2,
    prompt: 'Create an oval 55x35mm stamp for Apex Global Technologies Pvt Ltd, Authorized Signatory with double outer border',
  },
  {
    id: 'qc',
    title: 'QC Passed',
    badge: '30mm Square',
    desc: 'Quality inspection & verification badge',
    icon: CheckCircle2,
    prompt: 'Design a 30mm square QC inspection stamp with QC PASSED in center and Inspector No. 04',
  },
];

export const AiStudioCopilot: React.FC = () => {
  const {
    shape,
    widthMm,
    heightMm,
    inkColor,
    elements,
    projectTitle,
    loadAiGeneratedStamp,
    undo,
    canUndo,
    viewMode,
    a4Config,
    setA4Config,
    addMultipleToA4,
    selectedIds,
    saveProjectToCloud,
    laserInvert,
    laserMirror,
    setLaserInvert,
    setLaserMirror,
    switchCanvasShape,
  } = useEditor();
  const { user } = useAuth();
  // ids of the elements the AI changed last time — a follow-up like "make it bigger" means these
  const lastChangedIdsRef = useRef<string[]>([]);

  // ── Save / export asked for in the chat ──
  // The latest save function and design, read after the AI's edit has re-rendered (a function
  // captured before the edit would save / export the old design)
  const latestRef = useRef<{ save: () => Promise<string | null>; design: ExportDesign; realign: () => void }>(null as any);
  latestRef.current = {
    realign: () => switchCanvasShape(shape), // the current shape again = fix borders + re-align the layout
    save: saveProjectToCloud,
    design: { widthMm, heightMm, inkColor, elements, projectTitle, invert: laserInvert, mirror: laserMirror },
  };
  const noteOn = (msgId: string, note: string) =>
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, actionNote: m.actionNote ? `${m.actionNote} · ${note}` : note } : m)));
  const runRequestedActions = async (msgId: string, save: boolean, format?: ExportFormat) => {
    await new Promise((r) => setTimeout(r, 150)); // let this message's design change render first
    if (save) {
      if (!requireLogin(user, 'save')) {
        noteOn(msgId, 'Log in to save');
      } else {
        const id = await latestRef.current.save();
        noteOn(msgId, id ? '✓ Saved to your account' : 'Could not save — please try again');
      }
    }
    if (format) {
      if (!requireLogin(user, 'export')) {
        noteOn(msgId, 'Log in to export');
      } else {
        const ok = await exportStamp(format, latestRef.current.design).catch(() => false);
        noteOn(msgId, ok ? `✓ Downloaded ${format.toUpperCase()}` : `Could not make the ${format.toUpperCase()} — please try again`);
      }
    }
  };

  // ── Editing a sent message: put the design back to how it was, then resend from that point ──
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const submitEdit = (id: string) => {
    const idx = messages.findIndex((m) => m.id === id);
    const text = editText.trim();
    if (idx < 0 || !text || isGenerating) return;
    const msg = messages[idx];
    setEditingId(null);
    const restored = msg.designBefore
      ? { ...msg.designBefore, elements: JSON.parse(JSON.stringify(msg.designBefore.elements)) }
      : undefined;
    if (restored) loadAiGeneratedStamp(restored);
    lastChangedIdsRef.current = [];
    // the message and everything after it is replaced by the edited message and its new reply,
    // worked out on the restored design
    handleGenerate(text, messages.slice(0, idx), restored);
  };

  const [prompt, setPrompt] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isTypingReply, setIsTypingReply] = useState<boolean>(false);
  const [lastGeneratedSummary, setLastGeneratedSummary] = useState<string | null>(null);
  const [showQuickSamples, setShowQuickSamples] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageMode>('AUTO'); // reply in whatever language the user types
  useEffect(() => setSelectedLanguage(loadAiLanguage()), []); // remembered choice
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating]);

  const liveDesign = (): NonNullable<ChatMessage['designBefore']> => ({ title: projectTitle, shape, widthMm, heightMm, inkColor, elements });

  // `baseMessages`: the conversation to continue from — an edited message replaces itself and
  // everything after it, so the chat continues from just before it.
  // `designOverride`: the design to work on (an edited message: the design as it was back then —
  // the editor's state hasn't updated yet in this same moment)
  const handleGenerate = async (overridePrompt?: string, baseMessages?: ChatMessage[], designOverride?: ChatMessage['designBefore']) => {
    const textToRun = (overridePrompt || prompt).trim();
    if (!textToRun || isGenerating) return;
    const base = baseMessages ?? messages;
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const { title: projectTitle, shape, widthMm, heightMm, inkColor, elements } = designOverride ?? liveDesign();

    const userMsgId = 'msg-' + Date.now();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedMessages: ChatMessage[] = [
      ...base,
      {
        id: userMsgId,
        role: 'user',
        text: textToRun,
        timestamp: timeNow,
        designBefore: {
          title: projectTitle,
          shape,
          widthMm,
          heightMm,
          inkColor,
          elements: JSON.parse(JSON.stringify(elements)),
        },
      },
    ];

    setMessages(updatedMessages);
    setPrompt('');
    setIsGenerating(true);
    setShowQuickSamples(false);

    try {
      const getBackendUrl = () => {
        if (process.env.NEXT_PUBLIC_API_URL) {
          return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '');
        }
        if (typeof window !== 'undefined') {
          return `http://${window.location.hostname || 'localhost'}:5000`;
        }
        return 'http://localhost:5000';
      };

      const backendUrl = getBackendUrl();
      const endpoint = '/api/v1/ai/generate-stamp';

      // Earlier turns of this chat (NOT the new message — that is sent as `prompt`), so the AI reads a
      // follow-up like "make it bigger" / "athu red aakku" / "ok, design it" in context. For its own
      // turns it also gets what it changed, not only what it said.
      const historyPayload = base.slice(-10).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        text:
          m.role !== 'user' && m.summary && m.summary !== m.text && !/busy|limit/i.test(m.summary)
            ? `${m.text}\n[What I changed: ${m.summary}]`
            : m.text,
      }));

      const payload = {
        prompt: textToRun,
        history: historyPayload,
        viewMode, // Tell backend what context the user is currently looking at
        currentDesign: {
          shape,
          widthMm,
          heightMm,
          inkColor,
          projectTitle,
          elements,
          // what "it" / "that" / "athu" most likely means in a follow-up message
          lastChangedIds: lastChangedIdsRef.current.filter((id) => elements.some((e) => e.id === id)),
          selectedIds,
        },
        a4Config,
        language: selectedLanguage,
      };

      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`AI generation returned status ${res.status}`);
      }

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.message || 'No vector data returned from AI');
      }

      const data = json.data;

      // Check if AI responded with A4 setting updates
      if (data.action === 'UPDATE_A4_SETTINGS' && data.a4Config) {
        setA4Config(data.a4Config);
      }
      // Check if AI wants to add copies to A4
      else if (data.action === 'ADD_A4_COPIES' && data.copies) {
        addMultipleToA4(data.copies);
      }
      // Update Canvas CAD state if elements were generated or updated
      else if (Array.isArray(data.elements) && data.elements.length > 0) {
        // A logo whose stamp settings the AI changed (simplify, line weight, ink amount…) is
        // re-traced here, so the canvas shows the new silhouette — same centre and height
        const oldById = new Map(elements.map((e) => [e.id, e as any]));
        for (const el of data.elements as any[]) {
          if (el?.type !== 'image' || !el.src) continue;
          delete el.note;
          const old = oldById.get(el.id);
          const settingsChanged = !old || LOGO_EDIT_KEYS.some((k) => JSON.stringify(el[k]) !== JSON.stringify(old[k]));
          if (!settingsChanged && el.maskSrc) continue;
          try {
            const edit = Object.fromEntries(LOGO_EDIT_KEYS.filter((k) => el[k] !== undefined).map((k) => [k, el[k]]));
            const { maskSrc, aspect } = await processLogoAdvanced(el.src, edit);
            const cx = el.x + el.width / 2;
            const cy = el.y + el.height / 2;
            const w = +(el.height * aspect).toFixed(2); // keep proportions: width follows the traced shape
            Object.assign(el, { maskSrc, width: w, x: +(cx - w / 2).toFixed(2), y: +(cy - el.height / 2).toFixed(2) });
          } catch {
            /* keep the previous silhouette */
          }
        }
        // remember which elements this answer added or changed
        // An edit that changes the stamp shape or size ("make it round", "45 mm"): the design itself
        // follows — borders, inner rings and text take the new shape (not only the background)
        if (data.action !== 'GENERATE_NEW') {
          const newShape = data.shape || shape;
          const sizeChanged =
            (data.widthMm && Math.abs(data.widthMm - widthMm) > 0.05) || (data.heightMm && Math.abs(data.heightMm - heightMm) > 0.05);
          if (newShape !== shape || sizeChanged) {
            const r = reshapeDesign(
              data.elements,
              { shape, widthMm, heightMm },
              { shape: newShape, widthMm: data.widthMm, heightMm: data.heightMm },
              STAMP_MOUNT_PRESETS
            );
            data.shape = newShape;
            data.elements = r.elements;
            data.widthMm = r.widthMm;
            data.heightMm = r.heightMm;
          }
        }
        const before = new Map(elements.map((e) => [e.id, JSON.stringify(e)]));
        lastChangedIdsRef.current = data.elements
          .filter((e: any) => before.get(e.id) !== JSON.stringify(e))
          .map((e: any) => e.id);
        // anything the answer didn't set (ink, shape, size) stays as it is on the canvas
        loadAiGeneratedStamp({
          title: data.title,
          shape: data.shape || shape,
          widthMm: data.widthMm || widthMm,
          heightMm: data.heightMm || heightMm,
          inkColor: data.inkColor || inkColor,
          elements: data.elements,
        });
      }

      // negative (white on ink) / mirrored-for-engraving output, when the user asked for it
      if (typeof data.laserInvert === 'boolean') setLaserInvert(data.laserInvert);
      if (typeof data.laserMirror === 'boolean') setLaserMirror(data.laserMirror);

      const cleanAiName = (str: string) => {
        if (!str || typeof str !== 'string') return '';
        return str
          .replace(/kadeeja/gi, 'Clixio')
          .replace(/euyra/gi, 'Clixio')
          .replace(/inkora/gi, 'Clixio');
      };

      const rawReply = data.reply || data.summary || `Updated ${data.shape || shape} stamp design on canvas.`;
      const replyText = cleanAiName(rawReply);
      const summaryText = cleanAiName(data.summary || replyText);

      setIsTypingReply(true);
      // Append Assistant Conversational Memory Turn (and note how the AI understood the user's message)
      const understood = typeof data.understood === 'string' ? data.understood.trim() : '';
      const aiMsgId = 'ai-' + Date.now();
      setMessages((prev) => [
        ...prev.map((m) => (m.id === userMsgId && understood ? { ...m, understood } : m)),
        {
          id: aiMsgId,
          role: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          summary: summaryText,
          shape: data.shape,
          widthMm: data.widthMm,
          heightMm: data.heightMm,
          inkColor: data.inkColor,
          suggestedFollowUps: data.suggestedFollowUps,
          printWarnings: Array.isArray(data.printWarnings) ? data.printWarnings : undefined,
          // first entry = the design just placed on the canvas, so the user can switch back to it
          variations:
            Array.isArray(data.variations) && data.variations.length && Array.isArray(data.elements)
              ? [
                  { label: 'Original', shape: data.shape, widthMm: data.widthMm, heightMm: data.heightMm, inkColor: data.inkColor, elements: data.elements },
                  ...data.variations,
                ]
              : undefined,
          activeVariation: 0,
        },
      ]);

      setLastGeneratedSummary(summaryText);
      setTimeout(() => setLastGeneratedSummary(null), 3000);

      // "correct the alignment" → the editor re-aligns the layout (after this answer is on the canvas)
      if (data.doRealign) {
        window.setTimeout(() => {
          const before = JSON.stringify(latestRef.current.design.elements);
          latestRef.current.realign();
          // honest result: say when there was nothing to move
          window.setTimeout(() => {
            if (JSON.stringify(latestRef.current.design.elements) === before) noteOn(aiMsgId, 'Already aligned — nothing needed to move');
          }, 200);
        }, 150);
      }

      // "save" / "export" asked in the chat → do it (after any edit from this same message is on the canvas)
      if (data.doSave || data.doExport) runRequestedActions(aiMsgId, !!data.doSave, data.doExport);
    } catch (err: any) {
      console.warn('AI Network/Engine Warning, executing smart offline fallback:', err);
      // Smart offline fallback
      const lower = textToRun.toLowerCase();
      const isRect = lower.includes('rect') || lower.includes('doctor') || lower.includes('box');
      const isOval = lower.includes('oval') || lower.includes('ovel') || lower.includes('ellipse');
      const shapeVal = isRect ? 'RECTANGULAR' : isOval ? 'OVAL' : 'ROUND';
      const w = isRect ? 47 : isOval ? 55 : 42;
      const h = isRect ? 18 : isOval ? 35 : 42;
      const ink = lower.includes('red') ? '#990000' : lower.includes('black') ? '#111827' : lower.includes('green') ? '#007A3D' : '#003399';

      const fallbackElements = isRect
        ? [
            { id: 'f-rect', type: 'rect', x: 1, y: 1, width: 45, height: 16, strokeWidth: 0.6, strokeType: 'solid', visible: true },
            { id: 'f-t1', type: 'text', text: textToRun.toUpperCase().slice(0, 30), x: 23.5, y: 6, fontSize: 3.2, fontWeight: 'bold', visible: true },
            { id: 'f-t2', type: 'text', text: 'OFFICIAL STAMP', x: 23.5, y: 11, fontSize: 2.6, fontWeight: '500', visible: true },
          ]
        : isOval
        ? [
            { id: 'f-ov1', type: 'oval', cx: 27.5, cy: 17.5, rx: 26, ry: 16, strokeWidth: 0.8, strokeType: 'solid', visible: true },
            { id: 'f-ov2', type: 'oval', cx: 27.5, cy: 17.5, rx: 24, ry: 14, strokeWidth: 0.35, strokeType: 'solid', visible: true },
            { id: 'f-arc1', type: 'arc-text', text: textToRun.toUpperCase().slice(0, 30), cx: 27.5, cy: 17.5, radius: 17.5, startAngle: -140, sweepAngle: 280, fontSize: 3.2, fontWeight: 'bold', isReversed: false, visible: true },
            { id: 'f-txt', type: 'text', text: 'AUTHORIZED SIGNATORY', x: 27.5, y: 17.5, fontSize: 3.5, fontWeight: 'bold', visible: true },
          ]
        : [
            { id: 'f-r1', type: 'ring', cx: 21, cy: 21, radius: 19.5, strokeWidth: 0.8, strokeType: 'solid', visible: true },
            { id: 'f-r2', type: 'ring', cx: 21, cy: 21, radius: 18.2, strokeWidth: 0.35, strokeType: 'solid', visible: true },
            { id: 'f-arc1', type: 'arc-text', text: textToRun.toUpperCase().slice(0, 32), cx: 21, cy: 21, radius: 14.5, startAngle: -140, sweepAngle: 280, fontSize: 3.3, fontWeight: 'bold', isReversed: false, visible: true },
            { id: 'f-txt', type: 'text', text: 'OFFICIAL SEAL', x: 21, y: 21, fontSize: 3.5, fontWeight: 'bold', visible: true },
          ];

      loadAiGeneratedStamp({
        title: 'AI Stamp Design',
        shape: shapeVal as any,
        widthMm: w,
        heightMm: h,
        inkColor: ink,
        elements: fallbackElements as any,
      });

      const fallbackReply = `I've updated your stamp to ${shapeVal} (${w}x${h}mm) with customized vector layers.`;

      setIsTypingReply(true);
      setMessages((prev) => [
        ...prev,
        {
          id: 'ai-' + Date.now(),
          role: 'assistant',
          text: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          summary: `Updated design with ${shapeVal} layout.`,
          shape: shapeVal,
          widthMm: w,
          heightMm: h,
          inkColor: ink,
          suggestedFollowUps: ['Make Border Thicker', 'Change Ink to Red', 'Add Two Stars'],
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleHeaderPointerDown = (e: React.PointerEvent) => {
    // Ignore clicks on buttons/interactive elements
    if ((e.target as HTMLElement).closest('button, input, textarea, a')) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDraggingCard(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: dragOffset.x,
      initialY: dragOffset.y,
    };
  };

  const handleHeaderPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingCard || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    setDragOffset({
      x: dragStartRef.current.initialX + dx,
      y: dragStartRef.current.initialY + dy,
    });
  };

  const handleHeaderPointerUp = (e: React.PointerEvent) => {
    if (isDraggingCard) {
      setIsDraggingCard(false);
      dragStartRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleClearMemory = () => {
    setMessages([]);
    setLastGeneratedSummary(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#fafaf8] dark:bg-slate-950 select-none">

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto px-3.5 py-2.5 space-y-2 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 pb-8 px-4 text-center">
            {/* Welcome State */}
            <div className="shadow-2xl shadow-blue-500/20 mb-2 relative">
              <AiOrbIcon className="w-16 h-16" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-base">Clixio AI</p>
              <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e5f2ff] dark:bg-blue-950/60 text-[#0d99ff] text-[10.5px] font-semibold">
                <BadgeCheck className="w-3 h-3" />
                Expert Stamp Design Specialist
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 leading-relaxed max-w-[230px]">
                Company seals, doctor, notary &amp; school stamps — tell me what you need and I’ll design it the professional way.<br/>
                Or pick from <span className="font-semibold text-indigo-600 dark:text-indigo-400">+ Presets</span> below.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {msg.role === 'user' ? (
                  editingId === msg.id ? (
                    /* Editing a sent message */
                    <div className="w-[92%] rounded-2xl rounded-br-sm p-2 bg-white dark:bg-slate-900 border border-[#0d99ff] shadow-sm fx-pop-in">
                      <textarea
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            submitEdit(msg.id);
                          }
                          if (e.key === 'Escape') setEditingId(null);
                          e.stopPropagation();
                        }}
                        rows={Math.min(5, Math.max(2, Math.ceil(editText.length / 34)))}
                        aria-label="Edit your message"
                        className="w-full resize-none bg-transparent outline-none text-[12px] leading-relaxed text-slate-800 dark:text-slate-100 px-1"
                      />
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 pl-1">
                          {msg.designBefore ? 'Design goes back to before this message' : ''}
                        </span>
                        <span className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="h-7 px-2.5 rounded-lg text-[11.5px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => submitEdit(msg.id)}
                            disabled={!editText.trim() || isGenerating}
                            className="h-7 px-3 rounded-lg text-[11.5px] font-semibold text-white bg-[#0d99ff] hover:bg-[#0b87e0] disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                            Send
                          </button>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="group/msg flex items-center gap-1 max-w-[92%] justify-end">
                      {!isGenerating && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(msg.id);
                            setEditText(msg.text);
                          }}
                          title="Edit message"
                          aria-label="Edit message"
                          className="w-6 h-6 shrink-0 rounded-md flex items-center justify-center text-slate-400 hover:text-[#0d99ff] hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover/msg:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div className="rounded-2xl rounded-br-sm px-3 py-1.5 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white text-[12px] leading-relaxed shadow-sm shadow-blue-500/20 font-medium">
                        {msg.text}
                      </div>
                    </div>
                  )
                ) : null}
                {/* The AI fixed the message itself (typos, short forms, mixed words) — show what it understood */}
                {msg.role === 'user' && editingId !== msg.id && msg.understood && needsUnderstoodNote(msg.text, msg.understood) && (
                  <p className="mt-1 mr-1 max-w-[90%] text-right text-[10.5px] leading-snug text-slate-400 dark:text-slate-500 fx-pop-in">
                    <Check className="inline w-3 h-3 -mt-0.5 mr-0.5 text-emerald-500" />
                    Understood as: <span className="text-slate-500 dark:text-slate-400">{msg.understood}</span>
                  </p>
                )}
                {msg.role === 'user' ? null : (
                  <div className="max-w-[94%] rounded-2xl rounded-bl-sm px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-[12px] leading-relaxed shadow-xs">
                    <TypewriterText
                      text={msg.text.replace(/kadeeja/gi, 'Clixio').replace(/euyra/gi, 'Clixio').replace(/inkora/gi, 'Clixio')}
                      isLatest={idx === messages.length - 1 && msg.role === 'assistant'}
                      onComplete={() => setIsTypingReply(false)}
                    />
                    {/* Print check on the real stamp size */}
                    {msg.printWarnings && msg.printWarnings.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {msg.printWarnings.map((w) => (
                          <li key={w} className="flex items-start gap-1 text-[10.5px] leading-snug text-amber-700 dark:text-amber-400">
                            <span aria-hidden className="mt-px">⚠</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {/* Other professional styles of a new design — same texts, pick one */}
                    {msg.variations && msg.variations.length > 1 && idx === messages.length - 1 && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-0.5">
                          Other styles
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {msg.variations.map((v, i) => {
                            const active = (msg.activeVariation ?? 0) === i;
                            return (
                              <button
                                key={i}
                                type="button"
                                disabled={isGenerating}
                                aria-pressed={active}
                                onClick={() => {
                                  loadAiGeneratedStamp({
                                    title: projectTitle,
                                    shape: v.shape,
                                    widthMm: v.widthMm,
                                    heightMm: v.heightMm,
                                    inkColor: v.inkColor,
                                    elements: JSON.parse(JSON.stringify(v.elements)),
                                  });
                                  lastChangedIdsRef.current = [];
                                  setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, activeVariation: i } : m)));
                                }}
                                className={`px-2 py-1 rounded-lg border text-[10.5px] font-medium transition-colors cursor-pointer ${
                                  active
                                    ? 'bg-indigo-500 border-indigo-500 text-white'
                                    : 'bg-slate-50/90 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40'
                                }`}
                              >
                                {v.label}
                                <span className={`ml-1 ${active ? 'text-indigo-100' : 'text-slate-400'}`}>
                                  {v.widthMm}×{v.heightMm}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {/* Result of a save / export asked for in the chat */}
                    {msg.actionNote && (
                      <p
                        className={`mt-1.5 text-[11px] font-semibold fx-pop-in ${
                          msg.actionNote.includes('✓') && !/could not|log in/i.test(msg.actionNote)
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {msg.actionNote}
                      </p>
                    )}
                    {/* Suggested Follow-ups (Compact & Sleek) */}
                    {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && idx === messages.length - 1 && (
                      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                        <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-0.5 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                          Suggested Next Steps
                        </span>
                        <div className="flex flex-col gap-1">
                          {msg.suggestedFollowUps.map((s, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => { setPrompt(s); handleGenerate(s); }}
                              disabled={isGenerating}
                              className="group text-left px-2.5 py-1.5 rounded-lg bg-slate-50/90 dark:bg-slate-800/60 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-200/70 dark:border-slate-700 hover:border-indigo-300 transition-all duration-150 cursor-pointer flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="w-4 h-4 rounded-md bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                  <Sparkles className="w-2 h-2" />
                                </div>
                                <span className="text-[11px] text-slate-700 dark:text-slate-200 font-medium group-hover:text-indigo-950 dark:group-hover:text-indigo-200 transition-colors leading-tight truncate">
                                  {s}
                                </span>
                              </div>
                              <ArrowUpRight className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isGenerating && (
              <div className="flex items-start">
                <div className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm shadow-xs flex items-center gap-2">
                  <LiquidAiLoader size={0.45} colorOne="#6366f1" colorTwo="#38bdf8" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Clixio is thinking…</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </>
        )}
      </div>

      {/* Input Area - Pinned to Bottom */}
      <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 relative">
        {/* Floating Presets Popover Menu - Positioned ABOVE the input */}
        {showQuickSamples && (
          <div className="absolute bottom-[calc(100%+8px)] left-3 right-3 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-indigo-500/15 p-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Prompt Presets
              </span>
              <button
                type="button"
                onClick={() => setShowQuickSamples(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-xs p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-0.5">
              {QUICK_PROMPT_CHIPS.map((chip) => {
                const Icon = chip.icon;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      setPrompt(chip.prompt);
                      handleGenerate(chip.prompt);
                      setShowQuickSamples(false);
                    }}
                    disabled={isGenerating}
                    className="group text-left p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center gap-2.5 cursor-pointer shadow-2xs"
                  >
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 shrink-0 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {chip.title}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-700">
                          {chip.badge}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                        {chip.desc}
                      </p>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Clear button */}
        {messages.length > 0 && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{messages.length} memory turns</span>
            <button
              type="button"
              onClick={() => { setMessages([]); setLastGeneratedSummary(null); }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[10px] font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-2.5 h-2.5" />
              Clear
            </button>
          </div>
        )}

        {/* Input Box */}
        <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm focus-within:border-indigo-400 focus-within:shadow-md focus-within:shadow-indigo-500/10 transition-all">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            rows={2}
            placeholder={
              isGenerating
                ? 'Computing CAD layers…'
                : messages.length > 0
                ? 'Follow up (e.g. make ink red, add stars, change name…)'
                : 'Describe your stamp to Clixio AI (e.g. 42mm round notary seal)...'
            }
            className="w-full bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-normal text-sm leading-relaxed outline-none resize-none border-none px-3.5 pt-3 pb-2 focus:ring-0 disabled:opacity-50 rounded-2xl"
          />
          <div className="flex items-center justify-between px-3 pb-2.5">
            <div className="flex items-center gap-1.5">
              {/* Presets Button */}
              <button
                type="button"
                onClick={() => {
                  setShowQuickSamples(!showQuickSamples);
                              }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  showQuickSamples
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Plus className={`w-3 h-3 transition-transform ${showQuickSamples ? 'rotate-45' : ''}`} />
                Presets
                <ChevronDown className={`w-3 h-3 transition-transform ${showQuickSamples ? 'rotate-180' : ''}`} />
              </button>

              {/* Reply language: Auto, English, every Indian language (script or mixed with English) */}
              <AiLanguagePicker value={selectedLanguage} onChange={setSelectedLanguage} onOpen={() => setShowQuickSamples(false)} />
            </div>

            {/* Send Button */}
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={!prompt.trim() || isGenerating || isTypingReply}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 disabled:opacity-50 text-white flex items-center justify-center transition-all duration-200 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-indigo-500/30 hover:scale-105 active:scale-95 shrink-0 overflow-hidden"
              title="Send to AI (Enter)"
            >
              {(isGenerating || isTypingReply) ? (
                <div className="scale-90">
                  <LiquidAiLoader size={0.45} colorOne="#ffffff" colorTwo="#38bdf8" />
                </div>
              ) : (
                <ArrowUp className="w-4 h-4 text-white" strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

