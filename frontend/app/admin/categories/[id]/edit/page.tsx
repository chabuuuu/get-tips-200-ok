"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/utils/api';
import Link from 'next/link';

export default function EditCategory() {
  const params = useParams();
  const id = params?.id as string;
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
     const fetchCategory = async () => {
         try {
             if (!id) return;
             const res = await api.get(`/categories/${id}`);
             setName(res.data.name);
             setSlug(res.data.slug);
             setDescription(res.data.description);
             setLoading(false);
         } catch (err) {
             console.error(err);
             alert("Failed to load category");
             router.push('/admin/categories');
         }
     };
     fetchCategory();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/categories/${id}`, {
        name,
        slug,
        description
      });
      router.push('/admin/categories');
    } catch (err) {
      console.error(err);
      alert('Error updating category');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Edit Category</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-gray-700 font-bold mb-2">Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                    placeholder="post-slug"
                    required
                />
            </div>

            <div>
                <label className="block text-gray-700 font-bold mb-2">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-32"
                />
            </div>

            <div className="flex space-x-4 pt-4">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                    Update Category
                </button>
                <Link href="/admin/categories" className="text-gray-600 px-6 py-2 hover:bg-gray-100 rounded-lg transition text-center flex items-center">
                    Cancel
                </Link>
            </div>
        </form>
      </div>
    </div>
  );
}
