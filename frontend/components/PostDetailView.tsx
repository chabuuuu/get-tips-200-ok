"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PostContent from '@/components/PostContent';
import ReactionButton from '@/components/Reactions/ReactionButton';
import GiscusComments from '@/components/GiscusComments';
import RecommendedPosts from '@/components/RecommendedPosts';
import LanguageSelector from '@/components/LanguageSelector';
import { Locale } from '@/context/LanguageContext';

interface PostDetailViewProps {
  post: any;
  initialLang?: string;
  primaryCategory?: any;
}

export default function PostDetailView({
  post,
  initialLang,
  primaryCategory,
}: PostDetailViewProps) {
  const [activeLocale, setActiveLocale] = useState<string>(
    initialLang || post.active_locale || 'vi'
  );

  // Sync state if initialLang prop changes
  useEffect(() => {
    if (initialLang) {
      setActiveLocale(initialLang);
    }
  }, [initialLang]);

  // Support browser Back/Forward buttons without full page reload
  useEffect(() => {
    const handlePopState = () => {
      const url = new URL(window.location.href);
      const langParam = url.searchParams.get('lang');
      const resolved = langParam || post.default_locale || 'vi';
      setActiveLocale(resolved);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [post.default_locale]);

  // Resolve current language data directly from memory
  const currentLocaleData = post.locale_data?.[activeLocale] || null;
  const title = currentLocaleData?.title || post.title;
  const content = currentLocaleData?.content || post.content;

  // Handle instant language toggle
  const handleSelectLocale = (newLocale: Locale) => {
    setActiveLocale(newLocale);

    // Update URL query in address bar cleanly without triggering SSR / unmounting
    const url = new URL(window.location.href);
    url.searchParams.set('lang', newLocale);
    window.history.pushState({}, '', url.pathname + url.search);
  };

  const isJapanese = activeLocale === 'ja';
  const readingTime = Math.max(1, Math.ceil((content || '').split(/\s+/).length / 200));

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumb Navigation for SEO and UX */}
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        <ol className="flex items-center space-x-2 flex-wrap">
          <li>
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Trang chủ
            </Link>
          </li>
          {primaryCategory && (
            <>
              <li className="text-gray-400">/</li>
              <li>
                <Link
                  href={`/category/${primaryCategory.slug}`}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {primaryCategory.name}
                </Link>
              </li>
            </>
          )}
          <li className="text-gray-400">/</li>
          <li className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-xs md:max-w-md">
            {title}
          </li>
        </ol>
      </nav>

      {/* Fallback Notice if Japanese requested but translation missing */}
      {isJapanese && (!post.available_locales?.includes('ja') || !post.locale_data?.ja?.content) && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs sm:text-sm flex items-center space-x-2">
          <span>ℹ️</span>
          <span>
            Bài viết này chưa có phiên bản tiếng Nhật. Đang hiển thị bản gốc bằng tiếng Việt.
          </span>
        </div>
      )}

      <article className="bg-white dark:bg-[#181818] p-8 md:p-12 rounded-lg border border-gray-200 dark:border-[#222] shadow-sm dark:shadow-none transition-colors duration-300">
        <header className="mb-8 text-center border-b border-gray-200 dark:border-[#222] pb-8">
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4">
            <time dateTime={post.created_at}>
              {new Date(post.created_at).toLocaleDateString(
                isJapanese ? 'ja-JP' : 'vi-VN',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }
              )}
            </time>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight transition-all duration-150">
            {title}
          </h1>

          <div className="flex items-center justify-center space-x-4 md:space-x-6 text-gray-500 text-xs uppercase tracking-wide">
            <span>{isJapanese ? '著者: GET TIPS 200 OK' : 'Bởi GET TIPS 200 OK'}</span>
            <span>•</span>
            <span>
              {post.view_count || 0} {isJapanese ? '回閲覧' : 'lượt xem'}
            </span>
            <span>•</span>
            <span>
              {readingTime} {isJapanese ? '分で読める' : 'phút đọc'}
            </span>
          </div>

          {/* Instant Client-side Language Switcher */}
          <div className="flex justify-center mt-6">
            <LanguageSelector
              variant="post"
              availableLocales={post.available_locales || ['vi']}
              activeLocale={activeLocale}
              onSelectLocale={handleSelectLocale}
            />
          </div>

          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="flex justify-center flex-wrap gap-2 mt-6">
              {post.categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug || cat.id}`}
                  className="px-3 py-1 bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400 text-xs rounded-full hover:bg-blue-50 dark:hover:bg-[#2a2a2a] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  #{cat.name}
                </Link>
              ))}
            </div>
          )}
        </header>

        {post.cover_image && (
          <div className="mb-10 rounded-2xl overflow-hidden shadow-lg">
            <img
              src={post.cover_image}
              alt={title}
              className="w-full object-cover max-h-[500px]"
              loading="eager"
            />
          </div>
        )}

        {/* Post Content */}
        <PostContent content={content} />

        <div className="mt-8 flex justify-center">
          <ReactionButton postId={post.id} initialCounts={post.reaction_counts} />
        </div>

        {/* Smart Recommended Posts Section */}
        <RecommendedPosts currentSlug={post.slug} currentPostId={post.id} lang={activeLocale} />

        {/* Comments Section */}
        <GiscusComments />
      </article>
    </main>
  );
}
