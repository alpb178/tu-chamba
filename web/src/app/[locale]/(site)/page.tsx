import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { HomeClient } from './home-client';
import { DEPARTMENT_LABEL, Department } from '@/lib/types';
import { localeAlternates } from '@/lib/seo';
import type { Locale } from '@/i18n/routing';

type Search = { q?: string; dep?: string };
type Params = { params: Promise<{ locale: string }> };

// Search variants (?q=, ?dep=) canonicalize to the home page: avoids
// indexing endless parameter combinations as duplicates.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: localeAlternates(locale as Locale, '/'),
  };
}

// Server component: resolves the search from the URL and renders the home
// page (the hero and its text ship in the initial, indexable HTML).
export default async function HomePage({
  params,
  searchParams,
}: Params & {
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const { q = '', dep = '' } = await searchParams;
  // Only valid departments (anyone can write the URL).
  const department = dep in DEPARTMENT_LABEL ? (dep as Department) : '';
  return <HomeClient search={q.trim()} dep={department} />;
}
