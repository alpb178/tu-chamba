'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AdminStats } from '@/lib/types';
import { ChartCardSkeleton, StatCard, StatCardSkeleton } from '@/components/ui';
import { ChartCard, DailyColumns, HorizontalBars } from '@/components/charts';
import { FeaturedBrands } from '@/components/FeaturedBrands';

// Tonos de la rama azul de la marca (uno por entidad, validados en claro).
const ADS_COLOR = '#102136';
const VISITS_COLOR = '#33517a';

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<AdminStats>('/admin/stats')
      .then(setStats)
      .catch((e) => setError((e as Error).message));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Resumen</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Mientras cargan las stats, siluetas con la misma grilla. */}
      {!stats && !error && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCardSkeleton />
            <ChartCardSkeleton />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCardSkeleton height="h-24" />
            <ChartCardSkeleton height="h-24" />
          </div>
        </>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Usuarios registrados" value={stats.users.total} />
            <StatCard label="Anuncios publicados" value={stats.ads.total} />
            <StatCard
              label="Visitas (últimas 24 h)"
              value={stats.visits.last24h}
            />
            <StatCard
              label="Visitas (últimos 7 días)"
              value={stats.visits.last7Days}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Anuncios publicados por día (últimos 14 días)">
              <DailyColumns
                data={stats.ads.byDay}
                color={ADS_COLOR}
                unit="anuncios"
              />
            </ChartCard>
            <ChartCard title="Visitas por día (últimos 14 días)">
              <DailyColumns
                data={stats.visits.byDay}
                color={VISITS_COLOR}
                unit="visitas"
              />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Usuarios registrados">
              <HorizontalBars
                data={[
                  {
                    label: 'Usuarios',
                    total: stats.users.total - stats.users.admins,
                  },
                  { label: 'Administradores', total: stats.users.admins },
                ]}
                color={ADS_COLOR}
              />
            </ChartCard>
            <ChartCard title="Visitas acumuladas">
              <p className="text-4xl font-bold text-brand">
                {stats.visits.total.toLocaleString('es-BO')}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Visitas al detalle de anuncios desde el portal (histórico).
              </p>
            </ChartCard>
          </div>
        </>
      )}

      <FeaturedBrands />
    </div>
  );
}
