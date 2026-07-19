import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryUserActivityDto } from './dto/query-user-activity.dto';

const DAY_MS = 24 * 60 * 60 * 1000;
// Ventana de la estadística de tiempo de estancia por usuario.
const ACTIVITY_DAYS = 30;
// Un hueco mayor a 30 minutos entre páginas vistas abre una sesión nueva
// (el criterio estándar de la analítica web).
const SESSION_GAP_MS = 30 * 60 * 1000;
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

// Distribución por hora del día (0-23) en hora de Bolivia.
function countByHour(rows: { createdAt: Date }[]) {
  const totals = Array.from({ length: 24 }, (_, hour) => ({ hour, total: 0 }));
  for (const { createdAt } of rows) {
    const hour = Number(
      createdAt.toLocaleString('en-GB', {
        timeZone: TIME_ZONE,
        hour: '2-digit',
        hour12: false,
      }),
    );
    totals[hour % 24].total += 1;
  }
  return totals;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // KPIs del dashboard: usuarios, anuncios por día, visitas a anuncios
  // y visitas al sitio (páginas vistas del portal).
  async stats() {
    // Margen de un día extra para no perder el inicio del primer día local.
    const since = new Date(Date.now() - SERIES_DAYS * DAY_MS);
    const dayAgo = new Date(Date.now() - DAY_MS);

    const [
      totalUsers,
      totalAdmins,
      recentUsers,
      totalAds,
      recentAds,
      totalVisits,
      visits24h,
      recentVisits,
      totalPageViews,
      pageViews24h,
      recentPageViews,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isAdmin: true } }),
      // Registros por día para el dashboard, siempre sin administradores.
      this.prisma.user.findMany({
        where: { isAdmin: false, createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      this.prisma.ad.count(),
      this.prisma.ad.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      this.prisma.visit.count(),
      this.prisma.visit.count({ where: { createdAt: { gte: dayAgo } } }),
      this.prisma.visit.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      this.prisma.pageView.count(),
      this.prisma.pageView.count({ where: { createdAt: { gte: dayAgo } } }),
      this.prisma.pageView.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);

    const visitsByDay = countByDay(recentVisits);
    const last7Days = visitsByDay.slice(-7).reduce((sum, d) => sum + d.total, 0);
    const pageViewsByDay = countByDay(recentPageViews);
    const pageViewsLast7Days = pageViewsByDay
      .slice(-7)
      .reduce((sum, d) => sum + d.total, 0);
    // Distribución horaria sobre la última semana (ya traída para la serie).
    const weekAgo = new Date(Date.now() - 7 * DAY_MS);
    const pageViewsByHour = countByHour(
      recentPageViews.filter((v) => v.createdAt >= weekAgo),
    );

    return {
      users: {
        total: totalUsers,
        admins: totalAdmins,
        byDay: countByDay(recentUsers),
      },
      ads: { total: totalAds, byDay: countByDay(recentAds) },
      visits: {
        total: totalVisits,
        last24h: visits24h,
        last7Days,
        byDay: visitsByDay,
      },
      siteVisits: {
        total: totalPageViews,
        last24h: pageViews24h,
        last7Days: pageViewsLast7Days,
        byDay: pageViewsByDay,
        byHour: pageViewsByHour,
      },
    };
  }

  // Actividad de los usuarios registrados (excluye administradores): última
  // visita al portal y tiempo de estancia, calculados sobre las páginas
  // vistas que llegaron con sesión iniciada. Las sesiones se arman por
  // huecos de inactividad (SESSION_GAP_MS) en los últimos ACTIVITY_DAYS días.
  async userActivity(query: QueryUserActivityDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();

    const where: Prisma.UserWhereInput = { isAdmin: false };
    if (search) {
      const contains = { contains: search, mode: 'insensitive' as const };
      where.OR = [{ name: contains }, { email: contains }];
    }

    // La última visita ordena el listado, así que se resuelve para todos
    // los usuarios del filtro antes de paginar (son pocos campos).
    const users = await this.prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });
    const lastVisits = await this.prisma.pageView.groupBy({
      by: ['userId'],
      where: { userId: { in: users.map((u) => u.id) } },
      _max: { createdAt: true },
    });
    const lastByUser = new Map(
      lastVisits.map((v) => [v.userId as string, v._max.createdAt as Date]),
    );

    const sorted = [...users].sort((a, b) => {
      const la = lastByUser.get(a.id)?.getTime() ?? 0;
      const lb = lastByUser.get(b.id)?.getTime() ?? 0;
      // Sin visitas van al final, ordenados por registro más reciente.
      return lb - la || b.createdAt.getTime() - a.createdAt.getTime();
    });
    const pageUsers = sorted.slice((page - 1) * limit, page * limit);

    // Solo la página pedida carga sus páginas vistas para sesionizar.
    const views = await this.prisma.pageView.findMany({
      where: {
        userId: { in: pageUsers.map((u) => u.id) },
        createdAt: { gte: new Date(Date.now() - ACTIVITY_DAYS * DAY_MS) },
      },
      select: { userId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const viewsByUser = new Map<string, Date[]>();
    for (const v of views) {
      const list = viewsByUser.get(v.userId as string) ?? [];
      list.push(v.createdAt);
      viewsByUser.set(v.userId as string, list);
    }

    const items = pageUsers.map((u) => {
      const times = viewsByUser.get(u.id) ?? [];
      let sessions = 0;
      let totalMs = 0;
      let sessionStart: number | null = null;
      let prev = 0;
      for (const t of times) {
        const ms = t.getTime();
        if (sessionStart === null || ms - prev > SESSION_GAP_MS) {
          if (sessionStart !== null) totalMs += prev - sessionStart;
          sessionStart = ms;
          sessions += 1;
        }
        prev = ms;
      }
      if (sessionStart !== null) totalMs += prev - sessionStart;

      return {
        ...u,
        lastVisitAt: lastByUser.get(u.id) ?? null,
        sessionsLast30Days: sessions,
        totalMinutesLast30Days: Math.round(totalMs / 60_000),
        avgSessionMinutes: sessions > 0 ? Math.round(totalMs / sessions / 60_000) : 0,
      };
    });

    return {
      items,
      total: users.length,
      page,
      limit,
      totalPages: Math.ceil(users.length / limit),
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
