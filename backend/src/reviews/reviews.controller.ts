import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';
import { QueryAdminReviewDto } from './dto/query-admin-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  // Crear reseña: cualquier usuario autenticado, una única vez por anuncio
  // (nunca sobre un anuncio propio; validado en el servicio).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateReviewDto, @CurrentUser() user: AuthUser) {
    return this.reviews.create(dto, user.id);
  }

  // Reporte del panel admin: todas las reseñas con autor, calificado y
  // anuncio (debe ir antes de ':id' y de '/').
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('all')
  findAllAdmin(@Query() query: QueryAdminReviewDto) {
    return this.reviews.findAllAdmin(query);
  }

  // Público: reseñas y promedio de un publicante (sin datos de contacto).
  // Con token y adId, la respuesta incluye alreadyReviewed del usuario.
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findByOwner(
    @Query() query: QueryReviewDto,
    @CurrentUser() user: AuthUser | null,
  ) {
    return this.reviews.findByOwner(
      query.ownerId,
      query.page ?? 1,
      query.limit ?? 20,
      { adId: query.adId, userId: user?.id },
    );
  }

  // Eliminar: autor o admin.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.reviews.remove(id, user);
  }
}
