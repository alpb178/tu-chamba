import { HomeClient } from './home-client';

type Search = { q?: string; loc?: string };

// Server component: resuelve la búsqueda de la URL y renderiza la portada
// (el hero y su texto viajan en el HTML inicial, indexable).
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { q = '', loc = '' } = await searchParams;
  return <HomeClient search={q.trim()} loc={loc.trim()} />;
}
