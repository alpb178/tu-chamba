import { Module } from '@nestjs/common';
import { AnunciosService } from './anuncios.service';
import { AnunciosController } from './anuncios.controller';

@Module({
  controllers: [AnunciosController],
  providers: [AnunciosService],
})
export class AnunciosModule {}
