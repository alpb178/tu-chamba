import { Module } from '@nestjs/common';
import { AnunciosService } from './anuncios.service';
import { AnunciosController } from './anuncios.controller';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [NotificacionesModule],
  controllers: [AnunciosController],
  providers: [AnunciosService],
})
export class AnunciosModule {}
