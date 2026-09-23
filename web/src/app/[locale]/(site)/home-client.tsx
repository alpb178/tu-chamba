'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useLabels } from '@/i18n/use-labels';
import { Grid2X2, Grid3X3, SlidersHorizontal, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { SORT_LABEL, SortOption, sortAds } from '@/lib/sort';
import { Ad, Department, Facets, Paginated } from '@/lib/types';
import { Hero } from '@/components/Hero';
import { FiltersSidebar, Filters, NO_FILTERS } from '@/components/FiltersSidebar';
import { AdCard } from '@/components/AdCard';
import { AdListSkeleton } from '@/components/Skeleton';
import { Pagination } from '@/components/Pagination';
import { FeaturedBrands } from '@/components/FeaturedBrands';
import { Icon } from '@/components/Icon';
import { Button, Heading, Subheading } from '@/components/ui';

// Chips for the active filters above the list: they show what is
// applied and can be removed with one tap (key on mobile, where the
// filters panel stays collapsed).
function FilterChips({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const t = useTranslations('home.chips');
  const labels = useLabels();
  const chips: { key: string; label: string; next: Filters }[] = [];
  filters.jobType.forEach((j) =>
    chips.push({
      key: `t-${j}`,
      label: labels.jobType(j),
      next: { ...filters, jobType: filters.jobType.filter((x) => x !== j) },
    }),
  );
  filters.category.forEach((c) =>
    chips.push({
      key: `c-${c}`,
      label: labels.category(c),
      next: { ...filters, category: filters.category.filter((x) => x !== c) },
    }),
  );
  filters.department.forEach((d) =>
    chips.push({
      key: `d-${d}`,
      label: labels.department(d),
      next: { ...filters, department: filters.department.filter((x) => x !== d) },
    }),
  );
  if (filters.salaryMin != null || filters.salaryMax != null) {
    chips.push({
      key: 'salary',
      label:
        filters.salaryMax != null
          ? t('salaryRange', {
              min: labels.number(filters.salaryMin ?? 0),
              max: labels.number(filters.salaryMax),
            })
          : t('salaryFrom', { min: labels.number(filters.salaryMin ?? 0) }),
      next: { ...filters, salaryMin: undefined, salaryMax: undefined },
    });
  }
  if (chips.length === 0) return null;

  return (
    // Outlined chips (Iris editorial style): square corners, no fill.
    <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange(c.next)}
          title={t('remove', { label: c.label })}
          className="inline-flex items-center gap-1.5 border border-on-surface/20 bg-background px-3 py-1.5 font-medium text-on-surface transition-colors hover:border-on-surface"
        >
          {c.label}
          <X className="h-3 w-3" aria-hidden />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={() => onChange(NO_FILTERS)}
          className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant underline-offset-4 hover:text-on-surface hover:underline"
        >
          {t('clearAll')}
        </button>
      )}
    </div>
  );
}

// Floating back-to-top button on mobile: with infinite scroll the list
// gets long and there is no pagination to "escape".
function BackToTop() {
  const t = useTranslations('home');
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
      aria-label={t('backToTop')}
      className="fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface-variant shadow-lg transition-colors hover:text-primary md:hidden"
    >
      <Icon name="arrow_upward" className="text-xl" />
    </button>
  );
}

// Catalog header with a text search box (Iris listing style): replaces the
// search box that used to live in the hero. Pushes ?q= to the URL (the
// source of truth resolved by page.tsx) without moving the scroll. It is also
// the #listings anchor that the hero's "Explorar ofertas" CTA jumps to.
function CatalogHeader({
  search,
  dep,
}: {
  search: string;
  dep: Department | '';
}) {
  const t = useTranslations('home.catalog');
  const router = useRouter();
  const [q, setQ] = useState(search);
  useEffect(() => setQ(search), [search]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (dep) p.set('dep', dep);
    router.push(p.size ? `/?${p}` : '/', { scroll: false });
  }

  return (
    <div id="listings" className="scroll-mt-24">
      <div className="mb-6 flex flex-col gap-4 border-b border-outline-variant pb-5">
        <Heading as="h1" size="md">
          {t('title')}
        </Heading>
        <Subheading className="mx-0 text-left">
          {t.rich('subtitle', {
            link: (chunks) => (
              <Link
                href="/listings/new"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                {chunks}
              </Link>
            ),
          })}
        </Subheading>
        <form
          onSubmit={submit}
          className="mt-1 flex w-full items-center border border-outline-variant bg-surface-container-lowest px-4 py-3 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
        >
          <Icon name="search" className="mr-2 text-outline" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchLabel')}
            className="w-full bg-transparent text-base text-on-surface outline-none placeholder:text-outline"
          />
        </form>
      </div>
    </div>
  );
}

