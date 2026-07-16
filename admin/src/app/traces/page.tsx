'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Paginated, Trace, TraceType, TRACE_TYPE_LABEL } from '@/lib/types';
import { Button, DataTable, TableSkeleton } from '@/components/ui';
import { CustomSelect } from '@/components/CustomSelect';

const HEADERS = ['Fecha', 'Evento', 'Descripción', 'Actor'];

const LIMIT = 20;

// Chips por familia de evento: sesión/registro, altas, cambios y bajas.
const TYPE_STYLE: Record<TraceType, string> = {
  LOGIN: 'bg-blue-100 text-blue-800',
  REGISTER: 'bg-blue-100 text-blue-800',
  EMAIL_VERIFIED: 'bg-green-100 text-green-800',
  ADMIN_CREATED: 'bg-purple-100 text-purple-800',
  ROLE_UPDATED: 'bg-amber-100 text-amber-800',
  USER_DELETED: 'bg-red-100 text-red-800',
  AD_CREATED: 'bg-green-100 text-green-800',
  AD_UNPUBLISHED: 'bg-amber-100 text-amber-800',
  AD_REPUBLISHED: 'bg-green-100 text-green-800',
  AD_DELETED: 'bg-red-100 text-red-800',
  REPORT_RESOLVED: 'bg-purple-100 text-purple-800',
};

const TYPES = Object.keys(TRACE_TYPE_LABEL) as TraceType[];

export default function TracesPage() {
  const [data, setData] = useState<Paginated<Trace> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<TraceType | ''>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (type) params.set('type', type);
    api<Paginated<Trace>>(`/admin/traces?${params}`)
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [type, page]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-on-surface">Trazas del sistema</h1>
        <div className="w-56">
          <CustomSelect
            value={type}
            onChange={(v) => {
              setType(v as TraceType | '');
              setPage(1);
            }}
            options={[
              { value: '', label: 'Todos los eventos' },
              ...TYPES.map((t) => ({ value: t, label: TRACE_TYPE_LABEL[t] })),
            ]}
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton headers={HEADERS} rows={8} />
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-on-surface-variant">No hay trazas registradas.</p>
      ) : (
        <>
          <DataTable headers={HEADERS}>
            {data.items.map((t) => (
              <tr key={t.id}>
                <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                  {new Date(t.createdAt).toLocaleString('es-BO', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLE[t.type]}`}
                  >
                    {TRACE_TYPE_LABEL[t.type]}
                  </span>
                </td>
                <td className="px-4 py-3">{t.description}</td>
                <td className="px-4 py-3 text-on-surface-variant">{t.actorEmail ?? '—'}</td>
              </tr>
            ))}
          </DataTable>

          <div className="flex items-center justify-between text-sm text-on-surface-variant">
            <span>
              Página {data.page} de {data.totalPages} · {data.total} trazas
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
