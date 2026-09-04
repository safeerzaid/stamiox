'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import {
  ChevronDown,
  ChevronRight,
  Layers,
  CreditCard,
  LogOut,
  Clock,
  ShieldCheck,
  Menu,
  X,
  Sliders,
  LayoutGrid,
  Maximize2,
  Sparkle,
  FileCheck2,
  Building2,
  Scale,
  Stethoscope,
  Mail,
  Printer,
  BookOpen,
  Cpu,
  CheckCircle2,
  HelpCircle,
  Shapes,
  Compass,
  Award,
  Square,
} from 'lucide-react';

const TEMPLATE_DROPDOWN_ITEMS = [
  {
    title: 'Round & Circular Seals',
    desc: 'Notary, Company & Official Seals (10mm to 48mm)',
    href: '/templates?shape=ROUND',
    icon: Compass,
  },
  {
    title: 'Rectangular & Pocket Stamps',
    desc: 'Address, Signature & Signatory Stamps (36x12 to 70x34mm)',
    href: '/templates?shape=RECTANGULAR',
    icon: Layers,
  },
  {
    title: 'Oval & Badge Stamps',
    desc: 'Vintage Flourish & Dual Arch Seals (50x30mm)',
    href: '/templates?shape=OVAL',
    icon: Shapes,
  },
  {
    title: 'Square & QR Mount Stamps',
    desc: 'Square Mount, QR Code & Monogram Seals (20x20 to 45x45mm)',
    href: '/templates?shape=SQUARE',
    icon: Square,
  },
  {
    title: 'Notary & Legal Advocate Seals',
    desc: 'Scales of Justice & High Court Commission Seals',
    href: '/templates?category=notary',
    icon: Scale,
  },
  {
    title: 'Doctor & Medical Rx Stamps',
    desc: 'Physician Practitioner & MCI Registration Stamps',
    href: '/templates?category=medical',
    icon: Stethoscope,
  },
  {
    title: 'Banking, CA & Office Stamps',
    desc: 'Chartered Accountant, Cashier & Audit Stamps',
    href: '/templates?category=office',
    icon: Building2,
  },
  {
    title: 'Browse All 35+ Production Templates',
    desc: 'Explore complete production vector stamp catalog',
    href: '/templates',
    icon: LayoutGrid,
  },
];

