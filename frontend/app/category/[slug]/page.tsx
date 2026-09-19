import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Eye } from 'lucide-react';
import Pagination from '@/components/Pagination';
import { SITE_NAME, SITE_URL, generateBreadcrumbJsonLd } from '@/utils/seo';

async function getPosts(page: number = 1, categorySlug?: string) {
  try {
    let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/posts?page=${page}&limit=12`;
    if (categorySlug) {
      url += `&category=${categorySlug}`;
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const displayName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const title = `Chuyên mục: ${displayName}`;
  const description = `Tổng hợp tất cả các bài viết, thủ thuật và hướng dẫn thực chiến về chủ đề ${displayName} trên ${SITE_NAME}.`;
  const url = `/category/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'vi_VN',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const categorySlug = slug;
  const displayName = categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);

  const { data: posts, meta } = await getPosts(currentPage, categorySlug);

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Trang chủ', item: '/' },
    { name: 'Chuyên mục', item: '/categories' },
    { name: displayName, item: `/category/${categorySlug}` },
  ]);

  return (
    <div className="min-h-screen font-sans bg-gray-50 dark:bg-[#101010] transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />

      <main className="container mx-auto px-4 max-w-6xl py-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Trang chủ
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link href="/categories" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Chuyên mục
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-700 dark:text-gray-300 font-medium capitalize">
              {categorySlug}
            </li>
          </ol>
        </nav>

        <div className="mb-8 border-b border-gray-200 dark:border-[#222] pb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200">
            Chuyên mục: <span className="text-blue-600 dark:text-blue-400 capitalize">{categorySlug}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Tổng hợp bài viết chất lượng cao về {categorySlug} ({meta?.total || posts.length} bài viết)
          </p>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => (
              <article
                key={post.id}
                className="bg-white dark:bg-[#181818] rounded-lg overflow-hidden border border-gray-200 dark:border-[#222] hover:border-blue-300 dark:hover:border-[#333] transition-colors group shadow-sm dark:shadow-none"
              >
                {/* Image */}
                <div className="aspect-video bg-gray-100 dark:bg-[#202020] relative overflow-hidden">
                  {post.cover_image ? (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
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
                        <Link
                          key={cat.id}
                          href={`/category/${cat.slug}`}
                          className="text-[10px] font-bold text-blue-400 uppercase tracking-wider hover:underline"
                        >
                          {cat.name}
                        </Link>
                      ))
                    ) : (
                      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                        Chung
                      </span>
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
                      {new Date(post.created_at).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center">
                      <Eye size={12} className="mr-2" />
                      {post.view_count || 0} lượt xem
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            Chưa có bài viết nào trong chuyên mục này.
          </div>
        )}

        {/* Pagination */}
        <Pagination currentPage={currentPage} totalPages={meta?.last_page || 1} />
      </main>
    </div>
  );
}
