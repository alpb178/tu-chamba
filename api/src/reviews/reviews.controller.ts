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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';
import { QueryAdminReviewDto } from './dto/query-admin-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { BulkIdsDto } from '../common/dto/bulk-ids.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  // Create a review: any authenticated user, only once per ad
  // (never on their own ad; validated in the service).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateReviewDto, @CurrentUser() user: AuthUser) {
    return this.reviews.create(dto, user.id);
  }

  // Admin panel report: all reviews with author, reviewed user and ad
  // (must come before ':id' and '/').
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('all')
  findAllAdmin(@Query() query: QueryAdminReviewDto) {
    return this.reviews.findAllAdmin(query);
  }

  // Public: a poster's reviews and average (no contact details).
  // With a token and adId, the response includes the user's alreadyReviewed.
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

  // Moderation: bulk deletion of reviews selected in the panel.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('bulk-delete')
  removeMany(@Body() dto: BulkIdsDto, @CurrentUser() actor: AuthUser) {
    return this.reviews.removeMany(dto.ids, actor);
  }

  // Moderation: the admin corrects the rating or the comment.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.reviews.update(id, dto, actor);
  }

  // Moderation: deletes every review on the platform. Declared before ':id'
  // so 'all' isn't interpreted as an id.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('all')
  removeAll(@CurrentUser() actor: AuthUser) {
    return this.reviews.removeAll(actor);
  }

  // Delete: author or admin.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.reviews.remove(id, user);
  }
}
