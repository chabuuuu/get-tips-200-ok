"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import Editor from '@/components/Editor';

export default function CreatePost() {
  const [activeTab, setActiveTab] = useState<'vi' | 'ja'>('vi');

  // Vietnamese (Default)
  const [viTitle, setViTitle] = useState('');
  const [viDescription, setViDescription] = useState('');
  const [viContent, setViContent] = useState('');

  // Japanese (Optional translation)
  const [jaTitle, setJaTitle] = useState('');
  const [jaDescription, setJaDescription] = useState('');
  const [jaContent, setJaContent] = useState('');

  // Default priority language
  const [defaultLocale, setDefaultLocale] = useState<'vi' | 'ja'>('vi');

  const [slug, setSlug] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  // Auto-generate slug from Vietnamese title
  React.useEffect(() => {
    const generatedSlug = viTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generatedSlug);
  }, [viTitle]);

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
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
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
        headers: { 'Content-Type': 'multipart/form-data' },
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
    if (!viTitle.trim()) {
      setActiveTab('vi');
      alert('Vui lòng nhập tiêu đề bài viết bằng tiếng Việt');
      return;
    }

    try {
      const translations = [];
      if (jaTitle.trim() || jaContent.trim()) {
        translations.push({
          locale: 'ja',
          title: jaTitle.trim() || viTitle,
          description: jaDescription.trim(),
          content: jaContent,
        });
      }

      await api.post('/posts', {
        title: viTitle,
        description: viDescription,
        slug,
        content: viContent,
        cover_image: coverImage,
        category_ids: selectedCategories,
        is_published: isPublished,
        default_locale: defaultLocale,
        translations,
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
            Viết Bài Mới (Đa Ngôn Ngữ)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tạo và biên tập bài viết hỗ trợ cả Tiếng Việt và Tiếng Nhật
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
          {/* Multilingual Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('vi')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'vi'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>🇻🇳</span>
              <span>Tiếng Việt (Mặc định)</span>
              {viTitle && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ja')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'ja'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>🇯🇵</span>
              <span>Tiếng Nhật (日本語 - Tùy chọn)</span>
              {jaTitle && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
            </button>
          </div>

          {/* Vietnamese Fields */}
          <div className={activeTab === 'vi' ? 'space-y-5' : 'hidden'}>
            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                Tiêu đề bài viết (Tiếng Việt) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={viTitle}
                onChange={(e) => setViTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none"
                placeholder="Nhập tiêu đề tiếng Việt..."
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                Mô tả tóm tắt (SEO Meta Description)
              </label>
              <textarea
                value={viDescription}
                onChange={(e) => setViDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 bg-slate-850 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none resize-none"
                placeholder="Tóm tắt ngắn 150-160 ký tự cho kết quả tìm kiếm..."
              />
            </div>
          </div>

          {/* Japanese Fields */}
          <div className={activeTab === 'ja' ? 'space-y-5' : 'hidden'}>
            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                Tiêu đề bài viết (日本語 - Japanese Title)
              </label>
              <input
                type="text"
                value={jaTitle}
                onChange={(e) => setJaTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-850 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none"
                placeholder="日本語のタイトルを入力してください..."
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                Mô tả tóm tắt tiếng Nhật (日本語の概要)
              </label>
              <textarea
                value={jaDescription}
                onChange={(e) => setJaDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 bg-slate-850 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none resize-none"
                placeholder="日本語の記事概要..."
              />
            </div>
          </div>

          {/* Common metadata: Slug, Cover Image, Categories */}
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

          {/* Priority Language Selector */}
          <div className="p-4 bg-slate-850/60 rounded-xl border border-slate-700/80 space-y-3">
            <div>
              <label className="block text-slate-200 font-semibold text-xs sm:text-sm">
                Ngôn ngữ ưu tiên hiển thị khi người dùng truy cập bài viết
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Quyết định phiên bản ngôn ngữ nào sẽ xuất hiện đầu tiên khi độc giả nhấp vào xem bài viết
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  defaultLocale === 'vi'
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                    : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="default_locale"
                  value="vi"
                  checked={defaultLocale === 'vi'}
                  onChange={() => setDefaultLocale('vi')}
                  className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-semibold text-xs sm:text-sm flex items-center space-x-1.5">
                    <span>🇻🇳</span>
                    <span>Ưu tiên Tiếng Việt (Mặc định)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Độc giả vào link sẽ xem bản Tiếng Việt trước
                  </p>
                </div>
              </label>

              <label
                className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  defaultLocale === 'ja'
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                    : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="default_locale"
                  value="ja"
                  checked={defaultLocale === 'ja'}
                  onChange={() => setDefaultLocale('ja')}
                  className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-semibold text-xs sm:text-sm flex items-center space-x-1.5">
                    <span>🇯🇵</span>
                    <span>Ưu tiên Tiếng Nhật (日本語)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Độc giả vào link sẽ xem ngay bản Tiếng Nhật
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Editors for each language */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              Nội dung bài viết ({activeTab === 'vi' ? '🇻🇳 Tiếng Việt' : '🇯🇵 日本語'})
            </label>
            <div className={`bg-white rounded-xl overflow-hidden border border-slate-700/80 ${activeTab === 'vi' ? 'block' : 'hidden'}`}>
              <Editor model={viContent} onModelChange={setViContent} />
            </div>
            <div className={`bg-white rounded-xl overflow-hidden border border-slate-700/80 ${activeTab === 'ja' ? 'block' : 'hidden'}`}>
              <Editor model={jaContent} onModelChange={setJaContent} />
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
