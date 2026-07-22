'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { SiteClickRow } from '@/lib/admin/types';
import { AdminTable, IconButton } from '@/components/admin/ui';

const HEADERS = ['#', 'Sitio', 'Clics (30 días)', 'Clics (7 días)'];

export default function SiteClicksPage() {
  const [items, setItems] = useState<SiteClickRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api<SiteClickRow[]>('/admin/site-clicks')
      .then(setItems)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const total30 = (items ?? []).reduce((sum, r) => sum + r.clicksLast30Days, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface">
            Sitios de interés
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Accesos a las tarjetas de las empresas del Grupo CorpSC en el
            portal · {total30.toLocaleString('es-BO')} en los últimos 30 días.
          </p>
        </div>
        <IconButton
          icon="refresh"
          label="Actualizar la lista"
          onClick={load}
          disabled={loading}
        />
      </div>
      <AdminTable
        headers={HEADERS}
        loading={loading}
        error={error}
        empty="Todavía no hay accesos registrados."
      >
        {(items ?? []).map((r, i) => (
          <tr key={r.company}>
            <td className="px-4 py-3 font-medium text-on-surface-variant">
              {i + 1}
            </td>
            <td className="px-4 py-3 font-medium text-on-surface">{r.label}</td>
            <td className="px-4 py-3 font-medium text-brand">
              {r.clicksLast30Days.toLocaleString('es-BO')}
            </td>
            <td className="px-4 py-3 text-on-surface-variant">
              {r.clicksLast7Days.toLocaleString('es-BO')}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
