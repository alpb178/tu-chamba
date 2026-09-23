import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TraceResult, TraceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryTraceDto } from './dto/query-trace.dto';
import { requestContext } from './request-context';
import { endOfDay, startOfDay } from '../common/date-range';

// Offline geo-IP (geoip-lite) loaded lazily: if the package or its data are
// not available, the country is simply left null (best-effort).
let geoip: { lookup(ip: string): { country?: string } | null } | null | undefined;
function countryFromIp(ip?: string | null): string | null {
  if (!ip) return null;
  if (geoip === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      geoip = require('geoip-lite');
    } catch {
      geoip = null;
    }
  }
  if (!geoip) return null;
  try {
    // Normalizes IPv4-mapped IPv6 ("::ffff:200.87.100.1") and takes the first
    // IP if a list comes in (X-Forwarded-For).
    const clean = ip.replace(/^::ffff:/, '').split(',')[0].trim();
    return geoip.lookup(clean)?.country ?? null;
  } catch {
    return null;
  }
}

// Trace actor: id and email are enough (the email is denormalized).
export interface TraceActor {
  id?: string | null;
  email?: string | null;
}

// Optional trace metadata. IP and user-agent are not passed here: they are
// captured automatically from the current request (RequestContextMiddleware).
export interface TraceOptions {
  // Affected resource, in "type:id" format (e.g. "ad:<uuid>").
  resource?: string;
  result?: TraceResult;
}

@Injectable()
export class TracesService {
  constructor(private prisma: PrismaService) {}

  // Best-effort: recording a trace must never break the main operation.
  async record(
    type: TraceType,
    description: string,
    actor?: TraceActor | null,
    opts?: TraceOptions,
  ) {
    try {
      const ctx = requestContext.getStore();
      await this.prisma.trace.create({
        data: {
          type,
          description,
          actorId: actor?.id ?? null,
          actorEmail: actor?.email ?? null,
          ip: ctx?.ip ?? null,
          userAgent: ctx?.userAgent ?? null,
          // Country: CDN header if present; otherwise, geo-IP from the IP.
          country: ctx?.country ?? countryFromIp(ctx?.ip),
          source: ctx?.source ?? null,
          resource: opts?.resource ?? null,
          result: opts?.result ?? TraceResult.OK,
          durationMs: ctx ? Date.now() - ctx.startedAt : null,
        },
      });
    } catch {
      /* noop: the trace is best-effort */
    }
  }

  // Paginated list for the admin panel (most recent first).
  async findAll(query: QueryTraceDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.TraceWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.result) where.result = query.result;
    // Search by actor: email of the user who performed the action.
    if (query.actor) {
      where.actorEmail = { contains: query.actor, mode: 'insensitive' };
    }
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = startOfDay(query.from);
      // Up to the end of the given day (Bolivia time).
      if (query.to) where.createdAt.lte = endOfDay(query.to);
    }

    const [items, total] = await Promise.all([
      this.prisma.trace.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.trace.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Deletes a trace from the panel. The deletion is audited with a new
  // trace: the audit log is never emptied silently.
  async remove(id: string, actor: TraceActor) {
    const trace = await this.prisma.trace.findUnique({ where: { id } });
    if (!trace) throw new NotFoundException('Traza no encontrada');
    await this.prisma.trace.delete({ where: { id } });
    await this.record(
      TraceType.TRACE_DELETED,
      `Traza "${trace.description.slice(0, 80)}" eliminada por ${actor.email}`,
      actor,
      { resource: `trace:${id}` },
    );
    return { deleted: true };
  }

  // Deletes the whole trace history. The summary trace is created after the
  // deletion, so the history is never left silently empty.
  async removeAll(actor: TraceActor) {
    const { count } = await this.prisma.trace.deleteMany({});
    await this.record(
      TraceType.TRACE_DELETED,
      `Borrado total: ${count} trazas eliminadas por ${actor.email}`,
      actor,
    );
    return { deleted: count };
  }

  // Batch delete of traces, audited with a single summary trace.
  async removeMany(ids: string[], actor: TraceActor) {
    const { count } = await this.prisma.trace.deleteMany({
      where: { id: { in: ids } },
    });
    await this.record(
      TraceType.TRACE_DELETED,
      `Borrado por lotes: ${count} trazas eliminadas por ${actor.email}`,
      actor,
    );
    return { deleted: count };
  }
}
