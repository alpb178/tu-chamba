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

// Measures the duration and outcome of each request for the panel metrics
// (requests per minute, average latency, errors, online users).
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const started = Date.now();
    const http = context.switchToHttp();
    // The interceptor runs after the guards: req.user is already resolved.
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
