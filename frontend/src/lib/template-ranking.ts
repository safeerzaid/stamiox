import type { StampTemplate } from '../types/stamp';

/** Hand-picked, most eye-catching seals — shown first wherever templates are listed. */
export const FEATURED_TEMPLATE_IDS = [
  'template-wedding-save-the-date-monogram',
  'template-pro-cafe-rope',
  'template-certified-organic-product-seal',
  'template-pro-notary-scalloped',
  'template-pro-wedding-blossom',
  'template-royal-heritage-crest-monogram',
  'template-pro-thank-you-daisy',
  'template-pro-qc-passed-beaded',
];

/** How "finished" a design looks: wording, decorative borders, emblems and colour rank higher. */
export function designScore(t: StampTemplate): number {
  const els: any[] = (t.defaultData?.elements as any[]) || [];
  const count = (type: string) => els.filter((e) => e.type === type).length;
  const words = count('arc-text') + count('text');
  if (words === 0) return -100; // blank size templates go last
  let score = Math.min(count('arc-text'), 2) * 3 + Math.min(count('text'), 3);
  if (els.some((e) => e.type === 'serrated-ring')) score += 2;
  score += Math.min(count('clipart'), 2);
  if ((t.defaultData?.inkColor || '').toLowerCase() !== '#1e3a8a') score += 2; // coloured inks stand out
  if (t.id.startsWith('template-pro-')) score += 1;
  if (t.isPremium) score += 1;
  return score;
}

/** Featured first (in curated order), then by design score, blanks last. */
export function rankTemplates<T extends StampTemplate>(list: T[]): T[] {
  const featuredRank = (id: string) => {
    const i = FEATURED_TEMPLATE_IDS.indexOf(id);
    return i === -1 ? Infinity : i;
  };
  return [...list].sort((a, b) => {
    const fa = featuredRank(a.id);
    const fb = featuredRank(b.id);
    if (fa !== fb) return fa - fb;
    return designScore(b) - designScore(a);
  });
}
