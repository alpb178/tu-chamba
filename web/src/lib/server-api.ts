import { cache } from 'react';
import { headers } from 'next/headers';
import { Ad, Department, Paginated } from './types';

// Server-side fetch (SSR/metadata). It doesn't use the browser token, so the
// detail arrives without a phone (public); contact info is fetched client-side.
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// Visitor data forwarded to the backend on server requests: without it the
// API only sees the Next server and the audit log records its IP and country
// (US) instead of the real visitor's.
async function visitorHeaders(): Promise<Record<string, string>> {
  try {
    const incoming = await headers();
    const forward: Record<string, string> = {};
    for (const name of [
      'x-forwarded-for',
      'x-vercel-ip-country',
      'user-agent',
      'referer',
    ]) {
      const value = incoming.get(name);
      if (value) forward[name] = value;
    }
    return forward;
  } catch {
    // Outside a request cycle (build, sitemap): there is no visitor.
    return {};
  }
}

// React's cache() memoizes the call within a single render: the detail page
// and its generateMetadata request the same listing, and without this the
// backend recorded two "detail viewed" traces per visit.
export const fetchAd = cache(async (id: string): Promise<Ad | null> => {
  try {
    const res = await fetch(`${API}/listings/${id}`, {
      cache: 'no-store',
      headers: await visitorHeaders(),
    });
    if (!res.ok) return null;
    return (await res.json()) as Ad;
  } catch {
    return null;
  }
});

export async function fetchAds(params: {
  department?: Department;
  limit?: number;
  page?: number;
}): Promise<Paginated<Ad> | null> {
  try {
    const qs = new URLSearchParams();
    if (params.department) qs.set('department', params.department);
    qs.set('limit', String(params.limit ?? 50));
    if (params.page) qs.set('page', String(params.page));
    const res = await fetch(`${API}/listings?${qs}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as Paginated<Ad>;
  } catch {
    return null;
  }
}

// All active listings, paging 100 at a time (the API cap), with a defensive
// maximum — meant for the sitemap.
export async function fetchAllAds(max = 1000): Promise<Ad[]> {
  const items: Ad[] = [];
  for (let page = 1; items.length < max; page++) {
    const data = await fetchAds({ limit: 100, page });
    if (!data?.items.length) break;
    items.push(...data.items);
    if (page >= data.totalPages) break;
  }
  return items.slice(0, max);
}
