import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { StatusService } from './status.service';
import { ErrorsService } from './errors.service';
import { QueryErrorDto } from './dto/query-error.dto';

// Actividad del Sitio: estado de servicios, métricas y registro de errores.
// El feed de actividad reutiliza GET /admin/traces (con sus filtros).
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class ObservabilityController {
  constructor(
    private status: StatusService,
    private errors: ErrorsService,
  ) {}

  @Get('status')
  services() {
    return this.status.services();
  }

  @Get('metrics')
  metrics() {
    return this.status.performance();
  }

  @Get('errors')
  findErrors(@Query() query: QueryErrorDto) {
    return this.errors.findAll(query);
  }

  @Patch('errors/:id/resolve')
  resolveError(@Param('id') id: string) {
    return this.errors.resolve(id);
  }
}
