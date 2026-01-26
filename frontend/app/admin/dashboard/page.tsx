"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function AdminDashboard() {
  const [posts, setPosts] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('token');
    if (!token) {
        router.push('/admin/login');
        return;
    }

    fetchPosts();
  }, [router]);

  const fetchPosts = async () => {
      try {
          const res = await api.get('/posts?limit=100'); // Get all for admin usually
          setPosts(res.data.data);
      } catch (err) {
          console.error("Failed to fetch posts", err);
      }
  };

  const handleDelete = async (id: number) => {
      if (!confirm("Are you sure?")) return;
      try {
          await api.delete(`/posts/${id}`);
          fetchPosts(); // Refresh
      } catch (err) {
          alert("Failed to delete");
      }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <div className="space-x-4">
                 <Link href="/admin/categories" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg transition font-medium">
                    Manage Categories
                 </Link>
                 <Link href="/admin/posts/create" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium">
                    + New Post
                 </Link>
                 <button onClick={() => { localStorage.removeItem('token'); router.push('/admin/login'); }} className="text-red-500 font-medium hover:underline">
                    Logout
                 </button>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Views</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {posts.map((post: any) => (
                        <tr key={post.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 font-medium text-gray-900">{post.title}</td>
                            <td className="px-6 py-4">
                                {post.is_published ? (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Published</span>
                                ) : (
                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Draft</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-gray-500">{post.view_count}</td>
                            <td className="px-6 py-4 text-right space-x-3">
                                <Link href={`/admin/posts/${post.id}/edit`} className="text-blue-600 hover:underline">
                                    Edit
                                </Link>
                                <button onClick={() => handleDelete(post.id)} className="text-red-600 hover:underline">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {posts.length === 0 && (
                <div className="p-8 text-center text-gray-500">No posts found. Create one!</div>
            )}
        </div>
      </div>
    </div>
  );
}
