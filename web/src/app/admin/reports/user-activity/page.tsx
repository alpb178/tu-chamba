'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Paginated, UserActivity } from '@/lib/admin/types';
import {
  AdminTable,
  Button,
  ConfirmDialog,
  IconButton,
  Input,
  SelectCheckbox,
} from '@/components/admin/ui';
import { EditUserDialog } from '@/components/admin/EditUserDialog';
import { Pagination } from '@/components/admin/Pagination';
import { useSelection } from '@/lib/admin/useSelection';

const HEADERS = [
  'Usuario',
  'Registrado',
  'Última visita',
  'Sesiones (30 días)',
  'Estancia promedio',
  'Estancia total (30 días)',
  '',
];

const LIMIT = 20;

// "125 min" -> "2 h 5 min"; menos de un minuto se muestra como "< 1 min".
function formatMinutes(min: number) {
  if (min < 1) return '< 1 min';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

// Estadística de actividad de los usuarios registrados (sin administradores):
// última visita al portal y tiempo de estancia por sesiones (huecos de
// inactividad de 30 minutos, últimos 30 días).
export default function UserActivityPage() {
  const [data, setData] = useState<Paginated<UserActivity> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [toEdit, setToEdit] = useState<UserActivity | null>(null);
  const [toDelete, setToDelete] = useState<UserActivity | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const { selected, allInPage, toggleOne, togglePage, clear } = useSelection(
    (data?.items ?? []).map((u) => u.id),
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (search.trim()) params.set('search', search.trim());
    api<Paginated<UserActivity>>(`/admin/user-activity?${params}`)
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [search, page, reload]);

  async function remove() {
    if (!toDelete) return;
    await api(`/users/${toDelete.id}`, { method: 'DELETE' });
    setToDelete(null);
    setReload((n) => n + 1);
  }

  async function removeSelected() {
    setConfirmBulk(false);
    await api('/users/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: [...selected] }),
    });
    clear();
    setReload((n) => n + 1);
  }

  // El endpoint borra todos los usuarios registrados (sin admins), la
  // misma población que muestra esta tabla.
  async function removeAll() {
    setConfirmAll(false);
    await api('/users/all', { method: 'DELETE' });
    clear();
    setPage(1);
    setReload((n) => n + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">
            Actividad de usuarios
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Última visita y tiempo de estancia en el portal de los usuarios
            registrados (excluye a los administradores). Las sesiones se cuentan
            sobre los últimos 30 días.
          </p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button variant="danger" onClick={() => setConfirmBulk(true)}>
              Eliminar seleccionados ({selected.size})
            </Button>
          )}
          {(data?.total ?? 0) > 0 && !search.trim() && (
            <Button variant="danger" onClick={() => setConfirmAll(true)}>
              Eliminar todos ({data!.total})
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

      <div className="max-w-xs">
        <Input
          placeholder="Nombre o correo"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <AdminTable
        headers={[
          <SelectCheckbox
            key="select-page"
            label="Seleccionar todos los usuarios de la página"
            checked={allInPage}
            onChange={togglePage}
          />,
          ...HEADERS,
        ]}
        loading={loading}
        error={error}
        empty="No hay usuarios registrados para el filtro."
      >
        {(data?.items ?? []).map((u) => (
          <tr key={u.id}>
            <td className="px-4 py-3">
              <SelectCheckbox
                label={`Seleccionar a ${u.name}`}
                checked={selected.has(u.id)}
                onChange={() => toggleOne(u.id)}
              />
            </td>
            <td className="px-4 py-3">
              {u.name}
              <span className="block text-xs text-on-surface-variant">{u.email}</span>
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
              {new Date(u.createdAt).toLocaleDateString('es-BO')}
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              {u.lastVisitAt ? (
                new Date(u.lastVisitAt).toLocaleString('es-BO', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })
              ) : (
                <span className="text-on-surface-variant">Sin visitas</span>
              )}
            </td>
            <td className="px-4 py-3 text-on-surface-variant">
              {u.sessionsLast30Days}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
              {u.sessionsLast30Days > 0 ? formatMinutes(u.avgSessionMinutes) : '—'}
            </td>
            <td className="whitespace-nowrap px-4 py-3 font-medium text-brand">
              {u.sessionsLast30Days > 0
                ? formatMinutes(u.totalMinutesLast30Days)
                : '—'}
            </td>
            <td className="px-4 py-3 text-right">
              <div className="flex justify-end gap-1.5">
                <IconButton icon="edit" label="Editar" onClick={() => setToEdit(u)} />
                <IconButton
                  icon="delete"
                  label="Eliminar"
                  variant="danger"
                  onClick={() => setToDelete(u)}
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

      <EditUserDialog
        user={toEdit}
        onClose={() => setToEdit(null)}
        onSaved={() => {
          setToEdit(null);
          setReload((n) => n + 1);
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar usuario"
        message={`¿Eliminar a ${toDelete?.name}? Se borrarán también sus anuncios.`}
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={confirmAll}
        title="Eliminar TODOS los usuarios"
        message={`Esto borra definitivamente los ${data?.total ?? 0} usuarios registrados y sus anuncios (no se puede deshacer). Las cuentas de administrador se conservan. ¿Continuar?`}
        onConfirm={removeAll}
        onCancel={() => setConfirmAll(false)}
      />

      <ConfirmDialog
        open={confirmBulk}
        title="Eliminar usuarios seleccionados"
        message={`¿Eliminar ${selected.size} ${
          selected.size === 1 ? 'usuario' : 'usuarios'
        }? Se borrarán también sus anuncios.`}
        onConfirm={removeSelected}
        onCancel={() => setConfirmBulk(false)}
      />
    </div>
  );
}
