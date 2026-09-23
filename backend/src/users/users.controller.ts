import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { SetAdminDto } from './dto/set-admin.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BulkIdsDto } from '../common/dto/bulk-ids.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  // Own profile: any authenticated user edits their personal data.
  @Patch('me')
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  // ——— Admin panel ———

  @UseGuards(AdminGuard)
  @Get()
  findAll() {
    return this.users.findAll();
  }

  // Create another admin (email and password only).
  @UseGuards(AdminGuard)
  @Post('admin')
  createAdmin(@Body() dto: CreateAdminDto, @CurrentUser() actor: AuthUser) {
    return this.users.createAdmin(dto, actor);
  }

  // Edit a user's data from the panel.
  @UseGuards(AdminGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.users.adminUpdate(id, dto, actor);
  }

  // Grants or revokes admin panel access.
  @UseGuards(AdminGuard)
  @Patch(':id/admin')
  setAdmin(
    @Param('id') id: string,
    @Body() dto: SetAdminDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.users.setAdmin(id, dto.isAdmin, actor);
  }

  // Deletes ALL registered users (admins are kept).
  // Declared before ':id' so 'all' is not interpreted as an id.
  @UseGuards(AdminGuard)
  @Delete('all')
  removeAll(@CurrentUser() actor: AuthUser) {
    return this.users.removeAllClients(actor);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.users.remove(id, actor);
  }

  // Batch delete of users selected in the panel.
  @UseGuards(AdminGuard)
  @Post('bulk-delete')
  removeMany(@Body() dto: BulkIdsDto, @CurrentUser() actor: AuthUser) {
    return this.users.removeMany(dto.ids, actor);
  }
}
