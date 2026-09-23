import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VisitsService {
  constructor(private prisma: PrismaService) {}

  // Records a visit to an ad's detail page. Silent on purpose: tracking must
  // never break portal navigation.
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

  // Records a click on a "Sitios de interés" card (a Grupo CorpSC sister
  // company). Silent: tracking never breaks navigation.
  async recordSiteClick(company: string, label?: string) {
    await this.prisma.siteClick.create({
      data: {
        company: company.slice(0, 64),
        label: label ? label.slice(0, 120) : null,
      },
    });
    return { ok: true };
  }

  // Records a portal page view. Only the path is stored, without the query
  // string. If the visit came with a signed-in session it is linked to the
  // user (last visit and time on site in the admin panel); without a session
  // the metric stays anonymous.
  async recordPageView(path: string, userId?: string) {
    const cleanPath = path.split(/[?#]/)[0].slice(0, 200);
    await this.prisma.pageView.create({
      data: { path: cleanPath, userId: userId ?? null },
    });
    return { ok: true };
  }
}
