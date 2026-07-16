import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType, TraceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TracesService } from '../traces/traces.service';
import { MetricsService } from '../observability/metrics.service';
import { ErrorsService } from '../observability/errors.service';

// Recorte para el mensaje de la notificación al dueño.
function summary(description: string) {
  return description.length > 60 ? `${description.slice(0, 60)}…` : description;
}

// Elimina los anuncios cuya vigencia ya pasó (expiresAt en el pasado),
// cualquiera sea su estado. Antes de borrar, avisa a cada dueño con una
// notificación sin adId (las reseñas se desvinculan vía SET NULL y las
// visitas conservan sus filas; intereses y reportes caen en cascada).
@Injectable()
export class AdsCleanupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdsCleanupService.name);

  constructor(
    private prisma: PrismaService,
    private traces: TracesService,
    private metrics: MetricsService,
    private errors: ErrorsService,
  ) {}

  // Barrido al arrancar: cubre los vencidos acumulados mientras el
  // servicio estuvo dormido o entre deploys.
  async onApplicationBootstrap() {
    await this.run();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async sweepExpired() {
    await this.run();
  }

  // Ejecuta el barrido reportando estado y fallos al panel de actividad.
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
    this.logger.log(`Anuncios vencidos eliminados: ${expired.length}`);
    return { deleted: expired.length };
  }
}
