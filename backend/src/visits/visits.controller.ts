import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';

@ApiTags('visits')
@Controller('visits')
export class VisitsController {
  constructor(private visits: VisitsService) {}

  // Público: el portal registra cada visita al detalle de un anuncio.
  @Post()
  record(@Body() dto: CreateVisitDto) {
    return this.visits.record(dto.adId);
  }
}
