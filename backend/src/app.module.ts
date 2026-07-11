import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdsModule } from './ads/ads.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AlertsModule } from './alerts/alerts.module';
import { InterestsModule } from './interests/interests.module';
import { MailModule } from './mail/mail.module';
import { HealthModule } from './health/health.module';
import { TracesModule } from './traces/traces.module';
import { VisitsModule } from './visits/visits.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TracesModule,
    MailModule,
    AuthModule,
    UsersModule,
    AdsModule,
    ReviewsModule,
    ReportsModule,
    NotificationsModule,
    AlertsModule,
    InterestsModule,
    VisitsModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
