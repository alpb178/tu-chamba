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
import { UpdateReviewDto } from './dto/update-review.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { TracesService } from '../traces/traces.service';
import { endOfDay, startOfDay } from '../common/date-range';

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

  // A single review per (user, listing): you cannot rate again or edit the
  // existing one. The rated owner is derived from the listing, and nobody
  // can rate their own listing.
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
      // Unique (authorId, adId) violation: already rated this listing.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Ya calificaste este anuncio');
      }
      throw e;
    }
  }

  // Reviews received by a poster, with average and total (for the listing
  // detail). With a session and adId, it includes whether the user already
  // rated that listing (their review may not be on the requested page).
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

  // Admin panel report: all reviews with author, rated user and the
  // associated listing (null if the listing was already deleted).
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
      if (query.from) where.createdAt.gte = startOfDay(query.from);
      if (query.to) where.createdAt.lte = endOfDay(query.to);
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

  // Moderation: the admin corrects the rating or the comment. The owner's
  // average is not persisted (it is aggregated on read), so there is
  // nothing else to recompute.
  async update(id: string, dto: UpdateReviewDto, actor: AuthUser) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Reseña no encontrada');
    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        ...(dto.rating != null ? { rating: dto.rating } : {}),
        ...(dto.comment != null ? { comment: dto.comment.trim() } : {}),
      },
      include: includeAuthor,
    });
    await this.traces.record(
      TraceType.REVIEW_UPDATED,
      `Reseña de ${review.rating}★ editada por ${actor.email} (moderación)`,
      actor,
      { resource: `review:${id}` },
    );
    return updated;
  }

  // Delete: the review author or an admin (moderation).
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

  // Delete all reviews on the platform (moderation).
  async removeAll(actor: AuthUser) {
    const { count } = await this.prisma.review.deleteMany({});
    await this.traces.record(
      TraceType.REVIEW_DELETED,
      `Borrado total: ${count} reseñas eliminadas por ${actor.email} (moderación)`,
      actor,
    );
    return { deleted: count };
  }

  // Batch delete from the panel (moderation), with a single summary trace.
  async removeMany(ids: string[], actor: AuthUser) {
    const { count } = await this.prisma.review.deleteMany({
      where: { id: { in: ids } },
    });
    await this.traces.record(
      TraceType.REVIEW_DELETED,
      `Borrado por lotes: ${count} reseñas eliminadas por ${actor.email} (moderación)`,
      actor,
    );
    return { deleted: count };
  }
}
