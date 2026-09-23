import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('visits')
@Controller('visits')
export class VisitsController {
  constructor(private visits: VisitsService) {}

  // Public: the portal records each visit to a listing detail (adId) or
  // each page view of the site (path). It's a single route on purpose:
  // /visits is already verified against blocker lists.
  // When logged in, the page view is tied to the user (it feeds the
  // panel's last-visit and time-on-site statistics).
  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  record(@Body() dto: CreateVisitDto, @CurrentUser() user: AuthUser | null) {
    if (dto.adId) return this.visits.record(dto.adId);
    if (dto.company) return this.visits.recordSiteClick(dto.company, dto.label);
    if (dto.path) return this.visits.recordPageView(dto.path, user?.id);
    throw new BadRequestException('Se requiere adId, company o path');
  }
}
