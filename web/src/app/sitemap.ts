import type { MetadataRoute } from 'next';
import { DEPARTMENT_SLUG } from '@/lib/types';
import { fetchAllAds } from '@/lib/server-api';
import { locales } from '@/i18n/routing';
import { SITE, localePath } from '@/lib/seo';

type Entry = MetadataRoute.Sitemap[number];

// One entry per page and locale, each listing every language version as an
// alternate (hreflang), as Google recommends for localized sitemaps.
function localized(path: string, extra: Omit<Entry, 'url'>): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    locales.map((l) => [l, `${SITE}${localePath(l, path)}`]),
  );
  return locales.map((locale) => ({
    url: `${SITE}${localePath(locale, path)}`,
    alternates: { languages },
    ...extra,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    ...localized('/', { changeFrequency: 'daily', priority: 1 }),
    ...Object.values(DEPARTMENT_SLUG).flatMap((slug) =>
      localized(`/jobs/${slug}`, { changeFrequency: 'daily', priority: 0.8 }),
    ),
    ...localized('/privacy', { changeFrequency: 'yearly', priority: 0.3 }),
    ...localized('/cookies', { changeFrequency: 'yearly', priority: 0.3 }),
  ];

  // All active ads, paginating the API's cap of 100 (best-effort; if the API
  // fails, they are omitted).
  const items = await fetchAllAds();
  const ads = items.flatMap((a) =>
    localized(`/listings/${a.id}`, {
      lastModified: a.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.6,
    }),
  );

  return [...base, ...ads];
}
