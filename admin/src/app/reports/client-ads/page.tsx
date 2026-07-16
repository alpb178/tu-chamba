'use client';

import { useEffect, useState } from 'react';
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
} from '@/lib/types';
import { Button, DataTable, Input, TableSkeleton } from '@/components/ui';
import { CustomSelect } from '@/components/CustomSelect';

const HEADERS = [
  'Anuncio',
  'Publicante',
  'Categoría',
  'Departamento',
  'Salario',
  'Publicado',
  'Estado',
];

const LIMIT = 20;

const STATUS_STYLE: Record<EffectiveStatus, string> = {
  ACTIVO: 'bg-green-100 text-green-800',
  VENCIDO: 'bg-amber-100 text-amber-800',
  DADO_DE_BAJA: 'bg-surface-container-high text-on-surface-variant',
};

// Reporte de anuncios publicados por clientes (excluye a los administradores).
export default function ClientAdsReportPage() {
  const [data, setData] = useState<Paginated<Ad> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  }, [status, category, department, owner, from, to, page]);

  function filter<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">
          Anuncios publicados por clientes
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Solo anuncios creados por usuarios de la web (excluye a los
          administradores).
        </p>
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

      {loading ? (
        <TableSkeleton headers={HEADERS} rows={8} />
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-on-surface-variant">
          No hay anuncios de clientes para los filtros elegidos.
        </p>
      ) : (
        <>
          <DataTable headers={HEADERS}>
            {data.items.map((ad) => {
              const st = adEffectiveStatus(ad);
              return (
                <tr key={ad.id}>
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
                </tr>
              );
            })}
          </DataTable>

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
        </>
      )}
    </div>
  );
}
