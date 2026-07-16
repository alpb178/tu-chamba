import { Ad, Department, Paginated } from './types';

// Fetch en servidor (SSR/metadata). No usa el token del navegador, así que
// el detalle llega sin teléfono (público); el contacto se pide en cliente.
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function fetchAd(id: string): Promise<Ad | null> {
  try {
    const res = await fetch(`${API}/listings/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as Ad;
  } catch {
    return null;
  }
}

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

// Todos los anuncios vigentes paginando de a 100 (tope de la API), con un
// máximo defensivo — pensado para el sitemap.
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
