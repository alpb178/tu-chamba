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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  // Crear/actualizar reseña: solo TRABAJADOR (una por empleador).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TRABAJADOR)
  @Post()
  upsert(@Body() dto: CreateReviewDto, @CurrentUser() user: AuthUser) {
    return this.reviews.upsert(dto, user.id);
  }

  // Público: reseñas y promedio de un empleador (no expone datos de contacto).
  @Get()
  findByEmpleador(@Query() query: QueryReviewDto) {
    return this.reviews.findByEmpleador(
      query.empleadorId,
      query.page ?? 1,
      query.limit ?? 20,
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
