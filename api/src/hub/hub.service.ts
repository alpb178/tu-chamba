import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

// Tu Chamba is Bolivia-only (departments, phones, `es-BO` dates across the
// panel): days are cut on the Bolivian calendar, never UTC, or the series
// would drift a day against the hub's other projects.
const TZ = 'America/La_Paz';
/**
 * Always resend the last few days, not just yesterday: a user deleted for
 * abuse, or one that verifies late, changes a previous day's aggregate, and
 * the hub replaces the whole declared window on every push.
 */
const RESEND_DAYS = 3;

interface SignupRow {
  day: string;
  provider: string;
  value: number;
}

interface UsersTotalRow {
  day: string;
  total: number;
}

// Pushes Tu Chamba's business metrics the hub can't see from the browser:
// daily sign-ups (split by how the account was created) and the cumulative
// total of registered users. Traffic (visits/page_views/clicks) is already
// covered live by the events beacon (HubAnalytics / /api/hub-track) and must
// not be re-sent here — the hub replaces whatever window a push declares, so
// sending both would race.
@Injectable()
export class HubService {
  private readonly logger = new Logger(HubService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** De madrugada, cuando el día anterior ya está cerrado. */
  @Cron('0 30 4 * * *', { timeZone: TZ, name: 'hub-push' })
  async push(): Promise<void> {
    const url = process.env.HUB_URL;
    const key = process.env.HUB_API_KEY;
    // Without configuration the service is a no-op: a dev environment has no
    // reason to push anything to the hub.
    if (!url || !key) return;

    const to = this.localDay(-1);
    const from = this.localDay(-RESEND_DAYS);

    try {
      const payload = await this.build(from, to);

      const response = await fetch(`${url}/api/ingest/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': key },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status}: ${body.slice(0, 300)}`);
      }

      const result = (await response.json()) as {
        rowsWritten: number;
        warnings: string[];
      };
      this.logger.log(`Enviado ${from}…${to}: ${result.rowsWritten} filas`);
      for (const warning of result.warnings ?? []) this.logger.warn(warning);
    } catch (error) {
      // Not rethrown: the hub being down can't take down this project's own
      // scheduler. The hub notices the silence on its own (FreshnessService).
      this.logger.error(`Fallo al enviar al hub: ${(error as Error).message}`);
    }
  }

  async build(from: string, to: string) {
    const [rows, totalsRows] = await Promise.all([
      this.signupsByProvider(from, to),
      this.usersTotalByDay(from, to),
    ]);

    const byDay = new Map<string, { google: number; email: number }>();
    for (const row of rows) {
      const bucket = byDay.get(row.day) ?? { google: 0, email: 0 };
      if (row.provider === 'google' || row.provider === 'email') {
        bucket[row.provider] = Number(row.value);
      }
      byDay.set(row.day, bucket);
    }

    const totalByDay = new Map<string, number>();
    for (const row of totalsRows) totalByDay.set(row.day, Number(row.total));

    // Every calendar day in the declared range gets an explicit entry, zero
    // included: the hub replaces the whole window, so a day silently missing
    // from `days` is indistinguishable from "delete this day's data".
    const days = this.calendarDays(from, to).map((date) => {
      const split = byDay.get(date) ?? { google: 0, email: 0 };
      return {
        date,
        metrics: {
          signups: split.google + split.email,
          // Cumulative snapshot, not this day's new signups (those are
          // `signups` above) — `aggregation: 'last'` tells the hub to keep
          // only the most recent day's value instead of summing the window.
          users_total: totalByDay.get(date) ?? 0,
        },
        breakdowns: [
          {
            metric: 'signups',
            // Mirrors the `provider` field UsersService already derives from
            // `googleId` for the admin panel (users.service.ts).
            dimension: 'provider',
            values: { google: split.google, email: split.email },
          },
        ],
      };
    });

    return {
      schemaVersion: 1,
      project: 'tu-chamba',
      timezone: TZ,
      generatedAt: new Date().toISOString(),
      // `range` manda: el hub reemplaza exactamente este periodo.
      range: { from, to },
      definitions: [
        { key: 'signups', label: 'Altas', unit: 'count' },
        {
          key: 'users_total',
          label: 'Usuarios registrados',
          unit: 'count',
          aggregation: 'last',
        },
      ],
      days,
    };
  }

  /**
   * Sign-ups per local day, split by how the account was created
   * (`googleId` set = Google, no password needed; otherwise email+password).
   * No other user field is sent — only an aggregate count, per the contract's
   * privacy rule.
   *
   * The cut is done by Postgres, not JavaScript, so it doesn't depend on the
   * process's own timezone and doesn't require pulling every row to count
   * them. The table name is concatenated because Postgres doesn't allow
   * parameters for identifiers; only literals written in this file are
   * passed. If it ever came from a request, it would be SQL injection.
   */
  private signupsByProvider(from: string, to: string): Promise<SignupRow[]> {
    return this.prisma.$queryRawUnsafe<SignupRow[]>(
      `SELECT to_char(("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE $3)::date, 'YYYY-MM-DD') AS day,
              CASE WHEN "googleId" IS NOT NULL THEN 'google' ELSE 'email' END AS provider,
              count(*)::int AS value
         FROM "User"
        WHERE ("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE $3)::date BETWEEN $1::date AND $2::date
        GROUP BY 1, 2 ORDER BY 1, 2`,
      from,
      to,
      TZ,
    );
  }

  /**
   * Total cumulative registered users as of each local day in the window
   * (a snapshot, not that day's new signups — see `signupsByProvider`).
   * `aggregation: 'last'` in the push contract exists for exactly this: the
   * hub keeps only the most recent day's value instead of summing the window.
   *
   * A correlated subquery per day is cheap here because the window is only
   * `RESEND_DAYS` (3) days wide. The table name is concatenated because
   * Postgres doesn't allow parameters for identifiers; only the literal
   * written in this file is used — nothing from a request reaches this query.
   */
  private usersTotalByDay(from: string, to: string): Promise<UsersTotalRow[]> {
    return this.prisma.$queryRawUnsafe<UsersTotalRow[]>(
      `SELECT to_char(gs.day, 'YYYY-MM-DD') AS day,
              (SELECT count(*)::int FROM "User" u
                WHERE (u."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE $3)::date <= gs.day
              ) AS total
         FROM generate_series($1::date, $2::date, '1 day') AS gs(day)
        ORDER BY 1`,
      from,
      to,
      TZ,
    );
  }

  /** Local day with offset: -1 is yesterday. */
  private localDay(offset: number): string {
    const now = new Date();
    now.setUTCDate(now.getUTCDate() + offset);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  }

  /** Every 'YYYY-MM-DD' day between `from` and `to`, inclusive. */
  private calendarDays(from: string, to: string): string[] {
    const days: string[] = [];
    let cursor = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T00:00:00.000Z`);
    while (cursor <= end) {
      days.push(cursor.toISOString().slice(0, 10));
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    }
    return days;
  }
}
