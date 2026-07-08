import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

const includeAutor = {
  autor: { select: { id: true, nombre: true } },
};

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
  ) {}

  // Máx. una reseña por (trabajador, empleador): si ya existe, se actualiza.
  async upsert(dto: CreateReviewDto, autorId: string) {
    const empleador = await this.prisma.user.findUnique({
      where: { id: dto.empleadorId },
    });
    if (!empleador || empleador.role !== Role.EMPLEADOR) {
      throw new BadRequestException('Solo se puede reseñar a empleadores');
    }

    const existente = await this.prisma.review.findUnique({
      where: {
        autorId_empleadorId: { autorId, empleadorId: dto.empleadorId },
      },
    });

    const review = await this.prisma.review.upsert({
      where: {
        autorId_empleadorId: { autorId, empleadorId: dto.empleadorId },
      },
      create: {
        autorId,
        empleadorId: dto.empleadorId,
        rating: dto.rating,
        comentario: dto.comentario,
      },
      update: { rating: dto.rating, comentario: dto.comentario },
      include: includeAutor,
    });

    await this.notificaciones.notificarReview(
      review,
      review.autor.nombre,
      !existente,
    );
    return review;
  }

  // Reseñas de un empleador con promedio y total (para el detalle del anuncio).
  async findByEmpleador(empleadorId: string, page = 1, limit = 20) {
    const where = { empleadorId };
    const [items, stats] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: includeAutor,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    return {
      items,
      total: stats._count,
      promedio: stats._avg.rating,
      page,
      limit,
      totalPages: Math.ceil(stats._count / limit),
    };
  }

  // Eliminar: el autor de la reseña o un ADMIN (moderación).
  async remove(id: string, user: AuthUser) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Reseña no encontrada');
    if (user.role !== Role.ADMIN && user.id !== review.autorId) {
      throw new ForbiddenException('No puedes eliminar esta reseña');
    }
    await this.prisma.review.delete({ where: { id } });
    return { deleted: true };
  }
}
