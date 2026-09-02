import { cache } from 'react';
import { headers } from 'next/headers';
import { Ad, Department, Paginated } from './types';

// Fetch en servidor (SSR/metadata). No usa el token del navegador, así que
// el detalle llega sin teléfono (público); el contacto se pide en cliente.
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// Datos del visitante que se reenvían al backend en las peticiones de
// servidor: sin ellos la API solo ve al servidor de Next y la auditoría
// registra su IP y su país (EE. UU.) en lugar de los del visitante real.
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
    // Fuera del ciclo de un request (build, sitemap): no hay visitante.
    return {};
  }
}

// cache() de React memoiza la llamada dentro de un mismo render: la página de
// detalle y su generateMetadata piden el mismo anuncio, y sin esto el backend
// registraba dos trazas "detalle visto" por cada visita.
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
