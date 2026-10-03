import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

// PrismaService is @Global, so there is no need to import PrismaModule.
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
