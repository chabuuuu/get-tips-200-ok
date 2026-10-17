import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/utils/seo';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://api-gettips.chabu.io.vn/api'
    : 'http://localhost:8080/api');

export const revalidate = 3600;

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

const FALLBACK_POST_SLUGS = [
  'postgres-jsonb',
  'Spam-VM-cuc-nhanh-voi-Vagrant',
  'Tips-choose-linux-distro',
  'setup-mysql-va-ban-bo-quen-nhung-thu-nay-thi-that-do',
  'gioi-thieu-postgres-table-partitioning',
  'bien-dien-thoai-thanh-sms-gateway-tan-dung-lam-service-send-otp',
  'gioi-thieu-postgres-view',
  'setup-mysql-vscode',
  'so-sanh-tien-ich-postgres',
  'gioi-thieu-nested-set-model-va-trien-khai-thuc-te',
  'elastic-postgres-sync-strategies',
  'giai-quyet-cac-van-de-cua-database-partition',
  'wal-g-backup-database',
  'gioi-thieu-cte-postgres',
  'typescriptsetup',
  'so-sanh-orm-nodejs',
  'cach-crack-star-uml',
  'chuyen-sang-dung-absolubt-path-typescript',
  'cach-tao-ec2-instance',
  'Tai-sao-lai-dung-backend',
  'Cach-deploy-mysql-len-AWS-RDS',
  'Tong-hop-phuong-phap-bao-mat-api-nodejs-chong-hacker',
  'van-de-0-1-0-2-voi-ngon-ngu-lap-trinh',
  'My-New-Post',
];

const FALLBACK_CATEGORIES = [
  'backend',
  'frontend',
  'cloud-service',
  'aws',
  'devops',
  'virtualization',
  'automation',
  'linux',
  'kubernetes',
  'vagrant',
  'nodejs',
  'database',
  'fun',
];

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

  // Fetch all posts from API, fallback to known slugs if API is unavailable
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
    console.error('Error fetching posts for sitemap from API, using fallback list:', error);
  }

  if (postRoutes.length === 0) {
    postRoutes = FALLBACK_POST_SLUGS.map((slug) => ({
      url: `${SITE_URL}/posts/${encodeURIComponent(slug)}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }));
  }

  // Fetch all categories from API, fallback to known categories if API is unavailable
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
    console.error('Error fetching categories for sitemap from API, using fallback list:', error);
  }

  if (categoryRoutes.length === 0) {
    categoryRoutes = FALLBACK_CATEGORIES.map((slug) => ({
      url: `${SITE_URL}/category/${encodeURIComponent(slug)}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  }

  return [...staticRoutes, ...categoryRoutes, ...postRoutes];
}
