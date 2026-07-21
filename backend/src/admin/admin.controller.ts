import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { TracesService } from '../traces/traces.service';
import { QueryTraceDto } from '../traces/dto/query-trace.dto';
import { QueryUserActivityDto } from './dto/query-user-activity.dto';
import { BulkIdsDto } from '../common/dto/bulk-ids.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private admin: AdminService,
    private traces: TracesService,
  ) {}

  // KPIs del dashboard del panel.
  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  // Ranking de anuncios más clickeados (visitas al detalle).
  @Get('top-ads')
  topAds() {
    return this.admin.topAds();
  }

  // Accesos a las tarjetas de "Sitios de interés" (empresas del grupo).
  @Get('site-clicks')
  siteClicks() {
    return this.admin.siteClicks();
  }

  // Actividad de los usuarios registrados (excluye administradores):
  // última visita y tiempo de estancia en el portal.
  @Get('user-activity')
  userActivity(@Query() query: QueryUserActivityDto) {
    return this.admin.userActivity(query);
  }

  // Trazas del sistema, paginadas y filtrables por tipo.
  @Get('traces')
  findTraces(@Query() query: QueryTraceDto) {
    return this.traces.findAll(query);
  }

  // Borrado total del historial de trazas (queda la traza resumen).
  // Declarado antes de ':id' para que 'all' no se interprete como un id.
  @Delete('traces/all')
  removeAllTraces(@CurrentUser() actor: AuthUser) {
    return this.traces.removeAll(actor);
  }

  // Borra una traza puntual (la eliminación queda auditada).
  @Delete('traces/:id')
  removeTrace(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.traces.remove(id, actor);
  }

  // Borrado por lotes de trazas seleccionadas (auditado con traza resumen).
  @Post('traces/bulk-delete')
  removeTraces(@Body() dto: BulkIdsDto, @CurrentUser() actor: AuthUser) {
    return this.traces.removeMany(dto.ids, actor);
  }
}
