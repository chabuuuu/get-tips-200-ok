"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
      try {
          const res = await api.get('/categories');
          setCategories(res.data);
      } catch (err) {
          console.error("Failed to fetch categories", err);
      }
  };

  const handleDelete = async (id: number) => {
      if (!confirm("Are you sure?")) return;
      try {
          await api.delete(`/categories/${id}`);
          fetchCategories(); // Refresh
      } catch (err) {
          alert("Failed to delete");
      }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
                <Link href="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
                    &larr; Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-gray-800">Categories Management</h1>
            </div>
            <Link href="/admin/categories/create" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium">
                + New Category
            </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Slug</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {categories.map((cat: any) => (
                        <tr key={cat.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                            <td className="px-6 py-4 text-gray-500">{cat.slug}</td>
                            <td className="px-6 py-4 text-gray-500 line-clamp-1">{cat.description}</td>
                            <td className="px-6 py-4 text-right space-x-3">
                                <Link href={`/admin/categories/${cat.id}/edit`} className="text-blue-600 hover:underline">
                                    Edit
                                </Link>
                                <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:underline">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {categories.length === 0 && (
                <div className="p-8 text-center text-gray-500">No categories found.</div>
            )}
        </div>
      </div>
    </div>
  );
}
