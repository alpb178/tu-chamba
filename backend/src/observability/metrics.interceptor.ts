import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

// Mide la duración y el resultado de cada request para las métricas del
// panel (solicitudes por minuto, latencia promedio, errores, conectados).
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const started = Date.now();
    const http = context.switchToHttp();
    // El interceptor corre después de los guards: req.user ya está resuelto.
    const req = http.getRequest<Request & { user?: { id?: string } }>();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = http.getResponse<Response>();
          this.metrics.recordRequest(
            Date.now() - started,
            res.statusCode,
            req.user?.id,
          );
        },
        error: (err: unknown) => {
          const status = err instanceof HttpException ? err.getStatus() : 500;
          this.metrics.recordRequest(Date.now() - started, status, req.user?.id);
        },
      }),
    );
  }
}
