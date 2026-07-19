import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { StatusService } from './status.service';
import { ErrorsService } from './errors.service';
import { QueryErrorDto } from './dto/query-error.dto';
import { BulkIdsDto } from '../common/dto/bulk-ids.dto';

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

  // Declarado antes de ':id' para que 'all' no se interprete como un id.
  @Delete('errors/all')
  removeAllErrors() {
    return this.errors.removeAll();
  }

  @Delete('errors/:id')
  removeError(@Param('id') id: string) {
    return this.errors.remove(id);
  }

  @Post('errors/bulk-delete')
  removeErrors(@Body() dto: BulkIdsDto) {
    return this.errors.removeMany(dto.ids);
  }
}
