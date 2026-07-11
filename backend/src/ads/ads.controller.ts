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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { QueryAdDto } from './dto/query-ad.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('ads')
@Controller('ads')
export class AdsController {
  constructor(private ads: AdsService) {}

  // Público: cualquiera que entre al portal puede ver la lista de ofertas vigentes.
  @Get()
  findAll(@Query() query: QueryAdDto) {
    return this.ads.findAll(query);
  }

  // Público: conteos por opción para la barra de filtros.
  @Get('facets')
  facets() {
    return this.ads.facets();
  }

  // Panel admin: todos los anuncios, incluidos vencidos y dados de baja.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('all')
  findAllAdmin(@Query() query: QueryAdDto) {
    return this.ads.findAllAdmin(query);
  }

  // Anuncios propios del usuario autenticado (debe ir antes de ':id').
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.ads.findMine(user.id);
  }

  // Detalle público (indexable). El teléfono solo se incluye con sesión.
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser | null) {
    return this.ads.findOnePublic(id, user);
  }

  // Teléfono de contacto: requiere sesión (registro/login).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/contact')
  getContact(@Param('id') id: string) {
    return this.ads.getContact(id);
  }

  // Crear: cualquier usuario autenticado con correo verificado.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateAdDto, @CurrentUser() user: AuthUser) {
    return this.ads.create(dto, user);
  }

  // Editar: dueño o ADMIN (validado en el servicio).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAdDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ads.update(id, dto, user);
  }

  // Baja manual: dueño o ADMIN (validado en el servicio).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/unpublish')
  unpublish(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ads.unpublish(id, user);
  }

  // Republicar un anuncio vencido o dado de baja: dueño o ADMIN.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/republish')
  republish(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ads.republish(id, user);
  }

  // Borrado físico: dueño del anuncio o admin.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ads.remove(id, user);
  }
}
