import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';

const includeAd = {
  ad: {
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  },
};

@Injectable()
export class InterestsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // Registra el interés en un anuncio ajeno (al contactar por Chatear o
  // Llamar). Idempotente: la primera vez notifica al dueño; repetir no
  // duplica ni el registro ni el aviso.
  async register(adId: string, user: AuthUser) {
    const ad = await this.prisma.ad.findUnique({ where: { id: adId } });
    if (!ad) throw new NotFoundException('Anuncio no encontrado');
    // El interés en el anuncio propio no aporta nada: se ignora.
    if (ad.createdById === user.id) return { interested: false };

    try {
      await this.prisma.interest.create({
        data: { userId: user.id, adId: ad.id },
      });
    } catch (e) {
      // Único (userId, adId): ya estaba registrado; no se re-notifica.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        return { interested: true };
      }
      throw e;
    }

    // El aviso al dueño es best-effort: no rompe el registro si falla.
    try {
      await this.notifications.notifyInterest(ad, user.id);
    } catch {
      /* noop */
    }
    return { interested: true };
  }

  // Anuncios en los que el usuario mostró interés, el más reciente primero.
  findMine(userId: string) {
    return this.prisma.interest.findMany({
      where: { userId },
      include: includeAd,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ¿Ya mostró interés en este anuncio?
  async status(adId: string, userId: string) {
    const existing = await this.prisma.interest.findUnique({
      where: { userId_adId: { userId, adId } },
      select: { id: true },
    });
    return { interested: Boolean(existing) };
  }

  // Quitar un anuncio de la lista de interés propia.
  async remove(adId: string, userId: string) {
    await this.prisma.interest.deleteMany({ where: { userId, adId } });
    return { deleted: true };
  }
}
