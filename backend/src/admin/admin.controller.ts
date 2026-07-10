import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { TracesService } from '../traces/traces.service';
import { QueryTraceDto } from '../traces/dto/query-trace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
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
