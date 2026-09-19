"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import {
  FileText,
  Eye,
  FolderTree,
  Heart,
  TrendingUp,
  BarChart3,
  Search,
  ArrowUpDown,
  PlusCircle,
  ExternalLink,
  Edit3,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  X,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
} from 'lucide-react';

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
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  categories?: Category[];
}

interface AdminStats {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  total_views: number;
  total_categories: number;
  total_comments: number;
  total_reactions: number;
  top_viewed_posts?: {
    id: number;
    title: string;
    slug: string;
    view_count: number;
    is_published: boolean;
  }[];
  category_stats?: {
    id: number;
    name: string;
    slug: string;
    post_count: number;
  }[];
}

export default function AdminDashboard() {
  const router = useRouter();

  // Data states
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    'newest' | 'oldest' | 'views_desc' | 'views_asc' | 'title_asc' | 'title_desc'
  >('newest');

  // Delete modal state
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchPosts(), fetchCategories()]);
    setLoading(false);
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchPosts(), fetchCategories()]);
    setRefreshing(false);
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.warn("Failed to fetch /admin/stats, calculating client-side fallback");
    }
  };

  const fetchPosts = async () => {
    try {
      // Try admin posts endpoint first (includes drafts)
      const res = await api.get('/admin/posts');
      if (res.data?.data) {
        setPosts(res.data.data);
      } else if (Array.isArray(res.data)) {
        setPosts(res.data);
      }
    } catch (err) {
      // Fallback to regular posts
      try {
        const res = await api.get('/posts?limit=500');
        setPosts(res.data.data || []);
      } catch (fallbackErr) {
        console.error("Failed to fetch posts", fallbackErr);
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  // Toggle publish status fast
  const handleTogglePublish = async (post: Post) => {
    setActionLoadingId(post.id);
    try {
      const res = await api.patch(`/admin/posts/${post.id}/toggle-publish`);
      const updatedStatus = res.data.is_published;

      // Update local posts state
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, is_published: updatedStatus } : p))
      );

      // Update local stats
      setStats((prev) => {
        if (!prev) return prev;
        const diff = updatedStatus ? 1 : -1;
        return {
          ...prev,
          published_posts: prev.published_posts + diff,
          draft_posts: prev.draft_posts - diff,
        };
      });
    } catch (err) {
      alert("Không thể đổi trạng thái bài viết.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete post
  const confirmDelete = async () => {
    if (!postToDelete) return;
    const id = postToDelete.id;
    try {
      await api.delete(`/posts/${id}`);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      // Refresh stats
      fetchStats();
      setPostToDelete(null);
    } catch (err) {
      alert("Xóa bài viết thất bại!");
    }
  };

  // Client-side Filtered and Sorted Posts
  const filteredAndSortedPosts = useMemo(() => {
    let result = [...posts];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.slug?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (statusFilter === 'published') {
      result = result.filter((p) => p.is_published);
    } else if (statusFilter === 'draft') {
      result = result.filter((p) => !p.is_published);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter((p) =>
        p.categories?.some(
          (c) => String(c.id) === categoryFilter || c.slug === categoryFilter
        )
      );
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'views_desc':
          return (b.view_count || 0) - (a.view_count || 0);
        case 'views_asc':
          return (a.view_count || 0) - (b.view_count || 0);
        case 'title_asc':
          return a.title.localeCompare(b.title, 'vi');
        case 'title_desc':
          return b.title.localeCompare(a.title, 'vi');
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [posts, searchQuery, statusFilter, categoryFilter, sortBy]);

  // Derived metrics fallback if backend stats isn't fully ready
  const displayStats = useMemo(() => {
    const totalPosts = stats?.total_posts ?? posts.length;
    const publishedPosts =
      stats?.published_posts ?? posts.filter((p) => p.is_published).length;
    const draftPosts =
      stats?.draft_posts ?? posts.filter((p) => !p.is_published).length;
    const totalViews =
      stats?.total_views ?? posts.reduce((acc, p) => acc + (p.view_count || 0), 0);
    const avgViews = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0;
    const totalCategories = stats?.total_categories ?? categories.length;
    const interactions = (stats?.total_reactions || 0) + (stats?.total_comments || 0);

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      totalViews,
      avgViews,
      totalCategories,
      interactions,
    };
  }, [stats, posts, categories]);

  // Category distribution for visual analytics
  const categoryStatsList = useMemo(() => {
    if (stats?.category_stats && stats.category_stats.length > 0) {
      return stats.category_stats
        .filter((c) => c.post_count > 0)
        .sort((a, b) => b.post_count - a.post_count);
    }
    // Fallback calculation from posts
    const map = new Map<string, number>();
    posts.forEach((p) => {
      p.categories?.forEach((c) => {
        map.set(c.name, (map.get(c.name) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .map(([name, count], idx) => ({ id: idx, name, slug: name, post_count: count }))
      .sort((a, b) => b.post_count - a.post_count);
  }, [stats, posts]);

  // Top viewed posts
  const topViewedPosts = useMemo(() => {
    if (stats?.top_viewed_posts && stats.top_viewed_posts.length > 0) {
      return stats.top_viewed_posts;
    }
    return [...posts]
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 5);
  }, [stats, posts]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || statusFilter !== 'all' || categoryFilter !== 'all' || sortBy !== 'newest';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-850 to-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Bảng điều khiển Quản trị
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <Sparkles size={11} /> Hệ thống sẵn sàng
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Theo dõi hiệu suất bài viết, số liệu tương tác độc giả và quản lý nội dung blog.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-2 text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white px-3.5 py-2.5 rounded-xl border border-slate-700/80 transition-all shadow-sm"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-400' : ''} />
            <span>{refreshing ? 'Đang làm mới...' : 'Làm mới'}</span>
          </button>
          <Link
            href="/admin/posts/create"
            className="flex items-center gap-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02]"
          >
            <PlusCircle size={15} />
            <span>Thêm bài mới</span>
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. SECTION: BÁO CÁO & THỐNG KÊ (ANALYTICS & METRICS) */}
      {/* ============================================================ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Báo cáo & Thống kê</h2>
          </div>
          <span className="text-xs text-slate-400">Dữ liệu thời gian thực</span>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Tổng bài viết */}
          <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800/80 p-5 rounded-2xl hover:border-slate-700 transition-colors shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Tổng số bài viết
                </p>
                <p className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">
                  {loading ? '...' : displayStats.totalPosts}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <FileText size={22} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-medium">
                <CheckCircle2 size={11} /> {displayStats.publishedPosts} Đã đăng
              </span>
              <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md font-medium">
                <AlertCircle size={11} /> {displayStats.draftPosts} Bản nháp
              </span>
            </div>
          </div>

          {/* Card 2: Lượt xem */}
          <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800/80 p-5 rounded-2xl hover:border-slate-700 transition-colors shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Tổng lượt xem
                </p>
                <p className="text-3xl font-extrabold text-cyan-400 mt-1.5 tracking-tight">
                  {loading ? '...' : displayStats.totalViews.toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Eye size={22} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-400">
              <TrendingUp size={13} className="text-emerald-400 mr-1.5" />
              <span>
                Trung bình{' '}
                <strong className="text-slate-200 font-semibold">{displayStats.avgViews}</strong>{' '}
                lượt xem / bài
              </span>
            </div>
          </div>

          {/* Card 3: Danh mục */}
          <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800/80 p-5 rounded-2xl hover:border-slate-700 transition-colors shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Danh mục chủ đề
                </p>
                <p className="text-3xl font-extrabold text-purple-400 mt-1.5 tracking-tight">
                  {loading ? '...' : displayStats.totalCategories}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <FolderTree size={22} />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400 truncate">
              <span>Được phân loại theo công nghệ & chủ đề</span>
            </div>
          </div>

          {/* Card 4: Tương tác */}
          <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800/80 p-5 rounded-2xl hover:border-slate-700 transition-colors shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Tương tác độc giả
                </p>
                <p className="text-3xl font-extrabold text-rose-400 mt-1.5 tracking-tight">
                  {loading ? '...' : displayStats.interactions}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Heart size={22} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="text-slate-300 font-medium">
                {stats?.total_reactions || 0} cảm xúc
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-medium">
                {stats?.total_comments || 0} bình luận
              </span>
            </div>
          </div>
        </div>

        {/* Visual Charts / Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Chart 1: Phân bổ bài viết theo danh mục */}
          <div className="bg-slate-900/90 border border-slate-800/80 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Phân bổ theo Danh mục
                  </h3>
                </div>
                <Link
                  href="/admin/categories"
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Quản lý danh mục &rarr;
                </Link>
              </div>

              {categoryStatsList.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Chưa có dữ liệu danh mục</p>
              ) : (
                <div className="space-y-3.5">
                  {categoryStatsList.slice(0, 5).map((cat) => {
                    const percentage = displayStats.totalPosts > 0
                      ? Math.round((cat.post_count / displayStats.totalPosts) * 100)
                      : 0;
                    return (
                      <div key={cat.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium">{cat.name}</span>
                          <span className="text-slate-400">
                            <strong className="text-white font-semibold">{cat.post_count}</strong> bài{' '}
                            <span className="text-slate-500">({percentage}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Đang hiển thị top danh mục nhiều bài nhất</span>
              <span>Tổng: {displayStats.totalCategories} danh mục</span>
            </div>
          </div>

          {/* Chart 2: Top 5 bài viết nhiều lượt xem nhất */}
          <div className="bg-slate-900/90 border border-slate-800/80 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Top 5 Bài viết Nhiều Lượt Xem
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Bảng xếp hạng</span>
              </div>

              {topViewedPosts.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Chưa có bài viết nào</p>
              ) : (
                <div className="space-y-2.5">
                  {topViewedPosts.map((post, idx) => {
                    const rankColors = [
                      'bg-amber-500/20 text-amber-300 border-amber-500/30',
                      'bg-slate-300/20 text-slate-200 border-slate-400/30',
                      'bg-orange-500/20 text-orange-300 border-orange-500/30',
                      'bg-slate-800 text-slate-400 border-slate-700',
                      'bg-slate-800 text-slate-400 border-slate-700',
                    ];
                    return (
                      <div
                        key={post.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-850/50 hover:bg-slate-800/60 border border-slate-800/60 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <span
                            className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center border shrink-0 ${
                              rankColors[idx] || rankColors[3]
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <Link
                            href={`/posts/${post.slug}`}
                            target="_blank"
                            title={post.title}
                            className="text-xs font-medium text-slate-200 hover:text-blue-400 truncate transition-colors"
                          >
                            {post.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            <Eye size={12} /> {post.view_count.toLocaleString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Được tính theo tổng lượt truy cập bài viết</span>
              <span>Tổng view: {displayStats.totalViews.toLocaleString('vi-VN')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. SECTION: QUẢN LÝ BÀI VIẾT (SORT, FILTER, ACTIONS) */}
      {/* ============================================================ */}
      <section id="posts-section" className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Danh sách bài viết</h2>
            <span className="text-xs font-medium bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
              {filteredAndSortedPosts.length} / {posts.length} bài
            </span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors self-start sm:self-auto"
            >
              <X size={13} />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        {/* Filter & Sort Controls Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-2xl shadow-lg space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                placeholder="Tìm theo tiêu đề, slug, mô tả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-850 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="md:col-span-3 flex items-center bg-slate-850 p-1 rounded-xl border border-slate-700/80 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất cả ({posts.length})
              </button>
              <button
                onClick={() => setStatusFilter('published')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all ${
                  statusFilter === 'published'
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Đã đăng ({displayStats.publishedPosts})
              </button>
              <button
                onClick={() => setStatusFilter('draft')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all ${
                  statusFilter === 'draft'
                    ? 'bg-amber-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Nháp ({displayStats.draftPosts})
              </button>
            </div>

            {/* Category Filter Dropdown */}
            <div className="md:col-span-3">
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-850 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">Tất cả danh mục ({categories.length})</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <SlidersHorizontal size={14} />
                </div>
              </div>
            </div>

            {/* Sort Options Dropdown */}
            <div className="md:col-span-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full py-2 px-3 bg-slate-850 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="views_desc">Lượt xem: Cao &darr;</option>
                  <option value="views_asc">Lượt xem: Thấp &uarr;</option>
                  <option value="title_asc">Tiêu đề: A &rarr; Z</option>
                  <option value="title_desc">Tiêu đề: Z &rarr; A</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <ArrowUpDown size={14} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Table Card */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-850/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-4">Bài viết</th>
                  <th className="px-6 py-4">Danh mục</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Lượt xem</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs">Đang tải danh sách bài viết...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredAndSortedPosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
                          <FileText size={24} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-300">Không tìm thấy bài viết nào</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {hasActiveFilters
                              ? 'Thử thay đổi từ khóa hoặc điều kiện lọc của bạn.'
                              : 'Chưa có bài viết trong hệ thống. Hãy tạo bài viết đầu tiên!'}
                          </p>
                        </div>
                        {hasActiveFilters ? (
                          <button
                            onClick={resetFilters}
                            className="mt-1 text-xs text-blue-400 hover:underline font-medium"
                          >
                            Xóa tất cả bộ lọc
                          </button>
                        ) : (
                          <Link
                            href="/admin/posts/create"
                            className="mt-1 inline-flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg font-medium transition"
                          >
                            <PlusCircle size={14} /> Tạo bài viết ngay
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedPosts.map((post) => {
                    const isToggling = actionLoadingId === post.id;
                    const dateFormatted = post.created_at
                      ? new Date(post.created_at).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : '---';

                    return (
                      <tr
                        key={post.id}
                        className="hover:bg-slate-850/50 transition-colors group"
                      >
                        {/* Title & Slug */}
                        <td className="px-6 py-4 max-w-xs sm:max-w-md">
                          <div className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2">
                            {post.title}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                            /{post.slug}
                          </div>
                        </td>

                        {/* Categories */}
                        <td className="px-6 py-4">
                          {post.categories && post.categories.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {post.categories.map((c) => (
                                <span
                                  key={c.id}
                                  className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700/80 px-2 py-0.5 rounded-md font-medium"
                                >
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">Không có</span>
                          )}
                        </td>

                        {/* Status Toggle Badge */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleTogglePublish(post)}
                            disabled={isToggling}
                            title="Nhấn để đổi trạng thái nhanh"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${
                              post.is_published
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                            } ${isToggling ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                post.is_published ? 'bg-emerald-400' : 'bg-amber-400'
                              }`}
                            />
                            <span>{post.is_published ? 'Đã xuất bản' : 'Bản nháp'}</span>
                          </button>
                        </td>

                        {/* Views */}
                        <td className="px-6 py-4">
                          <span className="text-slate-300 font-semibold flex items-center gap-1 text-xs">
                            <Eye size={13} className="text-slate-500" />
                            {(post.view_count || 0).toLocaleString('vi-VN')}
                          </span>
                        </td>

                        {/* Created Date */}
                        <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                          {dateFormatted}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {post.is_published && (
                              <Link
                                href={`/posts/${post.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Xem bài viết trên trang chủ"
                                className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                              >
                                <ExternalLink size={15} />
                              </Link>
                            )}
                            <Link
                              href={`/admin/posts/${post.id}/edit`}
                              title="Chỉnh sửa bài viết"
                              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            >
                              <Edit3 size={15} />
                            </Link>
                            <button
                              onClick={() => setPostToDelete(post)}
                              title="Xóa bài viết"
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Summary */}
          {!loading && filteredAndSortedPosts.length > 0 && (
            <div className="px-6 py-3.5 bg-slate-850/50 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
              <span>
                Hiển thị <strong className="text-white">{filteredAndSortedPosts.length}</strong> / {posts.length} bài viết
              </span>
              <span className="text-[11px] text-slate-500">
                Mẹo: Bấm vào huy hiệu trạng thái để chuyển đổi nhanh giữa Đã xuất bản & Bản nháp.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Trash2 size={20} />
              </div>
              <h3 className="font-bold text-white text-base">Xác nhận xóa bài viết</h3>
            </div>
            <p className="text-sm text-slate-300">
              Bạn có chắc chắn muốn xóa bài viết{' '}
              <span className="font-semibold text-white">"{postToDelete.title}"</span>? Hành
              động này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPostToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/25 transition"
              >
                Xóa bài viết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
