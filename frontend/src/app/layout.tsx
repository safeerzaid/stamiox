import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import { EditorProvider } from '../context/EditorContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { TrialBanner } from '../components/layout/TrialBanner';
import { SubscriptionModal } from '../components/layout/SubscriptionModal';

export const metadata: Metadata = {
  title: 'Stamiox | Web-Based Rubber Stamp Designing Software & Vector Studio',
  description:
    'Design custom rubber stamps, company seals, notary public stamps, and medical seals with ease. Easier and faster than CorelDRAW with 3 months free trial, pre-built templates, and vector SVG/PDF export.',
  keywords: [
    'rubber stamp maker',
    'stamp design software',
    'coreldraw stamp alternative',
    'company seal maker',
    'notary stamp creator',
    'laser engraving stamp svg',
    'vector stamp designer',
  ],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@500;600;700;800;900&family=Great+Vibes&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700;800;900&family=Oswald:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-sans min-h-screen flex flex-col bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <AuthProvider>
          <SubscriptionProvider>
            <EditorProvider>
              <Header />
              <main className="flex-1 flex flex-col">{children}</main>
              <Footer />
              <SubscriptionModal />
            </EditorProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
