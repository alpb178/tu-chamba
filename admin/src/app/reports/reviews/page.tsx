'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  AdminReview,
  adEffectiveStatus,
  Paginated,
  STATUS_LABEL,
} from '@/lib/types';
import { AdminTable, Button, IconButton, Input } from '@/components/ui';
import { CustomSelect } from '@/components/CustomSelect';

const HEADERS = [
  'Autor',
  'Calificado',
  'Anuncio',
  'Calificación',
  'Comentario',
  'Fecha',
  'Estado',
  '',
];

const LIMIT = 20;

// Reporte y moderación de reseñas.
export default function ReviewsReportPage() {
  const [data, setData] = useState<Paginated<AdminReview> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (search.trim()) params.set('search', search.trim());
    if (rating) params.set('rating', rating);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    api<Paginated<AdminReview>>(`/reviews/all?${params}`)
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [search, rating, from, to, page, reload]);

  function filter<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  // Moderación: elimina la reseña (la calificación del dueño se recalcula).
  async function removeReview(r: AdminReview) {
    if (!confirm(`¿Eliminar la reseña de ${r.author.name} (${r.rating}★)?`)) return;
    await api(`/reviews/${r.id}`, { method: 'DELETE' });
    setReload((n) => n + 1);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Reseñas</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Todas las reseñas de la plataforma, con acciones de moderación.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Input
          placeholder="Comentario o usuario"
          value={search}
          onChange={(e) => filter(setSearch)(e.target.value)}
        />
        <CustomSelect
          value={rating}
          onChange={(v) => filter(setRating)(v)}
          options={[
            { value: '', label: 'Cualquier calificación' },
            ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}★` })),
          ]}
        />
        <Input
          type="date"
          value={from}
          onChange={(e) => filter(setFrom)(e.target.value)}
        />
        <Input type="date" value={to} onChange={(e) => filter(setTo)(e.target.value)} />
      </div>

      <AdminTable
        headers={HEADERS}
        loading={loading}
        error={error}
        empty="No hay reseñas para los filtros elegidos."
      >
        {(data?.items ?? []).map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-on-surface-variant">
                  {r.author.name}
                  <span className="block text-xs">{r.author.email}</span>
                </td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {r.owner.name}
                  <span className="block text-xs">{r.owner.email}</span>
                </td>
                <td className="max-w-xs truncate px-4 py-3">
                  {r.ad ? r.ad.description : <span className="text-on-surface-variant">Anuncio eliminado</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-amber-500">
                  {'★'.repeat(r.rating)}
                  <span className="text-on-surface-variant"> {r.rating}/5</span>
                </td>
                <td className="max-w-sm px-4 py-3">{r.comment}</td>
                <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                  {new Date(r.createdAt).toLocaleDateString('es-BO')}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                  {r.ad ? STATUS_LABEL[adEffectiveStatus(r.ad)] : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <IconButton
                      icon="delete"
                      label="Eliminar"
                      variant="danger"
                      onClick={() => removeReview(r)}
                    />
                  </div>
                </td>
              </tr>
            ))}
      </AdminTable>

      {!error && data && data.items.length > 0 && (
          <div className="flex items-center justify-between text-sm text-on-surface-variant">
            <span>
              Página {data.page} de {data.totalPages} · {data.total} reseñas
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
      )}
    </div>
  );
}
