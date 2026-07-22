'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Ad,
  CATEGORY_LABEL,
  DEPARTMENT_LABEL,
  Department,
  Facets,
  JOB_TYPE_LABEL,
  Paginated,
} from '@/lib/types';
import { Hero } from '@/components/Hero';
import { FiltersSidebar, Filters, NO_FILTERS } from '@/components/FiltersSidebar';
import { AdCard } from '@/components/AdCard';
import { AdListSkeleton, Skeleton } from '@/components/Skeleton';
import { Pagination } from '@/components/Pagination';
import { FeaturedBrands } from '@/components/FeaturedBrands';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/ui';

// Chips de los filtros activos sobre el listado: recuerdan qué está
// aplicado y se quitan de un toque (clave en móvil, donde el panel de
// filtros vive colapsado).
function FilterChips({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const chips: { key: string; label: string; next: Filters }[] = [];
  filters.jobType.forEach((t) =>
    chips.push({
      key: `t-${t}`,
      label: JOB_TYPE_LABEL[t],
      next: { ...filters, jobType: filters.jobType.filter((x) => x !== t) },
    }),
  );
  filters.category.forEach((c) =>
    chips.push({
      key: `c-${c}`,
      label: CATEGORY_LABEL[c],
      next: { ...filters, category: filters.category.filter((x) => x !== c) },
    }),
  );
  filters.department.forEach((d) =>
    chips.push({
      key: `d-${d}`,
      label: DEPARTMENT_LABEL[d],
      next: { ...filters, department: filters.department.filter((x) => x !== d) },
    }),
  );
  if (filters.salaryMin != null || filters.salaryMax != null) {
    chips.push({
      key: 'salary',
      label: `Bs ${(filters.salaryMin ?? 0).toLocaleString('es-BO')}${
        filters.salaryMax != null
          ? ` – ${filters.salaryMax.toLocaleString('es-BO')}`
          : ' o más'
      }`,
      next: { ...filters, salaryMin: undefined, salaryMax: undefined },
    });
  }
  if (chips.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange(c.next)}
          title={`Quitar el filtro ${c.label}`}
          className="flex items-center gap-1 rounded-full bg-secondary-container px-3 py-1.5 text-xs font-medium text-on-secondary-container transition-all hover:brightness-95 active:scale-95"
        >
          {c.label}
          <Icon name="close" className="text-sm" />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={() => onChange(NO_FILTERS)}
          className="px-2 py-1.5 text-xs font-bold text-primary hover:underline"
        >
          Limpiar todo
        </button>
      )}
    </div>
  );
}

// Botón flotante para volver arriba en móvil: con scroll infinito la
// lista se hace larga y no hay paginación para "escapar".
function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 800);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Volver arriba"
      className="fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface-variant shadow-lg transition-colors hover:text-primary md:hidden"
    >
      <Icon name="arrow_upward" className="text-xl" />
    </button>
  );
}

// Portada. La búsqueda (?q= y ?dep=) llega resuelta desde el server
// component (page.tsx), así el hero viaja en el HTML inicial.
export function HomeClient({
  search,
  dep,
}: {
  search: string;
  dep: Department | '';
}) {
  const { user } = useAuth();
  // CTA de publicar: sin sesión manda a registrarse y vuelve al formulario.
  const publishHref = user
    ? '/listings/new'
    : `/register?next=${encodeURIComponent('/listings/new')}`;
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
  // Posición de scroll a restaurar tras un cambio de filtros: al resetear a
  // la primera página la lista se reemplaza y encoge, y el navegador saltaría
  // el scroll. Preservamos la posición para que filtrar no lo mueva (igual
  // que la búsqueda con scroll:false).
  const pendingScrollRef = useRef<number | null>(null);

  // Cambia los filtros sin mover el scroll (recuerda la posición actual).
  const changeFilters = useCallback((f: Filters) => {
    pendingScrollRef.current = window.scrollY;
    setFilters(f);
    setPage(1);
  }, []);

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
      // Al acumular páginas en móvil se descartan ids ya presentes: si se
      // publica un anuncio entre cargas, la paginación se desplaza y un mismo
      // anuncio podría venir en dos páginas (clave duplicada en React).
      setItems((prev) => {
        if (!append) return res.items;
        const seen = new Set(prev.map((a) => a.id));
        return [...prev, ...res.items.filter((a) => !seen.has(a.id))];
      });
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

  // Tras reemplazar la lista por un cambio de filtros, restaura el scroll
  // antes de pintar para que no salte (solo cuando hay posición pendiente;
  // la paginación y el scroll infinito no la fijan).
  useLayoutEffect(() => {
    if (pendingScrollRef.current != null) {
      window.scrollTo(0, pendingScrollRef.current);
      pendingScrollRef.current = null;
    }
  }, [items]);

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
            total={data?.total}
            onChange={changeFilters}
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
              <div className="flex flex-col items-center gap-3 border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-14 text-center">
                <Icon name="search" className="text-4xl text-outline" />
                <p className="text-base text-on-surface">
                  No se encontraron ofertas con estos filtros.
                </p>
                <p className="text-sm text-on-surface-variant">
                  Prueba quitar algún filtro o buscar con otras palabras.
                </p>
                <button
                  type="button"
                  onClick={() => changeFilters(NO_FILTERS)}
                  className="mt-1 border border-outline-variant px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-container-low focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                    {/* Publicar (escritorio) + actualizar, a la derecha. */}
                    <div className="ml-auto flex items-center gap-2 self-center">
                      <Link href={publishHref} className="hidden md:inline-flex">
                        <Button variant="accent" className="px-4 py-2">
                          Publicar oferta de trabajo
                        </Button>
                      </Link>
                      {/* Recarga la lista sin refrescar la página. */}
                      <button
                        type="button"
                        onClick={refresh}
                        aria-label="Actualizar la lista"
                        title="Actualizar la lista"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Icon name="refresh" className="text-xl" />
                      </button>
                    </div>
                  </div>
                  {/* Filtros activos como chips removibles sobre la lista. */}
                  <FilterChips filters={filters} onChange={changeFilters} />

                  {/* Móvil: CTA de publicar al inicio de la lista. */}
                  <Link href={publishHref} className="mb-3 block md:hidden">
                    <Button variant="accent" className="w-full px-4 py-2.5">
                      Publicar oferta de trabajo
                    </Button>
                  </Link>

                  {/* Una tarjeta por fila: en móvil las tarjetas necesitan
                      todo el ancho para respirar (título + salario + rating). */}
                  <div className="grid grid-cols-1 gap-3 md:gap-4">
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
                  {/* Móvil: progreso del scroll infinito siempre visible. */}
                  {!loadingMore && data.total > 0 && (
                    <p className="py-3 text-center text-xs text-on-surface-variant md:hidden">
                      Mostrando {items.length} de {data.total}{' '}
                      {data.total === 1 ? 'oferta' : 'ofertas'}
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
      <BackToTop />
    </div>
  );
}
