'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  formatUserAgent,
  Paginated,
  Trace,
  TraceResult,
  TraceType,
  TRACE_TYPE_LABEL,
} from '@/lib/types';
import { Button, DataTable, Input, TableSkeleton } from '@/components/ui';
import { CustomSelect } from '@/components/CustomSelect';

const HEADERS = [
  'Fecha',
  'Evento',
  'Descripción',
  'Actor',
  'IP',
  'Navegador',
  'Recurso',
  'Resultado',
];

const LIMIT = 20;

// Chips por familia de evento: sesión/registro, altas, cambios y bajas.
const TYPE_STYLE: Record<TraceType, string> = {
  LOGIN: 'bg-blue-100 text-blue-800',
  LOGOUT: 'bg-blue-100 text-blue-800',
  REGISTER: 'bg-blue-100 text-blue-800',
  EMAIL_VERIFIED: 'bg-green-100 text-green-800',
  ADMIN_CREATED: 'bg-purple-100 text-purple-800',
  ROLE_UPDATED: 'bg-amber-100 text-amber-800',
  USER_DELETED: 'bg-red-100 text-red-800',
  AD_CREATED: 'bg-green-100 text-green-800',
  AD_UPDATED: 'bg-amber-100 text-amber-800',
  AD_VIEWED: 'bg-surface-container-high text-on-surface-variant',
  AD_IMPORTED: 'bg-green-100 text-green-800',
  AD_UNPUBLISHED: 'bg-amber-100 text-amber-800',
  AD_REPUBLISHED: 'bg-green-100 text-green-800',
  AD_DELETED: 'bg-red-100 text-red-800',
  REPORT_CREATED: 'bg-purple-100 text-purple-800',
  REPORT_RESOLVED: 'bg-purple-100 text-purple-800',
  REVIEW_CREATED: 'bg-green-100 text-green-800',
  REVIEW_DELETED: 'bg-red-100 text-red-800',
};

const TYPES = Object.keys(TRACE_TYPE_LABEL) as TraceType[];

export default function TracesPage() {
  const [data, setData] = useState<Paginated<Trace> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<TraceType | ''>('');
  const [result, setResult] = useState<TraceResult | ''>('');
  const [actor, setActor] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (type) params.set('type', type);
    if (result) params.set('result', result);
    if (actor.trim()) params.set('actor', actor.trim());
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    api<Paginated<Trace>>(`/admin/traces?${params}`)
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [type, result, actor, from, to, page]);

  // Cualquier cambio de filtro vuelve a la primera página.
  function filter<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Auditoría del sistema</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Todas las acciones relevantes, con IP, navegador, recurso afectado y
          resultado de la operación.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <CustomSelect
          value={type}
          onChange={(v) => filter(setType)(v as TraceType | '')}
          options={[
            { value: '', label: 'Todos los eventos' },
            ...TYPES.map((t) => ({ value: t, label: TRACE_TYPE_LABEL[t] })),
          ]}
        />
        <CustomSelect
          value={result}
          onChange={(v) => filter(setResult)(v as TraceResult | '')}
          options={[
            { value: '', label: 'Cualquier resultado' },
            { value: 'OK', label: 'Correcto' },
            { value: 'ERROR', label: 'Error' },
          ]}
        />
        <Input
          placeholder="Usuario (email)"
          value={actor}
          onChange={(e) => filter(setActor)(e.target.value)}
        />
        <Input
          type="date"
          value={from}
          onChange={(e) => filter(setFrom)(e.target.value)}
        />
        <Input type="date" value={to} onChange={(e) => filter(setTo)(e.target.value)} />
      </div>

      {loading ? (
        <TableSkeleton headers={HEADERS} rows={8} />
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-on-surface-variant">No hay trazas para los filtros elegidos.</p>
      ) : (
        <>
          <DataTable headers={HEADERS}>
            {data.items.map((t) => (
              <tr key={t.id}>
                <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                  {new Date(t.createdAt).toLocaleString('es-BO', {
                    dateStyle: 'short',
                    timeStyle: 'medium',
                  })}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLE[t.type]}`}
                  >
                    {TRACE_TYPE_LABEL[t.type]}
                  </span>
                </td>
                <td className="max-w-md px-4 py-3">{t.description}</td>
                <td className="px-4 py-3 text-on-surface-variant">{t.actorEmail ?? '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                  {t.ip ?? '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant" title={t.userAgent ?? undefined}>
                  {formatUserAgent(t.userAgent)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-on-surface-variant">
                  {t.resource ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      t.result === 'OK'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {t.result === 'OK' ? 'Correcto' : 'Error'}
                  </span>
                </td>
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
