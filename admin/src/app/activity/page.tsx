'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  ErrorLog,
  ErrorSeverity,
  ErrorStatus,
  ERROR_SEVERITY_LABEL,
  ERROR_STATUS_LABEL,
  formatUserAgent,
  Paginated,
  PerformanceMetrics,
  ServiceState,
  ServiceStatus,
  Trace,
  TraceResult,
  TraceType,
  TRACE_TYPE_LABEL,
} from '@/lib/types';
import { AdminTable, Button, IconButton, Input, Skeleton } from '@/components/ui';
import { CustomSelect } from '@/components/CustomSelect';

// El panel se refresca solo, como un centro de monitoreo.
const REFRESH_MS = 15_000;

const SERVICE_LABEL: Record<string, string> = {
  api: 'API',
  db: 'Base de datos',
  mail: 'Correo',
  cron: 'Procesos en segundo plano',
  storage: 'Almacenamiento',
  queues: 'Cola de trabajos',
};

const STATE_STYLE: Record<ServiceState, { dot: string; label: string }> = {
  up: { dot: 'bg-green-500', label: 'Disponible' },
  warning: { dot: 'bg-amber-500', label: 'Con advertencias' },
  down: { dot: 'bg-red-500', label: 'Fuera de servicio' },
  not_applicable: { dot: 'bg-outline', label: 'No aplica' },
};

const SEVERITY_STYLE: Record<ErrorSeverity, string> = {
  WARNING: 'bg-amber-100 text-amber-800',
  ERROR: 'bg-red-100 text-red-800',
  CRITICAL: 'bg-red-600 text-white',
};

const TYPES = Object.keys(TRACE_TYPE_LABEL) as TraceType[];

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ActivityPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Actividad del sitio</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Centro de monitoreo: estado de los servicios, rendimiento, errores y
          actividad en tiempo real (se actualiza cada 15 s).
        </p>
      </div>
      <ServicesSection />
      <MetricsSection />
      <ErrorsSection />
      <FeedSection />
    </div>
  );
}

// ——— Estado de los servicios ———

function ServicesSection() {
  const [services, setServices] = useState<ServiceStatus[] | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api<ServiceStatus[]>('/admin/status')
        .then((s) => alive && setServices(s))
        .catch(() => {});
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-on-surface">Estado de los servicios</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(services ?? []).map((s) => {
          const style = STATE_STYLE[s.state];
          return (
            <div
              key={s.key}
              className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-on-surface">
                  {SERVICE_LABEL[s.key] ?? s.key}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                  {style.label}
                </span>
              </div>
              <p className="mt-2 text-xs text-on-surface-variant">{s.detail}</p>
            </div>
          );
        })}
        {!services &&
          Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className="space-y-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"
            >
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
      </div>
    </section>
  );
}

// ——— Rendimiento ———

