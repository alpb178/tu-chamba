import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';

const includeAuthor = {
  author: { select: { id: true, name: true } },
};

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // Una única reseña por (trabajador, anuncio): no se puede volver a
  // calificar ni editar la existente. El empleador se deriva del anuncio.
  async create(dto: CreateReviewDto, authorId: string) {
    const ad = await this.prisma.ad.findUnique({
      where: { id: dto.adId },
      include: { createdBy: true },
    });
    if (!ad || ad.createdBy.role !== Role.EMPLEADOR) {
      throw new BadRequestException(
        'Solo se pueden calificar anuncios de empleadores',
      );
    }

    try {
      const review = await this.prisma.review.create({
        data: {
          authorId,
          employerId: ad.createdById,
          adId: ad.id,
          rating: dto.rating,
          comment: dto.comment,
        },
        include: includeAuthor,
      });
      await this.notifications.notifyReview(review, review.author.name);
      return review;
    } catch (e) {
      // Violación del único (authorId, adId): ya calificó este anuncio.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Ya calificaste este anuncio');
      }
      throw e;
    }
  }

  // Reseñas de un empleador con promedio y total (para el detalle del anuncio).
  // Con sesión y adId, incluye si el usuario ya calificó ese anuncio (la
  // reseña propia puede no estar en la página pedida).
  async findByEmployer(
    employerId: string,
    page = 1,
    limit = 20,
    opts: { adId?: string; userId?: string } = {},
  ) {
    const where = { employerId };
    const [items, stats, own] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: includeAuthor,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: true,
      }),
      opts.adId && opts.userId
        ? this.prisma.review.findUnique({
            where: {
              authorId_adId: { authorId: opts.userId, adId: opts.adId },
            },
            select: { id: true },
          })
        : null,
    ]);

    return {
      items,
      total: stats._count,
      average: stats._avg.rating,
      alreadyReviewed: Boolean(own),
      page,
      limit,
      totalPages: Math.ceil(stats._count / limit),
    };
  }

  // Eliminar: el autor de la reseña o un ADMIN (moderación).
  async remove(id: string, user: AuthUser) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Reseña no encontrada');
    if (user.role !== Role.ADMIN && user.id !== review.authorId) {
      throw new ForbiddenException('No puedes eliminar esta reseña');
    }
    await this.prisma.review.delete({ where: { id } });
    return { deleted: true };
  }
}
