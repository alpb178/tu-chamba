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
import { EstadoReporte, Role } from '@prisma/client';
import { ReportesService } from './reportes.service';
import { CreateReporteDto } from './dto/create-reporte.dto';
import { ResolveReporteDto } from './dto/resolve-reporte.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('reportes')
@ApiBearerAuth()
@Controller('reportes')
export class ReportesController {
  constructor(private reportes: ReportesService) {}

  // Cualquier usuario autenticado puede reportar un anuncio.
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateReporteDto, @CurrentUser() user: AuthUser) {
    return this.reportes.create(dto, user.id);
  }

  // Cola de reportes: solo ADMIN.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiQuery({ name: 'estado', enum: EstadoReporte, required: false })
  @Get()
  findAll(@Query('estado') estado?: EstadoReporte) {
    return this.reportes.findAll(estado);
  }

  // Resolver reporte (ATENDIDO / DESCARTADO): solo ADMIN.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveReporteDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.reportes.resolve(id, dto.estado, actor);
  }
}
