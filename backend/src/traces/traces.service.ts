import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TraceResult, TraceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryTraceDto } from './dto/query-trace.dto';
import { requestContext } from './request-context';

// Actor de la traza: alcanza con id y email (se denormaliza el email).
export interface TraceActor {
  id?: string | null;
  email?: string | null;
}

// Metadatos opcionales de la traza. IP y user-agent no se pasan aquí:
// se capturan solos del request en curso (RequestContextMiddleware).
export interface TraceOptions {
  // Recurso afectado, en formato "tipo:id" (ej. "ad:<uuid>").
  resource?: string;
  result?: TraceResult;
}

@Injectable()
export class TracesService {
  constructor(private prisma: PrismaService) {}

  // Best-effort: registrar una traza nunca debe romper la operación principal.
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
          resource: opts?.resource ?? null,
          result: opts?.result ?? TraceResult.OK,
          durationMs: ctx ? Date.now() - ctx.startedAt : null,
        },
      });
    } catch {
      /* noop: la traza es best-effort */
    }
  }

  // Listado paginado para el panel admin (más recientes primero).
  async findAll(query: QueryTraceDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.TraceWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.result) where.result = query.result;
    // Búsqueda por actor: email del usuario que ejecutó la acción.
    if (query.actor) {
      where.actorEmail = { contains: query.actor, mode: 'insensitive' };
    }
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      // Hasta el final del día indicado.
      if (query.to) where.createdAt.lte = new Date(`${query.to}T23:59:59.999Z`);
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

  // Borra una traza desde el panel. La eliminación queda auditada con una
  // traza nueva: el registro de auditoría nunca se vacía en silencio.
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

  // Borrado total del historial de trazas. La traza resumen se crea
  // después del borrado, así el historial nunca queda vacío en silencio.
  async removeAll(actor: TraceActor) {
    const { count } = await this.prisma.trace.deleteMany({});
    await this.record(
      TraceType.TRACE_DELETED,
      `Borrado total: ${count} trazas eliminadas por ${actor.email}`,
      actor,
    );
    return { deleted: count };
  }

  // Borrado por lotes de trazas, auditado con una traza resumen única.
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
