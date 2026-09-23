import { Injectable } from '@nestjs/common';
import { ErrorSeverity, ErrorStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryErrorDto } from './dto/query-error.dto';
import { endOfDay, startOfDay } from '../common/date-range';

// Persistent log of system errors (API, cron, email...).
@Injectable()
export class ErrorsService {
  constructor(private prisma: PrismaService) {}

  // Best-effort: logging an error must never trigger a cascading failure.
  async record(
    service: string,
    message: string,
    opts?: { stack?: string; path?: string; severity?: ErrorSeverity },
  ) {
    try {
      await this.prisma.errorLog.create({
        data: {
          service,
          message: message.slice(0, 1000),
          stack: opts?.stack?.slice(0, 4000) ?? null,
          path: opts?.path ?? null,
          severity: opts?.severity ?? ErrorSeverity.ERROR,
        },
      });
    } catch {
      /* noop */
    }
  }

  async findAll(query: QueryErrorDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ErrorLogWhereInput = {};
    if (query.severity) where.severity = query.severity;
    if (query.status) where.status = query.status;
    if (query.service) where.service = query.service;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = startOfDay(query.from);
      if (query.to) where.createdAt.lte = endOfDay(query.to);
    }

    const [items, total, pending] = await Promise.all([
      this.prisma.errorLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.errorLog.count({ where }),
      this.prisma.errorLog.count({ where: { status: ErrorStatus.NEW } }),
    ]);

    return { items, total, pending, page, limit, totalPages: Math.ceil(total / limit) };
  }

  resolve(id: string) {
    return this.prisma.errorLog.update({
      where: { id },
      data: { status: ErrorStatus.RESOLVED },
    });
  }

  // Deletes a single entry from the error log.
  async remove(id: string) {
    await this.prisma.errorLog.delete({ where: { id } });
    return { deleted: true };
  }

  // Batch delete of selected entries.
  async removeMany(ids: string[]) {
    const { count } = await this.prisma.errorLog.deleteMany({
      where: { id: { in: ids } },
    });
    return { deleted: count };
  }

  // Clears the entire error log.
  async removeAll() {
    const { count } = await this.prisma.errorLog.deleteMany({});
    return { deleted: count };
  }
}
