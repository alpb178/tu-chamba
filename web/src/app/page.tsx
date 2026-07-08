'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Anuncio,
  DEPARTAMENTO_LABEL,
  DEPARTAMENTO_SLUG,
  Departamento,
  Facetas,
  Paginated,
} from '@/lib/types';
import { SearchBar } from '@/components/SearchBar';
import { FiltrosSidebar, Filtros, SIN_FILTROS } from '@/components/FiltrosSidebar';
import { AnuncioCard } from '@/components/AnuncioCard';
import { Pagination } from '@/components/Pagination';
import { MarcasDestacadas } from '@/components/MarcasDestacadas';

export default function HomePage() {
  const [data, setData] = useState<Paginated<Anuncio> | null>(null);
  const [facetas, setFacetas] = useState<Facetas | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(SIN_FILTROS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Conteos para la barra de filtros (una vez).
  useEffect(() => {
    api<Facetas>('/anuncios/facetas')
      .then(setFacetas)
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      if (filtros.tipoJornada.length) p.set('tipoJornada', filtros.tipoJornada.join(','));
      if (filtros.departamento.length) p.set('departamento', filtros.departamento.join(','));
      if (filtros.categoria.length) p.set('categoria', filtros.categoria.join(','));
      if (filtros.salarioMin != null) p.set('salarioMin', String(filtros.salarioMin));
      if (filtros.salarioMax != null) p.set('salarioMax', String(filtros.salarioMax));
      if (search) p.set('search', search);
      p.set('page', String(page));
      p.set('limit', '12');
      setData(await api<Paginated<Anuncio>>(`/anuncios?${p}`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filtros, search, page]);

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
        <FiltrosSidebar
          value={filtros}
          facetas={facetas}
          onChange={(f) => {
            setFiltros(f);
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
              <AnuncioCard key={a.id} anuncio={a} />
            ))}
          </div>
          {data && (
            <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />
          )}
        </section>
      </div>

      <nav aria-label="Empleos por departamento" className="border-t border-gray-200 pt-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">
          Empleos por departamento
        </h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DEPARTAMENTO_SLUG) as Departamento[]).map((dep) => (
            <Link
              key={dep}
              href={`/empleos/${DEPARTAMENTO_SLUG[dep]}`}
              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 transition hover:border-brand hover:text-brand"
            >
              {DEPARTAMENTO_LABEL[dep]}
            </Link>
          ))}
        </div>
      </nav>

      <MarcasDestacadas />
    </div>
  );
}
