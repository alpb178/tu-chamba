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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  // Perfil propio: cualquier usuario autenticado edita sus datos personales.
  @Patch('me')
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  // ——— Panel de administración ———

  @UseGuards(AdminGuard)
  @Get()
  findAll() {
    return this.users.findAll();
  }

  // Alta de otro administrador (solo correo y contraseña).
  @UseGuards(AdminGuard)
  @Post('admin')
  createAdmin(@Body() dto: CreateAdminDto, @CurrentUser() actor: AuthUser) {
    return this.users.createAdmin(dto, actor);
  }

  // Concede o revoca acceso al panel de administración.
  @UseGuards(AdminGuard)
  @Patch(':id/admin')
  setAdmin(
    @Param('id') id: string,
    @Body() dto: SetAdminDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.users.setAdmin(id, dto.isAdmin, actor);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() actor: AuthUser) {
    return this.users.remove(id, actor);
  }
}
