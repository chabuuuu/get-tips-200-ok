import Link from 'next/link';
import { Tag } from 'lucide-react';

async function getCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/categories`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-white dark:bg-[#101010] text-gray-900 dark:text-gray-300 transition-colors duration-300 pb-20">
      
      <main className="container mx-auto px-4 py-16 max-w-4xl">
         <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 dark:text-white">Categories</h1>
            <p className="text-gray-500 dark:text-gray-400">Discover posts by topic</p>
         </div>

         {categories.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {categories.map((cat: any) => (
                    <Link key={cat.id} href={`/category/${cat.slug}`} className="block group">
                        <div className="bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#222] p-6 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-colors shadow-sm dark:shadow-none hover:shadow-md">
                            <div className="flex items-center justify-between mb-4">
                                <Tag className="text-blue-500" size={24} />
                                {/* <span className="text-xs bg-gray-200 dark:bg-[#2a2a2a] px-2 py-1 rounded text-gray-600 dark:text-gray-400">12 posts</span> */} 
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {cat.name}
                            </h2>
                            {cat.description && (
                                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 line-clamp-2">
                                    {cat.description}
                                </p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
         ) : (
             <div className="text-center text-gray-500 py-20">
                 No categories found.
             </div>
         )}

      </main>
    </div>
  );
}
