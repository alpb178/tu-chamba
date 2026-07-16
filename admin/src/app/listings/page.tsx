'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Ad,
  CATEGORY_LABEL,
  STATUS_LABEL,
  EffectiveStatus,
  adEffectiveStatus,
  Paginated,
} from '@/lib/types';
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  TableSkeleton,
} from '@/components/ui';

const HEADERS = [
  'Descripción',
  'Categoría',
  'Ubicación',
  'Salario',
  'Jornada',
  'Estado',
  'Publicado',
  'Vence',
  'Autor',
  '',
];

const STATUS_STYLE: Record<EffectiveStatus, string> = {
  ACTIVO: 'bg-green-100 text-green-800',
  VENCIDO: 'bg-amber-100 text-amber-800',
  DADO_DE_BAJA: 'bg-surface-container-high text-on-surface-variant',
};

const LIMIT = 20;

export default function AdsAdminPage() {
  const router = useRouter();
  const [data, setData] = useState<Paginated<Ad> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Ad | null>(null);
  const [page, setPage] = useState(1);

  function load() {
    setLoading(true);
    setError(null);
    // Vista admin: incluye vencidos y dados de baja, paginada.
    api<Paginated<Ad>>(`/listings/all?page=${page}&limit=${LIMIT}`)
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [page]);

  const items = data?.items ?? [];

  async function remove() {
    if (!toDelete) return;
    await api(`/listings/${toDelete.id}`, { method: 'DELETE' });
    setToDelete(null);
    load();
  }

  async function unpublish(ad: Ad) {
    await api(`/listings/${ad.id}/unpublish`, { method: 'POST' });
    load();
  }

  async function republish(ad: Ad) {
    await api(`/listings/${ad.id}/republish`, { method: 'POST' });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-on-surface">Anuncios</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/listings/import')}>
            Importar CSV
          </Button>
          <Button onClick={() => router.push('/listings/new')}>Nuevo anuncio</Button>
        </div>
      </div>
      {loading ? (
        <TableSkeleton headers={HEADERS} rows={8} />
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-on-surface-variant">No hay anuncios.</p>
      ) : (
      <>
      <DataTable headers={HEADERS}>
        {items.map((ad) => {
          const status = adEffectiveStatus(ad);
          return (
            <tr key={ad.id}>
              <td className="max-w-xs truncate px-4 py-3">{ad.description}</td>
              <td className="px-4 py-3 text-on-surface-variant">
                {ad.category ? CATEGORY_LABEL[ad.category] : '—'}
              </td>
              <td className="px-4 py-3 text-on-surface-variant">{ad.location ?? '—'}</td>
              <td className="px-4 py-3 font-medium text-brand">
                {ad.salary != null
                  ? `Bs ${Number(ad.salary).toLocaleString('es-BO')}`
                  : 'A convenir'}
              </td>
              <td className="px-4 py-3">
                <Badge type={ad.jobType} />
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
                >
                  {STATUS_LABEL[status]}
                </span>
              </td>
              <td className="px-4 py-3 text-on-surface-variant">
                {new Date(ad.createdAt).toLocaleDateString('es-BO')}
              </td>
              <td className="px-4 py-3 text-on-surface-variant">
                {new Date(ad.expiresAt).toLocaleDateString('es-BO')}
              </td>
              <td className="px-4 py-3 text-on-surface-variant">{ad.createdBy?.name ?? '—'}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  {status === 'ACTIVO' ? (
                    <Button variant="outline" onClick={() => unpublish(ad)}>
                      Dar de baja
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => republish(ad)}>
                      Republicar
                    </Button>
                  )}
                  <Button variant="danger" onClick={() => setToDelete(ad)}>
                    Eliminar
                  </Button>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-on-surface-variant">
          <span>
            Página {data.page} de {data.totalPages} · {data.total} anuncios
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
      </>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar anuncio"
        message="Esto borra el anuncio definitivamente (no es una baja). ¿Continuar?"
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
