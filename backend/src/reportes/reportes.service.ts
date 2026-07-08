import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoReporte, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReporteDto } from './dto/create-reporte.dto';

const includeDetalle = {
  anuncio: {
    select: {
      id: true,
      descripcion: true,
      estado: true,
      createdBy: { select: { id: true, nombre: true, email: true } },
    },
  },
  reporter: { select: { id: true, nombre: true, email: true } },
};

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReporteDto, reporterId: string) {
    const anuncio = await this.prisma.anuncio.findUnique({
      where: { id: dto.anuncioId },
    });
    if (!anuncio) throw new NotFoundException('Anuncio no encontrado');
    if (anuncio.createdById === reporterId) {
      throw new BadRequestException('No puedes reportar tu propio anuncio');
    }

    try {
      return await this.prisma.reporte.create({
        data: {
          anuncioId: dto.anuncioId,
          motivo: dto.motivo,
          comentario: dto.comentario?.trim() || null,
          reporterId,
        },
        include: includeDetalle,
      });
    } catch (e) {
      // Violación del único (anuncioId, reporterId): ya lo reportó antes.
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
  findAll(estado?: EstadoReporte) {
    return this.prisma.reporte.findMany({
      where: estado ? { estado } : undefined,
      include: includeDetalle,
      orderBy: { createdAt: 'desc' },
    });
  }

  // El admin marca el reporte como atendido o descartado. La baja del
  // anuncio, si corresponde, se hace por el endpoint de baja de anuncios.
  async resolve(id: string, estado: EstadoReporte) {
    const reporte = await this.prisma.reporte.findUnique({ where: { id } });
    if (!reporte) throw new NotFoundException('Reporte no encontrado');
    return this.prisma.reporte.update({
      where: { id },
      data: { estado },
      include: includeDetalle,
    });
  }
}
