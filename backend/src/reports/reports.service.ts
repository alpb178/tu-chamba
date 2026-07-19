import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReportStatus, TraceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TracesService } from '../traces/traces.service';
import { CreateReportDto } from './dto/create-report.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';

const includeDetail = {
  ad: {
    select: {
      id: true,
      description: true,
      status: true,
      createdBy: { select: { id: true, name: true, email: true } },
    },
  },
  reporter: { select: { id: true, name: true, email: true } },
};

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private traces: TracesService,
  ) {}

  async create(dto: CreateReportDto, reporter: AuthUser) {
    const ad = await this.prisma.ad.findUnique({
      where: { id: dto.adId },
    });
    if (!ad) throw new NotFoundException('Anuncio no encontrado');
    if (ad.createdById === reporter.id) {
      throw new BadRequestException('No puedes reportar tu propio anuncio');
    }

    try {
      const report = await this.prisma.report.create({
        data: {
          adId: dto.adId,
          reason: dto.reason,
          comment: dto.comment?.trim() || null,
          reporterId: reporter.id,
        },
        include: includeDetail,
      });
      await this.traces.record(
        TraceType.REPORT_CREATED,
        `Reporte por ${report.reason} sobre el anuncio "${ad.description.slice(0, 60)}" enviado por ${reporter.email}`,
        reporter,
        { resource: `report:${report.id}` },
      );
      return report;
    } catch (e) {
      // Violación del único (adId, reporterId): ya lo reportó antes.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Ya reportaste este anuncio');
      }
      throw e;
    }
  }

  // Cola de reportes para el panel admin.
  findAll(status?: ReportStatus) {
    return this.prisma.report.findMany({
      where: status ? { status } : undefined,
      include: includeDetail,
      orderBy: { createdAt: 'desc' },
    });
  }

  // El admin marca el reporte como atendido o descartado. La baja del
  // anuncio, si corresponde, se hace por el endpoint de baja de anuncios.
  async resolve(id: string, status: ReportStatus, actor: AuthUser) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Reporte no encontrado');
    const updated = await this.prisma.report.update({
      where: { id },
      data: { status },
      include: includeDetail,
    });
    await this.traces.record(
      TraceType.REPORT_RESOLVED,
      `Reporte por ${report.reason} marcado como ${status} por ${actor.email}`,
      actor,
      { resource: `report:${id}` },
    );
    return updated;
  }

  // Elimina el reporte de la cola (el anuncio reportado no se toca).
  async remove(id: string, actor: AuthUser) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Reporte no encontrado');
    await this.prisma.report.delete({ where: { id } });
    await this.traces.record(
      TraceType.REPORT_DELETED,
      `Reporte por ${report.reason} eliminado por ${actor.email}`,
      actor,
      { resource: `report:${id}` },
    );
    return { deleted: true };
  }

  // Borrado total de la cola de reportes (los anuncios no se tocan).
  async removeAll(actor: AuthUser) {
    const { count } = await this.prisma.report.deleteMany({});
    await this.traces.record(
      TraceType.REPORT_DELETED,
      `Borrado total: ${count} reportes eliminados por ${actor.email}`,
      actor,
    );
    return { deleted: count };
  }

  // Borrado por lotes de reportes seleccionados, con traza resumen única.
  async removeMany(ids: string[], actor: AuthUser) {
    const { count } = await this.prisma.report.deleteMany({
      where: { id: { in: ids } },
    });
    await this.traces.record(
      TraceType.REPORT_DELETED,
      `Borrado por lotes: ${count} reportes eliminados por ${actor.email}`,
      actor,
    );
    return { deleted: count };
  }
}
