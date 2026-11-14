import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import { EditorProvider } from '../context/EditorContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { TrialBanner } from '../components/layout/TrialBanner';
import { SiteAreaMarker } from '../components/common/SiteAreaMarker';
import { SubscriptionModal } from '../components/layout/SubscriptionModal';
import { HoverFx } from '../components/common/HoverFx';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  document.documentElement.dataset.area = location.pathname === '/editor' ? 'studio' : 'site';
                  var saved = localStorage.getItem('stamiox_theme');
                  var isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Core & Extended Google Font Typography (100+ Styles for Professional Stamps & Seals) */}
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Inter:wght@400;600;700&family=Outfit:wght@400;600;700&family=Montserrat:wght@400;600;700&family=Poppins:wght@400;600;700&family=DM+Sans:wght@400;600;700&family=Work+Sans:wght@400;600;700&family=Raleway:wght@400;600;700&family=Space+Grotesk:wght@400;600;700&family=Manrope:wght@400;600;700&family=Sora:wght@400;600;700&family=Lexend:wght@400;600;700&family=Urbanist:wght@400;600;700&family=Figtree:wght@400;600;700&family=Rubik:wght@400;600;700&family=Nunito+Sans:wght@400;600;700&family=Josefin+Sans:wght@400;600;700&family=Quicksand:wght@400;600;700&family=Exo+2:wght@400;600;700&family=Cabin:wght@400;600;700&family=Barlow:wght@400;600;700&family=Overpass:wght@400;600;700&family=Kanit:wght@400;600;700&family=Archivo:wght@400;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Cinzel+Decorative:wght@700&family=Playfair+Display:wght@600;700&family=Cormorant+Garamond:wght@600;700&family=EB+Garamond:wght@600;700&family=DM+Serif+Display&family=Bodoni+Moda:wght@600;700&family=Merriweather:wght@400;700&family=Lora:wght@500;600;700&family=Prata&family=Libre+Baskerville:wght@400;700&family=Crimson+Pro:wght@600;700&family=Spectral:wght@600;700&family=Abril+Fatface&family=Marcellus&family=Forum&family=Castoro&family=Faustina:wght@600;700&family=Gilda+Display&family=Yeseva+One&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@500;600;700&family=Anton&family=Archivo+Black&family=Barlow+Condensed:wght@600;700&family=Russo+One&family=Teko:wght@600;700&family=Staatliches&family=Righteous&family=Black+Ops+One&family=Bungee&family=Passion+One:wght@700;900&family=Alfa+Slab+One&family=Big+Shoulders+Display:wght@700;800&family=Fjalla+One&family=Saira+Condensed:wght@600;700&family=Titan+One&family=Squada+One&family=Chango&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Dancing+Script:wght@600;700&family=Alex+Brush&family=Allura&family=Pinyon+Script&family=Sacramento&family=Pacifico&family=Parisienne&family=Satisfy&family=Kaushan+Script&family=Yellowtail&family=Tangerine:wght@700&family=Italianno&family=Herr+Von+Muellerhoff&family=Marck+Script&family=Homemade+Apple&family=Bad+Script&family=Caveat:wght@600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Space+Mono:wght@700&family=Fira+Code:wght@500;700&family=Share+Tech+Mono&family=IBM+Plex+Mono:wght@500;600&family=Courier+Prime:wght@700&family=Roboto+Mono:wght@500;700&family=Major+Mono+Display&family=Overpass+Mono:wght@600;700&family=Anonymous+Pro:wght@700&family=MedievalSharp&family=UnifrakturMaguntia&family=Pirata+One&family=Uncial+Antiqua&family=IM+Fell+English+SC&family=Special+Elite&family=Rye&family=Sancreek&family=Trade+Winds&family=Caesar+Dressing&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@500;600;700&family=Manjari:wght@700&family=Gayathri:wght@700&family=Chilanka&family=Baloo+Chettan+2:wght@600;700&family=Noto+Sans+Devanagari:wght@500;600;700&family=Hind:wght@500;600;700&family=Mukta:wght@500;600;700&family=Rozha+One&family=Noto+Sans+Tamil:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-sans min-h-screen flex flex-col bg-white dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 selection:bg-blue-100 selection:text-blue-900 transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <EditorProvider>
                <SiteAreaMarker />
                <Header />
                <main className="flex-1 flex flex-col">{children}</main>
                <Footer />
                <SubscriptionModal />
                <HoverFx />
              </EditorProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
