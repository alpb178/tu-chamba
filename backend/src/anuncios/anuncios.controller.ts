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
import { Role } from '@prisma/client';
import { AnunciosService } from './anuncios.service';
import { CreateAnuncioDto } from './dto/create-anuncio.dto';
import { UpdateAnuncioDto } from './dto/update-anuncio.dto';
import { QueryAnuncioDto } from './dto/query-anuncio.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('anuncios')
@Controller('anuncios')
export class AnunciosController {
  constructor(private anuncios: AnunciosService) {}

  // Público: cualquiera que entre al portal puede ver la lista de ofertas vigentes.
  @Get()
  findAll(@Query() query: QueryAnuncioDto) {
    return this.anuncios.findAll(query);
  }

  // Público: conteos por opción para la barra de filtros.
  @Get('facetas')
  facetas() {
    return this.anuncios.facetas();
  }

  // Panel admin: todos los anuncios, incluidos vencidos y dados de baja.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('todos')
  findAllAdmin(@Query() query: QueryAnuncioDto) {
    return this.anuncios.findAllAdmin(query);
  }

  // Anuncios propios del usuario autenticado (debe ir antes de ':id').
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('mis-anuncios')
  findMine(@CurrentUser() user: AuthUser) {
    return this.anuncios.findMine(user.id);
  }

  // Detalle público (indexable). El teléfono solo se incluye con sesión.
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser | null) {
    return this.anuncios.findOnePublic(id, user);
  }

  // Teléfono de contacto: requiere sesión (registro/login).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/contacto')
  getContacto(@Param('id') id: string) {
    return this.anuncios.getContacto(id);
  }

  // Crear: solo EMPLEADOR o ADMIN.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLEADOR, Role.ADMIN)
  @Post()
  create(@Body() dto: CreateAnuncioDto, @CurrentUser() user: AuthUser) {
    return this.anuncios.create(dto, user.id);
  }

  // Editar: dueño o ADMIN (validado en el servicio).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAnuncioDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.anuncios.update(id, dto, user);
  }

  // Baja manual: dueño o ADMIN (validado en el servicio).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/baja')
  darDeBaja(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.anuncios.darDeBaja(id, user);
  }

  // Republicar un anuncio vencido o dado de baja: dueño o ADMIN.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/republicar')
  republicar(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.anuncios.republicar(id, user);
  }

  // Borrado físico: solo ADMIN (los dueños dan de baja).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.anuncios.remove(id, user);
  }
}
