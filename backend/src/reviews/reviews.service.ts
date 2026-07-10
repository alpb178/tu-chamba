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

  // Máx. una reseña por (trabajador, empleador): si ya existe, se actualiza.
  async upsert(dto: CreateReviewDto, authorId: string) {
    const employer = await this.prisma.user.findUnique({
      where: { id: dto.employerId },
    });
    if (!employer || employer.role !== Role.EMPLEADOR) {
      throw new BadRequestException('Solo se puede reseñar a empleadores');
    }

    const existing = await this.prisma.review.findUnique({
      where: {
        authorId_employerId: { authorId, employerId: dto.employerId },
      },
    });

    const review = await this.prisma.review.upsert({
      where: {
        authorId_employerId: { authorId, employerId: dto.employerId },
      },
      create: {
        authorId,
        employerId: dto.employerId,
        rating: dto.rating,
        comment: dto.comment,
      },
      update: { rating: dto.rating, comment: dto.comment },
      include: includeAuthor,
    });

    await this.notifications.notifyReview(
      review,
      review.author.name,
      !existing,
    );
    return review;
  }

  // Reseñas de un empleador con promedio y total (para el detalle del anuncio).
  async findByEmployer(employerId: string, page = 1, limit = 20) {
    const where = { employerId };
    const [items, stats] = await Promise.all([
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
    ]);

    return {
      items,
      total: stats._count,
      average: stats._avg.rating,
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
