import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { TracesService } from '../traces/traces.service';
import { QueryTraceDto } from '../traces/dto/query-trace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

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

  // Trazas del sistema, paginadas y filtrables por tipo.
  @Get('traces')
  findTraces(@Query() query: QueryTraceDto) {
    return this.traces.findAll(query);
  }
}
