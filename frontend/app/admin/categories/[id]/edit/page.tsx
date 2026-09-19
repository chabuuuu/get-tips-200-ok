"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/utils/api';
import Link from 'next/link';
import { Edit3, ArrowLeft } from 'lucide-react';

export default function EditCategory() {
  const params = useParams();
  const id = params?.id as string;
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        if (!id) return;
        const res = await api.get(`/categories/${id}`);
        setName(res.data.name);
        setSlug(res.data.slug);
        setDescription(res.data.description || '');
      } catch (err) {
        console.error(err);
        alert("Không tìm thấy danh mục");
        router.push('/admin/categories');
      } finally {
        setLoading(false);
      }
    };
    fetchCategory();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/categories/${id}`, {
        name,
        slug,
        description,
      });
      router.push('/admin/categories');
    } catch (err) {
      console.error(err);
      alert('Lỗi cập nhật danh mục');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-xs">
        Đang tải thông tin danh mục...
      </div>
    );
  }

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
            <Edit3 className="text-blue-400" size={24} />
            Chỉnh sửa Danh mục
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cập nhật tên, slug và mô tả danh mục
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
              className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none"
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
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-2">Mô tả danh mục</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-slate-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none h-28"
            />
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
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
