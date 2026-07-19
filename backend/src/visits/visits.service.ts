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

  // Registra una página vista del portal. Se guarda solo la ruta, sin
  // query string. Si la visita llegó con sesión iniciada se asocia al
  // usuario (última visita y tiempo de estancia del panel admin); sin
  // sesión la métrica sigue siendo anónima.
  async recordPageView(path: string, userId?: string) {
    const cleanPath = path.split(/[?#]/)[0].slice(0, 200);
    await this.prisma.pageView.create({
      data: { path: cleanPath, userId: userId ?? null },
    });
    return { ok: true };
  }
}
