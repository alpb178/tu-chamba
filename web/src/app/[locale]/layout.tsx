import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import '../globals.css';
import { RootDocument } from '@/components/RootDocument';
import { routing } from '@/i18n/routing';
import { SITE } from '@/lib/seo';

// Common metadata base (resolves relative OpenGraph URLs, etc.). The site's
// specific SEO (title/openGraph/verification) lives in (site)/layout.
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Root layout of the public site: the locale comes from the URL.
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return <RootDocument lang={locale}>{children}</RootDocument>;
}
