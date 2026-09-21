import React from 'react';

export default function HomeLoading() {
  return (
    <div className="min-h-screen font-sans pb-16">
      {/* Hero Section Skeleton */}
      <section className="bg-white dark:bg-[#101010] text-center pt-20 pb-16 transition-colors duration-300 animate-pulse">
        <div className="h-4 w-64 bg-gray-200 dark:bg-[#202020] rounded-full mx-auto mb-4" />
        <div className="space-y-3 max-w-xl mx-auto">
          <div className="h-12 md:h-16 bg-gray-200 dark:bg-[#202020] rounded-2xl w-4/5 mx-auto" />
          <div className="h-12 md:h-16 bg-gray-200 dark:bg-[#202020] rounded-2xl w-3/5 mx-auto" />
        </div>
      </section>

      {/* Main Content Skeleton */}
      <main className="container mx-auto px-4 max-w-6xl py-10 animate-pulse">
        {/* Featured Section */}
        <div className="mb-16">
          <div className="h-8 w-48 bg-gray-200 dark:bg-[#202020] rounded-lg mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#181818] rounded-lg overflow-hidden border border-gray-200 dark:border-[#222]"
              >
                <div className="aspect-[2/1] bg-gray-200 dark:bg-[#222]" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-gray-200 dark:bg-[#252525] rounded w-full" />
                  <div className="h-5 bg-gray-200 dark:bg-[#252525] rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Posts Section */}
        <div>
          <div className="h-8 w-36 bg-gray-200 dark:bg-[#202020] rounded-lg mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#181818] rounded-lg overflow-hidden border border-gray-200 dark:border-[#222]"
              >
                <div className="aspect-video bg-gray-200 dark:bg-[#222]" />
                <div className="p-4 space-y-2.5">
                  <div className="h-3 w-20 bg-blue-500/15 rounded-full" />
                  <div className="h-5 bg-gray-200 dark:bg-[#252525] rounded w-full" />
                  <div className="h-5 bg-gray-200 dark:bg-[#252525] rounded w-4/5" />
                  <div className="h-3 w-28 bg-gray-200 dark:bg-[#252525] rounded mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
