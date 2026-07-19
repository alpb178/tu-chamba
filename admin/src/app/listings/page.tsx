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
import { AdminTable, Badge, Button, ConfirmDialog, IconButton } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Pagination } from '@/components/Pagination';

// La primera columna es la de selección para el borrado por lotes.
const HEADERS = [
  '',
  'Título',
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

const CHECKBOX_CLASS = 'h-4 w-4 cursor-pointer accent-primary';

const LIMIT = 20;

export default function AdsAdminPage() {
  const router = useRouter();
  const [data, setData] = useState<Paginated<Ad> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Ad | null>(null);
  // Ids marcados para el borrado por lotes (se conservan al cambiar de página).
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
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
  const allInPageSelected =
    items.length > 0 && items.every((ad) => selected.has(ad.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allInPageSelected) items.forEach((ad) => next.delete(ad.id));
      else items.forEach((ad) => next.add(ad.id));
      return next;
    });
  }

  async function remove() {
    if (!toDelete) return;
    await api(`/listings/${toDelete.id}`, { method: 'DELETE' });
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(toDelete.id);
      return next;
    });
    setToDelete(null);
    load();
  }

  async function removeSelected() {
    setConfirmBulk(false);
    try {
      await api('/listings/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: [...selected] }),
      });
      setSelected(new Set());
      setPage(1);
      if (page === 1) load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function removeAll() {
    setConfirmAll(false);
    try {
      await api('/listings/all', { method: 'DELETE' });
      setSelected(new Set());
      setPage(1);
      if (page === 1) load();
    } catch (e) {
      setError((e as Error).message);
    }
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
          <Button
            variant="outline"
            onClick={load}
            disabled={loading}
            aria-label="Actualizar la lista"
            title="Actualizar la lista"
          >
            <Icon name="refresh" className="text-base" />
          </Button>
          {selected.size > 0 && (
            <Button variant="danger" onClick={() => setConfirmBulk(true)}>
              Eliminar seleccionados ({selected.size})
            </Button>
          )}
          {(data?.total ?? 0) > 0 && (
            <Button variant="danger" onClick={() => setConfirmAll(true)}>
              Eliminar todos ({data!.total})
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push('/listings/import')}>
            Importar CSV
          </Button>
          <Button onClick={() => router.push('/listings/new')}>Nuevo anuncio</Button>
        </div>
      </div>
      <AdminTable
        loading={loading}
        error={error}
        empty="No hay anuncios."
        headers={[
          <input
            key="select-page"
            type="checkbox"
            className={CHECKBOX_CLASS}
            checked={allInPageSelected}
            onChange={togglePage}
            aria-label="Seleccionar todos los anuncios de la página"
          />,
          ...HEADERS.slice(1),
        ]}
      >
        {items.map((ad) => {
          const status = adEffectiveStatus(ad);
          return (
            <tr key={ad.id}>
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  className={CHECKBOX_CLASS}
                  checked={selected.has(ad.id)}
                  onChange={() => toggleOne(ad.id)}
                  aria-label={`Seleccionar el anuncio "${ad.title}"`}
                />
              </td>
              <td className="max-w-[14rem] truncate px-4 py-3 font-medium">{ad.title}</td>
              <td className="max-w-xs truncate px-4 py-3 text-on-surface-variant">
                {ad.description}
              </td>
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
                <div className="flex justify-end gap-1.5">
                  <IconButton
                    icon="edit"
                    label="Editar"
                    onClick={() => router.push(`/listings/new?id=${ad.id}`)}
                  />
                  {status !== 'ACTIVO' && (
                    <IconButton
                      icon="publish"
                      label="Republicar"
                      onClick={() => republish(ad)}
                    />
                  )}
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

      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          limit={data.limit}
          onPage={setPage}
        />
      )}

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
        message={`Esto borra definitivamente los ${data?.total ?? 0} anuncios del sitio, incluidos los de otras páginas (no es una baja y no se puede deshacer). ¿Continuar?`}
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
