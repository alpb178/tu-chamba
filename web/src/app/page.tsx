import { HomeClient } from './home-client';
import { DEPARTMENT_LABEL, Department } from '@/lib/types';

type Search = { q?: string; dep?: string };

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
