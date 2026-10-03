import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request } from 'express';
import { ErrorsService } from './errors.service';

// Global filter: the client response doesn't change (it delegates to Nest's
// base filter), but 5xx errors are persisted for the site activity panel
// ("Actividad del Sitio").
@Catch()
export class ErrorLogFilter extends BaseExceptionFilter {
  constructor(private errors: ErrorsService) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    if (status >= 500) {
      const req = host.switchToHttp().getRequest<Request>();
      const err = exception instanceof Error ? exception : null;
      void this.errors.record('api', err?.message ?? String(exception), {
        stack: err?.stack,
        path: req?.originalUrl,
      });
    }

    super.catch(exception, host);
  }
}
