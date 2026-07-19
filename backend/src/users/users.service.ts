import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { TraceType } from '@prisma/client';
import { TracesService } from '../traces/traces.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';

const selectSafe = {
  id: true,
  email: true,
  name: true,
  phone: true,
  isAdmin: true,
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

  // Perfil propio: datos personales y, opcionalmente, la contraseña.
  // Con contraseña existente se exige la actual; las cuentas de Google
  // (sin contraseña local) pueden definir una directamente.
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.ensureExists(userId);

    let hashed: string | undefined;
    if (dto.password) {
      if (user.password) {
        const ok =
          dto.currentPassword != null &&
          (await bcrypt.compare(dto.currentPassword, user.password));
        if (!ok) {
          throw new BadRequestException('La contraseña actual no es correcta');
        }
      }
      hashed = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name != null ? { name: dto.name.trim() } : {}),
        ...(dto.phone != null ? { phone: dto.phone.trim() || null } : {}),
        ...(hashed ? { password: hashed } : {}),
      },
      select: selectSafe,
    });
  }

  // Edición de los datos de un usuario desde el panel de administración.
  async adminUpdate(id: string, dto: UpdateUserDto, actor: AuthUser) {
    const user = await this.ensureExists(id);

    if (dto.email && dto.email !== user.email) {
      const taken = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });
      if (taken) throw new ConflictException('El correo ya está registrado');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name != null ? { name: dto.name.trim() } : {}),
        ...(dto.email != null ? { email: dto.email.trim() } : {}),
        ...(dto.phone != null ? { phone: dto.phone.trim() || null } : {}),
      },
      select: selectSafe,
    });
    await this.traces.record(
      TraceType.USER_UPDATED,
      `Usuario ${user.email} editado por ${actor.email}`,
      actor,
      { resource: `user:${id}` },
    );
    return updated;
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
        // El usuario sirve para iniciar sesión; si no se indica, del correo.
        name: dto.name?.trim() || dto.email.split('@')[0],
        isAdmin: true,
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

  // Concede o revoca el acceso al panel de administración.
  async setAdmin(id: string, isAdmin: boolean, actor: AuthUser) {
    const user = await this.ensureExists(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isAdmin },
      select: selectSafe,
    });
    await this.traces.record(
      TraceType.ROLE_UPDATED,
      `Acceso admin de ${user.email} ${isAdmin ? 'concedido' : 'revocado'} por ${actor.email}`,
      actor,
    );
    return updated;
  }

  async remove(id: string, actor: AuthUser) {
    const user = await this.ensureExists(id);
    await this.prisma.user.delete({ where: { id } });
    await this.traces.record(
      TraceType.USER_DELETED,
      `Usuario ${user.email} eliminado por ${actor.email}`,
      actor,
    );
    return { deleted: true };
  }

  // Borrado total de los usuarios registrados. Los administradores se
  // conservan a propósito: se eliminan solo de a uno o por lotes.
  async removeAllClients(actor: AuthUser) {
    const { count } = await this.prisma.user.deleteMany({
      where: { isAdmin: false },
    });
    await this.traces.record(
      TraceType.USER_DELETED,
      `Borrado total: ${count} usuarios eliminados por ${actor.email}`,
      actor,
    );
    return { deleted: count };
  }

  // Borrado por lotes desde el panel, con traza resumen única. El actor no
  // puede borrarse a sí mismo en el lote (evita quedarse sin sesión).
  async removeMany(ids: string[], actor: AuthUser) {
    const targets = ids.filter((id) => id !== actor.id);
    const { count } = await this.prisma.user.deleteMany({
      where: { id: { in: targets } },
    });
    await this.traces.record(
      TraceType.USER_DELETED,
      `Borrado por lotes: ${count} usuarios eliminados por ${actor.email}`,
      actor,
    );
    return { deleted: count };
  }

  private async ensureExists(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}
