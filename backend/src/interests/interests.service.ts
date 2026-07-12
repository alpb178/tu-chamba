import { Injectable, NotFoundException } from '@nestjs/common';
import { Ad, Prisma } from '@prisma/client';
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

  // Registra el interés en un anuncio ajeno. Se dispara al abrir el detalle
  // (silencioso) y al contactar (contact=true, que además avisa al dueño la
  // primera vez). Idempotente: no duplica registros ni avisos.
  async register(adId: string, user: AuthUser, contact = false) {
    const ad = await this.prisma.ad.findUnique({ where: { id: adId } });
    if (!ad) throw new NotFoundException('Anuncio no encontrado');
    // El interés en el anuncio propio no aporta nada: se ignora.
    if (ad.createdById === user.id) return { interested: false };

    const key = { userId_adId: { userId: user.id, adId: ad.id } };
    let existing = await this.prisma.interest.findUnique({ where: key });

    if (!existing) {
      try {
        await this.prisma.interest.create({
          data: { userId: user.id, adId: ad.id, contacted: contact },
        });
        if (contact) await this.notifyOwner(ad, user.id);
        return { interested: true };
      } catch (e) {
        // Carrera sobre el único (userId, adId): sigue como ya existente.
        if (
          !(e instanceof Prisma.PrismaClientKnownRequestError) ||
          e.code !== 'P2002'
        ) {
          throw e;
        }
        existing = await this.prisma.interest.findUnique({ where: key });
      }
    }

    // Transición a "contactado": una sola vez, con su aviso.
    if (contact && existing && !existing.contacted) {
      await this.prisma.interest.update({
        where: { id: existing.id },
        data: { contacted: true },
      });
      await this.notifyOwner(ad, user.id);
    }
    return { interested: true };
  }

  // El aviso al dueño es best-effort: no rompe el registro si falla.
  private async notifyOwner(ad: Ad, userId: string) {
    try {
      await this.notifications.notifyInterest(ad, userId);
    } catch {
      /* noop */
    }
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
