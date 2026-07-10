'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Ad, Facets, Paginated } from '@/lib/types';
import { SearchBar } from '@/components/SearchBar';
import { FiltersSidebar, Filters, NO_FILTERS } from '@/components/FiltersSidebar';
import { AdCard } from '@/components/AdCard';
import { Pagination } from '@/components/Pagination';
import { FeaturedBrands } from '@/components/FeaturedBrands';

export default function HomePage() {
  const [data, setData] = useState<Paginated<Ad> | null>(null);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Conteos para la barra de filtros (una vez).
  useEffect(() => {
    api<Facets>('/ads/facets')
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
      p.set('page', String(page));
      p.set('limit', '12');
      setData(await api<Paginated<Ad>>(`/ads?${p}`));
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
    <div className="space-y-4">
      <SearchBar
        initial={search}
        onSearch={(q) => {
          setSearch(q);
          setPage(1);
        }}
      />

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
          {data && !loading && (
            <p className="mb-3 text-sm text-gray-500">
              {data.total}{' '}
              {data.total === 1 ? 'oferta encontrada' : 'ofertas encontradas'}
            </p>
          )}
          {loading && <p className="text-gray-500">Cargando anuncios...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {data && data.items.length === 0 && !loading && (
            <p className="text-gray-500">
              No se encontraron anuncios con estos filtros.
            </p>
          )}
          {/* Tarjetas una debajo de otra. */}
          <div className="grid grid-cols-1 gap-3">
            {data?.items.map((a) => (
              <AdCard key={a.id} ad={a} />
            ))}
          </div>
          {data && (
            <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />
          )}
        </section>
      </div>

      <FeaturedBrands />
    </div>
  );
}
