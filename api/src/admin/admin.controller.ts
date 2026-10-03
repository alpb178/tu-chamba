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
import { AdminService } from './admin.service';
import { TracesService } from '../traces/traces.service';
import { QueryTraceDto } from '../traces/dto/query-trace.dto';
import { QueryUserActivityDto } from './dto/query-user-activity.dto';
import { BulkIdsDto } from '../common/dto/bulk-ids.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private admin: AdminService,
    private traces: TracesService,
  ) {}

  // Admin panel dashboard KPIs.
  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  // Ranking of the most clicked listings (detail page visits).
  @Get('top-ads')
  topAds() {
    return this.admin.topAds();
  }

  // Clicks on the "Sitios de interés" cards (group companies).
  @Get('site-clicks')
  siteClicks() {
    return this.admin.siteClicks();
  }

  // Activity of registered users (excludes admins):
  // last visit and time spent on the portal.
  @Get('user-activity')
  userActivity(@Query() query: QueryUserActivityDto) {
    return this.admin.userActivity(query);
  }

  // System traces, paginated and filterable by type.
  @Get('traces')
  findTraces(@Query() query: QueryTraceDto) {
    return this.traces.findAll(query);
  }

  // Deletes the whole trace history (a summary trace is kept).
  // Declared before ':id' so 'all' is not parsed as an id.
  @Delete('traces/all')
  removeAllTraces(@CurrentUser() actor: AuthUser) {
    return this.traces.removeAll(actor);
  }

  // Deletes a single trace (the deletion is audited).
  @Delete('traces/:id')
  removeTrace(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.traces.remove(id, actor);
  }

  // Batch deletion of selected traces (audited with a summary trace).
  @Post('traces/bulk-delete')
  removeTraces(@Body() dto: BulkIdsDto, @CurrentUser() actor: AuthUser) {
    return this.traces.removeMany(dto.ids, actor);
  }
}
