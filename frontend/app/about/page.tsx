import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

async function getAboutPage() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/posts/about-me`, { 
      cache: 'no-store' 
    });
    
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch about page');
    }
    return res.json();
  } catch (error) {
    console.error('Error loading about page:', error);
    return null;
  }
}

export default async function About() {
  const post = await getAboutPage();

  if (!post) {
      return (
        <div className="min-h-screen bg-white dark:bg-[#101010] text-gray-900 dark:text-gray-300 font-sans transition-colors duration-300 flex items-center justify-center">
            <main className="container mx-auto px-4 py-20 max-w-4xl text-center">
                <h1 className="text-4xl font-bold mb-4">About Me</h1>
                <p>Content not found. Please run the sync script.</p>
            </main>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#101010] text-gray-900 dark:text-gray-300 font-sans transition-colors duration-300">
      <main className="container mx-auto px-4 py-20 max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-bold mb-8 text-gray-900 dark:text-white tracking-tight">{post.title}</h1>
        <div className="prose dark:prose-invert max-w-none text-lg leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.content}
            </ReactMarkdown>
        </div>
      </main>
    </div>
  );
}
