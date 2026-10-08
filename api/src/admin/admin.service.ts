import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryUserActivityDto } from './dto/query-user-activity.dto';

const DAY_MS = 24 * 60 * 60 * 1000;
// Window for the per-user time-on-site statistic.
const ACTIVITY_DAYS = 30;
// A gap longer than 30 minutes between page views opens a new session
// (the standard web analytics criterion).
const SESSION_GAP_MS = 30 * 60 * 1000;
// Days covered by the dashboard's daily series.
const SERIES_DAYS = 14;
// Series are grouped by Bolivian calendar day, not UTC.
const TIME_ZONE = 'America/La_Paz';

// Calendar day in Bolivia as 'YYYY-MM-DD' (en-CA yields that format).
function dayKey(date: Date) {
  return date.toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
}

// Series for the last SERIES_DAYS days, defaulting to a total of 0.
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

// Distribution by hour of day (0-23) in Bolivian time.
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

  // Dashboard KPIs: users, ads per day, ad visits and site visits
  // (portal page views).
  async stats() {
    // One extra day of margin so the start of the first local day isn't lost.
    const since = new Date(Date.now() - SERIES_DAYS * DAY_MS);
    const dayAgo = new Date(Date.now() - DAY_MS);

    const [
      totalUsers,
      totalAdmins,
      recentUsers,
      totalAds,
      recentAds,
      totalVisits,
      visitsOfLiveAds,
      visits24h,
      recentVisits,
      totalPageViews,
      pageViews24h,
      recentPageViews,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isAdmin: true } }),
      // Sign-ups per day for the dashboard, always excluding admins.
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
      // When an ad is deleted its visits are kept with a null adId (history
      // isn't lost), so the running total includes ads that no longer exist.
      // "Top anuncios" and the card counters only see the remaining ones:
      // without the breakdown, the two numbers seem to contradict each other.
      this.prisma.visit.count({ where: { adId: { not: null } } }),
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
    // Hourly distribution over the last week (already fetched for the series).
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
        // Of the running total, those belonging to ads that still exist.
        liveAds: visitsOfLiveAds,
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

  // Activity of registered users (excluding admins): last portal visit and
  // time on site, computed from page views that arrived with a logged-in
  // session. Sessions are split by inactivity gaps (SESSION_GAP_MS) over the
  // last ACTIVITY_DAYS days.
  async userActivity(query: QueryUserActivityDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();

    const where: Prisma.UserWhereInput = { isAdmin: false };
    if (search) {
      const contains = { contains: search, mode: 'insensitive' as const };
      where.OR = [{ name: contains }, { email: contains }];
    }

    // The last visit sorts the list, so it's resolved for every user matching
    // the filter before paginating (it's only a few fields).
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
      // Users without visits go last, sorted by most recent sign-up.
      return lb - la || b.createdAt.getTime() - a.createdAt.getTime();
    });
    const pageUsers = sorted.slice((page - 1) * limit, page * limit);

    // Only the requested page loads its page views for sessionizing.
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

  // Most clicked ads: ranking by detail-page visits. Visits to deleted ads
  // keep a null adId and are left out of the ranking.
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

    // Keeps the groupBy order (most visited first).
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

  // Clicks on the "Sitios de interés" cards (Grupo CorpSC companies),
  // aggregated per company: 30-day and 7-day totals, most visited first.
  async siteClicks() {
    const since30 = new Date(Date.now() - 30 * DAY_MS);
    const since7 = new Date(Date.now() - 7 * DAY_MS);

    const [totals, recent, labels] = await Promise.all([
      this.prisma.siteClick.groupBy({
        by: ['company'],
        where: { createdAt: { gte: since30 } },
        _count: { _all: true },
        orderBy: { _count: { company: 'desc' } },
      }),
      this.prisma.siteClick.groupBy({
        by: ['company'],
        where: { createdAt: { gte: since7 } },
        _count: { _all: true },
      }),
      // Most recent display name recorded for each company.
      this.prisma.siteClick.groupBy({
        by: ['company'],
        _max: { label: true },
      }),
    ]);

    const last7 = new Map(recent.map((r) => [r.company, r._count._all]));
    const labelByCompany = new Map(labels.map((l) => [l.company, l._max.label]));

    return totals.map((t) => ({
      company: t.company,
      label: labelByCompany.get(t.company) ?? t.company,
      clicksLast30Days: t._count._all,
      clicksLast7Days: last7.get(t.company) ?? 0,
    }));
  }
}
