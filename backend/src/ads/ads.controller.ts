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
// 'listings' is the canonical route: ad blockers (EasyList) block any URL
// containing /ads/. 'ads' remains as an alias for already-installed mobile
// apps.
@Controller(['listings', 'ads'])
export class AdsController {
  constructor(private ads: AdsService) {}

  // Public: anyone visiting the portal can see the list of active listings.
  @Get()
  findAll(@Query() query: QueryAdDto) {
    return this.ads.findAll(query);
  }

  // Public: per-option counts for the filter bar.
  @Get('facets')
  facets() {
    return this.ads.facets();
  }

  // Admin panel: all listings, including expired and unpublished ones.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('all')
  findAllAdmin(@Query() query: QueryAdDto) {
    return this.ads.findAllAdmin(query);
  }

  // The authenticated user's own listings (must come before ':id').
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.ads.findMine(user.id);
  }

  // Public detail (indexable). The phone is only included when logged in.
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser | null) {
    return this.ads.findOnePublic(id, user);
  }

  // Contact phone: requires a session (sign-up/login).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/contact')
  getContact(@Param('id') id: string) {
    return this.ads.getContact(id);
  }

  // Create: any authenticated user with a verified email.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateAdDto, @CurrentUser() user: AuthUser) {
    return this.ads.create(dto, user);
  }

  // Bulk import (admin panel CSV): ADMIN only. Listings are published under
  // the name of the importing admin.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('bulk')
  bulkCreate(@Body() dto: BulkCreateAdsDto, @CurrentUser() user: AuthUser) {
    return this.ads.bulkCreate(dto.items, user);
  }

  // Batch hard delete (admin panel multi-select): ADMIN only.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('bulk-delete')
  bulkRemove(@Body() dto: BulkDeleteAdsDto, @CurrentUser() user: AuthUser) {
    return this.ads.bulkRemove(dto.ids, user);
  }

  // Edit: owner or ADMIN (validated in the service).
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

  // Manual unpublish: owner or ADMIN (validated in the service).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/unpublish')
  unpublish(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ads.unpublish(id, user);
  }

  // Republish an expired or unpublished listing: owner or ADMIN.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/republish')
  republish(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ads.republish(id, user);
  }

  // Hard delete of ALL listings (admin panel): ADMIN only.
  // With clientsOnly=true it deletes only listings created by clients
  // (users without panel access). Declared before ':id' so that 'all' is
  // not interpreted as an id.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('all')
  removeAll(
    @CurrentUser() user: AuthUser,
    @Query('clientsOnly') clientsOnly?: string,
  ) {
    return this.ads.removeAll(user, clientsOnly === 'true');
  }

  // Hard delete: listing owner or admin.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ads.remove(id, user);
  }
}
