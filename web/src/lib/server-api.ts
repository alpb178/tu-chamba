import { Ad, Department, Paginated } from './types';

// Fetch en servidor (SSR/metadata). No usa el token del navegador, así que
// el detalle llega sin teléfono (público); el contacto se pide en cliente.
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function fetchAd(id: string): Promise<Ad | null> {
  try {
    const res = await fetch(`${API}/ads/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as Ad;
  } catch {
    return null;
  }
}

export async function fetchAds(params: {
  department?: Department;
  limit?: number;
}): Promise<Paginated<Ad> | null> {
  try {
    const qs = new URLSearchParams();
    if (params.department) qs.set('department', params.department);
    qs.set('limit', String(params.limit ?? 50));
    const res = await fetch(`${API}/ads?${qs}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as Paginated<Ad>;
  } catch {
    return null;
  }
}
