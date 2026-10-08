import { Module } from '@nestjs/common';
import { AdsService } from './ads.service';
import { AdsCleanupService } from './ads-cleanup.service';
import { AdsController } from './ads.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AdsController],
  providers: [AdsService, AdsCleanupService],
})
export class AdsModule {}
