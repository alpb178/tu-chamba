import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tu-chamba.corpsc.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Rutas privadas o sin valor de indexación.
      disallow: ['/mis-anuncios', '/alertas', '/anuncios/nuevo', '/login', '/register'],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
