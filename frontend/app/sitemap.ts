import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/utils/seo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface PostSummary {
  slug: string;
  updated_at?: string;
  created_at?: string;
}

interface CategorySummary {
  slug: string;
  updated_at?: string;
  created_at?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/categories`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Fetch all posts
  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/posts?limit=500`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const posts: PostSummary[] = json.data || [];
      postRoutes = posts
        .filter((post) => post.slug && post.slug !== 'about-me')
        .map((post) => ({
          url: `${SITE_URL}/posts/${encodeURIComponent(post.slug)}`,
          lastModified: post.updated_at ? new Date(post.updated_at) : currentDate,
          changeFrequency: 'weekly' as const,
          priority: 0.9,
        }));
    }
  } catch (error) {
    console.error('Error fetching posts for sitemap:', error);
  }

  // Fetch all categories
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const categories: CategorySummary[] = await res.json();
      categoryRoutes = categories
        .filter((cat) => cat.slug)
        .map((cat) => ({
          url: `${SITE_URL}/category/${encodeURIComponent(cat.slug)}`,
          lastModified: cat.updated_at ? new Date(cat.updated_at) : currentDate,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));
    }
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
  }

  return [...staticRoutes, ...categoryRoutes, ...postRoutes];
}
