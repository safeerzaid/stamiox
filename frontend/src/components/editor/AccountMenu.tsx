'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, LogIn, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Avatar menu for the signed-in user: who is signed in, and log out.
 * `sidebar`: a full-width row pinned to the bottom of the left panel; its menu opens upward.
 */
export const AccountMenu: React.FC<{ variant?: 'toolbar' | 'sidebar' }> = ({ variant = 'toolbar' }) => {
  const inSidebar = variant === 'sidebar';
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) {
    if (!inSidebar) return null;
    // guest (free trial): offer Log in in the profile's place
    return (
      <button
        type="button"
        onClick={() => {
          window.location.href = '/login?tab=login&next=/editor';
        }}
        className="w-full h-10 px-1.5 rounded-lg flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <span className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
          <LogIn className="w-3.5 h-3.5" />
        </span>
        <span className="flex-1 min-w-0 text-left">
          <span className="block text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">Log in</span>
          <span className="block text-[11px] text-slate-400 truncate">Free trial · log in to export</span>
        </span>
      </button>
    );
  }
  const display = user.username || user.name || 'Account';
  const initial = display.trim()[0]?.toUpperCase() || 'U';

  return (
    <div ref={wrapRef} className="relative">
      {inSidebar ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          title={display}
          className={`w-full h-10 px-1.5 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer ${
            open ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold text-white bg-gradient-to-br from-[#0d99ff] to-indigo-600 shrink-0">
            {initial}
          </span>
          <span className="flex-1 min-w-0 text-left">
            <span className="block text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 truncate">{display}</span>
            {user.mobile && <span className="block text-[11px] text-slate-400 tabular-nums truncate">{user.mobile}</span>}
          </span>
          <ChevronUp className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${open ? '' : 'rotate-180'}`} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          title={display}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold text-white bg-gradient-to-br from-[#0d99ff] to-indigo-600 ring-2 transition-shadow cursor-pointer ${
            open ? 'ring-[#0d99ff]/40' : 'ring-transparent hover:ring-slate-200 dark:hover:ring-slate-700'
          }`}
        >
          {initial}
        </button>
      )}

      {open && (
        <div
          role="menu"
          className={`absolute rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 fx-menu ${
            inSidebar ? 'left-0 right-0 bottom-full mb-2' : 'right-0 top-full mt-2 w-64'
          }`}
        >
          {/* the sidebar row already shows the name */}
          {!inSidebar && (
            <div className="px-2.5 pt-1.5 pb-2.5 mb-1 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">{display}</p>
              {user.mobile && <p className="text-[12px] text-slate-500 dark:text-slate-400 tabular-nums">{user.mobile}</p>}
            </div>
          )}
          <button
            type="button"
            role="menuitem"
            className="w-full h-9 px-2.5 rounded-lg flex items-center gap-2.5 text-[13px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            onClick={() => {
              logout();
              router.replace('/login?tab=login');
            }}
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
};
