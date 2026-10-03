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
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReportStatus } from '@prisma/client';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { BulkIdsDto } from '../common/dto/bulk-ids.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private reports: ReportsService) {}

  // Any authenticated user can report a listing.
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateReportDto, @CurrentUser() user: AuthUser) {
    return this.reports.create(dto, user);
  }

  // Report queue: admin only.
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiQuery({ name: 'status', enum: ReportStatus, required: false })
  @Get()
  findAll(@Query('status') status?: ReportStatus) {
    return this.reports.findAll(status);
  }

  // Change the report status (resolve, dismiss or reopen): admin only.
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.reports.resolve(id, dto.status, actor);
  }

  // Delete the entire report queue: admin only. Declared before ':id' so
  // that 'all' is not interpreted as an id.
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('all')
  removeAll(@CurrentUser() actor: AuthUser) {
    return this.reports.removeAll(actor);
  }

  // Delete the report (leaves the reported listing untouched): admin only.
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.reports.remove(id, actor);
  }

  // Batch delete of selected reports: admin only.
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('bulk-delete')
  removeMany(@Body() dto: BulkIdsDto, @CurrentUser() actor: AuthUser) {
    return this.reports.removeMany(dto.ids, actor);
  }
}
