'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Ad,
  adEffectiveStatus,
  Category,
  CATEGORY_LABEL,
  Department,
  DEPARTMENT_LABEL,
  EffectiveStatus,
  Paginated,
  STATUS_LABEL,
} from '@/lib/admin/types';
import {
  AdminTable,
  Button,
  ConfirmDialog,
  IconButton,
  Input,
  SelectCheckbox,
} from '@/components/admin/ui';
import { CustomSelect } from '@/components/admin/CustomSelect';
import { Pagination } from '@/components/admin/Pagination';
import { useSelection } from '@/lib/admin/useSelection';

const HEADERS = [
  'Anuncio',
  'Publicante',
  'Categoría',
  'Departamento',
  'Salario',
  'Publicado',
  'Estado',
  '',
];

const LIMIT = 20;

const STATUS_STYLE: Record<EffectiveStatus, string> = {
  ACTIVO: 'bg-green-100 text-green-800',
  VENCIDO: 'bg-amber-100 text-amber-800',
  DADO_DE_BAJA: 'bg-surface-container-high text-on-surface-variant',
};

// Reporte de anuncios publicados por clientes (excluye a los administradores).
export default function ClientAdsReportPage() {
  const router = useRouter();
  const [data, setData] = useState<Paginated<Ad> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Ad | null>(null);
  const [reload, setReload] = useState(0);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const { selected, allInPage, toggleOne, togglePage, clear } = useSelection(
    (data?.items ?? []).map((ad) => ad.id),
  );
  const [status, setStatus] = useState<EffectiveStatus | ''>('');
  const [category, setCategory] = useState<Category | ''>('');
  const [department, setDepartment] = useState<Department | ''>('');
  const [owner, setOwner] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      clientsOnly: 'true',
      page: String(page),
      limit: String(LIMIT),
    });
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    if (department) params.set('department', department);
    if (owner.trim()) params.set('owner', owner.trim());
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    api<Paginated<Ad>>(`/listings/all?${params}`)
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [status, category, department, owner, from, to, page, reload]);

  function filter<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  async function remove() {
    if (!toDelete) return;
    await api(`/listings/${toDelete.id}`, { method: 'DELETE' });
    setToDelete(null);
    setReload((n) => n + 1);
  }

  async function removeSelected() {
    setConfirmBulk(false);
    await api('/listings/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: [...selected] }),
    });
    clear();
    setReload((n) => n + 1);
  }

  // Borra todos los anuncios de clientes (los de administradores no).
  async function removeAll() {
    setConfirmAll(false);
    await api('/listings/all?clientsOnly=true', { method: 'DELETE' });
    clear();
    setPage(1);
    setReload((n) => n + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">
            Anuncios publicados por clientes
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Solo anuncios creados por usuarios de la web (excluye a los
            administradores).
          </p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button variant="danger" onClick={() => setConfirmBulk(true)}>
              Eliminar seleccionados ({selected.size})
            </Button>
          )}
          {(data?.total ?? 0) > 0 && (
            <Button variant="danger" onClick={() => setConfirmAll(true)}>
              Eliminar todos
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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <Input
          type="date"
          value={from}
          onChange={(e) => filter(setFrom)(e.target.value)}
        />
        <Input type="date" value={to} onChange={(e) => filter(setTo)(e.target.value)} />
        <CustomSelect
          value={status}
          onChange={(v) => filter(setStatus)(v as EffectiveStatus | '')}
          options={[
            { value: '', label: 'Todos los estados' },
            ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
          ]}
        />
        <CustomSelect
          value={category}
          onChange={(v) => filter(setCategory)(v as Category | '')}
          options={[
            { value: '', label: 'Todas las categorías' },
            ...Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label })),
          ]}
        />
        <CustomSelect
          value={department}
          onChange={(v) => filter(setDepartment)(v as Department | '')}
          options={[
            { value: '', label: 'Todos los departamentos' },
            ...Object.entries(DEPARTMENT_LABEL).map(([value, label]) => ({ value, label })),
          ]}
        />
        <Input
          placeholder="Usuario (email o nombre)"
          value={owner}
          onChange={(e) => filter(setOwner)(e.target.value)}
        />
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
        empty="No hay anuncios de clientes para los filtros elegidos."
      >
        {(data?.items ?? []).map((ad) => {
              const st = adEffectiveStatus(ad);
              return (
                <tr key={ad.id}>
                  <td className="px-4 py-3">
                    <SelectCheckbox
                      label={`Seleccionar el anuncio "${ad.title}"`}
                      checked={selected.has(ad.id)}
                      onChange={() => toggleOne(ad.id)}
                    />
                  </td>
                  <td className="max-w-xs truncate px-4 py-3">{ad.description}</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {ad.createdBy ? `${ad.createdBy.name} (${ad.createdBy.email})` : '—'}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {ad.category ? CATEGORY_LABEL[ad.category] : '—'}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {ad.department ? DEPARTMENT_LABEL[ad.department] : '—'}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {ad.salary != null
                      ? `Bs ${Number(ad.salary).toLocaleString('es-BO')}`
                      : 'A convenir'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                    {new Date(ad.createdAt).toLocaleDateString('es-BO')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[st]}`}
                    >
                      {STATUS_LABEL[st]}
                    </span>
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

      {!error && data && (
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
        title="Eliminar TODOS los anuncios de clientes"
        message="Esto borra definitivamente TODOS los anuncios publicados por clientes, no solo los filtrados; los de administradores se conservan (no se puede deshacer). ¿Continuar?"
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
