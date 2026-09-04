'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Calendar, ArrowRight, User } from 'lucide-react';
import { BlogIllustration } from './BlogIllustration';

export interface BlogCardProps {
  title: string;
  excerpt: string;
  slug?: string;
  imageUrl?: string;
  href: string;
  category?: string;
  categoryColor?: string;
  readTime?: string;
  publishedAt?: string;
  authorName?: string;
  badge?: string;
}

export const BlogCard: React.FC<BlogCardProps> = ({
  title,
  excerpt,
  slug,
  imageUrl,
  href,
  category = 'Design',
  categoryColor = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  readTime = '5 min read',
  publishedAt = 'September 2026',
  authorName = 'Stamiox Team',
  badge,
}) => {
  // Extract slug if not explicitly passed
  const effectiveSlug = slug || href.replace('/blogs/', '').replace('/blog/', '');

  return (
    <article className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 dark:hover:border-blue-500/40 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col h-full overflow-hidden">
      {/* Visual Cover / SVG Illustration */}
      <Link href={href} className="block relative overflow-hidden aspect-[16/10] bg-slate-950">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full transition-transform duration-500 group-hover:scale-105">
            <BlogIllustration slug={effectiveSlug} />
          </div>
        )}

        {/* Category Pill Overlaid */}
        <div className="absolute top-3.5 left-3.5 z-20">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border ${categoryColor}`}>
            {category}
          </span>
        </div>

        {badge && (
          <div className="absolute top-3.5 right-3.5 z-20">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase bg-slate-900/80 text-white border border-white/10 backdrop-blur-md">
              {badge}
            </span>
          </div>
        )}
      </Link>

      {/* Article Body Content */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Meta details */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {publishedAt}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {readTime}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
          <Link href={href}>{title}</Link>
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 mb-6 flex-grow leading-relaxed">
          {excerpt}
        </p>

        {/* Bottom Author & CTA */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
              {authorName.charAt(0)}
            </div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate max-w-[130px]">
              {authorName}
            </span>
          </div>

          <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform"
          >
            <span>Read Article</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
};
