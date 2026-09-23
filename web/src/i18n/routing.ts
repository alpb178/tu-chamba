import { defineRouting } from 'next-intl/routing';

export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';

// Every public URL carries its locale (/es/..., /en/...). Unprefixed URLs
// (including old e-mail links and the Spanish -> English 301s in
// next.config.js) are redirected by the proxy to the locale taken from the
// NEXT_LOCALE cookie, then Accept-Language, falling back to Spanish.
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  // hreflang alternates are emitted per page in the metadata (see
  // lib/seo.ts#localeAlternates), where private pages can opt out.
  alternateLinks: false,
});
