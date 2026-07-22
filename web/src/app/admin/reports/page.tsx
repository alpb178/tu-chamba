'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  REPORT_STATUS_LABEL,
  ReportStatus,
  REPORT_REASON_LABEL,
  Report,
} from '@/lib/admin/types';
import {
  AdminTable,
  Button,
  ConfirmDialog,
  IconButton,
  SelectCheckbox,
} from '@/components/admin/ui';
import { CustomSelect } from '@/components/admin/CustomSelect';
import { useSelection } from '@/lib/admin/useSelection';

const HEADERS = ['Anuncio', 'Motivo', 'Comentario', 'Reportado por', 'Fecha', 'Estado', ''];

export default function ReportsAdminPage() {
  const [items, setItems] = useState<Report[]>([]);
  const [filter, setFilter] = useState<ReportStatus | ''>('PENDIENTE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Report | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);
  const { selected, allInPage, toggleOne, togglePage, clear } = useSelection(
    items.map((r) => r.id),
  );

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

  // Actualiza el estado del reporte (atender, descartar o reabrir).
  async function resolve(r: Report, status: ReportStatus) {
    await api(`/reports/${r.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    load();
  }

  // Elimina el reporte de la cola (el anuncio reportado no se toca).
  async function removeReport() {
    if (!toDelete) return;
    await api(`/reports/${toDelete.id}`, { method: 'DELETE' });
    setToDelete(null);
    load();
  }

  async function removeSelected() {
    setConfirmBulk(false);
    await api('/reports/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: [...selected] }),
    });
    clear();
    load();
  }

  async function removeAll() {
    setConfirmAll(false);
    await api('/reports/all', { method: 'DELETE' });
    clear();
    load();
  }

  // Atiende el reporte dando de baja el anuncio reportado (sigue en la BD).
  async function unpublishAd(r: Report) {
    await api(`/listings/${r.adId}/unpublish`, { method: 'POST' });
    await resolve(r, 'ATENDIDO');
  }

  // Atiende el reporte eliminando el anuncio definitivamente.
  async function deleteAd(r: Report) {
    if (!confirm('¿Eliminar definitivamente el anuncio reportado?')) return;
    await api(`/listings/${r.adId}`, { method: 'DELETE' });
    await resolve(r, 'ATENDIDO');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-on-surface">Reportes</h1>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button variant="danger" onClick={() => setConfirmBulk(true)}>
              Eliminar seleccionados ({selected.size})
            </Button>
          )}
          {items.length > 0 && (
            <Button variant="danger" onClick={() => setConfirmAll(true)}>
              Eliminar todos
            </Button>
          )}
          <IconButton
            icon="refresh"
            label="Actualizar la lista"
            onClick={() => load()}
            disabled={loading}
          />
          <div className="w-48">
            <CustomSelect
              value={filter}
              onChange={(v) => setFilter(v as ReportStatus | '')}
              options={[
                { value: '', label: 'Todos' },
                { value: 'PENDIENTE', label: 'Pendientes' },
                { value: 'ATENDIDO', label: 'Atendidos' },
                { value: 'DESCARTADO', label: 'Descartados' },
              ]}
            />
          </div>
        </div>
      </div>

      <AdminTable
        headers={[
          <SelectCheckbox
            key="select-page"
            label="Seleccionar todos los reportes de la página"
            checked={allInPage}
            onChange={togglePage}
          />,
          ...HEADERS,
        ]}
        loading={loading}
        error={error}
        empty="No hay reportes con este filtro."
      >
        {items.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3">
                <SelectCheckbox
                  label="Seleccionar el reporte"
                  checked={selected.has(r.id)}
                  onChange={() => toggleOne(r.id)}
                />
              </td>
              <td className="max-w-xs truncate px-4 py-3">
                {r.ad?.description ?? '—'}
                {r.ad?.status === 'DADO_DE_BAJA' && (
                  <span className="ml-2 text-xs text-outline">(de baja)</span>
                )}
              </td>
              <td className="px-4 py-3">{REPORT_REASON_LABEL[r.reason]}</td>
              <td className="max-w-xs truncate px-4 py-3 text-on-surface-variant">
                {r.comment ?? '—'}
              </td>
              <td className="px-4 py-3 text-on-surface-variant">
                {r.reporter?.name ?? '—'}
              </td>
              <td className="px-4 py-3 text-on-surface-variant">
                {new Date(r.createdAt).toLocaleDateString('es-BO')}
              </td>
              <td className="px-4 py-3">
                {/* Cambio de estado directo: atender, descartar o reabrir. */}
                <div className="w-36">
                  <CustomSelect
                    value={r.status}
                    onChange={(v) => resolve(r, v as ReportStatus)}
                    options={Object.entries(REPORT_STATUS_LABEL).map(
                      ([value, label]) => ({ value, label }),
                    )}
                  />
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-1.5">
                  {r.status === 'PENDIENTE' && (
                    <>
                      <IconButton
                        icon="visibility_off"
                        label="Ocultar anuncio"
                        onClick={() => unpublishAd(r)}
                      />
                      <IconButton
                        icon="delete"
                        label="Eliminar anuncio"
                        variant="danger"
                        onClick={() => deleteAd(r)}
                      />
                    </>
                  )}
                  <IconButton
                    icon="close"
                    label="Eliminar reporte"
                    variant="danger"
                    onClick={() => setToDelete(r)}
                  />
                </div>
              </td>
            </tr>
          ))}
      </AdminTable>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar reporte"
        message="El reporte se borra de la cola; el anuncio reportado no se toca. ¿Continuar?"
        onConfirm={removeReport}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={confirmAll}
        title="Eliminar TODOS los reportes"
        message="Esto vacía toda la cola de reportes (de cualquier estado, no solo los filtrados); los anuncios reportados no se tocan (no se puede deshacer). ¿Continuar?"
        onConfirm={removeAll}
        onCancel={() => setConfirmAll(false)}
      />

      <ConfirmDialog
        open={confirmBulk}
        title="Eliminar reportes seleccionados"
        message={`Se borran ${selected.size} ${
          selected.size === 1 ? 'reporte' : 'reportes'
        } de la cola; los anuncios reportados no se tocan. ¿Continuar?`}
        onConfirm={removeSelected}
        onCancel={() => setConfirmBulk(false)}
      />
    </div>
  );
}
