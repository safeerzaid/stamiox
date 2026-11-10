'use client';

import React, { useState } from 'react';
import {
  X,
  Lightbulb,
  Sparkles,
  Send,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';

export type SupportType = 'REQUIREMENT' | 'SUGGESTION';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: SupportType;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'REQUIREMENT',
}) => {
  const [type, setType] = useState<SupportType>(defaultType);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setErrorMsg('Please enter both subject and message.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          subject: subject.trim(),
          message: message.trim(),
          email: email.trim() || undefined,
          userMeta: {
            url: typeof window !== 'undefined' ? window.location.href : '',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmittedTicketId(data.ticketId);
      } else {
        setErrorMsg(data.error || 'Failed to submit. Please try again.');
      }
    } catch (err) {
      console.warn('Backend request failed, saving locally:', err);
      const localId = `${type === 'REQUIREMENT' ? 'REQ' : 'SUG'}-${Date.now().toString(36).toUpperCase()}`;
      try {
        const existing = JSON.parse(localStorage.getItem('stamiox_support_drafts') || '[]');
        existing.unshift({ id: localId, type, subject, message, email, date: new Date().toISOString() });
        localStorage.setItem('stamiox_support_drafts', JSON.stringify(existing));
      } catch {}
      setSubmittedTicketId(localId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedTicketId(null);
    setSubject('');
    setMessage('');
    setEmail('');
    setErrorMsg(null);
  };

  const handleWhatsAppChat = () => {
    const text = encodeURIComponent(
      `Hi Stamiox Team,\n\nI have a ${type === 'REQUIREMENT' ? 'Requirement' : 'Suggestion'}:\n` +
      `*Subject:* ${subject || '(Not specified)'}\n` +
      `*Details:* ${message || '(Not specified)'}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Support & Feedback"
        className="fx-menu relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ring-1 ring-slate-200/90 dark:ring-slate-800 p-5 text-slate-800 dark:text-slate-100 flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0d99ff] animate-pulse" />
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
              Support & Feedback
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 -mr-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {submittedTicketId ? (
          /* Catchy Success Screen */
          <div className="py-6 flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center ring-4 ring-emerald-50/60 dark:ring-emerald-950/20">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {type === 'REQUIREMENT' ? 'Requirement Received!' : 'Suggestion Received!'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ticket <strong className="text-[#0d99ff] font-mono">{submittedTicketId}</strong> created.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 w-full">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 h-9 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Send Another
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-9 rounded-xl bg-[#0d99ff] hover:bg-[#0b87e0] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Sleek Catchy Form */
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Catchy Pill Switcher (Requirement vs Suggestion) */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setType('REQUIREMENT')}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'REQUIREMENT'
                    ? 'bg-white dark:bg-slate-900 text-[#0d99ff] shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0d99ff]" />
                <span>Requirement</span>
              </button>
              <button
                type="button"
                onClick={() => setType('SUGGESTION')}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  type === 'SUGGESTION'
                    ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Suggestion</span>
              </button>
            </div>

            {/* Combined Clean Card Container for Subject + Message */}
            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 focus-within:border-[#0d99ff] focus-within:ring-2 focus-within:ring-[#0d99ff]/15 focus-within:bg-white dark:focus-within:bg-slate-850 transition-all space-y-2">
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={
                  type === 'REQUIREMENT'
                    ? 'What requirement do you need?'
                    : 'What is your suggestion or idea?'
                }
                className="w-full text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal bg-transparent outline-none"
              />
              <div className="h-px bg-slate-200/60 dark:bg-slate-700/60" />
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain the details, dimensions, or workflow..."
                className="w-full text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 bg-transparent outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Optional Contact Input */}
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email or phone (optional, for follow-up)"
              className="w-full h-8 px-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 focus:bg-white dark:focus:bg-slate-800 focus:border-[#0d99ff] text-[11px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none transition-colors"
            />

            {/* Error Message if any */}
            {errorMsg && (
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-[11px] text-rose-600 dark:text-rose-400">
                {errorMsg}
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full h-10 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.99] disabled:opacity-70 ${
                type === 'REQUIREMENT'
                  ? 'bg-[#0d99ff] hover:bg-[#0b87e0] shadow-[0_4px_14px_-3px_rgba(13,153,255,0.6)]'
                  : 'bg-amber-500 hover:bg-amber-600 shadow-[0_4px_14px_-3px_rgba(245,158,11,0.6)]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isSubmitting
                  ? 'Sending…'
                  : type === 'REQUIREMENT'
                  ? 'Submit Requirement'
                  : 'Submit Suggestion'}
              </span>
            </button>

            {/* WhatsApp Alternative */}
            <div className="pt-1 flex items-center justify-center">
              <button
                type="button"
                onClick={handleWhatsAppChat}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Or chat instantly on WhatsApp ↗</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
