"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import Editor from '@/components/Editor';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  // Auto-generate slug from title
  React.useEffect(() => {
    const generatedSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generatedSlug);
  }, [title]);

  // Fetch categories
  React.useEffect(() => {
    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
        } catch (err) {
            console.error("Failed to fetch categories");
        }
    };
    fetchCategories();
  }, []);

  const toggleCategory = (id: number) => {
      setSelectedCategories(prev => 
        prev.includes(id) 
            ? prev.filter(c => c !== id)
            : [...prev, id]
      );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
        const res = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        setCoverImage(res.data.link);
    } catch (err) {
        console.error("Upload failed", err);
        alert("Failed to upload image");
    } finally {
        setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/posts', {
        title,
        slug,
        content,
        cover_image: coverImage,
        category_ids: selectedCategories,
        is_published: isPublished
      });
      router.push('/admin/dashboard');
    } catch (err) {
      console.error(err);
      alert('Error creating post');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Viết Bài Mới
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tạo và biên tập bài viết mới cho blog
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/admin/dashboard')}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-850 transition"
        >
          &larr; Quay lại
        </button>
      </div>

      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs sm:text-sm">
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              Tiêu đề bài viết <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none"
              placeholder="Nhập tiêu đề bài viết..."
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
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-2">Ảnh bìa (Cover Image)</label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-xs text-slate-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-xl file:border-0
                  file:text-xs file:font-semibold
                  file:bg-blue-600/20 file:text-blue-400
                  hover:file:bg-blue-600/30 file:cursor-pointer"
              />
              {uploading && <span className="text-xs text-blue-400 shrink-0">Đang tải ảnh...</span>}
            </div>
            {coverImage && (
              <div className="mt-3">
                <img
                  src={coverImage}
                  alt="Cover Preview"
                  className="h-40 w-auto object-cover rounded-xl border border-slate-800 shadow-md"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-2">Danh mục chuyên môn</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    selectedCategories.includes(cat.id)
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                      : 'bg-slate-850 text-slate-300 border border-slate-700/80 hover:bg-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-2">Nội dung bài viết</label>
            <div className="bg-white rounded-xl overflow-hidden border border-slate-700/80">
              <Editor model={content} onModelChange={setContent} />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-slate-850 rounded-xl border border-slate-700/80">
            <input
              type="checkbox"
              id="publish"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="publish" className="text-slate-200 select-none cursor-pointer font-medium">
              Xuất bản công khai ngay lập tức (Bỏ chọn nếu muốn lưu bản nháp)
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-600/25 transition hover:scale-[1.02]"
            >
              Tạo bài viết
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-slate-400 hover:text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition"
            >
              Hủy bỏ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
