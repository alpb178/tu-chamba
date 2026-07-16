import { Injectable } from '@nestjs/common';
import * as os from 'os';
import { statfs } from 'fs/promises';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { MetricsService } from './metrics.service';

export type ServiceState = 'up' | 'warning' | 'down' | 'not_applicable';

export interface ServiceStatus {
  key: string;
  state: ServiceState;
  detail: string;
  latencyMs?: number;
}

// El cron corre cada hora: sin ejecuciones en 2h algo anda mal.
const CRON_STALE_MS = 2 * 60 * 60 * 1000;

// Estado en vivo de los servicios y métricas técnicas de la instancia.
@Injectable()
export class StatusService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private metrics: MetricsService,
  ) {}

  async services(): Promise<ServiceStatus[]> {
    const [db, mail] = await Promise.all([this.dbStatus(), this.mailStatus()]);
    return [
      // Si este endpoint respondió, la API está arriba por definición.
      { key: 'api', state: 'up', detail: 'Respondiendo peticiones' },
      db,
      mail,
      this.cronStatus(),
      {
        key: 'storage',
        state: 'not_applicable',
        detail: 'La plataforma no usa almacenamiento de archivos',
      },
      {
        key: 'queues',
        state: 'not_applicable',
        detail: 'Sin colas de trabajos: las tareas corren como cron en proceso',
      },
    ];
  }

  private async dbStatus(): Promise<ServiceStatus> {
    const started = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - started;
      return {
        key: 'db',
        state: latencyMs > 500 ? 'warning' : 'up',
        detail:
          latencyMs > 500
            ? `Respondiendo lento (${latencyMs} ms)`
            : `Conectada (${latencyMs} ms)`,
        latencyMs,
      };
    } catch (e) {
      return {
        key: 'db',
        state: 'down',
        detail: `Sin conexión: ${(e as Error).message.slice(0, 120)}`,
      };
    }
  }

  private async mailStatus(): Promise<ServiceStatus> {
    const state = await this.mail.healthCheck();
    const detail = {
      up: 'SMTP conectado',
      warning: 'SMTP no configurado: los correos van al log',
      down: 'SMTP configurado pero sin conexión',
    }[state];
    return { key: 'mail', state, detail };
  }

  private cronStatus(): ServiceStatus {
    const last = this.metrics.cronLastRun;
    if (!last) {
      return {
        key: 'cron',
        state: 'warning',
        detail: 'Sin ejecuciones desde el arranque',
      };
    }
    const age = Date.now() - last.getTime();
    return {
      key: 'cron',
      state: age > CRON_STALE_MS ? 'warning' : 'up',
      detail: `Última limpieza: ${last.toISOString()}`,
    };
  }

  // Indicadores técnicos de la instancia (proceso + host).
  async performance() {
    const load = os.loadavg()[0];
    const cores = os.cpus().length || 1;
    const mem = process.memoryUsage();
    const disk = await statfs(process.cwd()).catch(() => null);

    return {
      ...this.metrics.snapshot(),
      uptimeSeconds: Math.round(process.uptime()),
      cpu: {
        // Carga promedio (1 min) normalizada por núcleos, en porcentaje.
        loadPercent: Math.min(100, Math.round((load / cores) * 100)),
        cores,
      },
      memory: {
        processRssMb: Math.round(mem.rss / 1024 / 1024),
        totalMb: Math.round(os.totalmem() / 1024 / 1024),
        freeMb: Math.round(os.freemem() / 1024 / 1024),
      },
      disk: disk
        ? {
            totalGb: Number(((disk.blocks * disk.bsize) / 1024 ** 3).toFixed(1)),
            freeGb: Number(((disk.bfree * disk.bsize) / 1024 ** 3).toFixed(1)),
          }
        : null,
    };
  }
}
