export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://gettips200ok.com'
).replace(/\/$/, '');

export const SITE_NAME = 'GET TIPS 200 OK';
export const SITE_TAGLINE = 'Blog chuyên sâu về Backend, DevOps, IoT và Công nghệ phần mềm';
export const DEFAULT_DESCRIPTION =
  'GET TIPS 200 OK - Blog chia sẻ kiến thức, kinh nghiệm thực chiến chuyên sâu về Backend, DevOps, Cơ sở dữ liệu (PostgreSQL, Redis), Kiến trúc hệ thống và Tối ưu hiệu năng.';

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

/**
 * Remove HTML tags, convert HTML entities, and trim extra whitespace.
 */
export function stripHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clean and truncate description to ideal SEO snippet length (150-160 chars).
 */
export function cleanDescription(
  data?: { description?: string; content?: string },
  maxLength: number = 160
): string {
  if (!data) return DEFAULT_DESCRIPTION;
  const rawText = data.description ? stripHtml(data.description) : stripHtml(data.content);
  if (!rawText) return DEFAULT_DESCRIPTION;

  if (rawText.length <= maxLength) return rawText;
  return rawText.slice(0, maxLength - 3).trim() + '...';
}

/**
 * Resolve absolute cover image URL for OpenGraph and Schema.
 */
export function resolveImageUrl(url?: string): string {
  if (!url) return DEFAULT_OG_IMAGE;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Generate Schema.org JSON-LD for a BlogPosting / TechArticle.
 */
export function generateArticleJsonLd(post: {
  title: string;
  slug: string;
  content?: string;
  description?: string;
  cover_image?: string;
  created_at: string;
  updated_at?: string;
  categories?: Array<{ name: string; slug?: string }>;
}) {
  const url = `${SITE_URL}/posts/${post.slug}`;
  const imageUrl = resolveImageUrl(post.cover_image);
  const description = cleanDescription(post, 200);

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    headline: post.title,
    description: description,
    image: [imageUrl],
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      '@type': 'Person',
      name: 'GET TIPS 200 OK Author',
      url: `${SITE_URL}/about`,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/favicon.ico`,
      },
    },
    keywords: post.categories?.map((c) => c.name).join(', ') || 'Backend, DevOps, Tech Tips',
    articleSection: post.categories?.[0]?.name || 'Technology',
    url: url,
  };
}

/**
 * Generate Schema.org JSON-LD BreadcrumbList.
 */
export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; item: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.item.startsWith('http') ? crumb.item : `${SITE_URL}${crumb.item}`,
    })),
  };
}

/**
 * Generate Schema.org WebSite JSON-LD with Sitelinks SearchBox.
 */
export function generateWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
