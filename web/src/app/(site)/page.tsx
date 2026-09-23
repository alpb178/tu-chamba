import type { Metadata } from 'next';
import { HomeClient } from './home-client';
import { DEPARTMENT_LABEL, Department } from '@/lib/types';

type Search = { q?: string; dep?: string };

// Search variants (?q=, ?dep=) canonicalize to the home page: avoids
// indexing endless parameter combinations as duplicates.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

// Server component: resolves the search from the URL and renders the home
// page (the hero and its text ship in the initial, indexable HTML).
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { q = '', dep = '' } = await searchParams;
  // Only valid departments (anyone can write the URL).
  const department = dep in DEPARTMENT_LABEL ? (dep as Department) : '';
  return <HomeClient search={q.trim()} dep={department} />;
}
