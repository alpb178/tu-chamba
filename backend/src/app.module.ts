import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AnunciosModule } from './anuncios/anuncios.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ReportesModule } from './reportes/reportes.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { AlertasModule } from './alertas/alertas.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AnunciosModule,
    ReviewsModule,
    ReportesModule,
    NotificacionesModule,
    AlertasModule,
    HealthModule,
  ],
})
export class AppModule {}
