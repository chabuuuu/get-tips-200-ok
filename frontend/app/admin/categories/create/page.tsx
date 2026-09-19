"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import Link from 'next/link';
import { FolderPlus, ArrowLeft } from 'lucide-react';

export default function CreateCategory() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Auto-generate slug
  React.useEffect(() => {
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generatedSlug);
  }, [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/categories', {
        name,
        slug,
        description,
      });
      router.push('/admin/categories');
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tạo danh mục');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/categories"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderPlus className="text-blue-400" size={24} />
            Tạo Danh mục Mới
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Thêm danh mục mới để phân loại bài viết
          </p>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs sm:text-sm">
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              Tên danh mục <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none"
              placeholder="VD: DevOps, Backend, AI..."
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-2">Đường dẫn (Slug)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-slate-400 font-mono focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none"
              placeholder="auto-generated-slug"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-2">Mô tả danh mục</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none h-28"
              placeholder="Mô tả ngắn gọn về danh mục này (tùy chọn)..."
            />
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
            >
              {loading ? 'Đang tạo...' : 'Tạo danh mục'}
            </button>
            <Link
              href="/admin/categories"
              className="text-slate-400 hover:text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition"
            >
              Hủy bỏ
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
