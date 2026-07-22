'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Paginated,
  Trace,
  TraceResult,
  TraceType,
  TRACE_TYPE_LABEL,
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
import { Icon } from '@/components/admin/Icon';
import { Pagination } from '@/components/admin/Pagination';
import { useSelection } from '@/lib/admin/useSelection';

const HEADERS = [
  'Fecha',
  'Evento',
  'Descripción',
  'Actor',
  'IP',
  'País',
  'Fuente',
  'Navegador',
  'Móvil',
  'Resultado',
  '',
];

const LIMIT = 10;

// Bandera emoji a partir del ISO-2 (letras -> símbolos indicadores regionales).
function countryFlag(iso: string): string {
  if (!/^[A-Za-z]{2}$/.test(iso)) return '';
  const A = 0x1f1e6;
  return String.fromCodePoint(
    ...[...iso.toUpperCase()].map((c) => A + c.charCodeAt(0) - 65),
  );
}

// Navegador y "¿móvil?" se derivan del user-agent (el backend solo guarda el
// UA crudo).
function browserName(ua: string | null): string {
  if (!ua) return '—';
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\//.test(ua)) return 'Opera';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'Otro';
}
function isMobileUA(ua: string | null): boolean {
  return ua ? /Mobile|Android|iPhone|iPad/.test(ua) : false;
}

// Chips por familia de evento: sesión/registro, altas, cambios y bajas.
const TYPE_STYLE: Record<TraceType, string> = {
  LOGIN: 'bg-primary-container text-on-primary-container',
  LOGOUT: 'bg-primary-container text-on-primary-container',
  REGISTER: 'bg-primary-container text-on-primary-container',
  EMAIL_VERIFIED: 'bg-tertiary-container text-on-tertiary-container',
  ADMIN_CREATED: 'bg-secondary text-on-secondary',
  ROLE_UPDATED: 'bg-secondary-container text-on-secondary-container',
  USER_DELETED: 'bg-error-container text-on-error-container',
  AD_CREATED: 'bg-tertiary-container text-on-tertiary-container',
  AD_UPDATED: 'bg-secondary-container text-on-secondary-container',
  AD_VIEWED: 'bg-surface-container-high text-on-surface-variant',
  AD_IMPORTED: 'bg-tertiary-container text-on-tertiary-container',
  AD_UNPUBLISHED: 'bg-secondary-container text-on-secondary-container',
  AD_REPUBLISHED: 'bg-tertiary-container text-on-tertiary-container',
  AD_DELETED: 'bg-error-container text-on-error-container',
  REPORT_CREATED: 'bg-secondary text-on-secondary',
  REPORT_RESOLVED: 'bg-secondary text-on-secondary',
  REPORT_DELETED: 'bg-error-container text-on-error-container',
  REVIEW_CREATED: 'bg-tertiary-container text-on-tertiary-container',
  REVIEW_UPDATED: 'bg-secondary-container text-on-secondary-container',
  REVIEW_DELETED: 'bg-error-container text-on-error-container',
  USER_UPDATED: 'bg-secondary-container text-on-secondary-container',
  TRACE_DELETED: 'bg-error-container text-on-error-container',
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
  const [toDelete, setToDelete] = useState<Trace | null>(null);
  const [reload, setReload] = useState(0);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const { selected, allInPage, toggleOne, togglePage, clear } = useSelection(
    (data?.items ?? []).map((t) => t.id),
  );

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
  }, [type, result, actor, from, to, page, reload]);

  // La eliminación queda auditada en el backend con una traza nueva.
  async function remove() {
    if (!toDelete) return;
    await api(`/admin/traces/${toDelete.id}`, { method: 'DELETE' });
    setToDelete(null);
    setReload((n) => n + 1);
  }

  async function removeSelected() {
    setConfirmBulk(false);
    await api('/admin/traces/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: [...selected] }),
    });
    clear();
    setReload((n) => n + 1);
  }

  async function removeAll() {
    setConfirmAll(false);
    await api('/admin/traces/all', { method: 'DELETE' });
    clear();
    setPage(1);
    setReload((n) => n + 1);
  }

  // Cualquier cambio de filtro vuelve a la primera página.
  function filter<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">Auditoría del sistema</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Todas las acciones relevantes, con IP, navegador, recurso afectado y
            resultado de la operación.
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

      <AdminTable
        headers={[
          <SelectCheckbox
            key="select-page"
            label="Seleccionar todas las trazas de la página"
            checked={allInPage}
            onChange={togglePage}
          />,
          ...HEADERS,
        ]}
        loading={loading}
        error={error}
        empty="No hay trazas para los filtros elegidos."
      >
        {(data?.items ?? []).map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3">
                  <SelectCheckbox
                    label="Seleccionar la traza"
                    checked={selected.has(t.id)}
                    onChange={() => toggleOne(t.id)}
                  />
                </td>
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
                <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                  {t.country ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden>{countryFlag(t.country)}</span>
                      {t.country}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td
                  className="max-w-[12rem] truncate px-4 py-3 text-on-surface-variant"
                  title={t.source ?? undefined}
                >
                  {t.source ?? 'Directo'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant" title={t.userAgent ?? undefined}>
                  {browserName(t.userAgent)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon
                      name={isMobileUA(t.userAgent) ? 'smartphone' : 'computer'}
                      className="text-base"
                    />
                    {isMobileUA(t.userAgent) ? 'Sí' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      t.result === 'OK'
                        ? 'bg-tertiary-container text-on-tertiary-container'
                        : 'bg-error-container text-on-error-container'
                    }`}
                  >
                    {t.result === 'OK' ? 'Correcto' : 'Error'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end">
                    <IconButton
                      icon="delete"
                      label="Eliminar"
                      variant="danger"
                      onClick={() => setToDelete(t)}
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

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar traza"
        message="La traza se borra del historial y la eliminación queda auditada. ¿Continuar?"
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={confirmAll}
        title="Eliminar TODO el historial"
        message="Esto borra TODAS las trazas de auditoría, no solo las filtradas; queda una traza resumen del borrado (no se puede deshacer). ¿Continuar?"
        onConfirm={removeAll}
        onCancel={() => setConfirmAll(false)}
      />

      <ConfirmDialog
        open={confirmBulk}
        title="Eliminar trazas seleccionadas"
        message={`Se borran ${selected.size} ${
          selected.size === 1 ? 'traza' : 'trazas'
        } del historial y la eliminación queda auditada. ¿Continuar?`}
        onConfirm={removeSelected}
        onCancel={() => setConfirmBulk(false)}
      />
    </div>
  );
}
