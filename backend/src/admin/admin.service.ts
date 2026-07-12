import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;
// Días que cubren las series diarias del dashboard.
const SERIES_DAYS = 14;
// Las series se agrupan por día calendario de Bolivia, no UTC.
const TIME_ZONE = 'America/La_Paz';

// Día calendario en Bolivia como 'YYYY-MM-DD' (en-CA da ese formato).
function dayKey(date: Date) {
  return date.toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
}

// Serie de los últimos SERIES_DAYS días con total 0 por defecto.
function emptySeries() {
  const days = new Map<string, number>();
  for (let i = SERIES_DAYS - 1; i >= 0; i--) {
    days.set(dayKey(new Date(Date.now() - i * DAY_MS)), 0);
  }
  return days;
}

function countByDay(rows: { createdAt: Date }[]) {
  const days = emptySeries();
  for (const { createdAt } of rows) {
    const key = dayKey(createdAt);
    if (days.has(key)) days.set(key, (days.get(key) ?? 0) + 1);
  }
  return Array.from(days, ([date, total]) => ({ date, total }));
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // KPIs del dashboard: usuarios, anuncios por día y visitas.
  async stats() {
    // Margen de un día extra para no perder el inicio del primer día local.
    const since = new Date(Date.now() - SERIES_DAYS * DAY_MS);

    const [
      totalUsers,
      totalAdmins,
      totalAds,
      recentAds,
      totalVisits,
      visits24h,
      recentVisits,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isAdmin: true } }),
      this.prisma.ad.count(),
      this.prisma.ad.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      this.prisma.visit.count(),
      this.prisma.visit.count({
        where: { createdAt: { gte: new Date(Date.now() - DAY_MS) } },
      }),
      this.prisma.visit.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);

    const visitsByDay = countByDay(recentVisits);
    const last7Days = visitsByDay.slice(-7).reduce((sum, d) => sum + d.total, 0);

    return {
      users: { total: totalUsers, admins: totalAdmins },
      ads: { total: totalAds, byDay: countByDay(recentAds) },
      visits: {
        total: totalVisits,
        last24h: visits24h,
        last7Days,
        byDay: visitsByDay,
      },
    };
  }

  // Anuncios más clickeados: ranking por visitas al detalle. Las visitas
  // de anuncios borrados quedan con adId null y no entran al ranking.
  async topAds(limit = 20) {
    const totals = await this.prisma.visit.groupBy({
      by: ['adId'],
      where: { adId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { adId: 'desc' } },
      take: limit,
    });
    const ids = totals.map((t) => t.adId as string);

    const [ads, recent] = await Promise.all([
      this.prisma.ad.findMany({
        where: { id: { in: ids } },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.visit.groupBy({
        by: ['adId'],
        where: {
          adId: { in: ids },
          createdAt: { gte: new Date(Date.now() - 7 * DAY_MS) },
        },
        _count: { _all: true },
      }),
    ]);

    const adById = new Map(ads.map((a) => [a.id, a]));
    const last7ByAd = new Map(recent.map((r) => [r.adId, r._count._all]));

    // Se conserva el orden del groupBy (más visitados primero).
    return totals.flatMap((t) => {
      const ad = adById.get(t.adId as string);
      if (!ad) return [];
      return [
        {
          ...ad,
          visitsTotal: t._count._all,
          visitsLast7Days: last7ByAd.get(t.adId) ?? 0,
        },
      ];
    });
  }
}
