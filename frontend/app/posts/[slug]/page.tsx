import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ScrollProgressBar from '@/components/ScrollProgressBar';
import PostDetailView from '@/components/PostDetailView';
import {
  SITE_NAME,
  cleanDescription,
  resolveImageUrl,
  generateArticleJsonLd,
  generateBreadcrumbJsonLd,
} from '@/utils/seo';

const getPost = cache(async (slug: string, lang?: string) => {
  try {
    let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/posts/${slug}`;
    if (lang) {
      url += `?lang=${encodeURIComponent(lang)}`;
    }
    const res = await fetch(url, {
      next: { revalidate: 30, tags: [`post-${slug}`] },
    });

    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    return null;
  }
});

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { lang } = await searchParams;
  const post = await getPost(slug, lang);

  if (!post) {
    return {
      title: 'Bài viết không tìm thấy',
      description: 'Bài viết không tồn tại hoặc đã được chuyển sang đường dẫn khác.',
    };
  }

  const description = cleanDescription(post, 160);
  const imageUrl = resolveImageUrl(post.cover_image);
  const postUrl = lang ? `/posts/${post.slug}?lang=${lang}` : `/posts/${post.slug}`;
  const keywords = post.categories?.map((c: any) => c.name) || [];

  const availableLocales = post.available_locales || ['vi'];
  const languageAlternates: Record<string, string> = {};
  availableLocales.forEach((l: string) => {
    languageAlternates[l] = `/posts/${post.slug}?lang=${l}`;
  });
  languageAlternates['x-default'] = `/posts/${post.slug}`;

  return {
    title: post.title,
    description: description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: {
      canonical: postUrl,
      languages: languageAlternates,
    },
    openGraph: {
      title: post.title,
      description: description,
      url: postUrl,
      siteName: SITE_NAME,
      locale: post.active_locale === 'ja' ? 'ja_JP' : 'vi_VN',
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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const post = await getPost(slug, lang);

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

      <PostDetailView
        post={post}
        initialLang={lang}
        primaryCategory={primaryCategory}
      />
    </div>
  );
}
