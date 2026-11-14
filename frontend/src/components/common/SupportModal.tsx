'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Send, CheckCircle2, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSmoothClose } from '../../hooks/useSmoothClose';

export type SupportType = 'REQUIREMENT' | 'SUGGESTION';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: SupportType;
}

const TYPES: { id: SupportType; label: string; placeholder: string }[] = [
  { id: 'REQUIREMENT', label: 'I need something', placeholder: 'Tell us what you need — a stamp size, a feature, a problem you hit…' },
  { id: 'SUGGESTION', label: 'I have an idea', placeholder: 'Tell us your idea to make Stamiox better…' },
];

/** Help & support: one message box, sent to the team (or via WhatsApp). */
export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, defaultType = 'REQUIREMENT' }) => {
  const { user } = useAuth();
  const [type, setType] = useState<SupportType>(defaultType);
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const { closing, close } = useSmoothClose(onClose, isOpen);

  // signed-in people are contacted on their account details — no need to type them
  const accountContact = (user as any)?.mobile || (user?.email && !String(user.email).endsWith('.local') ? user.email : '') || '';

  useEffect(() => {
    if (!isOpen) return;
    setType(defaultType);
    const t = window.setTimeout(() => textRef.current?.focus(), 120);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, defaultType, close]);

  if (!isOpen) return null;

  const current = TYPES.find((t) => t.id === type)!;
  const text = message.trim();
  // the first line becomes the ticket's subject
  const subject = (text.split('\n')[0] || '').slice(0, 80);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) {
      setErrorMsg('Please write a short message.');
      textRef.current?.focus();
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    const email = (accountContact || contact).trim() || undefined;
    try {
      const res = await fetch('http://localhost:5000/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          subject,
          message: text,
          email,
          userMeta: {
            url: window.location.href,
            userAgent: navigator.userAgent,
            username: (user as any)?.username,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) setTicketId(data.ticketId);
      else setErrorMsg(data.error || 'Could not send. Please try again.');
    } catch {
      // offline: keep it in this browser so nothing is lost
      const localId = `${type === 'REQUIREMENT' ? 'REQ' : 'SUG'}-${Date.now().toString(36).toUpperCase()}`;
      try {
        const existing = JSON.parse(localStorage.getItem('stamiox_support_drafts') || '[]');
        existing.unshift({ id: localId, type, subject, message: text, email, date: new Date().toISOString() });
        localStorage.setItem('stamiox_support_drafts', JSON.stringify(existing));
      } catch {
        /* ignore */
      }
      setTicketId(localId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setTicketId(null);
    setMessage('');
    setErrorMsg(null);
  };

  const openWhatsApp = () => {
    const msg = encodeURIComponent(`Hi Stamiox team,\n\n${text || (type === 'REQUIREMENT' ? 'I need help with…' : 'I have an idea…')}`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank', 'noopener');
  };

  return (
    <div
      onMouseDown={(e) => e.target === e.currentTarget && close()}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm fx-modal-backdrop ${closing ? 'fx-modal-closing' : ''}`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-title"
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 text-slate-800 dark:text-slate-100 fx-modal-open"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="support-title" className="text-[16px] font-semibold text-slate-900 dark:text-white">
              {ticketId ? 'Thanks — message sent' : 'How can we help?'}
            </h3>
            {!ticketId && <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">We usually reply within a day.</p>}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="w-8 h-8 -mr-1.5 -mt-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {ticketId ? (
          <div className="pt-5 flex flex-col items-center text-center gap-3">
            <span className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </span>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              Your reference is <strong className="font-mono text-slate-800 dark:text-slate-100">{ticketId}</strong>
            </p>
            <div className="flex gap-2 w-full pt-1">
              <button type="button" onClick={reset} className="flex-1 h-9 rounded-full border border-slate-200 dark:border-slate-700 text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                Send another
              </button>
              <button type="button" onClick={close} className="flex-1 h-9 rounded-full bg-[#0d99ff] hover:bg-[#0b87e0] text-white text-[13px] font-semibold transition-colors cursor-pointer">
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pt-4 space-y-3">
            <div role="radiogroup" aria-label="Message type" className="flex gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={type === t.id}
                  onClick={() => setType(t.id)}
                  className={`h-8 px-3 rounded-full text-[12px] font-medium border transition-colors cursor-pointer ${
                    type === t.id
                      ? 'bg-[#e5f2ff] dark:bg-blue-950/60 border-[#0d99ff]/40 text-[#0d99ff]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <textarea
              ref={textRef}
              rows={5}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder={current.placeholder}
              aria-label="Your message"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-[#0d99ff] focus:ring-2 focus:ring-[#0d99ff]/15 text-[13px] leading-relaxed text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none resize-none transition-all"
            />

            {accountContact ? (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 px-0.5">
                We&apos;ll reply to <span className="font-medium text-slate-600 dark:text-slate-300">{accountContact}</span>
              </p>
            ) : (
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Email or phone, so we can reply (optional)"
                aria-label="Email or phone"
                className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-[#0d99ff] text-[12px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-colors"
              />
            )}

            {errorMsg && <p className="text-[12px] text-rose-600 dark:text-rose-400 px-0.5">{errorMsg}</p>}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={openWhatsApp}
                title="Chat with us on WhatsApp"
                className="h-10 px-3.5 rounded-full border border-slate-200 dark:border-slate-700 text-[13px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-10 rounded-full bg-[#0d99ff] hover:bg-[#0b87e0] text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-70"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
