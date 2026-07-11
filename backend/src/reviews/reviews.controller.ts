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
import { Role } from '@prisma/client';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  // Crear reseña: solo TRABAJADOR, una única vez por anuncio.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TRABAJADOR)
  @Post()
  create(@Body() dto: CreateReviewDto, @CurrentUser() user: AuthUser) {
    return this.reviews.create(dto, user.id);
  }

  // Público: reseñas y promedio de un empleador (no expone datos de contacto).
  // Con token y adId, la respuesta incluye alreadyReviewed del usuario.
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findByEmployer(
    @Query() query: QueryReviewDto,
    @CurrentUser() user: AuthUser | null,
  ) {
    return this.reviews.findByEmployer(
      query.employerId,
      query.page ?? 1,
      query.limit ?? 20,
      { adId: query.adId, userId: user?.id },
    );
  }

  // Eliminar: autor o ADMIN.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.reviews.remove(id, user);
  }
}
