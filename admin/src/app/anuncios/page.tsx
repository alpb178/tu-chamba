'use client';

import { useEffect, useState } from 'react';
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
  DADO_DE_BAJA: 'bg-gray-200 text-gray-600',
};

export default function AdsAdminPage() {
  const [items, setItems] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Ad | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    // Vista admin: incluye vencidos y dados de baja.
    api<Paginated<Ad>>('/ads/all?limit=100')
      .then((res) => setItems(res.items))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function remove() {
    if (!toDelete) return;
    await api(`/ads/${toDelete.id}`, { method: 'DELETE' });
    setToDelete(null);
    load();
  }

  async function unpublish(ad: Ad) {
    await api(`/ads/${ad.id}/unpublish`, { method: 'POST' });
    load();
  }

  async function republish(ad: Ad) {
    await api(`/ads/${ad.id}/republish`, { method: 'POST' });
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Anuncios</h1>
      {loading ? (
        <TableSkeleton headers={HEADERS} rows={8} />
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">No hay anuncios.</p>
      ) : (
      <DataTable headers={HEADERS}>
        {items.map((ad) => {
          const status = adEffectiveStatus(ad);
          return (
            <tr key={ad.id}>
              <td className="max-w-xs truncate px-4 py-3">{ad.description}</td>
              <td className="px-4 py-3 text-gray-600">
                {ad.category ? CATEGORY_LABEL[ad.category] : '—'}
              </td>
              <td className="px-4 py-3 text-gray-600">{ad.location ?? '—'}</td>
              <td className="px-4 py-3 font-medium text-brand">
                Bs {Number(ad.salary).toLocaleString('es-BO')}
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
              <td className="px-4 py-3 text-gray-600">
                {new Date(ad.createdAt).toLocaleDateString('es-BO')}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {new Date(ad.expiresAt).toLocaleDateString('es-BO')}
              </td>
              <td className="px-4 py-3 text-gray-600">{ad.createdBy?.name ?? '—'}</td>
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
