import React from 'react';

export default function PostLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101010] text-gray-900 dark:text-gray-300 font-sans pb-20 transition-colors duration-300">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6 flex items-center space-x-2 animate-pulse">
          <div className="h-4 w-16 bg-gray-200 dark:bg-[#222] rounded" />
          <div className="h-4 w-3 text-gray-400">/</div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-[#222] rounded" />
          <div className="h-4 w-3 text-gray-400">/</div>
          <div className="h-4 w-40 bg-gray-200 dark:bg-[#222] rounded" />
        </div>

        {/* Article Container Skeleton */}
        <article className="bg-white dark:bg-[#181818] p-8 md:p-12 rounded-2xl border border-gray-200 dark:border-[#222] shadow-sm dark:shadow-none animate-pulse">
          {/* Header */}
          <header className="mb-8 text-center border-b border-gray-200 dark:border-[#222] pb-8">
            {/* Date */}
            <div className="flex justify-center mb-4">
              <div className="h-4 w-32 bg-blue-500/10 dark:bg-blue-500/20 rounded-full" />
            </div>

            {/* Title */}
            <div className="space-y-3 max-w-2xl mx-auto mb-6">
              <div className="h-8 md:h-10 bg-gray-200 dark:bg-[#252525] rounded-xl w-full" />
              <div className="h-8 md:h-10 bg-gray-200 dark:bg-[#252525] rounded-xl w-3/4 mx-auto" />
            </div>

            {/* Meta (Author, views, reading time) */}
            <div className="flex items-center justify-center space-x-4 md:space-x-6">
              <div className="h-3 w-28 bg-gray-200 dark:bg-[#252525] rounded" />
              <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-[#333]" />
              <div className="h-3 w-20 bg-gray-200 dark:bg-[#252525] rounded" />
              <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-[#333]" />
              <div className="h-3 w-20 bg-gray-200 dark:bg-[#252525] rounded" />
            </div>

            {/* Language Switcher Placeholder */}
            <div className="flex justify-center mt-6">
              <div className="h-8 w-56 bg-gray-100 dark:bg-[#202020] rounded-full" />
            </div>
          </header>

          {/* Cover Image Placeholder */}
          <div className="mb-10 rounded-2xl overflow-hidden bg-gray-200 dark:bg-[#252525] h-64 md:h-96 w-full" />

          {/* Content Shimmer Paragraphs */}
          <div className="space-y-4 max-w-none">
            <div className="h-4 bg-gray-200 dark:bg-[#252525] rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-[#252525] rounded w-[96%]" />
            <div className="h-4 bg-gray-200 dark:bg-[#252525] rounded w-[92%]" />
            <div className="h-4 bg-gray-200 dark:bg-[#252525] rounded w-[85%]" />

            {/* Code block shimmer */}
            <div className="my-8 p-6 rounded-xl bg-gray-100 dark:bg-[#141414] border border-gray-200 dark:border-[#262626] space-y-3">
              <div className="h-3 bg-gray-300 dark:bg-[#2a2a2a] rounded w-2/5" />
              <div className="h-3 bg-gray-300 dark:bg-[#2a2a2a] rounded w-4/5" />
              <div className="h-3 bg-gray-300 dark:bg-[#2a2a2a] rounded w-3/5" />
            </div>

            <div className="h-4 bg-gray-200 dark:bg-[#252525] rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-[#252525] rounded w-[94%]" />
            <div className="h-4 bg-gray-200 dark:bg-[#252525] rounded w-[70%]" />
          </div>
        </article>
      </main>
    </div>
  );
}
