'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AdminStats } from '@/lib/types';
import { ChartCardSkeleton, StatCard, StatCardSkeleton } from '@/components/ui';
import { ChartCard, DailyColumns, DailyLine, HourlyColumns } from '@/components/charts';

// Tonos de la rama azul de la marca (uno por entidad, validados en claro).
const ADS_COLOR = '#004ac6';
const SITE_VISITS_COLOR = '#2563eb';
const AD_VISITS_COLOR = '#60a5fa';
const USERS_COLOR = '#4338ca';

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
      <h1 className="text-2xl font-semibold text-on-surface">Resumen</h1>

      {error && <p className="text-sm text-error">{error}</p>}

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
          {/* Cada KPI lleva a la sección a la que pertenece. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Usuarios registrados"
              value={stats.users.total}
              href="/users"
            />
            <StatCard
              label="Anuncios publicados"
              value={stats.ads.total}
              href="/listings"
            />
            <StatCard
              label="Visitas al sitio (últimas 24 h)"
              value={stats.siteVisits.last24h}
              href="/activity"
            />
            <StatCard
              label="Visitas al sitio (últimos 7 días)"
              value={stats.siteVisits.last7Days}
              href="/activity"
            />
          </div>

          {/* Cada gráfica también lleva a la sección de su serie. */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="Visitas al sitio por día (últimos 14 días)"
              href="/activity"
            >
              <DailyColumns
                data={stats.siteVisits.byDay}
                color={SITE_VISITS_COLOR}
                unit="visitas"
              />
            </ChartCard>
            <ChartCard
              title="Anuncios publicados por día (últimos 14 días)"
              href="/listings"
            >
              <DailyColumns
                data={stats.ads.byDay}
                color={ADS_COLOR}
                unit="anuncios"
              />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard
              title="Visitas a anuncios por día (últimos 14 días)"
              href="/top-listings"
            >
              <DailyColumns
                data={stats.visits.byDay}
                color={AD_VISITS_COLOR}
                unit="visitas"
              />
            </ChartCard>
            <ChartCard
              title="Usuarios registrados por día (últimos 14 días, sin administradores)"
              href="/reports/user-activity"
            >
              <DailyLine
                data={stats.users.byDay}
                color={USERS_COLOR}
                unit="usuarios"
              />
            </ChartCard>
          </div>

          <ChartCard
            title="Visitas al sitio por hora del día (últimos 7 días)"
            href="/activity"
          >
            <HourlyColumns
              data={stats.siteVisits.byHour}
              color={SITE_VISITS_COLOR}
              unit="visitas"
            />
          </ChartCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Visitas al sitio acumuladas" href="/activity">
              <p className="text-4xl font-bold text-brand">
                {stats.siteVisits.total.toLocaleString('es-BO')}
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Páginas vistas en el portal (histórico).
              </p>
            </ChartCard>
            <ChartCard title="Visitas a anuncios acumuladas" href="/top-listings">
              <p className="text-4xl font-bold text-brand">
                {stats.visits.total.toLocaleString('es-BO')}
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Visitas al detalle de anuncios desde el portal (histórico).
              </p>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
