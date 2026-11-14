'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Marks <html data-area="site|studio">. The website pages were designed light-only, so in dark
 * mode globals.css maps their light colours to dark ones — only for the site, never the Studio
 * (which has its own dark styles).
 */
export function SiteAreaMarker() {
  const pathname = usePathname();
  useEffect(() => {
    document.documentElement.dataset.area = pathname === '/editor' ? 'studio' : 'site';
  }, [pathname]);
  return null;
}
