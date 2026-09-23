import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { MailModule } from '../mail/mail.module';
import { MetricsService } from './metrics.service';
import { MetricsInterceptor } from './metrics.interceptor';
import { ErrorsService } from './errors.service';
import { ErrorLogFilter } from './error-log.filter';
import { StatusService } from './status.service';
import { ObservabilityController } from './observability.controller';

// Global: the cleanup cron reports its runs and errors without importing
// this module (same approach as TracesModule).
@Global()
@Module({
  imports: [MailModule],
  controllers: [ObservabilityController],
  providers: [
    MetricsService,
    ErrorsService,
    StatusService,
    // Every request goes through the metrics and the error log.
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
    { provide: APP_FILTER, useClass: ErrorLogFilter },
  ],
  exports: [MetricsService, ErrorsService],
})
export class ObservabilityModule {}
