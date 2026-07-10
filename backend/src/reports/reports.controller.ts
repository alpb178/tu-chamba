import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReportStatus, Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private reports: ReportsService) {}

  // Cualquier usuario autenticado puede reportar un anuncio.
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateReportDto, @CurrentUser() user: AuthUser) {
    return this.reports.create(dto, user.id);
  }

  // Cola de reportes: solo ADMIN.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiQuery({ name: 'status', enum: ReportStatus, required: false })
  @Get()
  findAll(@Query('status') status?: ReportStatus) {
    return this.reports.findAll(status);
  }

  // Resolver reporte (ATENDIDO / DESCARTADO): solo ADMIN.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.reports.resolve(id, dto.status, actor);
  }
}
