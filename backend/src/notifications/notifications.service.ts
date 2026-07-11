import { Injectable, NotFoundException } from '@nestjs/common';
import { Ad, NotificationType, Review } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';

// Recorte para mensajes legibles en la campana de notificaciones.
function summary(text: string, max = 60) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Listado propio + conteo de no leídas. Antes de listar se generan las
  // notificaciones de vencimiento pendientes (lazy, sin cron).
  async findMine(user: AuthUser) {
    await this.generateExpiryNotifications(user.id);

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

  // Alguien mostró interés en un anuncio (la llama InterestsService la
  // primera vez que ese usuario contacta): avisa al dueño.
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

  // Nueva calificación recibida (la llama ReviewsService).
  async notifyReview(review: Review, authorName: string) {
    await this.prisma.notification.create({
      data: {
        type: NotificationType.NUEVA_REVIEW,
        message: `${authorName} te calificó con ${review.rating}★: «${summary(review.comment)}»`,
        userId: review.ownerId,
      },
    });
  }

  // Anuncio nuevo publicado: avisa solo a los usuarios con una alerta
  // que coincide (departamento y categoría; null = cualquiera). Un usuario
  // con varias alertas coincidentes recibe una sola notificación.
  async notifyNewAd(ad: Ad) {
    const alerts = await this.prisma.jobAlert.findMany({
      where: {
        // El dueño del anuncio no se notifica a sí mismo.
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

  // Vencimientos: genera una notificación por anuncio ACTIVO ya expirado que
  // aún no fue notificado. El flag se resetea al republicar.
  private async generateExpiryNotifications(userId: string) {
    const expired = await this.prisma.ad.findMany({
      where: {
        createdById: userId,
        status: 'ACTIVO',
        expiresAt: { lt: new Date() },
        expiryNotified: false,
      },
    });
    if (!expired.length) return;

    await this.prisma.$transaction([
      this.prisma.notification.createMany({
        data: expired.map((ad) => ({
          type: NotificationType.ANUNCIO_VENCIDO,
          message: `Tu anuncio «${summary(ad.description)}» venció. Puedes republicarlo desde Mis anuncios.`,
          userId,
          adId: ad.id,
        })),
      }),
      this.prisma.ad.updateMany({
        where: { id: { in: expired.map((ad) => ad.id) } },
        data: { expiryNotified: true },
      }),
    ]);
  }
}
