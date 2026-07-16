import { Injectable } from '@nestjs/common';

// Bucket de un minuto: solicitudes, errores y latencia acumulada.
interface MinuteBucket {
  count: number;
  errors: number;
  totalMs: number;
}

const HOUR_MINUTES = 60;
// Un usuario cuenta como "conectado" si hizo alguna petición hace <5 min.
const CONNECTED_WINDOW_MS = 5 * 60 * 1000;

// Métricas de la API en memoria (ventana rodante de una hora). Se pierden al
// reiniciar el proceso a propósito: describen la instancia viva, no histórico.
@Injectable()
export class MetricsService {
  private buckets = new Map<number, MinuteBucket>();
  private usersLastSeen = new Map<string, number>();
  private lastCronRun: Date | null = null;
  private readonly startedAt = new Date();

  // Registrada por el interceptor para cada request atendida.
  recordRequest(durationMs: number, statusCode: number, userId?: string) {
    const minute = Math.floor(Date.now() / 60_000);
    const bucket = this.buckets.get(minute) ?? { count: 0, errors: 0, totalMs: 0 };
    bucket.count += 1;
    bucket.totalMs += durationMs;
    if (statusCode >= 500) bucket.errors += 1;
    this.buckets.set(minute, bucket);

    if (userId) this.usersLastSeen.set(userId, Date.now());
    this.prune(minute);
  }

  // El job de limpieza reporta cada ejecución (estado del cron en el panel).
  markCronRun() {
    this.lastCronRun = new Date();
  }

  get cronLastRun(): Date | null {
    return this.lastCronRun;
  }

  // Resumen para el panel: última ventana de 1h y usuarios conectados.
  snapshot() {
    const minute = Math.floor(Date.now() / 60_000);
    this.prune(minute);

    let count = 0;
    let errors = 0;
    let totalMs = 0;
    let lastMinuteCount = 0;
    for (const [key, b] of this.buckets) {
      count += b.count;
      errors += b.errors;
      totalMs += b.totalMs;
      // El minuto anterior completo representa mejor el "por minuto" actual.
      if (key === minute - 1) lastMinuteCount = b.count;
    }

    const now = Date.now();
    let connectedUsers = 0;
    for (const [userId, seen] of this.usersLastSeen) {
      if (now - seen <= CONNECTED_WINDOW_MS) connectedUsers += 1;
      else this.usersLastSeen.delete(userId);
    }

    return {
      requestsLastHour: count,
      requestsPerMinute: lastMinuteCount,
      avgResponseMs: count ? Math.round(totalMs / count) : 0,
      errorsLastHour: errors,
      connectedUsers,
      startedAt: this.startedAt,
    };
  }

  private prune(currentMinute: number) {
    for (const key of this.buckets.keys()) {
      if (key < currentMinute - HOUR_MINUTES) this.buckets.delete(key);
    }
  }
}
