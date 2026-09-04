'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import {
  Calendar,
  Clock,
  ArrowLeft,
  Share2,
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronRight,
  Bookmark,
  Check,
  Twitter,
  Linkedin,
  Lightbulb,
  AlertTriangle,
  Info,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { getBlogPostBySlug, getRelatedBlogPosts, BLOG_POSTS } from '@/data/blogs';
import { BlogIllustration } from '@/components/blog/BlogIllustration';
import { BlogCard } from '@/components/blog/BlogCard';

export default function BlogDetailPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  const post = getBlogPostBySlug(slug as string);

  useEffect(() => {
    if (!post) return;

    const handleScroll = () => {
      const sections = post.sections.map((s) => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(post.sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-5">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Article Not Found</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            The article you are looking for does not exist or may have been relocated.
          </p>
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Articles
          </Link>
        </div>
      </div>
    );
  }

  const relatedPosts = getRelatedBlogPosts(post.slug);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareTwitter = () => {
    if (typeof window !== 'undefined') {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`Check out "${post.title}" on Stamiox:`);
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    }
  };

  const handleShareLinkedIn = () => {
    if (typeof window !== 'undefined') {
      const url = encodeURIComponent(window.location.href);
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* --- BREADCRUMB & BACK BAR --- */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <Link href="/blogs" className="hover:text-blue-600 transition-colors">
              Blog
            </Link>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="text-slate-900 dark:text-slate-200 font-medium truncate max-w-[200px] sm:max-w-md">
              {post.title}
            </span>
          </nav>

          <Link
            href="/blogs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Articles</span>
          </Link>
        </div>
      </div>

      {/* --- ARTICLE HEADER HERO --- */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Category & Badge */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
            <span className={`px-3.5 py-1 rounded-full text-xs font-semibold border ${post.categoryColor}`}>
              {post.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {post.badge}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.15]">
            {post.title}
          </h1>

          {/* Subtitle / Excerpt */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed mb-8">
            {post.subtitle}
          </p>

          {/* Author info & Metadata */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-500 dark:text-slate-400 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-blue-500/20">
                {post.author.avatar}
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-900 dark:text-white">{post.author.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{post.author.role}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                {post.publishedAt}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                {post.readTime}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* --- HERO SVG ILLUSTRATION BANNER --- */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8">
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 aspect-[21/9] min-h-[260px] sm:min-h-[360px]">
          <BlogIllustration slug={post.slug} className="w-full h-full" />
        </div>
      </div>

      {/* --- MAIN ARTICLE CONTENT LAYOUT --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* --- LEFT SIDEBAR: Table of Contents & Quick Actions --- */}
          <aside className="lg:col-span-4 order-2 lg:order-1">
            <div className="sticky top-20 space-y-6">
              {/* Table of Contents */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  <Bookmark className="w-4 h-4 text-blue-500" />
                  <span>Table of Contents</span>
                </div>
                <nav className="space-y-2.5">
                  {post.sections.map((section) => {
                    const isActive = activeSection === section.id;
                    return (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className={`block text-xs sm:text-sm transition-all py-1 px-2.5 rounded-lg ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold border-l-2 border-blue-600'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {section.title}
                      </a>
                    );
                  })}
                </nav>
              </div>

              {/* Share Box */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Share this Guide
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                  <button
                    onClick={handleShareTwitter}
                    title="Share on X / Twitter"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-500 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleShareLinkedIn}
                    title="Share on LinkedIn"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-500 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Studio Editor Recommendation Card */}
              {post.recommendedTemplate && (
                <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-6 shadow-lg border border-blue-700/50">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-3">
                    <Sparkles className="w-3 h-3" /> Recommended Preset
                  </div>
                  <h4 className="font-bold text-base text-white mb-1.5">
                    {post.recommendedTemplate.name}
                  </h4>
                  <p className="text-xs text-blue-200/90 mb-4 leading-relaxed">
                    Test these parameters directly on this preset in Stamiox Studio.
                  </p>
                  <Link
                    href={post.recommendedTemplate.link}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-blue-500/25"
                  >
                    <span>Open in Stamiox Editor</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </aside>

          {/* --- RIGHT COLUMN: Rich Article Body --- */}
          <article className="lg:col-span-8 order-1 lg:order-2">
            {/* Key Takeaways Box */}
            <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-3xl p-6 sm:p-8 mb-12 shadow-sm">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm uppercase tracking-wider mb-4">
                <Sparkles className="w-4 h-4" />
                <span>Executive Summary &amp; Key Takeaways</span>
              </div>
              <ul className="space-y-3">
                {post.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sections */}
            <div className="space-y-16">
              {post.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-6 pb-3 border-b border-slate-200 dark:border-slate-800">
                    {section.title}
                  </h2>

                  {/* Paragraphs */}
                  <div className="space-y-4 mb-8">
                    {section.paragraphs.map((p, pIdx) => (
                      <p key={pIdx} className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>

                  {/* Callout box if present */}
                  {section.callout && (
                    <div
                      className={`rounded-2xl p-6 mb-8 border flex items-start gap-4 ${
                        section.callout.type === 'tip'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                          : section.callout.type === 'warning'
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                          : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-200'
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {section.callout.type === 'tip' && <Lightbulb className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                        {section.callout.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                        {section.callout.type === 'info' && <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                      </div>
                      <div>
                        <div className="font-bold text-sm mb-1">{section.callout.title}</div>
                        <p className="text-xs sm:text-sm leading-relaxed opacity-90">{section.callout.text}</p>
                      </div>
                    </div>
                  )}

                  {/* Numbered Step Cards */}
                  {section.steps && (
                    <div className="grid grid-cols-1 gap-4 mb-8">
                      {section.steps.map((step) => (
                        <div
                          key={step.num}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:border-blue-400 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                            {step.num}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                              {step.title}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Specifications / Comparison Matrix Table */}
                  {section.specs && (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm mb-8">
                      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Technical Tolerances &amp; Production Matrix
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {section.specs.map((spec, sIdx) => (
                          <div key={sIdx} className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              {spec.label}
                            </div>
                            <div className="text-xs sm:text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                              {spec.value}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {spec.recommendation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* Tags Cloud */}
            <div className="mt-14 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">Topic Tags:</span>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Author Bio Card */}
            <div className="mt-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                {post.author.avatar}
              </div>
              <div>
                <div className="text-xs uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider mb-1">
                  About the Author
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {post.author.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{post.author.role}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {post.author.bio}
                </p>
              </div>
            </div>
          </article>
        </div>

        {/* --- RELATED ARTICLES SECTION --- */}
        <section className="mt-24 pt-16 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Related Masterclasses &amp; Guides</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Continue expanding your stamp design &amp; manufacturing engineering knowledge.
              </p>
            </div>
            <Link
              href="/blogs"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedPosts.map((rPost) => (
              <BlogCard
                key={rPost.slug}
                slug={rPost.slug}
                title={rPost.title}
                excerpt={rPost.excerpt}
                href={`/blogs/${rPost.slug}`}
                category={rPost.category}
                categoryColor={rPost.categoryColor}
                readTime={rPost.readTime}
                publishedAt={rPost.publishedAt}
                authorName={rPost.author.name}
                badge={rPost.badge}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
