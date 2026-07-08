import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificacionesService } from './notificaciones.service';
import { ChatClickDto } from './dto/chat-click.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('notificaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private notificaciones: NotificacionesService) {}

  @Get()
  findMine(@CurrentUser() user: AuthUser) {
    return this.notificaciones.findMine(user);
  }

  // Registra el clic en "Chatear" para avisar al dueño del anuncio.
  @Post('chat-click')
  chatClick(@Body() dto: ChatClickDto, @CurrentUser() user: AuthUser) {
    return this.notificaciones.chatClick(dto.anuncioId, user);
  }

  @Post('leer-todas')
  marcarTodas(@CurrentUser() user: AuthUser) {
    return this.notificaciones.marcarTodasLeidas(user.id);
  }

  @Patch(':id/leida')
  marcarLeida(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.notificaciones.marcarLeida(id, user.id);
  }
}
