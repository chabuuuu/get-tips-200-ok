import Link from 'next/link';
import api from '@/utils/api';
import { Clock, Eye } from 'lucide-react';

import Pagination from '@/components/Pagination';

async function getPosts(page: number = 1, category?: string, search?: string) {
  try {
    let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/posts?page=${page}&limit=9`;
    if (category) {
        url += `&category=${category}`;
    }
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
        return { data: [], meta: { total: 0, page: 1, last_page: 1 } };
    }
    return res.json();
  } catch (e) {
      return { data: [], meta: { total: 0, page: 1, last_page: 1 } };
  }
}

async function getRecommendedPosts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/posts/recommended`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    return [];
  }
}

// ... inside Home component ...
export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string; category?: string; search?: string }> }) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const categoryId = params.category;
  const searchTerm = params.search;
  
  // Parallel fetch
  const postsData = getPosts(currentPage, categoryId, searchTerm);
  const recommendedData = getRecommendedPosts();
  
  const [{ data: posts, meta }, recommendedPosts] = await Promise.all([postsData, recommendedData]);
  
  // Highlight posts / featured could be logic based on views or specific tag.
  // For now, let's just pick the first few.
  const featuredPosts = posts.slice(0, 3);
  const latestPosts = posts;

  return (
    <div className="min-h-screen font-sans">
      {/* Hero Section */}
      {/* Hero Section or Search Header */}
      <section className="bg-white dark:bg-[#101010] text-center pt-20 pb-16 transition-colors duration-300">
        <h2 className="text-gray-500 dark:text-gray-500 text-sm font-light uppercase tracking-[0.2em] mb-4">
          GET TIPS 200 OK - Blog về tất cả mọi thứ
        </h2>
        
        {searchTerm ? (
             <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-gray-900 dark:text-gray-200 tracking-tight leading-none mb-4">
                Results for: <span className="text-blue-500">"{searchTerm}"</span>
            </h1>
        ) : (
             <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold text-gray-900 dark:text-gray-200 tracking-tight leading-none mb-4">
                Explore new <br /> stuffs
            </h1>
        )}
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 max-w-6xl py-10">
         
         {/* Featured Section (Recommended) - Hide on Search */}
         {!searchTerm && (
             <div className="mb-16">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-6 border-b border-gray-200 dark:border-[#222] pb-2">Posts You May Like</h3>
                
                {recommendedPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {recommendedPosts.map((post: any) => (
                             <Link key={post.id} href={`/posts/${post.slug}`} className="group block">
                                 <div className="bg-white dark:bg-[#181818] rounded-lg overflow-hidden border border-gray-200 dark:border-[#222] hover:border-blue-400 dark:hover:border-blue-400 transition">
                                     <div className="aspect-[2/1] bg-gray-100 dark:bg-[#202020] relative overflow-hidden">
                                         {post.cover_image && (
                                             <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                         )}
                                         <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                                             {post.view_count} views
                                         </div>
                                     </div>
                                     <div className="p-4">
                                         <h4 className="text-md font-bold text-gray-900 dark:text-gray-200 line-clamp-2 group-hover:text-blue-500 transition-colors">
                                             {post.title}
                                         </h4>
                                     </div>
                                 </div>
                             </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 text-sm">No recommendations available yet.</div>
                )}
             </div>
         )}

         {/* Latest Posts */}
         <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-8 border-b border-gray-200 dark:border-[#222] pb-2">Latest Posts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestPosts.map((post: any) => (
                <article key={post.id} className="bg-white dark:bg-[#181818] rounded-lg overflow-hidden border border-gray-200 dark:border-[#222] hover:border-blue-300 dark:hover:border-[#333] transition-colors group shadow-sm dark:shadow-none">
                    {/* Image */}
                    <div className="aspect-video bg-gray-100 dark:bg-[#202020] relative overflow-hidden">
                        {post.cover_image ? (
                             <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-600 font-mono text-sm">
                                 &lt;/&gt;
                             </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Tags/Categories */}
                        <div className="flex flex-wrap gap-2 mb-3">
                             {post.categories && post.categories.length > 0 ? (
                                 post.categories.map((cat: any) => (
                                     <Link key={cat.id} href={`/?category=${cat.id}`} className="text-[10px] font-bold text-blue-400 uppercase tracking-wider hover:underline">
                                         {cat.name}
                                     </Link>
                                 ))
                             ) : (
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Uncategorized</span>
                             )}
                        </div>

                        <Link href={`/posts/${post.slug}`}>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                                {post.title}
                            </h2>
                        </Link>
                        
                            <div className="text-xs text-gray-500 flex items-center mt-4 space-x-4">
                                <div className="flex items-center">
                                    <Clock size={12} className="mr-2" />
                                    {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                                <div className="flex items-center">
                                    <Eye size={12} className="mr-2" />
                                    {post.view_count} views
                                </div>
                            </div>
                    </div>
                </article>
              ))}
            </div>
         </div>

         {/* Pagination */}
         <Pagination currentPage={currentPage} totalPages={meta?.last_page || 1} />

      </main>
    </div>
  );
}
