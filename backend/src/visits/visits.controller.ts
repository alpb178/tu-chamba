import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('visits')
@Controller('visits')
export class VisitsController {
  constructor(private visits: VisitsService) {}

  // Público: el portal registra cada visita al detalle de un anuncio
  // (adId) o cada página vista del sitio (path). La ruta es una sola a
  // propósito: /visits ya está verificada contra listas de bloqueadores.
  // Con sesión iniciada, la página vista se asocia al usuario (alimenta
  // la estadística de última visita y tiempo de estancia del panel).
  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  record(@Body() dto: CreateVisitDto, @CurrentUser() user: AuthUser | null) {
    if (dto.adId) return this.visits.record(dto.adId);
    if (dto.company) return this.visits.recordSiteClick(dto.company, dto.label);
    if (dto.path) return this.visits.recordPageView(dto.path, user?.id);
    throw new BadRequestException('Se requiere adId, company o path');
  }
}
