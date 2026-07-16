import type { MetadataRoute } from 'next';
import { DEPARTMENT_SLUG } from '@/lib/types';
import { fetchAllAds } from '@/lib/server-api';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tu-chamba.corpsc.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: 'daily', priority: 1 },
    ...Object.values(DEPARTMENT_SLUG).map((slug) => ({
      url: `${SITE}/jobs/${slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    { url: `${SITE}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE}/cookies`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Todos los anuncios vigentes, paginando el tope de 100 de la API
  // (best-effort; si la API falla, se omiten).
  const items = await fetchAllAds();
  const ads: MetadataRoute.Sitemap = items.map((a) => ({
    url: `${SITE}/listings/${a.id}`,
    lastModified: a.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...base, ...ads];
}
