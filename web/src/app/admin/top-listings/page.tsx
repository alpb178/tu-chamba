'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  CATEGORY_LABEL,
  adEffectiveStatus,
  TopAd,
} from '@/lib/admin/types';
import {
  AdminTable,
  AdStatusBadge,
  Badge,
  Button,
  ConfirmDialog,
  IconButton,
  SelectCheckbox,
} from '@/components/admin/ui';
import { useSelection } from '@/lib/admin/useSelection';

const HEADERS = [
  '#',
  'Descripción',
  'Categoría',
  'Jornada',
  'Estado',
  'Autor',
  'Visitas (7 días)',
  'Visitas totales',
  '',
];

export default function TopAdsPage() {
  const router = useRouter();
  const [items, setItems] = useState<TopAd[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<TopAd | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const { selected, allInPage, toggleOne, togglePage, clear } = useSelection(
    (items ?? []).map((ad) => ad.id),
  );

  function load() {
    setLoading(true);
    api<TopAd[]>('/admin/top-ads')
      .then(setItems)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function remove() {
    if (!toDelete) return;
    await api(`/listings/${toDelete.id}`, { method: 'DELETE' });
    setToDelete(null);
    load();
  }

  async function removeSelected() {
    setConfirmBulk(false);
    await api('/listings/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: [...selected] }),
    });
    clear();
    load();
  }

  // Mismo borrado total que la página de anuncios: TODOS los del sitio.
  async function removeAll() {
    setConfirmAll(false);
    await api('/listings/all', { method: 'DELETE' });
    clear();
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Top anuncios</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Los anuncios más clickeados del portal, ordenados por visitas a su
            página de detalle.
          </p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button variant="danger" onClick={() => setConfirmBulk(true)}>
              Eliminar seleccionados ({selected.size})
            </Button>
          )}
          {(items?.length ?? 0) > 0 && (
            <Button variant="danger" onClick={() => setConfirmAll(true)}>
              Eliminar todos
            </Button>
          )}
          <IconButton
            icon="refresh"
            label="Actualizar la lista"
            onClick={load}
            disabled={loading}
          />
        </div>
      </div>
      <AdminTable
        headers={[
          <SelectCheckbox
            key="select-page"
            label="Seleccionar todos los anuncios de la página"
            checked={allInPage}
            onChange={togglePage}
          />,
          ...HEADERS,
        ]}
        loading={loading}
        error={error}
        empty="Todavía no hay visitas registradas."
      >
        {(items ?? []).map((ad, i) => {
            const status = adEffectiveStatus(ad);
            return (
              <tr key={ad.id}>
                <td className="px-4 py-3">
                  <SelectCheckbox
                    label={`Seleccionar el anuncio "${ad.title}"`}
                    checked={selected.has(ad.id)}
                    onChange={() => toggleOne(ad.id)}
                  />
                </td>
                <td className="px-4 py-3 font-medium text-on-surface-variant">{i + 1}</td>
                <td className="max-w-xs truncate px-4 py-3">{ad.description}</td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {ad.category ? CATEGORY_LABEL[ad.category] : '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge type={ad.jobType} />
                </td>
                <td className="px-4 py-3">
                  <AdStatusBadge status={status} />
                </td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {ad.createdBy?.name ?? '—'}
                </td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {ad.visitsLast7Days.toLocaleString('es-BO')}
                </td>
                <td className="px-4 py-3 font-medium text-brand">
                  {ad.visitsTotal.toLocaleString('es-BO')}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    <IconButton
                      icon="edit"
                      label="Editar"
                      onClick={() => router.push(`/listings/new?id=${ad.id}`)}
                    />
                    <IconButton
                      icon="delete"
                      label="Eliminar"
                      variant="danger"
                      onClick={() => setToDelete(ad)}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
      </AdminTable>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar anuncio"
        message="Esto borra el anuncio definitivamente (no es una baja). ¿Continuar?"
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={confirmAll}
        title="Eliminar TODOS los anuncios"
        message="Esto borra definitivamente TODOS los anuncios del sitio, no solo los del ranking (no es una baja y no se puede deshacer). ¿Continuar?"
        onConfirm={removeAll}
        onCancel={() => setConfirmAll(false)}
      />

      <ConfirmDialog
        open={confirmBulk}
        title="Eliminar anuncios seleccionados"
        message={`Esto borra definitivamente ${selected.size} ${
          selected.size === 1 ? 'anuncio' : 'anuncios'
        } (no es una baja). ¿Continuar?`}
        onConfirm={removeSelected}
        onCancel={() => setConfirmBulk(false)}
      />
    </div>
  );
}
