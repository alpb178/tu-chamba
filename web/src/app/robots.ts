import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/routing';
import { SITE } from '@/lib/seo';

// Private pages or pages with no indexing value, in every locale.
const PRIVATE_PATHS = [
  '/my-listings',
  '/alerts',
  '/interests',
  '/profile',
  '/listings/new',
  '/login',
  '/register',
  '/verify',
  '/forgot-password',
  '/reset-password',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        ...locales.flatMap((locale) => PRIVATE_PATHS.map((p) => `/${locale}${p}`)),
      ],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
