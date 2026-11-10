import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          750: '#243044',
          850: '#141d2e',
        },
        stamp: {
          blue: '#1e3a8a',
          navy: '#0f172a',
          red: '#dc2626',
          green: '#15803d',
          violet: '#6b21a8',
          maroon: '#831843',
          black: '#111827',
        },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Cinzel', '"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
        display: ['"Plus Jakarta Sans"', 'Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        stamp: '0 4px 20px -2px rgba(0, 0, 0, 0.15)',
        'stamp-lg': '0 10px 30px -4px rgba(0, 0, 0, 0.25)',
        glow: '0 0 25px rgba(59, 130, 246, 0.35)',
      },
      animation: {
        'stamp-press': 'stampPress 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        stampPress: {
          '0%': { transform: 'scale(1.4) rotate(-8deg)', opacity: '0' },
          '70%': { transform: 'scale(0.96) rotate(1deg)', opacity: '0.9' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
