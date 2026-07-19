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
import { BulkCreateAdsDto } from './dto/bulk-create-ads.dto';
import { BulkDeleteAdsDto } from './dto/bulk-delete-ads.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { QueryAdDto } from './dto/query-ad.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('ads')
// 'listings' es la ruta canónica: los bloqueadores de anuncios (EasyList)
// bloquean cualquier URL con /ads/. 'ads' queda como alias para las apps
// móviles ya instaladas.
@Controller(['listings', 'ads'])
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

  // Importación masiva (CSV del panel admin): solo ADMIN. Los anuncios se
  // publican a nombre del administrador que importa.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('bulk')
  bulkCreate(@Body() dto: BulkCreateAdsDto, @CurrentUser() user: AuthUser) {
    return this.ads.bulkCreate(dto.items, user);
  }

  // Borrado físico por lotes (selección múltiple del panel admin): solo ADMIN.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('bulk-delete')
  bulkRemove(@Body() dto: BulkDeleteAdsDto, @CurrentUser() user: AuthUser) {
    return this.ads.bulkRemove(dto.ids, user);
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

  // Borrado físico de TODOS los anuncios (panel admin): solo ADMIN.
  // Con clientsOnly=true borra solo los anuncios creados por clientes
  // (usuarios sin acceso al panel). Declarado antes de ':id' para que
  // 'all' no se interprete como un id.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('all')
  removeAll(
    @CurrentUser() user: AuthUser,
    @Query('clientsOnly') clientsOnly?: string,
  ) {
    return this.ads.removeAll(user, clientsOnly === 'true');
  }

  // Borrado físico: dueño del anuncio o admin.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ads.remove(id, user);
  }
}
