import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';

@ApiTags('visits')
@Controller('visits')
export class VisitsController {
  constructor(private visits: VisitsService) {}

  // Público: el portal registra cada visita al detalle de un anuncio
  // (adId) o cada página vista del sitio (path). La ruta es una sola a
  // propósito: /visits ya está verificada contra listas de bloqueadores.
  @Post()
  record(@Body() dto: CreateVisitDto) {
    if (dto.adId) return this.visits.record(dto.adId);
    if (dto.path) return this.visits.recordPageView(dto.path);
    throw new BadRequestException('Se requiere adId o path');
  }
}
