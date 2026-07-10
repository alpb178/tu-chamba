import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VisitsService {
  constructor(private prisma: PrismaService) {}

  // Registra la visita al detalle de un anuncio. Silencioso a propósito:
  // el tracking nunca debe romper la navegación del portal.
  async record(adId: string) {
    const ad = await this.prisma.ad.findUnique({
      where: { id: adId },
      select: { id: true },
    });
    if (ad) {
      await this.prisma.visit.create({ data: { adId } });
    }
    return { ok: true };
  }
}
