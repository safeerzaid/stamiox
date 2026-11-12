'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Stamp, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PhoneField } from '../../components/common/PhoneField';
import { COUNTRIES, guessCountry, type Country } from '../../lib/countries';

type Tab = 'register' | 'login';


/** field with a label that sits inside the box and floats up when there is a value or focus */
const Floating = ({
  id, label, value, onChange, type = 'text', autoComplete, inputMode, maxLength, prefix, bad, suffix,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; type?: string; autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; maxLength?: number; prefix?: string; bad?: boolean; suffix?: React.ReactNode;
}) => (
  <div
    className={`group relative h-14 rounded-xl border bg-white dark:bg-slate-900 transition-all focus-within:border-[#0d99ff] focus-within:ring-4 focus-within:ring-[#0d99ff]/10 ${
      bad ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
    }`}
  >
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      inputMode={inputMode}
      maxLength={maxLength}
      placeholder=" "
      className={`peer absolute inset-0 w-full h-full bg-transparent outline-none rounded-xl pt-5 text-[15px] text-slate-900 dark:text-white ${prefix ? 'pl-[52px]' : 'pl-4'} ${suffix ? 'pr-11' : 'pr-4'}`}
    />
    {prefix && (
      <span className="absolute left-4 top-[27px] text-[15px] text-slate-500 dark:text-slate-400 pointer-events-none opacity-0 peer-focus:opacity-100 peer-[:not(:placeholder-shown)]:opacity-100 transition-opacity">
        {prefix}
      </span>
    )}
    <label
      htmlFor={id}
      className="absolute left-4 pointer-events-none text-slate-500 dark:text-slate-400 transition-all duration-200 top-1/2 -translate-y-1/2 text-[15px] peer-focus:top-[15px] peer-focus:text-[11px] peer-focus:text-[#0d99ff] peer-[:not(:placeholder-shown)]:top-[15px] peer-[:not(:placeholder-shown)]:text-[11px]"
    >
      {label}
    </label>
    {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</span>}
  </div>
);

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, isLoading: authLoading, registerAccount, loginAccount } = useAuth();

  // Register is the default; ?tab=login opens Log in
  const [tab, setTab] = useState<Tab>(params.get('tab') === 'login' ? 'login' : 'register');
  const next = params.get('next') || '/editor';

  const [mobile, setMobile] = useState('');
  // country for the mobile number: India until the browser's region is known (avoids a server/client mismatch)
  const [country, setCountry] = useState<Country>(() => COUNTRIES.find((c) => c.iso === 'in')!);
  useEffect(() => setCountry(guessCountry()), []);
  const [username, setUsername] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<{ field?: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // already signed in → straight to where they were going
  useEffect(() => {
    if (!authLoading && user) router.replace(next);
  }, [authLoading, user, next, router]);

  const switchTab = (t: Tab) => {
    setTab(t);
    setError(null);
    router.replace(`/login?tab=${t}${next !== '/editor' ? `&next=${encodeURIComponent(next)}` : ''}`);
  };

  const mobileDigits = mobile.replace(/\D/g, '').replace(/^0+/, ''); // local number, without the country code

  const validate = (): { field?: string; text: string } | null => {
    if (tab === 'register') {
      const isIndia = country.dial === '+91';
      if (isIndia ? !/^[6-9]\d{9}$/.test(mobileDigits) : !/^\d{6,14}$/.test(mobileDigits))
        return { field: 'mobile', text: isIndia ? 'Enter a valid 10-digit mobile number' : `Enter a valid mobile number for ${country.name}` };
      if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username.trim())) return { field: 'username', text: 'Username: 3–20 letters, numbers, _ or .' };
      if (password.length < 6) return { field: 'password', text: 'Password must be at least 6 characters' };
    } else {
      if (!identifier.trim()) return { field: 'identifier', text: 'Enter your mobile number or username' };
      if (!password) return { field: 'password', text: 'Enter your password' };
    }
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    setError(v);
    if (v) return;
    setBusy(true);
    try {
      if (tab === 'register') await registerAccount(mobileDigits, username.trim(), password, country.dial);
      else await loginAccount(identifier.trim(), password);
      router.replace(next);
    } catch (err: any) {
      const text = err?.message || 'Something went wrong. Please try again.';
      setError({ text, field: /mobile/i.test(text) ? 'mobile' : /username/i.test(text) ? 'username' : undefined });
    } finally {
      setBusy(false);
    }
  };

  const errOn = (f: string) => error?.field === f;

  const eye = (
    <button
      type="button"
      onClick={() => setShowPw((v) => !v)}
      aria-label={showPw ? 'Hide password' : 'Show password'}
      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
    >
      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="w-full max-w-[380px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.35)] p-6 sm:p-7">
      {/* brand + Register / Log in switch */}
      <div className="flex items-center justify-between mb-6">
        <span className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-[#0d99ff] text-white flex items-center justify-center">
            <Stamp className="w-4 h-4" />
          </span>
          <span className="text-[15px] font-semibold text-slate-900 dark:text-white">Stamiox</span>
        </span>
        <div role="tablist" className="relative grid grid-cols-2 p-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[12px] font-semibold">
          <span
            aria-hidden
            className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-white dark:bg-slate-700 shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${tab === 'login' ? 'translate-x-full' : ''}`}
          />
          {(['register', 'login'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => switchTab(t)}
              className={`relative z-10 h-7 px-3.5 rounded-full transition-colors cursor-pointer ${tab === t ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {t === 'register' ? 'Register' : 'Log in'}
            </button>
          ))}
        </div>
      </div>

      <h1 className="text-[22px] font-semibold tracking-tight text-slate-900 dark:text-white">
        {tab === 'register' ? 'Create your account' : 'Welcome back'}
      </h1>
      <p className="mt-1 mb-6 text-[13.5px] text-slate-500 dark:text-slate-400">
        {tab === 'register' ? 'It takes less than a minute.' : 'Log in to continue to the Studio.'}
      </p>

      <form onSubmit={submit} className="space-y-3" noValidate>
        {tab === 'register' ? (
          <>
            <PhoneField country={country} onCountry={setCountry} value={mobile} onChange={setMobile} bad={errOn('mobile')} />
            <Floating id="username" label="Username" autoComplete="username" maxLength={20}
              value={username} onChange={(v) => setUsername(v.replace(/\s/g, ''))} bad={errOn('username')} />
          </>
        ) : (
          <Floating id="identifier" label="Mobile number or username" autoComplete="username"
            value={identifier} onChange={setIdentifier} bad={errOn('identifier')} />
        )}
        <Floating id="password" label={tab === 'register' ? 'Password (6+ characters)' : 'Password'} type={showPw ? 'text' : 'password'}
          autoComplete={tab === 'register' ? 'new-password' : 'current-password'} value={password} onChange={setPassword} bad={errOn('password')} suffix={eye} />

        {error && (
          <p role="alert" className="text-[13px] text-rose-600 dark:text-rose-400 px-0.5">
            {error.text}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full h-12 !mt-5 rounded-xl bg-[#0d99ff] hover:bg-[#0b87e0] active:scale-[0.99] disabled:opacity-70 text-white text-[15px] font-semibold shadow-[0_10px_24px_-10px_rgba(13,153,255,0.8)] flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {tab === 'register' ? 'Create account' : 'Log in'}
        </button>
      </form>

      <p className="mt-5 text-center text-[13px] text-slate-500 dark:text-slate-400">
        {tab === 'register' ? 'Already registered? ' : "Don't have an account? "}
        <button type="button" onClick={() => switchTab(tab === 'register' ? 'login' : 'register')} className="font-semibold text-[#0d99ff] hover:underline cursor-pointer">
          {tab === 'register' ? 'Log in' : 'Register'}
        </button>
      </p>
    </div>
  );
}

function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
      className="h-9 pl-2.5 pr-3.5 rounded-full flex items-center gap-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200/80 dark:border-slate-700 text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-colors cursor-pointer"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-b from-sky-100 via-slate-50 to-white dark:from-[#0b1730] dark:via-[#0b0f19] dark:to-[#0b0f19]">
      <div aria-hidden className="pointer-events-none absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[520px] rounded-full bg-white/70 dark:bg-sky-500/10 blur-3xl" />
      <header className="relative h-16 px-5 flex items-center">
        <BackButton />
      </header>
      <div className="relative flex-1 flex items-center justify-center px-5 pb-16">
        <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin text-slate-400" />}>
          <AuthForm />
        </Suspense>
      </div>
    </div>
  );
}
