import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AlertasService } from './alertas.service';
import { CreateAlertaDto } from './dto/create-alerta.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

// Alertas de empleo: solo para TRABAJADOR (quien recibe avisos de ofertas).
@ApiTags('alertas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TRABAJADOR)
@Controller('alertas')
export class AlertasController {
  constructor(private alertas: AlertasService) {}

  @Get()
  findMine(@CurrentUser() user: AuthUser) {
    return this.alertas.findMine(user.id);
  }

  @Post()
  create(@Body() dto: CreateAlertaDto, @CurrentUser() user: AuthUser) {
    return this.alertas.create(dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.alertas.remove(id, user);
  }
}
