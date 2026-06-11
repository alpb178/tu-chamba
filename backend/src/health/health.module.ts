import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

// PrismaService es @Global, así que no hace falta importar PrismaModule.
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
