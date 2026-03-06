import Link from 'next/link';
import { notFound } from 'next/navigation';
import PostContent from '@/components/PostContent';
import ReactionButton from '@/components/Reactions/ReactionButton';
import GiscusComments from '@/components/GiscusComments';
import ScrollProgressBar from '@/components/ScrollProgressBar';

async function getPost(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/posts/${slug}`, { 
        cache: 'no-store' 
    });
    
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    return null;
  }
}

export default async function PostDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101010] text-gray-900 dark:text-gray-300 font-sans pb-20 transition-colors duration-300">
      <ScrollProgressBar />
      {/* Header handled by RootLayout */}

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <article className="bg-white dark:bg-[#181818] p-8 md:p-12 rounded-lg border border-gray-200 dark:border-[#222] shadow-sm dark:shadow-none transition-colors duration-300">
            <header className="mb-8 text-center border-b border-gray-200 dark:border-[#222] pb-8">
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4">
                    {new Date(post.created_at).toLocaleDateString()}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                    {post.title}
                </h1>
                <div className="flex items-center justify-center space-x-6 text-gray-500 text-xs uppercase tracking-wide">
                    {/* Author could be dynamic */}
                     <span>by Admin</span>
                     <span>•</span>
                     <span>{post.view_count} views</span>
                     <span>•</span>
                     <span>{Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200))} min read</span>
                </div>
                
                {/* Categories */}
                {post.categories && post.categories.length > 0 && (
                    <div className="flex justify-center flex-wrap gap-2 mt-6">
                        {post.categories.map((cat: any) => (
                            <Link key={cat.id} href={`/?category=${cat.id}`} className="px-3 py-1 bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400 text-xs rounded-full hover:bg-blue-50 dark:hover:bg-[#2a2a2a] hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                {cat.name}
                            </Link>
                        ))}
                    </div>
                )}
            </header>

            {post.cover_image && (
                <div className="mb-10 rounded-2xl overflow-hidden shadow-lg">
                    <img src={post.cover_image} alt={post.title} className="w-full object-cover" />
                </div>
            )}

            <PostContent content={post.content} />
            
            <div className="mt-8 flex justify-center">
                <ReactionButton postId={post.id} initialCounts={post.reaction_counts} />
            </div>
            
            {/* Comments Section */}
            <GiscusComments />
        </article>
      </main>
    </div>
  );
}
