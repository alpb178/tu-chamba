'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
import { Icon } from '@/components/Icon';

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
  // Tarjetas visibles: en escritorio son las de la página actual; en móvil
  // se acumulan las páginas a medida que se hace scroll.
  const [items, setItems] = useState<Ad[]>([]);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // Vista móvil (< md): tarjetas de dos en dos y paginación por scroll.
  const [isMobile, setIsMobile] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const listTopRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

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
    // En móvil las páginas siguientes se añaden al final (scroll infinito);
    // en escritorio (o al volver a la página 1) se reemplaza el listado.
    const append = isMobile && page > 1;
    if (append) setLoadingMore(true);
    else setLoading(true);
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
      const res = await api<Paginated<Ad>>(`/listings?${p}`);
      setData(res);
      setItems((prev) => (append ? [...prev, ...res.items] : res.items));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, search, page, isMobile]);

  useEffect(() => {
    load();
  }, [load]);

  // El botón de actualizar reinicia el listado desde la primera página.
  const refresh = useCallback(() => {
    if (page !== 1) setPage(1);
    else load();
  }, [page, load]);

  // Centinela del scroll infinito: al acercarse al final de la lista en
  // móvil se pide la página siguiente.
  useEffect(() => {
    if (!isMobile) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loading &&
          !loadingMore &&
          data &&
          page < data.totalPages
        ) {
          setPage((p) => p + 1);
        }
      },
      // Empieza a cargar un poco antes de llegar al final.
      { rootMargin: '300px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMobile, loading, loadingMore, data, page]);

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

          <section ref={listTopRef} className="flex-1 scroll-mt-24">
            {/* Skeleton solo en la primera carga; en las recargas la lista
                anterior queda atenuada (transición suave, sin parpadeo). */}
            {!data ? (
              <>
                <Skeleton className="mb-3 h-4 w-44" />
                <AdListSkeleton />
              </>
            ) : items.length === 0 ? (
              loading ? (
                <AdListSkeleton />
              ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-14 text-center">
                <Icon name="search" className="text-4xl text-outline" />
                <p className="text-base text-on-surface">
                  No se encontraron ofertas con estos filtros.
                </p>
                <p className="text-sm text-on-surface-variant">
                  Prueba quitar algún filtro o buscar con otras palabras.
                </p>
                <button
                  type="button"
                  onClick={() => setFilters(NO_FILTERS)}
                  className="mt-1 rounded-lg border border-outline-variant px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-container-low focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Limpiar filtros
                </button>
              </div>
              )
            ) : (
              <div
                aria-busy={loading}
                className={`transition-opacity duration-300 ${
                  loading ? 'pointer-events-none opacity-60' : ''
                }`}
              >
                  <div className="mb-4 flex flex-wrap items-baseline gap-2">
                    <h2 className="font-display text-2xl font-semibold text-on-surface">
                      {data.total}{' '}
                      {data.total === 1
                        ? 'oferta encontrada'
                        : 'ofertas encontradas'}
                    </h2>
                    {dep && (
                      <span className="text-sm text-on-surface-variant">
                        en {DEPARTMENT_LABEL[dep]}
                      </span>
                    )}
                    {/* Recarga la lista sin refrescar la página. */}
                    <button
                      type="button"
                      onClick={refresh}
                      aria-label="Actualizar la lista"
                      title="Actualizar la lista"
                      className="ml-auto flex h-9 w-9 items-center justify-center self-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Icon name="refresh" className="text-xl" />
                    </button>
                  </div>
                  {/* En móvil, tarjetas de dos en dos (una sola columna en
                      pantallas muy angostas); en escritorio, una debajo de
                      otra. */}
                  <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-1 md:gap-4">
                    {items.map((a) => (
                      <AdCard key={a.id} ad={a} />
                    ))}
                  </div>

                  {/* Móvil: el paso de página es por scroll (centinela). */}
                  <div ref={sentinelRef} aria-hidden className="md:hidden" />
                  {loadingMore && (
                    <p className="py-4 text-center text-sm text-on-surface-variant md:hidden">
                      Cargando más ofertas…
                    </p>
                  )}

                  {/* Escritorio: paginación con botones. */}
                  <div className="hidden md:block">
                    <Pagination
                      page={data.page}
                      totalPages={data.totalPages}
                      total={data.total}
                      limit={data.limit}
                      onPage={(p) => {
                        setPage(p);
                        // Vuelve suavemente al inicio del listado.
                        listTopRef.current?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        });
                      }}
                    />
                  </div>
              </div>
            )}
          </section>
        </div>
      )}

      <FeaturedBrands />
    </div>
  );
}
