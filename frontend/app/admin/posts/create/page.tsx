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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Create New Post</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-gray-700 font-bold mb-2">Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter post title"
                    required
                />
            </div>

            <div>
                <label className="block text-gray-700 font-bold mb-2">Slug</label>
                <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
                    placeholder="auto-generated-slug"
                    required
                />
            </div>

            <div>
                 <label className="block text-gray-700 font-bold mb-2">Cover Image</label>
                 <div className="flex items-center space-x-4">
                     <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                     />
                     {uploading && <span className="text-sm text-blue-500">Uploading...</span>}
                 </div>
                 {coverImage && (
                     <div className="mt-4">
                         <img src={coverImage} alt="Cover Preview" className="h-40 w-auto object-cover rounded shadow-md" />
                     </div>
                 )}
            </div>

            <div>
                 <label className="block text-gray-700 font-bold mb-2">Categories</label>
                 <div className="flex flex-wrap gap-2">
                     {categories.map((cat) => (
                         <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                selectedCategories.includes(cat.id)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                         >
                             {cat.name}
                         </button>
                     ))}
                 </div>
            </div>

            <div>
                 <label className="block text-gray-700 font-bold mb-2">Content</label>
                 <div className="prose max-w-none">
                     <Editor model={content} onModelChange={setContent} />
                 </div>
            </div>

            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="publish"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="publish" className="text-gray-700 select-none">Publish immediately</label>
            </div>

            <div className="flex space-x-4 pt-4">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                    Create Post
                </button>
                <button type="button" onClick={() => router.back()} className="text-gray-600 px-6 py-2 hover:bg-gray-100 rounded-lg transition">
                    Cancel
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}
