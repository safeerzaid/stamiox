'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Sparkles, BookOpen, Layers, ArrowRight, Filter, Compass } from 'lucide-react';
import { BLOG_POSTS } from '@/data/blogs';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogIllustration } from '@/components/blog/BlogIllustration';

const CATEGORIES = ['All', 'Design', 'Laser & Engraving', 'Branding', 'Materials', 'Automation', 'Inspiration'];

export default function BlogsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const featuredPost = BLOG_POSTS[0];

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const matchesQuery =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* --- HERO HEADER SECTION --- */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pt-16 pb-12 sm:pt-20 sm:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 mb-5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Stamiox Engineering &amp; Design Journal</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-6">
            Guides, Techniques &amp; <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
              Stamp Making Insights
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-10">
            Deep-dives into vector typography, high-resolution CO2 laser engraving parameters, multi-surface inks, and automated print workflows.
          </p>

          {/* Search & Filter Bar */}
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles by keyword, laser specs, or typography..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1.5 py-0.5"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- MAIN BLOG CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Hero Banner (Shown when no search/filter active) */}
        {selectedCategory === 'All' && !searchQuery && (
          <div className="mb-14">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Featured Masterclass</span>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Editor’s Choice
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
              <div className="lg:col-span-6 xl:col-span-7 bg-slate-950 min-h-[280px] lg:min-h-[380px] relative">
                <BlogIllustration slug={featuredPost.slug} className="w-full h-full" />
              </div>
              <div className="lg:col-span-6 xl:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${featuredPost.categoryColor}`}>
                      {featuredPost.category}
                    </span>
                    <span className="text-xs text-slate-400">• {featuredPost.readTime}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3 hover:text-blue-600 transition-colors">
                    <Link href={`/blogs/${featuredPost.slug}`}>{featuredPost.title}</Link>
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    {featuredPost.subtitle}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                      {featuredPost.author.avatar}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{featuredPost.author.name}</div>
                      <div className="text-[11px] text-slate-400">{featuredPost.author.role}</div>
                    </div>
                  </div>
                  <Link
                    href={`/blogs/${featuredPost.slug}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    Read Article
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {searchQuery ? `Search Results (${filteredPosts.length})` : 'Latest Articles'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''} available in the knowledge library
            </p>
          </div>
        </div>

        {/* Articles Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <BlogCard
                key={post.slug}
                slug={post.slug}
                title={post.title}
                excerpt={post.excerpt}
                href={`/blogs/${post.slug}`}
                category={post.category}
                categoryColor={post.categoryColor}
                readTime={post.readTime}
                publishedAt={post.publishedAt}
                authorName={post.author.name}
                badge={post.badge}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
            <Filter className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No articles found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
              No matching articles for &ldquo;{searchQuery}&rdquo;. Try searching for &ldquo;laser&rdquo;, &ldquo;vector&rdquo;, or &ldquo;ink&rdquo;.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Editor Interactive CTA Banner */}
        <section className="mt-20 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white relative overflow-hidden shadow-xl border border-blue-800/40">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 bg-[radial-gradient(#60a5fa_2px,transparent_2px)] [background-size:20px_20px]" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-4">
              <Compass className="w-3.5 h-3.5" /> Stamiox Vector Studio
            </span>
            <h3 className="text-2xl sm:text-3xl font-black mb-3 text-white">
              Ready to create your own stamp?
            </h3>
            <p className="text-sm sm:text-base text-slate-300 mb-8 leading-relaxed">
              Design custom round seals, notary stamps, pocket rectangular stamps, and QR seals with 1:1 scale preview, automatic SVG export, and vector laser pathing.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/editor"
                className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-sm shadow-lg shadow-blue-500/25 transition-all"
              >
                Launch Studio Editor
              </Link>
              <Link
                href="/templates"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/15 transition-all"
              >
                Browse 500+ Templates
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