const RESOURCE_ITEMS = [
  {
    title: 'Self-Inking Mount Sizing Matrix',
    href: '/resources/mount-matrix',
    icon: LayoutGrid,
  },
  {
    title: 'Laser Machine Invert & Mirror Specs',
    href: '/resources/laser-specs',
    icon: Cpu,
  },
  {
    title: 'Export Vector Formats (SVG, PDF, PNG)',
    href: '/resources/export-formats',
    icon: CheckCircle2,
  },
  {
    title: 'Stamp Design & Vector Studio Guide',
    href: '/resources/studio-guide',
    icon: BookOpen,
  },
  {
    title: 'Help Center & Support',
    href: '/resources/help-center',
    icon: HelpCircle,
  },
];

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { trialDaysRemaining, isPro } = useSubscription();

  // Active dropdown state: 'templates' | 'resources' | null
  const [activeDropdown, setActiveDropdown] = useState<'templates' | 'resources' | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isActive = (path: string) => pathname === path || (path !== '/' && pathname.startsWith(path));

  // Smooth hover handlers with debounce
  const handleMouseEnter = (menu: 'templates' | 'resources') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(menu);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 120);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hide global header on full-screen Studio editor page
  if (pathname === '/editor') {
    return null;
  }

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full bg-white border-b border-slate-200/80 transition-all shadow-xs"
      onMouseLeave={handleMouseLeave}
    >
      {/* Top Navbar Row with increased height and spaciousness */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        {/* --- LEFT: BRAND LOGO & ENLARGED NAV LINKS --- */}
        <div className="flex items-center gap-8 lg:gap-11">
          {/* Stamiox Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0 select-none">
            {/* Stamiox Signature Rubber Stamp Seal Icon */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-sm shadow-blue-600/30 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-blue-600/40 transition-all duration-200">
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="9.5" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="3 2" />
                <path
                  d="M16 8C16 6.343 14.209 5 12 5C9.791 5 8 6.343 8 8C8 9.657 9.791 10.6 12 11.4C14.209 12.2 16 13.143 16 14.8C16 16.457 14.209 18 12 18C9.791 18 8 16.457 8 14.8"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="11.4" r="1" fill="white" />
              </svg>
            </div>
            {/* Brand Name Typography: Stamiox */}
            <div className="flex items-center text-[22px] font-bold tracking-tight">
              <span className="text-slate-900">Stam</span>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                iox
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Increased Size to 16px / text-base) */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-3 text-[16px] font-medium text-[#2d3135]">
            {/* 1. Templates ⌵ Dropdown */}
            <div
              onMouseEnter={() => handleMouseEnter('templates')}
              className="relative"
            >
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'templates' ? null : 'templates')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all duration-150 cursor-pointer ${
                  activeDropdown === 'templates' || isActive('/templates')
                    ? 'bg-[#f1f3f4] text-[#111827] font-semibold'
                    : 'text-[#2d3135] hover:text-[#111827] hover:bg-slate-50'
                }`}
              >
                <span>Templates</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#5f6368] transition-transform duration-200 ${
                    activeDropdown === 'templates' ? 'rotate-180 text-[#111827]' : ''
                  }`}
                  strokeWidth={2.2}
                />
              </button>
            </div>

            {/* 2. Pricing */}
            <Link
              href="/pricing"
              onMouseEnter={() => setActiveDropdown(null)}
              className={`px-4 py-2 rounded-full transition-colors ${
                isActive('/pricing') ? 'text-[#111827] font-semibold bg-slate-50' : 'text-[#2d3135] hover:text-[#111827] hover:bg-slate-50'
              }`}
            >
              Pricing
            </Link>

            {/* 4. Enterprise */}
            <Link
              href="/enterprise"
              onMouseEnter={() => setActiveDropdown(null)}
              className={`px-4 py-2 rounded-full transition-colors ${
                isActive('/enterprise') ? 'text-[#111827] font-semibold bg-slate-50' : 'text-[#2d3135] hover:text-[#111827] hover:bg-slate-50'
              }`}
            >
              Enterprise
            </Link>

            {/* 5. Resources ⌵ */}
            <div
              onMouseEnter={() => handleMouseEnter('resources')}
              className="relative"
            >
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'resources' ? null : 'resources')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all duration-150 cursor-pointer ${
                  activeDropdown === 'resources'
                    ? 'bg-[#f1f3f4] text-[#111827] font-semibold'
                    : 'text-[#2d3135] hover:text-[#111827] hover:bg-slate-50'
                }`}
              >
                <span>Resources</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#5f6368] transition-transform duration-200 ${
                    activeDropdown === 'resources' ? 'rotate-180 text-[#111827]' : ''
                  }`}
                  strokeWidth={2.2}
                />
              </button>
            </div>
            <Link href="/blogs" className={`px-4 py-2 rounded-full transition-colors ${isActive('/blogs') ? 'text-[#111827] font-semibold bg-slate-50' : 'text-[#2d3135] hover:text-[#111827] hover:bg-slate-50'}`}>Blogs</Link>
          </nav>
        </div>

        {/* --- RIGHT: ENLARGED USER ACTIONS & GET STARTED --- */}
        <div className="flex items-center gap-3.5">
          {user ? (
            /* User Profile if Logged In */
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 pl-3.5 pr-2 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 text-sm font-semibold text-slate-800 shadow-2xs cursor-pointer select-none"
              >
                <span className="hidden sm:inline max-w-[110px] truncate text-xs font-semibold text-slate-700">
                  {user.name?.split(' ')[0]}
                </span>
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isUserMenuOpen ? 'rotate-180 text-slate-700' : ''
                  }`}
                  strokeWidth={2.2}
                />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2.5 w-64 bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] p-2 z-50 space-y-1.5 select-none animate-in fade-in zoom-in-95 duration-150 ring-1 ring-slate-900/5">
                  {/* Inset User Profile Header Stage */}
                  <div className="bg-gradient-to-br from-slate-50/90 via-slate-50/50 to-blue-50/30 rounded-xl p-3 border border-slate-200/60 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 to-blue-900 text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 text-sm truncate leading-tight">{user.name}</p>
                        <p className="text-slate-400 text-xs truncate font-medium mt-0.5">{user.email}</p>
                      </div>
                    </div>

                    <div className="pt-1">
                      {isPro ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200/80">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>PRO Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200/80">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>{trialDaysRemaining}d Free Trial</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-0.5 pt-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold text-xs transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm">My Stamp Designs</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                    </Link>

                    <Link
                      href="/pricing"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold text-xs transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                          <CreditCard className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm">Plans & Billing</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 my-1"></div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold text-xs transition-colors text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
                      <LogOut className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3.5">
              <Link
                href="/login"
                className="text-[15px] font-semibold text-slate-700 hover:text-black transition-colors px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                href="/editor"
                className="inline-flex items-center px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[14.5px] font-semibold transition-all duration-200 hover:scale-[1.02] shadow-sm hover:shadow"
              >
                Start Designing
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* --- CLEAN 2-COLUMN MEGA DROPDOWN (WITH 1-BY-1 STAGGERED ANIMATION) --- */}
      {activeDropdown && (
        <div
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
          className="absolute top-full left-0 right-0 w-full bg-white border-b border-slate-200/90 shadow-2xl z-40 animate-in fade-in duration-150"
        >
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
            {/* 1. TEMPLATES DROPDOWN */}
            {activeDropdown === 'templates' && (
              <div className="grid grid-cols-12 gap-12 items-start">
                {/* Left Column: Heading & Action Button */}
                <div className="col-span-12 md:col-span-4 space-y-5 animate-in fade-in slide-in-from-left-2 duration-300">
                  <h3 className="text-[28px] font-bold text-[#202124] tracking-tight leading-[1.25]">
                    Explore 35+ Production <br />
                    Rubber Stamp Templates
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Select from Round, Rectangular, Oval, Notary, Doctor, CA, and Monogram templates to customize live.
                  </p>
                  <div>
                    <Link
                      href="/templates"
                      onClick={() => setActiveDropdown(null)}
                      className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#f1f3f4] hover:bg-[#e8eaed] text-[#202124] text-[14px] font-semibold transition-colors"
                    >
                      View All Templates
                    </Link>
                  </div>
                </div>

                {/* Right Column: 2-column grid of stamp types */}
                <div className="col-span-12 md:col-span-8 md:pl-6">
                  <p className="text-[14px] font-semibold text-[#5f6368] mb-4 tracking-wide uppercase text-xs">
                    Stamp Categories & Mount Shapes
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {TEMPLATE_DROPDOWN_ITEMS.map((item, index) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.title}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          style={{ animationDelay: `${index * 40}ms` }}
                          className="animate-dropdown-item flex items-start gap-3 p-2.5 rounded-2xl hover:bg-slate-50 text-[#202124] transition-all duration-200 group"
                        >
                          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-all shrink-0">
                            <IconComponent className="w-4 h-4" strokeWidth={2} />
                          </div>
                          <div>
                            <span className="text-[15px] font-semibold block group-hover:text-blue-600 transition-colors leading-tight">
                              {item.title}
                            </span>
                            <span className="text-xs text-slate-500 font-normal line-clamp-1 mt-0.5">
                              {item.desc}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 2. RESOURCES DROPDOWN */}
            {activeDropdown === 'resources' && (
              <div className="grid grid-cols-12 gap-12 items-start">
                <div className="col-span-12 md:col-span-4 space-y-5 animate-in fade-in slide-in-from-left-2 duration-300">
                  <h3 className="text-[28px] font-bold text-[#202124] tracking-tight leading-[1.25]">
                    Design guides, laser specs, <br />
                    and technical resources
                  </h3>
                  <div>
                    <Link
                      href="/resources"
                      onClick={() => setActiveDropdown(null)}
                      className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#f1f3f4] hover:bg-[#e8eaed] text-[#202124] text-[14px] font-semibold transition-colors"
                    >
                      See documentation
                    </Link>
                  </div>
                </div>

                <div className="col-span-12 md:col-span-8 md:pl-6">
                  <p className="text-[14px] font-semibold text-[#5f6368] mb-4 tracking-wide uppercase text-xs">
                    Resources
                  </p>

                  <div className="space-y-4 max-w-lg">
                    {RESOURCE_ITEMS.map((item, index) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.title}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          style={{ animationDelay: `${index * 60}ms` }}
                          className="animate-dropdown-item flex items-center gap-4 py-1.5 text-[#202124] hover:text-blue-600 hover:translate-x-2 transition-all duration-200 group"
                        >
                          <IconComponent className="w-5 h-5 text-slate-700 group-hover:text-blue-600 group-hover:scale-115 transition-all duration-200 shrink-0" strokeWidth={1.8} />
                          <span className="text-[16px] font-medium">{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-5 py-4 space-y-3 text-base">
          <Link
            href="/editor"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between py-2.5 text-slate-900 hover:text-blue-600 font-semibold border-b border-slate-50"
          >
            <span>Products</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </Link>
          <Link
            href="/templates"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-2.5 text-slate-900 hover:text-blue-600 font-semibold border-b border-slate-50"
          >
            Templates
          </Link>
          <Link
            href="/pricing"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-2.5 text-slate-900 hover:text-blue-600 font-semibold border-b border-slate-50"
          >
            Pricing
          </Link>
          <Link
            href="/pricing"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-2.5 text-slate-900 hover:text-blue-600 font-semibold border-b border-slate-50"
          >
            Enterprise
          </Link>
          <Link
            href="/templates"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between py-2.5 text-slate-900 hover:text-blue-600 font-semibold border-b border-slate-50"
          >
            <span>Resources</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </Link>

          <div className="pt-3 flex flex-col gap-2.5">
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-full border border-slate-200 text-slate-800 font-semibold text-sm"
            >
              Sign In
            </Link>
            <Link
              href="/editor"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold"
            >
              Start Designing Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
