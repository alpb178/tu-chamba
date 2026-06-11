'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Anuncio, Paginated, TipoJornada } from '@/lib/types';
import { SearchBar } from '@/components/SearchBar';
import { FilterSidebar } from '@/components/FilterSidebar';
import { AnuncioCard } from '@/components/AnuncioCard';
import { Pagination } from '@/components/Pagination';

export default function HomePage() {
  const [data, setData] = useState<Paginated<Anuncio> | null>(null);
  const [tipo, setTipo] = useState<TipoJornada | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (tipo) params.set('tipoJornada', tipo);
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('limit', '12');
      const res = await api<Paginated<Anuncio>>(`/anuncios?${params}`);
      setData(res);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [tipo, search, page]);

  // Lista pública: se carga para cualquier visitante, sin sesión.
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
      <div className="flex flex-col gap-4 md:flex-row">
        <FilterSidebar
          value={tipo}
          onChange={(v) => {
            setTipo(v);
            setPage(1);
          }}
        />
        <section className="flex-1">
          {loading && <p className="text-gray-500">Cargando anuncios...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {data && data.items.length === 0 && !loading && (
            <p className="text-gray-500">No se encontraron anuncios.</p>
          )}
          <div className="grid grid-cols-1 gap-3">
            {data?.items.map((a) => (
              <AnuncioCard key={a.id} anuncio={a} />
            ))}
          </div>
          {data && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              onPage={setPage}
            />
          )}
        </section>
      </div>
    </div>
  );
}
