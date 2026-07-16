import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { MailModule } from '../mail/mail.module';
import { MetricsService } from './metrics.service';
import { MetricsInterceptor } from './metrics.interceptor';
import { ErrorsService } from './errors.service';
import { ErrorLogFilter } from './error-log.filter';
import { StatusService } from './status.service';
import { ObservabilityController } from './observability.controller';

// Global: el cron de limpieza reporta sus ejecuciones y errores sin importar
// este módulo (mismo criterio que TracesModule).
@Global()
@Module({
  imports: [MailModule],
  controllers: [ObservabilityController],
  providers: [
    MetricsService,
    ErrorsService,
    StatusService,
    // Todas las requests pasan por las métricas y el registro de errores.
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
    { provide: APP_FILTER, useClass: ErrorLogFilter },
  ],
  exports: [MetricsService, ErrorsService],
})
export class ObservabilityModule {}
