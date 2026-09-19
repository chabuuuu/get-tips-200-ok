import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PostContent from '@/components/PostContent';
import ReactionButton from '@/components/Reactions/ReactionButton';
import GiscusComments from '@/components/GiscusComments';
import ScrollProgressBar from '@/components/ScrollProgressBar';
import RecommendedPosts from '@/components/RecommendedPosts';
import {
  SITE_NAME,
  SITE_URL,
  cleanDescription,
  resolveImageUrl,
  generateArticleJsonLd,
  generateBreadcrumbJsonLd,
} from '@/utils/seo';

async function getPost(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/posts/${slug}`,
      { cache: 'no-store' }
    );

    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: 'Bài viết không tìm thấy',
      description: 'Bài viết không tồn tại hoặc đã được chuyển sang đường dẫn khác.',
    };
  }

  const description = cleanDescription(post, 160);
  const imageUrl = resolveImageUrl(post.cover_image);
  const postUrl = `/posts/${post.slug}`;
  const keywords = post.categories?.map((c: any) => c.name) || [];

  return {
    title: post.title,
    description: description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: post.title,
      description: description,
      url: postUrl,
      siteName: SITE_NAME,
      locale: 'vi_VN',
      type: 'article',
      publishedTime: post.created_at,
      modifiedTime: post.updated_at || post.created_at,
      authors: ['GET TIPS 200 OK'],
      tags: keywords,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: description,
      images: [imageUrl],
    },
  };
}

export default async function PostDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const primaryCategory = post.categories?.[0];
  const breadcrumbItems = [
    { name: 'Trang chủ', item: '/' },
    ...(primaryCategory
      ? [{ name: primaryCategory.name, item: `/category/${primaryCategory.slug}` }]
      : []),
    { name: post.title, item: `/posts/${post.slug}` },
  ];

  const articleJsonLd = generateArticleJsonLd(post);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101010] text-gray-900 dark:text-gray-300 font-sans pb-20 transition-colors duration-300">
      <ScrollProgressBar />

      {/* Structured Data JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb Navigation for SEO and UX */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          <ol className="flex items-center space-x-2 flex-wrap">
            <li>
              <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Trang chủ
              </Link>
            </li>
            {primaryCategory && (
              <>
                <li className="text-gray-400">/</li>
                <li>
                  <Link
                    href={`/category/${primaryCategory.slug}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {primaryCategory.name}
                  </Link>
                </li>
              </>
            )}
            <li className="text-gray-400">/</li>
            <li className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-xs md:max-w-md">
              {post.title}
            </li>
          </ol>
        </nav>

        <article className="bg-white dark:bg-[#181818] p-8 md:p-12 rounded-lg border border-gray-200 dark:border-[#222] shadow-sm dark:shadow-none transition-colors duration-300">
          <header className="mb-8 text-center border-b border-gray-200 dark:border-[#222] pb-8">
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4">
              <time dateTime={post.created_at}>
                {new Date(post.created_at).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center justify-center space-x-4 md:space-x-6 text-gray-500 text-xs uppercase tracking-wide">
              <span>Bởi GET TIPS 200 OK</span>
              <span>•</span>
              <span>{post.view_count || 0} lượt xem</span>
              <span>•</span>
              <span>
                {Math.max(1, Math.ceil((post.content || '').split(/\s+/).length / 200))} phút đọc
              </span>
            </div>

            {/* Categories */}
            {post.categories && post.categories.length > 0 && (
              <div className="flex justify-center flex-wrap gap-2 mt-6">
                {post.categories.map((cat: any) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug || cat.id}`}
                    className="px-3 py-1 bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400 text-xs rounded-full hover:bg-blue-50 dark:hover:bg-[#2a2a2a] hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    #{cat.name}
                  </Link>
                ))}
              </div>
            )}
          </header>

          {post.cover_image && (
            <div className="mb-10 rounded-2xl overflow-hidden shadow-lg">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full object-cover max-h-[500px]"
                loading="eager"
              />
            </div>
          )}

          <PostContent content={post.content} />

          <div className="mt-8 flex justify-center">
            <ReactionButton postId={post.id} initialCounts={post.reaction_counts} />
          </div>

          {/* Smart Recommended Posts Section */}
          <RecommendedPosts currentSlug={post.slug} currentPostId={post.id} />

          {/* Comments Section */}
          <GiscusComments />
        </article>
      </main>
    </div>
  );
}
