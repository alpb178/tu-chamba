import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Role, TraceType } from '@prisma/client';
import { TracesService } from '../traces/traces.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';

const selectSafe = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private traces: TracesService,
  ) {}

  findAll() {
    return this.prisma.user.findMany({
      select: { ...selectSafe, _count: { select: { ads: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Alta de un administrador desde el panel (solo correo y contraseña).
  async createAdmin(dto: CreateAdminDto, actor: AuthUser) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('El correo ya está registrado');

    const admin = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: await bcrypt.hash(dto.password, 10),
        // Solo se pide correo y contraseña: el nombre sale del correo.
        name: dto.email.split('@')[0],
        role: Role.ADMIN,
        // Cuenta creada por un admin de confianza: no exige verificación.
        emailVerified: true,
      },
      select: selectSafe,
    });

    await this.traces.record(
      TraceType.ADMIN_CREATED,
      `Admin ${admin.email} creado por ${actor.email}`,
      actor,
    );
    return admin;
  }

  async updateRole(id: string, role: Role, actor: AuthUser) {
    const user = await this.ensureExists(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: selectSafe,
    });
    await this.traces.record(
      TraceType.ROLE_UPDATED,
      `Rol de ${user.email} cambiado a ${role} por ${actor.email}`,
      actor,
    );
    return updated;
  }

  async remove(id: string, actor: AuthUser) {
    const user = await this.ensureExists(id);
    await this.prisma.user.delete({ where: { id } });
    await this.traces.record(
      TraceType.USER_DELETED,
      `Usuario ${user.email} (${user.role}) eliminado por ${actor.email}`,
      actor,
    );
    return { deleted: true };
  }

  private async ensureExists(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}