// Rich-text tags for the result count ("<b>12</b> <muted>ofertas</muted>").
const countTags = {
  b: (chunks: React.ReactNode) => <span className="font-semibold">{chunks}</span>,
  muted: (chunks: React.ReactNode) => (
    <span className="text-on-surface-variant">{chunks}</span>
  ),
};

// Toolbar above the list (Iris style): result count, sort selector and
// density control; on mobile it opens the filters drawer.
function Toolbar({
  total,
  dep,
  sort,
  setSort,
  density,
  setDensity,
  onOpenFilters,
  publishHref,
  onRefresh,
}: {
  total: number | null;
  dep: Department | '';
  sort: SortOption;
  setSort: (s: SortOption) => void;
  density: 'comfortable' | 'compact';
  setDensity: (d: 'comfortable' | 'compact') => void;
  onOpenFilters: () => void;
  publishHref: string;
  onRefresh: () => void;
}) {
  const t = useTranslations('home.toolbar');
  const labels = useLabels();
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-4">
        {/* Mobile: opens the filters drawer. */}
        <button
          type="button"
          onClick={onOpenFilters}
          className="inline-flex items-center gap-2 border border-on-surface/20 px-3 py-2 font-semibold uppercase tracking-[0.14em] text-on-surface md:hidden"
          aria-label={t('openFilters')}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t('filters')}
        </button>
        {total != null && (
          <p className="text-on-surface">
            {dep
              ? t.rich('countIn', {
                  ...countTags,
                  count: total,
                  department: labels.department(dep),
                })
              : t.rich('count', { ...countTags, count: total })}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2 text-on-surface-variant">
          {t('sort')}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="border-0 bg-transparent font-semibold text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {(Object.keys(SORT_LABEL) as SortOption[]).map((s) => (
              <option key={s} value={s}>
                {labels.sort(s)}
              </option>
            ))}
          </select>
        </label>

        {/* Density: changes the grid classes (one vs. two columns on wide
            screens). Only has an effect on desktop. */}
        <div className="hidden items-center gap-1 md:flex" role="group">
          <button
            type="button"
            aria-label={t('comfortable')}
            aria-pressed={density === 'comfortable'}
            onClick={() => setDensity('comfortable')}
            className={
              density === 'comfortable'
                ? 'p-1.5 text-on-surface'
                : 'p-1.5 text-on-surface-variant transition-colors hover:text-on-surface'
            }
          >
            <Grid2X2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={t('compact')}
            aria-pressed={density === 'compact'}
            onClick={() => setDensity('compact')}
            className={
              density === 'compact'
                ? 'p-1.5 text-on-surface'
                : 'p-1.5 text-on-surface-variant transition-colors hover:text-on-surface'
            }
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
        </div>

        {/* Publish (desktop) + refresh the list. */}
        <Link href={publishHref} className="hidden md:inline-flex">
          <Button variant="accent" className="px-4 py-2">
            {t('publish')}
          </Button>
        </Link>
        <button
          type="button"
          onClick={onRefresh}
          aria-label={t('refresh')}
          title={t('refresh')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icon name="refresh" className="text-xl" />
        </button>
      </div>
    </div>
  );
}

