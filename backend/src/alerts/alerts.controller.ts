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
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

// Alertas de empleo: solo para TRABAJADOR (quien recibe avisos de ofertas).
@ApiTags('alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TRABAJADOR)
@Controller('alerts')
export class AlertsController {
  constructor(private alerts: AlertsService) {}

  @Get()
  findMine(@CurrentUser() user: AuthUser) {
    return this.alerts.findMine(user.id);
  }

  @Post()
  create(@Body() dto: CreateAlertDto, @CurrentUser() user: AuthUser) {
    return this.alerts.create(dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.alerts.remove(id, user);
  }
}
