import { Module } from '@nestjs/common';
import { HubService } from './hub.service';

// Daily push of business metrics (sign-ups) to corpsc-hub. ScheduleModule is
// already registered globally in AppModule.
@Module({ providers: [HubService] })
export class HubModule {}
