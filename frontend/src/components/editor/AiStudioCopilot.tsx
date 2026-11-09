'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { LiquidAiLoader } from '../common/LiquidAiLoader';
import { AiOrbIcon } from './AiOrbIcon';
import {
  ArrowUp,
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
} from 'lucide-react';

export const LANGUAGE_OPTIONS = [
  { id: 'AUTO', label: 'Auto Detect (Smart)', short: 'Auto', flag: '🌐' },
  { id: 'ENGLISH', label: 'English', short: 'English', flag: '🇬🇧' },
  { id: 'MANGLISH', label: 'Manglish (മലയാളം)', short: 'Manglish', flag: '🇮🇳' },
  { id: 'MALAYALAM', label: 'മലയാളം (Script)', short: 'മലയാളം', flag: '✍️' },
] as const;

export type LanguageMode = typeof LANGUAGE_OPTIONS[number]['id'];




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

    const step = Math.max(2, Math.ceil(text.length / 35));
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
  } = useEditor();

  const [prompt, setPrompt] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isTypingReply, setIsTypingReply] = useState<boolean>(false);
  const [lastGeneratedSummary, setLastGeneratedSummary] = useState<string | null>(null);
  const [showQuickSamples, setShowQuickSamples] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageMode>('AUTO'); // reply in whatever language the user types
  const [showLangMenu, setShowLangMenu] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [isDraggingCard, setIsDraggingCard] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number } | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating]);

  const handleGenerate = async (overridePrompt?: string) => {
    const textToRun = (overridePrompt || prompt).trim();
    if (!textToRun || isGenerating) return;

    const userMsgId = 'msg-' + Date.now();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        text: textToRun,
        timestamp: timeNow,
      },
    ];

    setMessages(updatedMessages);
    setPrompt('');
    setIsGenerating(true);
    setShowQuickSamples(false);
    setShowLangMenu(false);

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

      // Pass previous conversational memory turns
      const historyPayload = updatedMessages.slice(-6).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text,
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
        loadAiGeneratedStamp({
          title: data.title,
          shape: data.shape,
          widthMm: data.widthMm,
          heightMm: data.heightMm,
          inkColor: data.inkColor,
          elements: data.elements,
        });
      }

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
      // Append Assistant Conversational Memory Turn
      setMessages((prev) => [
        ...prev,
        {
          id: 'ai-' + Date.now(),
          role: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          summary: summaryText,
          shape: data.shape,
          widthMm: data.widthMm,
          heightMm: data.heightMm,
          inkColor: data.inkColor,
          suggestedFollowUps: data.suggestedFollowUps,
        },
      ]);

      setLastGeneratedSummary(summaryText);
      setTimeout(() => setLastGeneratedSummary(null), 3000);
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
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 leading-relaxed max-w-[220px]">
                Your intelligent stamp CAD assistant.<br/>
                Describe your stamp or choose from <span className="font-semibold text-indigo-600 dark:text-indigo-400">+ Presets</span> below!
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
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm px-3 py-1.5 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white text-[12px] leading-relaxed shadow-sm shadow-blue-500/20 font-medium">
                    {msg.text}
                  </div>
                ) : (
                  <div className="max-w-[94%] rounded-2xl rounded-bl-sm px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-[12px] leading-relaxed shadow-xs">
                    <TypewriterText
                      text={msg.text.replace(/kadeeja/gi, 'Clixio').replace(/euyra/gi, 'Clixio').replace(/inkora/gi, 'Clixio')}
                      isLatest={idx === messages.length - 1 && msg.role === 'assistant'}
                      onComplete={() => setIsTypingReply(false)}
                    />
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
                  setShowLangMenu(false);
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

              {/* Language Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowLangMenu(!showLangMenu);
                    setShowQuickSamples(false);
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700"
                  title="Select AI Response Language"
                >
                  <Languages className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                  <span>{LANGUAGE_OPTIONS.find((l) => l.id === selectedLanguage)?.short || 'Auto'}</span>
                  <ChevronDown className={`w-2.5 h-2.5 text-slate-400 dark:text-slate-500 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Language Dropdown Menu */}
                {showLangMenu && (
                  <div className="absolute bottom-[calc(100%+6px)] left-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1.5 z-50 flex flex-col gap-0.5 min-w-[170px] animate-in fade-in slide-in-from-bottom-1">
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1">
                      Response Language
                    </div>
                    {LANGUAGE_OPTIONS.map((lang) => {
                      const isSelected = selectedLanguage === lang.id;
                      return (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => {
                            setSelectedLanguage(lang.id);
                            setShowLangMenu(false);
                          }}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
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

