'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Ad,
  DEPARTMENT_LABEL,
  Department,
  Facets,
  Paginated,
} from '@/lib/types';
import { Hero } from '@/components/Hero';
import { FiltersSidebar, Filters, NO_FILTERS } from '@/components/FiltersSidebar';
import { AdCard } from '@/components/AdCard';
import { AdListSkeleton, Skeleton } from '@/components/Skeleton';
import { Pagination } from '@/components/Pagination';
import { FeaturedBrands } from '@/components/FeaturedBrands';

// Portada. La búsqueda (?q= y ?dep=) llega resuelta desde el server
// component (page.tsx), así el hero viaja en el HTML inicial.
export function HomeClient({
  search,
  dep,
}: {
  search: string;
  dep: Department | '';
}) {
  const [data, setData] = useState<Paginated<Ad> | null>(null);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // El departamento del hero inicializa el filtro del sidebar (una sola
  // fuente de verdad: filters.department). Al cambiar, primera página.
  useEffect(() => {
    setFilters((f) => ({ ...f, department: dep ? [dep] : [] }));
    setPage(1);
  }, [dep]);

  // Al cambiar la búsqueda, volvemos a la primera página.
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Conteos para la barra de filtros (una vez).
  useEffect(() => {
    api<Facets>('/listings/facets')
      .then(setFacets)
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      if (filters.jobType.length) p.set('jobType', filters.jobType.join(','));
      if (filters.department.length) p.set('department', filters.department.join(','));
      if (filters.category.length) p.set('category', filters.category.join(','));
      if (filters.salaryMin != null) p.set('salaryMin', String(filters.salaryMin));
      if (filters.salaryMax != null) p.set('salaryMax', String(filters.salaryMax));
      if (search) p.set('search', search);
      // Páginas de 10 (mismo tamaño que mobile).
      p.set('page', String(page));
      p.set('limit', '10');
      setData(await api<Paginated<Ad>>(`/listings?${p}`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filters, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-8">
      <Hero initialQuery={search} initialDep={dep} />

      {/* Si el listado no carga (p. ej. servidor caído), ocultamos filtros y
          resultados: la portada queda solo con el hero y los destacados. */}
      {!error && (
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <FiltersSidebar
            value={filters}
            facets={facets}
            onChange={(f) => {
              setFilters(f);
              setPage(1);
            }}
          />

          <section className="flex-1">
            {loading ? (
              <>
                <Skeleton className="mb-3 h-4 w-44" />
                <AdListSkeleton />
              </>
            ) : data && data.items.length === 0 ? (
              <p className="text-on-surface-variant">
                No se encontraron anuncios con estos filtros.
              </p>
            ) : (
              data && (
                <>
                  <div className="mb-4 flex flex-wrap items-baseline gap-2">
                    <h1 className="font-display text-2xl font-semibold text-on-surface">
                      {data.total}{' '}
                      {data.total === 1
                        ? 'oferta encontrada'
                        : 'ofertas encontradas'}
                    </h1>
                    {dep && (
                      <span className="text-sm text-on-surface-variant">
                        en {DEPARTMENT_LABEL[dep]}
                      </span>
                    )}
                  </div>
                  {/* Tarjetas una debajo de otra. */}
                  <div className="grid grid-cols-1 gap-4">
                    {data.items.map((a) => (
                      <AdCard key={a.id} ad={a} />
                    ))}
                  </div>
                  <Pagination
                    page={data.page}
                    totalPages={data.totalPages}
                    onPage={setPage}
                  />
                </>
              )
            )}
          </section>
        </div>
      )}

      {/* Banner promocional de la marca: lleva a publicar una oferta. */}
      <section className="mx-auto mt-10 max-w-7xl 2xl:max-w-screen-2xl">
        <Link href="/listings/new" aria-label="Publica o busca trabajo en Tu Chamba">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/banner.jpeg"
            alt="Ofrece o busca trabajo — conexión directa, sin CV"
            className="w-full rounded-2xl shadow-md transition-transform hover:scale-[1.01]"
            loading="lazy"
          />
        </Link>
      </section>

      <FeaturedBrands />
    </div>
  );
}
