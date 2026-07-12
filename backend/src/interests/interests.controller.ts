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
import { InterestsService } from './interests.service';
import { CreateInterestDto } from './dto/create-interest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('interests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('interests')
export class InterestsController {
  constructor(private interests: InterestsService) {}

  // Registra interés en un anuncio: al abrir el detalle (silencioso) o al
  // contactar (contact=true, avisa al dueño la primera vez).
  @Post()
  register(@Body() dto: CreateInterestDto, @CurrentUser() user: AuthUser) {
    return this.interests.register(dto.adId, user, dto.contact ?? false);
  }

  // Anuncios en los que el usuario mostró interés.
  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.interests.findMine(user.id);
  }

  // ¿Ya mostré interés en este anuncio? (para pintar el estado en el detalle)
  @Get('status/:adId')
  status(@Param('adId') adId: string, @CurrentUser() user: AuthUser) {
    return this.interests.status(adId, user.id);
  }

  // Quitar un anuncio de mi lista de interés.
  @Delete(':adId')
  remove(@Param('adId') adId: string, @CurrentUser() user: AuthUser) {
    return this.interests.remove(adId, user.id);
  }
}
