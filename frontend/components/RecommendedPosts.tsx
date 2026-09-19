"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Eye, Clock, Calendar, ArrowRight, BookOpen } from 'lucide-react';
import api from '@/utils/api';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Post {
  id: number;
  title: string;
  slug: string;
  description: string;
  cover_image: string;
  content?: string;
  view_count: number;
  created_at: string;
  categories?: Category[];
}

interface RecommendedPostsProps {
  currentSlug: string;
  currentPostId?: number;
}

export default function RecommendedPosts({
  currentSlug,
  currentPostId,
}: RecommendedPostsProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const res = await api.get(
          `/posts/recommended?current_slug=${encodeURIComponent(currentSlug)}&limit=4`
        );
        setPosts(res.data || []);
      } catch (err) {
        console.error("Failed to load recommended posts", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentSlug) {
      fetchRecommendations();
    }
  }, [currentSlug, currentPostId]);

  if (!loading && posts.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-10 border-t border-gray-200 dark:border-[#222]">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Sparkles size={13} className="text-blue-500 animate-pulse" />
              Đề xuất thông minh
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Bài viết liên quan & Đề xuất cho bạn
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gợi ý dựa trên chuyên mục, nội dung tương tự và bài viết được độc giả quan tâm nhất
          </p>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#262626] animate-pulse space-y-4"
            >
              <div className="h-40 bg-gray-200 dark:bg-[#252525] rounded-xl" />
              <div className="h-4 bg-gray-200 dark:bg-[#252525] rounded w-1/3" />
              <div className="h-6 bg-gray-200 dark:bg-[#252525] rounded w-4/5" />
              <div className="h-4 bg-gray-200 dark:bg-[#252525] rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        /* Recommended Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((item) => {
            const dateStr = item.created_at
              ? new Date(item.created_at).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : '';

            return (
              <Link
                key={item.id}
                href={`/posts/${item.slug}`}
                className="group flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#262626] hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                <div>
                  {/* Thumbnail / Cover Image */}
                  <div className="relative h-44 w-full mb-4 rounded-xl overflow-hidden bg-gray-100 dark:bg-[#222]">
                    {item.cover_image ? (
                      <img
                        src={item.cover_image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900/20 via-slate-800/30 to-indigo-950/20 text-gray-400 dark:text-gray-500 p-4 text-center">
                        <BookOpen size={32} className="text-blue-500/60 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">GET TIPS 200 OK</span>
                      </div>
                    )}

                    {/* First Category Badge overlay */}
                    {item.categories && item.categories.length > 0 && (
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-white border border-white/10 shadow-sm">
                          {item.categories[0].name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>

                  {/* Description snippet */}
                  {item.description && (
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Footer Metadata */}
                <div className="mt-5 pt-3.5 border-t border-gray-100 dark:border-[#262626] flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-3">
                    {dateStr && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" />
                        {dateStr}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye size={12} className="text-gray-400" />
                      {(item.view_count || 0).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-0.5 transition-transform text-xs">
                    Đọc tiếp <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
