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
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

// Alertas de empleo: cualquier usuario puede suscribirse a nuevas ofertas.
@ApiTags('alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
