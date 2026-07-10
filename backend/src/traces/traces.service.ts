import { Injectable } from '@nestjs/common';
import { TraceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryTraceDto } from './dto/query-trace.dto';

// Actor de la traza: alcanza con id y email (se denormaliza el email).
export interface TraceActor {
  id?: string | null;
  email?: string | null;
}

@Injectable()
export class TracesService {
  constructor(private prisma: PrismaService) {}

  // Best-effort: registrar una traza nunca debe romper la operación principal.
  async record(type: TraceType, description: string, actor?: TraceActor | null) {
    try {
      await this.prisma.trace.create({
        data: {
          type,
          description,
          actorId: actor?.id ?? null,
          actorEmail: actor?.email ?? null,
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
    const where = query.type ? { type: query.type } : {};

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