function MetricsSection() {
  const [m, setM] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api<PerformanceMetrics>('/admin/metrics')
        .then((v) => alive && setM(v))
        .catch(() => {});
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const tiles = m
    ? [
        { label: 'Solicitudes por minuto', value: String(m.requestsPerMinute) },
        { label: 'Solicitudes (última hora)', value: String(m.requestsLastHour) },
        { label: 'Respuesta promedio', value: `${m.avgResponseMs} ms` },
        { label: 'Errores (última hora)', value: String(m.errorsLastHour) },
        { label: 'Usuarios conectados', value: String(m.connectedUsers) },
        { label: 'CPU', value: `${m.cpu.loadPercent}% · ${m.cpu.cores} núcleos` },
        {
          label: 'Memoria del proceso',
          value: `${m.memory.processRssMb} MB / ${(m.memory.totalMb / 1024).toFixed(1)} GB`,
        },
        {
          label: 'Disco libre',
          value: m.disk ? `${m.disk.freeGb} de ${m.disk.totalGb} GB` : '—',
        },
        { label: 'Tiempo en línea', value: formatUptime(m.uptimeSeconds) },
      ]
    : [];

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-on-surface">Rendimiento</h2>
      {!m ? (
        <div
          aria-hidden="true"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className="space-y-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tiles.map((t) => (
            <div
              key={t.label}
              className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"
            >
              <p className="text-xs text-on-surface-variant">{t.label}</p>
              <p className="mt-1 text-xl font-semibold text-on-surface">{t.value}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ——— Registro de errores ———

function ErrorsSection() {
  const [data, setData] = useState<(Paginated<ErrorLog> & { pending: number }) | null>(null);
  const [severity, setSeverity] = useState<ErrorSeverity | ''>('');
  const [status, setStatus] = useState<ErrorStatus | ''>('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams({ limit: '10' });
    if (severity) params.set('severity', severity);
    if (status) params.set('status', status);
    api<Paginated<ErrorLog> & { pending: number }>(`/admin/errors?${params}`)
      .then(setData)
      .catch(() => {});
  }, [severity, status, reload]);

  async function resolve(e: ErrorLog) {
    await api(`/admin/errors/${e.id}/resolve`, { method: 'PATCH' });
    setReload((n) => n + 1);
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-on-surface">
          Registro de errores
          {data && data.pending > 0 && (
            <span className="ml-2 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
              {data.pending} sin resolver
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          <CustomSelect
            value={severity}
            onChange={(v) => setSeverity(v as ErrorSeverity | '')}
            options={[
              { value: '', label: 'Cualquier severidad' },
              ...Object.entries(ERROR_SEVERITY_LABEL).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
          <CustomSelect
            value={status}
            onChange={(v) => setStatus(v as ErrorStatus | '')}
            options={[
              { value: '', label: 'Cualquier estado' },
              ...Object.entries(ERROR_STATUS_LABEL).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
        </div>
      </div>

      <AdminTable
        headers={['Fecha', 'Servicio', 'Descripción', 'Severidad', 'Estado', '']}
        loading={!data}
        empty="Sin errores registrados. Todo en orden ✨"
        skeletonRows={4}
      >
        {(data?.items ?? []).map((e) => (
            <tr key={e.id}>
              <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                {new Date(e.createdAt).toLocaleString('es-BO', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </td>
              <td className="px-4 py-3 text-on-surface-variant">{e.service}</td>
              <td className="max-w-md px-4 py-3" title={e.path ?? undefined}>
                {e.message}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_STYLE[e.severity]}`}
                >
                  {ERROR_SEVERITY_LABEL[e.severity]}
                </span>
              </td>
              <td className="px-4 py-3 text-on-surface-variant">
                {ERROR_STATUS_LABEL[e.status]}
              </td>
              <td className="px-4 py-3 text-right">
                {e.status === 'NEW' && (
                  <div className="flex justify-end">
                    <IconButton
                      icon="check"
                      label="Marcar resuelto"
                      onClick={() => resolve(e)}
                    />
                  </div>
                )}
              </td>
            </tr>
          ))}
      </AdminTable>
    </section>
  );
}

// ——— Feed de actividad ———

function FeedSection() {
  const [data, setData] = useState<Paginated<Trace> | null>(null);
  const [type, setType] = useState<TraceType | ''>('');
  const [result, setResult] = useState<TraceResult | ''>('');
  const [actor, setActor] = useState('');
  const [from, setFrom] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (type) params.set('type', type);
    if (result) params.set('result', result);
    if (actor.trim()) params.set('actor', actor.trim());
    if (from) params.set('from', from);
    api<Paginated<Trace>>(`/admin/traces?${params}`)
      .then(setData)
      .catch(() => {});
  }, [type, result, actor, from, page]);

  useEffect(() => {
    load();
    // Solo la primera página se refresca sola (es la vista "en vivo").
    if (page !== 1) return;
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load, page]);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-on-surface">Feed de actividad</h2>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
        <CustomSelect
          value={result}
          onChange={(v) => {
            setResult(v as TraceResult | '');
            setPage(1);
          }}
          options={[
            { value: '', label: 'Cualquier estado' },
            { value: 'OK', label: 'Correcto' },
            { value: 'ERROR', label: 'Error' },
          ]}
        />
        <Input
          placeholder="Usuario (email)"
          value={actor}
          onChange={(e) => {
            setActor(e.target.value);
            setPage(1);
          }}
        />
        <Input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {!data ? (
        <div aria-hidden="true" className="space-y-3 border-l border-outline-variant pl-5">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-1.5 py-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <p className="text-sm text-on-surface-variant">Sin actividad para los filtros.</p>
      ) : (
        <>
          <ol className="relative space-y-0 border-l border-outline-variant pl-5">
            {data.items.map((t) => (
              <li key={t.id} className="relative py-2.5">
                <span
                  className={`absolute -left-[26.5px] top-4 h-3 w-3 rounded-full border-2 border-surface-container-lowest ${
                    t.result === 'ERROR' ? 'bg-red-500' : 'bg-green-500'
                  }`}
                />
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="whitespace-nowrap text-xs text-on-surface-variant">
                    {new Date(t.createdAt).toLocaleString('es-BO', {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                    })}
                  </span>
                  <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-xs font-medium text-on-surface-variant">
                    {TRACE_TYPE_LABEL[t.type]}
                  </span>
                  <span className="text-sm text-on-surface">{t.description}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-on-surface-variant">
                  {t.actorEmail && <span>{t.actorEmail}</span>}
                  {t.resource && <span className="font-mono">{t.resource}</span>}
                  {t.durationMs != null && <span>{t.durationMs} ms</span>}
                  {t.userAgent && <span>{formatUserAgent(t.userAgent)}</span>}
                </div>
              </li>
            ))}
          </ol>

          <div className="flex items-center justify-between text-sm text-on-surface-variant">
            <span>
              Página {data.page} de {data.totalPages} · {data.total} eventos
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
    </section>
  );
}
