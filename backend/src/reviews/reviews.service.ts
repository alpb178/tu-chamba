import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TraceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryAdminReviewDto } from './dto/query-admin-review.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { TracesService } from '../traces/traces.service';

const includeAuthor = {
  author: { select: { id: true, name: true } },
};

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private traces: TracesService,
  ) {}

  // Una única reseña por (usuario, anuncio): no se puede volver a calificar
  // ni editar la existente. El dueño calificado se deriva del anuncio, y
  // nadie puede calificar su propio anuncio.
  async create(dto: CreateReviewDto, authorId: string) {
    const ad = await this.prisma.ad.findUnique({
      where: { id: dto.adId },
    });
    if (!ad) throw new BadRequestException('El anuncio no existe');
    if (ad.createdById === authorId) {
      throw new BadRequestException('No puedes calificar tu propio anuncio');
    }

    try {
      const review = await this.prisma.review.create({
        data: {
          authorId,
          ownerId: ad.createdById,
          adId: ad.id,
          rating: dto.rating,
          comment: dto.comment,
        },
        include: includeAuthor,
      });
      await this.notifications.notifyReview(review, review.author.name);
      await this.traces.record(
        TraceType.REVIEW_CREATED,
        `Reseña de ${review.rating}★ creada por ${review.author.name} sobre el anuncio "${ad.description.slice(0, 60)}"`,
        { id: authorId },
        { resource: `review:${review.id}` },
      );
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

  // Reseñas recibidas por un publicante, con promedio y total (para el
  // detalle del anuncio). Con sesión y adId, incluye si el usuario ya
  // calificó ese anuncio (su reseña puede no estar en la página pedida).
  async findByOwner(
    ownerId: string,
    page = 1,
    limit = 20,
    opts: { adId?: string; userId?: string } = {},
  ) {
    const where = { ownerId };
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

  // Reporte del panel admin: todas las reseñas con autor, calificado y el
  // anuncio asociado (null si el anuncio ya fue eliminado).
  async findAllAdmin(query: QueryAdminReviewDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ReviewWhereInput = {};
    if (query.rating) where.rating = query.rating;
    if (query.search) {
      const contains = { contains: query.search, mode: 'insensitive' as const };
      where.OR = [
        { comment: contains },
        { author: { is: { OR: [{ name: contains }, { email: contains }] } } },
        { owner: { is: { OR: [{ name: contains }, { email: contains }] } } },
      ];
    }
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(`${query.to}T23:59:59.999Z`);
    }

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, email: true } },
          owner: { select: { id: true, name: true, email: true } },
          ad: { select: { id: true, description: true, status: true, expiresAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Eliminar: el autor de la reseña o un admin (moderación).
  async remove(id: string, user: AuthUser) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Reseña no encontrada');
    if (!user.isAdmin && user.id !== review.authorId) {
      throw new ForbiddenException('No puedes eliminar esta reseña');
    }
    await this.prisma.review.delete({ where: { id } });
    await this.traces.record(
      TraceType.REVIEW_DELETED,
      `Reseña de ${review.rating}★ eliminada por ${user.email}${user.isAdmin && user.id !== review.authorId ? ' (moderación)' : ''}`,
      user,
      { resource: `review:${id}` },
    );
    return { deleted: true };
  }
}
