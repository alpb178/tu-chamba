import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType, TraceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TracesService } from '../traces/traces.service';
import { MetricsService } from '../observability/metrics.service';
import { ErrorsService } from '../observability/errors.service';
import { GoogleIndexingService } from '../indexing/google-indexing.service';

// Truncation for the owner notification message.
function summary(description: string) {
  return description.length > 60 ? `${description.slice(0, 60)}…` : description;
}

// Deletes listings whose validity has passed (expiresAt in the past),
// regardless of status. Before deleting, notifies each owner with a
// notification without adId (reviews are unlinked via SET NULL and visits
// keep their rows; interests and reports cascade).
@Injectable()
export class AdsCleanupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdsCleanupService.name);

  constructor(
    private prisma: PrismaService,
    private traces: TracesService,
    private metrics: MetricsService,
    private errors: ErrorsService,
    private indexing: GoogleIndexingService,
  ) {}

  // Sweep on startup: covers listings that expired while the service was
  // asleep or between deploys.
  async onApplicationBootstrap() {
    await this.run();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async sweepExpired() {
    await this.run();
  }

  // Runs the sweep, reporting status and failures to the activity panel.
  private async run() {
    try {
      await this.sweep();
      this.metrics.markCronRun();
    } catch (err) {
      this.logger.error(err);
      await this.errors.record(
        'cron',
        `Limpieza de anuncios vencidos falló: ${(err as Error).message}`,
        { stack: (err as Error).stack },
      );
    }
  }

  async sweep() {
    const expired = await this.prisma.ad.findMany({
      where: { expiresAt: { lte: new Date() } },
      select: { id: true, description: true, createdById: true },
    });
    if (!expired.length) return { deleted: 0 };

    await this.prisma.$transaction([
      this.prisma.notification.createMany({
        data: expired.map((ad) => ({
          type: NotificationType.ANUNCIO_VENCIDO,
          message: `Tu anuncio «${summary(ad.description)}» venció y fue eliminado.`,
          userId: ad.createdById,
        })),
      }),
      this.prisma.ad.deleteMany({
        where: { id: { in: expired.map((ad) => ad.id) } },
      }),
    ]);

    await this.traces.record(
      TraceType.AD_DELETED,
      `Limpieza automática: ${expired.length} ${expired.length === 1 ? 'anuncio vencido eliminado' : 'anuncios vencidos eliminados'}`,
      null,
    );
    // Removes the URLs from Google's index. Capped at 100 per sweep so as not
    // to exhaust the Indexing API daily quota (200/day by default); the
    // sitemap cleans up the rest.
    for (const ad of expired.slice(0, 100)) {
      void this.indexing.notifyDeleted(ad.id);
    }
    this.logger.log(`Anuncios vencidos eliminados: ${expired.length}`);
    return { deleted: expired.length };
  }
}
