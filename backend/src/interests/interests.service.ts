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

  // Records interest in someone else's listing. Fired when opening the detail
  // (silently) and when contacting (contact=true, which also notifies the owner
  // the first time). Idempotent: never duplicates records or notifications.
  async register(adId: string, user: AuthUser, contact = false) {
    const ad = await this.prisma.ad.findUnique({ where: { id: adId } });
    if (!ad) throw new NotFoundException('Anuncio no encontrado');
    // Interest in one's own listing adds nothing: ignored.
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
        // Race on the unique (userId, adId): treat it as already existing.
        if (
          !(e instanceof Prisma.PrismaClientKnownRequestError) ||
          e.code !== 'P2002'
        ) {
          throw e;
        }
        existing = await this.prisma.interest.findUnique({ where: key });
      }
    }

    // Transition to "contacted": only once, with its notification.
    if (contact && existing && !existing.contacted) {
      await this.prisma.interest.update({
        where: { id: existing.id },
        data: { contacted: true },
      });
      await this.notifyOwner(ad, user.id);
    }
    return { interested: true };
  }

  // Notifying the owner is best-effort: a failure doesn't break the record.
  private async notifyOwner(ad: Ad, userId: string) {
    try {
      await this.notifications.notifyInterest(ad, userId);
    } catch {
      /* noop */
    }
  }

  // Listings the user showed interest in, most recent first.
  findMine(userId: string) {
    return this.prisma.interest.findMany({
      where: { userId },
      include: includeAd,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Has the user already shown interest in this listing?
  async status(adId: string, userId: string) {
    const existing = await this.prisma.interest.findUnique({
      where: { userId_adId: { userId, adId } },
      select: { id: true },
    });
    return { interested: Boolean(existing) };
  }

  // Remove a listing from the user's own interest list.
  async remove(adId: string, userId: string) {
    await this.prisma.interest.deleteMany({ where: { userId, adId } });
    return { deleted: true };
  }
}
