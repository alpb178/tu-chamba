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
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReportStatus } from '@prisma/client';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { BulkIdsDto } from '../common/dto/bulk-ids.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
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
    return this.reports.create(dto, user);
  }

  // Cola de reportes: solo admin.
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiQuery({ name: 'status', enum: ReportStatus, required: false })
  @Get()
  findAll(@Query('status') status?: ReportStatus) {
    return this.reports.findAll(status);
  }

  // Cambiar el estado del reporte (atender, descartar o reabrir): solo admin.
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.reports.resolve(id, dto.status, actor);
  }

  // Borrado total de la cola de reportes: solo admin. Declarado antes
  // de ':id' para que 'all' no se interprete como un id.
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('all')
  removeAll(@CurrentUser() actor: AuthUser) {
    return this.reports.removeAll(actor);
  }

  // Eliminar el reporte (no toca el anuncio reportado): solo admin.
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.reports.remove(id, actor);
  }

  // Borrado por lotes de reportes seleccionados: solo admin.
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('bulk-delete')
  removeMany(@Body() dto: BulkIdsDto, @CurrentUser() actor: AuthUser) {
    return this.reports.removeMany(dto.ids, actor);
  }
}
