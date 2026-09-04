'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Stamp,
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  Building,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register, demoLogin, user } = useAuth();

  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name, company);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await demoLogin();
      router.push('/dashboard');
    } catch (err: any) {
      setError('Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-2xl space-y-6 text-slate-900">
      {/* Logo & Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/25">
          <Stamp className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">
          {tab === 'login' ? 'Sign In to Stamiox' : 'Start 3-Month Free Trial'}
        </h2>
        <p className="text-xs text-slate-500">
          {tab === 'login'
            ? 'Access your saved stamp vector designs and cloud workspace'
            : 'Get 90 days of complete unrestricted access to all templates & vector studio'}
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => {
            setTab('login');
            setError(null);
          }}
          className={`flex-1 py-2 rounded-lg transition-all ${
            tab === 'login'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('register');
            setError(null);
          }}
          className={`flex-1 py-2 rounded-lg transition-all ${
            tab === 'register'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sign Up (90 Days Free)
        </button>
      </div>

      {/* 1-Click Demo Login Banner */}
      <button
        type="button"
        onClick={handleDemo}
        disabled={isLoading}
        className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
      >
        <Sparkles className="w-4 h-4 text-blue-600" />
        <span>Instant 1-Click Demo Login (Alex Mercer)</span>
      </button>

      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center">
          {error}
        </div>
      )}

      {/* Auth Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {tab === 'register' && (
          <>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Your Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Company / Notary Office (Optional)</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Jenkins Legal Services"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </>
        )}

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl font-extrabold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 mt-2"
        >
          <span>
            {isLoading
              ? 'Processing...'
              : tab === 'login'
              ? 'Sign In to Studio'
              : 'Claim 3-Month Free Trial'}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Guarantee Badge */}
      <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>No credit card required for 3-Month Free Trial</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 bg-slate-50 flex items-center justify-center p-4 min-h-[calc(100vh-64px)]">
      <Suspense fallback={<div className="text-slate-600 text-xs">Loading login...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
