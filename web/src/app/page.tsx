import type { Metadata } from 'next';
import { HomeClient } from './home-client';
import { DEPARTMENT_LABEL, Department } from '@/lib/types';

type Search = { q?: string; dep?: string };

// Las variantes con búsqueda (?q=, ?dep=) canonicalizan a la portada:
// evita indexar infinitas combinaciones de parámetros como duplicados.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

// Server component: resuelve la búsqueda de la URL y renderiza la portada
// (el hero y su texto viajan en el HTML inicial, indexable).
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { q = '', dep = '' } = await searchParams;
  // Solo departamentos válidos (la URL la escribe cualquiera).
  const department = dep in DEPARTMENT_LABEL ? (dep as Department) : '';
  return <HomeClient search={q.trim()} dep={department} />;
}
