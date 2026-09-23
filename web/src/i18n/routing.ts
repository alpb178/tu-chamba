import { defineRouting } from 'next-intl/routing';

export const locales = ['es', 'en', 'pt'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';

// BCP 47 tag of each locale, for <html lang>, hreflang and JSON-LD
// inLanguage. The URL prefix stays short (/pt) but the content is Brazilian
// Portuguese.
export const LANGUAGE_TAG: Record<Locale, string> = {
  es: 'es',
  en: 'en',
  pt: 'pt-BR',
};

// OpenGraph og:locale of each locale.
export const OG_LOCALE: Record<Locale, string> = {
  es: 'es_BO',
  en: 'en_US',
  pt: 'pt_BR',
};

// Every public URL carries its locale (/es/..., /en/..., /pt/...). Unprefixed URLs
// (including old e-mail links and the Spanish -> English 301s in
// next.config.js) are redirected by the proxy to the locale taken from the
// NEXT_LOCALE cookie, then Accept-Language (pt, pt-BR and pt-PT all match
// /pt), falling back to Spanish.
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  // hreflang alternates are emitted per page in the metadata (see
  // lib/seo.ts#localeAlternates), where private pages can opt out.
  alternateLinks: false,
});
