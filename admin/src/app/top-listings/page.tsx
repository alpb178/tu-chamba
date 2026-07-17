'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  CATEGORY_LABEL,
  STATUS_LABEL,
  EffectiveStatus,
  adEffectiveStatus,
  TopAd,
} from '@/lib/types';
import { AdminTable, Badge } from '@/components/ui';

const HEADERS = [
  '#',
  'Descripción',
  'Categoría',
  'Jornada',
  'Estado',
  'Autor',
  'Visitas (7 días)',
  'Visitas totales',
];

const STATUS_STYLE: Record<EffectiveStatus, string> = {
  ACTIVO: 'bg-green-100 text-green-800',
  VENCIDO: 'bg-amber-100 text-amber-800',
  DADO_DE_BAJA: 'bg-surface-container-high text-on-surface-variant',
};

export default function TopAdsPage() {
  const [items, setItems] = useState<TopAd[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<TopAd[]>('/admin/top-ads')
      .then(setItems)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Top anuncios</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Los anuncios más clickeados del portal, ordenados por visitas a su
          página de detalle.
        </p>
      </div>
      <AdminTable
        headers={HEADERS}
        loading={loading}
        error={error}
        empty="Todavía no hay visitas registradas."
      >
        {(items ?? []).map((ad, i) => {
            const status = adEffectiveStatus(ad);
            return (
              <tr key={ad.id}>
                <td className="px-4 py-3 font-medium text-on-surface-variant">{i + 1}</td>
                <td className="max-w-xs truncate px-4 py-3">{ad.description}</td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {ad.category ? CATEGORY_LABEL[ad.category] : '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge type={ad.jobType} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {ad.createdBy?.name ?? '—'}
                </td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {ad.visitsLast7Days.toLocaleString('es-BO')}
                </td>
                <td className="px-4 py-3 font-medium text-brand">
                  {ad.visitsTotal.toLocaleString('es-BO')}
                </td>
              </tr>
            );
          })}
      </AdminTable>
    </div>
  );
}
