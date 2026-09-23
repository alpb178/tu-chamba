import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tu-chamba.corpsc.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private routes or routes with no indexing value.
      disallow: [
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
      ],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
