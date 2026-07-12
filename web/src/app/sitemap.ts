import type { MetadataRoute } from 'next';
import { DEPARTMENT_SLUG } from '@/lib/types';
import { fetchAds } from '@/lib/server-api';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tu-chamba.corpsc.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: 'daily', priority: 1 },
    ...Object.values(DEPARTMENT_SLUG).map((slug) => ({
      url: `${SITE}/empleos/${slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    { url: `${SITE}/privacidad`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE}/cookies`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Anuncios vigentes (best-effort; si la API falla, se omiten).
  const data = await fetchAds({ limit: 100 });
  const ads: MetadataRoute.Sitemap = (data?.items ?? []).map((a) => ({
    url: `${SITE}/anuncios/${a.id}`,
    lastModified: a.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...base, ...ads];
}
