import { Injectable } from '@nestjs/common';
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
}
