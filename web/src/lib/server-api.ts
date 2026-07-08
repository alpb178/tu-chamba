import { Anuncio, Departamento, Paginated } from './types';

// Fetch en servidor (SSR/metadata). No usa el token del navegador, así que
// el detalle llega sin teléfono (público); el contacto se pide en cliente.
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function fetchAnuncio(id: string): Promise<Anuncio | null> {
  try {
    const res = await fetch(`${API}/anuncios/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as Anuncio;
  } catch {
    return null;
  }
}

export async function fetchAnuncios(params: {
  departamento?: Departamento;
  limit?: number;
}): Promise<Paginated<Anuncio> | null> {
  try {
    const qs = new URLSearchParams();
    if (params.departamento) qs.set('departamento', params.departamento);
    qs.set('limit', String(params.limit ?? 50));
    const res = await fetch(`${API}/anuncios?${qs}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as Paginated<Anuncio>;
  } catch {
    return null;
  }
}
