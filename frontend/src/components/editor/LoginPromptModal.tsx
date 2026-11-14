'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, CloudUpload, Files, History, Check } from 'lucide-react';
import { useSmoothClose } from '../../hooks/useSmoothClose';
import { GUEST_DESIGN_LIMIT, LOGIN_PROMPT_EVENT, type LoginReason } from '../../lib/require-login';

const COPY: Record<LoginReason, { icon: React.ElementType; title: string; text: string }> = {
  export: {
    icon: Download,
    title: 'Log in to export your stamp',
    text: 'Your design is kept on this device. Log in or create a free account to download it — you’ll come straight back here.',
  },
  save: {
    icon: CloudUpload,
    title: 'Log in to save to your account',
    text: 'Your design is kept on this device. Log in to save it to your account and open it anywhere.',
  },
  designs: {
    icon: History,
    title: 'Log in to see your saved designs',
    text: 'Designs saved to your account show up here once you log in.',
  },
  limit: {
    icon: Files,
    title: `You’ve used your ${GUEST_DESIGN_LIMIT} free trial designs`,
    text: 'Create a free account or log in to make more designs. Your trial designs stay with you.',
  },
};

/** "Log in to continue" — opened by `requireLogin()` when a guest uses an account-only action. */
export const LoginPromptModal: React.FC = () => {
  const [reason, setReason] = useState<LoginReason | null>(null);
  const { closing, close } = useSmoothClose(() => setReason(null), reason !== null);

  useEffect(() => {
    const onAsk = (e: Event) => setReason(((e as CustomEvent).detail?.reason as LoginReason) || 'export');
    window.addEventListener(LOGIN_PROMPT_EVENT, onAsk);
    return () => window.removeEventListener(LOGIN_PROMPT_EVENT, onAsk);
  }, []);

  useEffect(() => {
    if (!reason) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reason, close]);

  if (!reason || typeof document === 'undefined') return null;
  const { icon: Icon, title, text } = COPY[reason];

  // a full page load (not client navigation) so the design on this device is written out first
  const go = (tab: 'login' | 'register') => {
    window.location.href = `/login?tab=${tab}&next=/editor`;
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm fx-modal-backdrop ${closing ? 'fx-modal-closing' : ''}`}
      onMouseDown={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 fx-modal-open"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <span className="w-11 h-11 rounded-full bg-[#e5f2ff] dark:bg-blue-950/60 text-[#0d99ff] flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </span>
        <h2 className="mt-4 text-[17px] font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>

        <ul className="mt-4 space-y-1.5 text-[12.5px] text-slate-600 dark:text-slate-300">
          {['Export SVG, PNG & PDF for laser / print', 'Save designs to your account', 'Unlimited designs'].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => go('register')}
            className="h-10 rounded-xl bg-[#0d99ff] hover:bg-[#0b87e0] text-white text-[13.5px] font-semibold transition-colors cursor-pointer"
          >
            Create free account
          </button>
          <button
            type="button"
            onClick={() => go('login')}
            className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[13.5px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            I already have an account — Log in
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