// Home page. The search (?q= and ?dep=) arrives resolved from the server
// component (page.tsx), so the hero ships in the initial HTML.
export function HomeClient({
  search,
  dep,
}: {
  search: string;
  dep: Department | '';
}) {
  const t = useTranslations('home');
  const { user } = useAuth();
  // Publish CTA: without a session it sends to sign-up and back to the form.
  const publishHref = user
    ? '/listings/new'
    : `/register?next=${encodeURIComponent('/listings/new')}`;
  const [data, setData] = useState<Paginated<Ad> | null>(null);
  // Visible cards: on desktop, those of the current page; on mobile, pages
  // accumulate as the user scrolls.
  const [items, setItems] = useState<Ad[]>([]);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // Mobile view (< md): cards two by two and scroll-based pagination.
  const [isMobile, setIsMobile] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const listTopRef = useRef<HTMLElement | null>(null);
  // Scroll position to restore after a filter change: when resetting to the
  // first page the list is replaced and shrinks, and the browser would jump
  // the scroll. We preserve the position so filtering doesn't move it (same
  // as the search with scroll:false).
  const pendingScrollRef = useRef<number | null>(null);
  // Filters drawer on mobile (Iris style), list sort order and density.
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sort, setSort] = useState<SortOption>('newest');
  const [density, setDensity] = useState<'comfortable' | 'compact'>(
    'comfortable',
  );

  // Client-side sorting of the already loaded cards (the backend doesn't
  // sort). On desktop it sorts the current page; on mobile, the accumulated list.
  const sortedItems = useMemo(() => sortAds(items, sort), [items, sort]);

  // Changes the filters without moving the scroll (remembers the current position).
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

  // The hero's department initializes the sidebar filter (single source of
  // truth: filters.department). When it changes, go to the first page.
  useEffect(() => {
    setFilters((f) => ({ ...f, department: dep ? [dep] : [] }));
    setPage(1);
  }, [dep]);

  // When the search changes, go back to the first page.
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Counts for the filters bar (once).
  useEffect(() => {
    api<Facets>('/listings/facets')
      .then(setFacets)
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    // On mobile the following pages are appended (infinite scroll); on
    // desktop (or when going back to page 1) the list is replaced.
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
      // Pages of 10 (same size as mobile).
      p.set('page', String(page));
      p.set('limit', '10');
      const res = await api<Paginated<Ad>>(`/listings?${p}`);
      setData(res);
      // When accumulating pages on mobile, ids already present are dropped: if
      // a listing is published between loads, pagination shifts and the same
      // listing could come in two pages (duplicate key in React).
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

  // After replacing the list due to a filter change, restore the scroll
  // before painting so it doesn't jump (only when a position is pending;
  // pagination and infinite scroll don't set it).
  useLayoutEffect(() => {
    if (pendingScrollRef.current != null) {
      window.scrollTo(0, pendingScrollRef.current);
      pendingScrollRef.current = null;
    }
  }, [items]);

  // The refresh button restarts the list from the first page.
  const refresh = useCallback(() => {
    if (page !== 1) setPage(1);
    else load();
  }, [page, load]);

  // Infinite scroll sentinel: when nearing the end of the list on mobile,
  // the next page is requested.
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
      // Starts loading a bit before reaching the end.
      { rootMargin: '300px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMobile, loading, loadingMore, data, page]);

  return (
    <div className="space-y-8">
      <Hero />

      {/* If the list fails to load (e.g. server down), we hide filters and
          results: the home page keeps only the hero and featured listings. */}
      {!error && (
        <>
        <CatalogHeader search={search} dep={dep} />
        {/* Iris-style layout: ~220px filters column + list. */}
        <div className="grid grid-cols-1 gap-x-8 md:grid-cols-[220px_1fr]">
          {/* Desktop: sidebar sticky on scroll. */}
          <div className="hidden self-start md:sticky md:top-24 md:block">
            <FiltersSidebar
              value={filters}
              facets={facets}
              onChange={changeFilters}
            />
          </div>

          <section ref={listTopRef} className="min-w-0 scroll-mt-24">
            {/* Toolbar: count, sort, density, publish and refresh; on mobile it
                opens the filters drawer. */}
            <Toolbar
              total={data?.total ?? null}
              dep={dep}
              sort={sort}
              setSort={setSort}
              density={density}
              setDensity={setDensity}
              onOpenFilters={() => setMobileFiltersOpen(true)}
              publishHref={publishHref}
              onRefresh={refresh}
            />

            {/* Active filters as removable chips above the list (also visible in
                the empty state so they can be removed). */}
            <FilterChips filters={filters} onChange={changeFilters} />

            {/* Skeleton only on the first load; on reloads the previous list is
                dimmed (smooth transition, no flicker). */}
            {!data ? (
              <AdListSkeleton />
            ) : items.length === 0 ? (
              loading ? (
                <AdListSkeleton />
              ) : (
              <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-14 text-center">
                <Icon name="search" className="text-4xl text-outline" />
                <p className="text-base text-on-surface">
                  {t('empty.title')}
                </p>
                <p className="text-sm text-on-surface-variant">
                  {t('empty.hint')}
                </p>
                <button
                  type="button"
                  onClick={() => changeFilters(NO_FILTERS)}
                  className="mt-1 border border-outline-variant px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-container-low focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {t('empty.clear')}
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
                  {/* Mobile: publish CTA at the top of the list. */}
                  <Link href={publishHref} className="mb-3 block md:hidden">
                    <Button variant="accent" className="w-full px-4 py-2.5">
                      {t('toolbar.publish')}
                    </Button>
                  </Link>

                  {/* List grid: one column (comfortable) or two columns on wide
                      screens (compact). Listing cards take the whole row, so
                      density only changes the number of columns on desktop.
                      The listings are rendered sorted on the client
                      (sortedItems). */}
                  <div
                    className={`grid gap-3 md:gap-4 ${
                      density === 'compact'
                        ? 'grid-cols-1 xl:grid-cols-2'
                        : 'grid-cols-1'
                    }`}
                  >
                    {sortedItems.map((a) => (
                      <AdCard key={a.id} ad={a} />
                    ))}
                  </div>

                  {/* Mobile: paging happens via scroll (sentinel). */}
                  <div ref={sentinelRef} aria-hidden className="md:hidden" />
                  {loadingMore && (
                    <p className="py-4 text-center text-sm text-on-surface-variant md:hidden">
                      {t('list.loadingMore')}
                    </p>
                  )}
                  {/* Mobile: infinite scroll progress always visible. */}
                  {!loadingMore && data.total > 0 && (
                    <p className="py-3 text-center text-xs text-on-surface-variant md:hidden">
                      {t('list.showing', {
                        shown: items.length,
                        total: data.total,
                      })}
                    </p>
                  )}

                  {/* Desktop: pagination with buttons. */}
                  <div className="hidden md:block">
                    <Pagination
                      page={data.page}
                      totalPages={data.totalPages}
                      total={data.total}
                      limit={data.limit}
                      onPage={(p) => {
                        setPage(p);
                        // Smoothly scrolls back to the top of the list.
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

        {/* Mobile: filters in a drawer (Iris style) with a blurred backdrop. */}
        {mobileFiltersOpen && (
          <div
            className="fixed inset-0 z-50 flex md:hidden"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="flex-1 bg-on-surface/40 backdrop-blur-sm"
              onClick={() => setMobileFiltersOpen(false)}
              aria-label={t('drawer.close')}
            />
            <div className="flex h-full w-[88vw] max-w-sm flex-col bg-background shadow-xl">
              <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface">
                  {t('drawer.title')}
                </p>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label={t('drawer.closeButton')}
                  className="p-1"
                >
                  <X className="h-5 w-5 text-on-surface" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5">
                <FiltersSidebar
                  value={filters}
                  facets={facets}
                  onChange={changeFilters}
                />
              </div>
              <div className="border-t border-outline-variant p-5">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full bg-on-surface py-3 text-xs font-semibold uppercase tracking-[0.14em] text-inverse-on-surface"
                >
                  {t('drawer.show', { count: data?.total ?? 0 })}
                </button>
              </div>
            </div>
          </div>
        )}
        </>
      )}

      <FeaturedBrands />
      <BackToTop />
    </div>
  );
}
