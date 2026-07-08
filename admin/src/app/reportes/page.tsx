'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  ESTADO_REPORTE_LABEL,
  EstadoReporte,
  MOTIVO_REPORTE_LABEL,
  Reporte,
} from '@/lib/types';
import { Button, DataTable, Select } from '@/components/ui';

const ESTADO_STYLE: Record<EstadoReporte, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-800',
  ATENDIDO: 'bg-green-100 text-green-800',
  DESCARTADO: 'bg-gray-200 text-gray-600',
};

export default function ReportesAdminPage() {
  const [items, setItems] = useState<Reporte[]>([]);
  const [filtro, setFiltro] = useState<EstadoReporte | ''>('PENDIENTE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load(estado: EstadoReporte | '' = filtro) {
    setLoading(true);
    setError(null);
    api<Reporte[]>(`/reportes${estado ? `?estado=${estado}` : ''}`)
      .then(setItems)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => load(), [filtro]);

  async function resolver(r: Reporte, estado: 'ATENDIDO' | 'DESCARTADO') {
    await api(`/reportes/${r.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    });
    load();
  }

  // Atiende el reporte dando de baja el anuncio reportado.
  async function darDeBajaAnuncio(r: Reporte) {
    await api(`/anuncios/${r.anuncioId}/baja`, { method: 'POST' });
    await resolver(r, 'ATENDIDO');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Reportes</h1>
        <Select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as EstadoReporte | '')}
        >
          <option value="">Todos</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="ATENDIDO">Atendidos</option>
          <option value="DESCARTADO">Descartados</option>
        </Select>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">No hay reportes con este filtro.</p>
      ) : (
        <DataTable
          headers={['Anuncio', 'Motivo', 'Comentario', 'Reportado por', 'Fecha', 'Estado', '']}
        >
          {items.map((r) => (
            <tr key={r.id}>
              <td className="max-w-xs truncate px-4 py-3">
                {r.anuncio?.descripcion ?? '—'}
                {r.anuncio?.estado === 'DADO_DE_BAJA' && (
                  <span className="ml-2 text-xs text-gray-400">(de baja)</span>
                )}
              </td>
              <td className="px-4 py-3">{MOTIVO_REPORTE_LABEL[r.motivo]}</td>
              <td className="max-w-xs truncate px-4 py-3 text-gray-600">
                {r.comentario ?? '—'}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {r.reporter?.nombre ?? '—'}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {new Date(r.createdAt).toLocaleDateString('es-BO')}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_STYLE[r.estado]}`}
                >
                  {ESTADO_REPORTE_LABEL[r.estado]}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {r.estado === 'PENDIENTE' && (
                  <div className="flex justify-end gap-2">
                    <Button variant="danger" onClick={() => darDeBajaAnuncio(r)}>
                      Dar de baja anuncio
                    </Button>
                    <Button variant="outline" onClick={() => resolver(r, 'DESCARTADO')}>
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
