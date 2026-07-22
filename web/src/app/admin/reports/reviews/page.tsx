'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  AdminReview,
  adEffectiveStatus,
  Paginated,
  STATUS_LABEL,
} from '@/lib/admin/types';
import {
  AdminTable,
  Button,
  ConfirmDialog,
  FormField,
  IconButton,
  Input,
  SelectCheckbox,
} from '@/components/admin/ui';
import { CustomSelect } from '@/components/admin/CustomSelect';
import { Pagination } from '@/components/admin/Pagination';
import { useSelection } from '@/lib/admin/useSelection';

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

const LIMIT = 10;

// Moderación: el admin corrige la calificación o el comentario de la reseña.
function EditReviewDialog({
  review,
  onClose,
  onSaved,
}: {
  review: AdminReview | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!review) return;
    setRating(String(review.rating));
    setComment(review.comment);
    setError(null);
  }, [review]);

  if (!review) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!review) return;
    setSaving(true);
    setError(null);
    try {
      await api(`/reviews/${review.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ rating: Number(rating), comment }),
      });
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 border border-outline-variant bg-surface-container-lowest p-6 shadow-derek"
      >
        <div>
          <h3 className="text-lg font-semibold text-on-surface">Editar reseña</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            De {review.author.name} sobre {review.owner.name}.
          </p>
        </div>
        <div className="space-y-3">
          <FormField label="Calificación">
            <CustomSelect
              value={rating}
              onChange={setRating}
              options={[1, 2, 3, 4, 5].map((n) => ({
                value: String(n),
                label: `${n}★`,
              }))}
            />
          </FormField>
          <FormField label="Comentario">
            <textarea
              className="w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </FormField>
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}

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
  const [toEdit, setToEdit] = useState<AdminReview | null>(null);
  const [toDelete, setToDelete] = useState<AdminReview | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const { selected, allInPage, toggleOne, togglePage, clear } = useSelection(
    (data?.items ?? []).map((r) => r.id),
  );

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
  async function removeReview() {
    if (!toDelete) return;
    await api(`/reviews/${toDelete.id}`, { method: 'DELETE' });
    setToDelete(null);
    setReload((n) => n + 1);
  }

  async function removeSelected() {
    setConfirmBulk(false);
    await api('/reviews/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: [...selected] }),
    });
    clear();
    setReload((n) => n + 1);
  }

  async function removeAll() {
    setConfirmAll(false);
    await api('/reviews/all', { method: 'DELETE' });
    clear();
    setPage(1);
    setReload((n) => n + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Reseñas</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Todas las reseñas de la plataforma, con acciones de moderación.
          </p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button variant="danger" onClick={() => setConfirmBulk(true)}>
              Eliminar seleccionadas ({selected.size})
            </Button>
          )}
          {(data?.total ?? 0) > 0 && (
            <Button variant="danger" onClick={() => setConfirmAll(true)}>
              Eliminar todas
            </Button>
          )}
          <IconButton
            icon="refresh"
            label="Actualizar la lista"
            onClick={() => setReload((n) => n + 1)}
            disabled={loading}
          />
        </div>
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
        headers={[
          <SelectCheckbox
            key="select-page"
            label="Seleccionar todas las reseñas de la página"
            checked={allInPage}
            onChange={togglePage}
          />,
          ...HEADERS,
        ]}
        loading={loading}
        error={error}
        empty="No hay reseñas para los filtros elegidos."
      >
        {(data?.items ?? []).map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <SelectCheckbox
                    label={`Seleccionar la reseña de ${r.author.name}`}
                    checked={selected.has(r.id)}
                    onChange={() => toggleOne(r.id)}
                  />
                </td>
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
                <td className="whitespace-nowrap px-4 py-3 text-secondary-container">
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
                  <div className="flex justify-end gap-1.5">
                    <IconButton
                      icon="edit"
                      label="Editar"
                      onClick={() => setToEdit(r)}
                    />
                    <IconButton
                      icon="delete"
                      label="Eliminar"
                      variant="danger"
                      onClick={() => setToDelete(r)}
                    />
                  </div>
                </td>
              </tr>
            ))}
      </AdminTable>

      {!error && data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          limit={data.limit}
          onPage={setPage}
        />
      )}

      <EditReviewDialog
        review={toEdit}
        onClose={() => setToEdit(null)}
        onSaved={() => {
          setToEdit(null);
          setReload((n) => n + 1);
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar reseña"
        message={`¿Eliminar la reseña de ${toDelete?.author.name} (${toDelete?.rating}★)? La calificación del publicante se recalcula.`}
        onConfirm={removeReview}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={confirmAll}
        title="Eliminar TODAS las reseñas"
        message="Esto borra definitivamente TODAS las reseñas de la plataforma, no solo las filtradas; las calificaciones de los publicantes se recalculan (no se puede deshacer). ¿Continuar?"
        onConfirm={removeAll}
        onCancel={() => setConfirmAll(false)}
      />

      <ConfirmDialog
        open={confirmBulk}
        title="Eliminar reseñas seleccionadas"
        message={`¿Eliminar ${selected.size} ${
          selected.size === 1 ? 'reseña' : 'reseñas'
        }? Las calificaciones de los publicantes se recalculan.`}
        onConfirm={removeSelected}
        onCancel={() => setConfirmBulk(false)}
      />
    </div>
  );
}
