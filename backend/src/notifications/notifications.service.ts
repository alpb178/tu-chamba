import { Injectable, NotFoundException } from '@nestjs/common';
import { Ad, NotificationType, Review } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';

// Truncation for readable messages in the notification bell.
function summary(text: string, max = 60) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Own list + unread count. Expiration notifications are created by
  // AdsCleanupService when it deletes the expired listing.
  async findMine(user: AuthUser) {
    const [items, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      this.prisma.notification.count({
        where: { userId: user.id, read: false },
      }),
    ]);
    return { items, unread };
  }

  async markRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notificación no encontrada');
    }
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  // Someone showed interest in a listing (called by InterestsService the
  // first time that user makes contact): notifies the owner.
  async notifyInterest(ad: Ad, interestedUserId: string) {
    const who = await this.prisma.user.findUnique({
      where: { id: interestedUserId },
      select: { name: true },
    });
    await this.prisma.notification.create({
      data: {
        type: NotificationType.CHAT_INICIADO,
        message: `${who?.name ?? 'Alguien'} se interesó en tu anuncio «${summary(ad.description)}» y quiere contactarte`,
        userId: ad.createdById,
        adId: ad.id,
      },
    });
  }

  // New rating received (called by ReviewsService).
  async notifyReview(review: Review, authorName: string) {
    await this.prisma.notification.create({
      data: {
        type: NotificationType.NUEVA_REVIEW,
        message: `${authorName} te calificó con ${review.rating}★: «${summary(review.comment)}»`,
        userId: review.ownerId,
      },
    });
  }

  // New listing published: notifies only users with a matching alert
  // (department and category; null = any). A user with several matching
  // alerts receives a single notification.
  async notifyNewAd(ad: Ad) {
    const alerts = await this.prisma.jobAlert.findMany({
      where: {
        // The listing owner is not notified about their own listing.
        userId: { not: ad.createdById },
        AND: [
          { OR: [{ department: null }, { department: ad.department }] },
          { OR: [{ category: null }, { category: ad.category }] },
        ],
      },
      select: { userId: true },
    });

    const recipients = [...new Set(alerts.map((a) => a.userId))];
    if (!recipients.length) return;

    await this.prisma.notification.createMany({
      data: recipients.map((userId) => ({
        type: NotificationType.NUEVO_ANUNCIO,
        message: `Nueva oferta${ad.location ? ` en ${ad.location}` : ''}: «${summary(ad.description)}»`,
        userId,
        adId: ad.id,
      })),
    });
  }
}
