'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  REPORT_STATUS_LABEL,
  ReportStatus,
  REPORT_REASON_LABEL,
  Report,
} from '@/lib/types';
import { Button, DataTable, Select, TableSkeleton } from '@/components/ui';

const HEADERS = ['Anuncio', 'Motivo', 'Comentario', 'Reportado por', 'Fecha', 'Estado', ''];

const STATUS_STYLE: Record<ReportStatus, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-800',
  ATENDIDO: 'bg-green-100 text-green-800',
  DESCARTADO: 'bg-gray-200 text-gray-600',
};

export default function ReportsAdminPage() {
  const [items, setItems] = useState<Report[]>([]);
  const [filter, setFilter] = useState<ReportStatus | ''>('PENDIENTE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load(status: ReportStatus | '' = filter) {
    setLoading(true);
    setError(null);
    api<Report[]>(`/reports${status ? `?status=${status}` : ''}`)
      .then(setItems)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => load(), [filter]);

  async function resolve(r: Report, status: 'ATENDIDO' | 'DESCARTADO') {
    await api(`/reports/${r.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    load();
  }

  // Atiende el reporte dando de baja el anuncio reportado.
  async function unpublishAd(r: Report) {
    await api(`/ads/${r.adId}/unpublish`, { method: 'POST' });
    await resolve(r, 'ATENDIDO');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Reportes</h1>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as ReportStatus | '')}
        >
          <option value="">Todos</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="ATENDIDO">Atendidos</option>
          <option value="DESCARTADO">Descartados</option>
        </Select>
      </div>

      {loading ? (
        <TableSkeleton headers={HEADERS} />
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">No hay reportes con este filtro.</p>
      ) : (
        <DataTable headers={HEADERS}>
          {items.map((r) => (
            <tr key={r.id}>
              <td className="max-w-xs truncate px-4 py-3">
                {r.ad?.description ?? '—'}
                {r.ad?.status === 'DADO_DE_BAJA' && (
                  <span className="ml-2 text-xs text-gray-400">(de baja)</span>
                )}
              </td>
              <td className="px-4 py-3">{REPORT_REASON_LABEL[r.reason]}</td>
              <td className="max-w-xs truncate px-4 py-3 text-gray-600">
                {r.comment ?? '—'}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {r.reporter?.name ?? '—'}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {new Date(r.createdAt).toLocaleDateString('es-BO')}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}
                >
                  {REPORT_STATUS_LABEL[r.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {r.status === 'PENDIENTE' && (
                  <div className="flex justify-end gap-2">
                    <Button variant="danger" onClick={() => unpublishAd(r)}>
                      Dar de baja anuncio
                    </Button>
                    <Button variant="outline" onClick={() => resolve(r, 'DESCARTADO')}>
                      Descartar
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
