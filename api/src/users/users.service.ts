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

  async findAll() {
    const users = await this.prisma.user.findMany({
      // googleId is only used to derive the sign-up method; it is not exposed
      // raw to the panel.
      select: { ...selectSafe, googleId: true, _count: { select: { ads: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return users.map(({ googleId, ...u }) => ({
      ...u,
      // 'google' = account created with Google (no local password);
      // 'email' = sign-up with email and password.
      provider: googleId ? 'google' : 'email',
    }));
  }

  // Own profile: personal data and, optionally, the password.
  // If a password exists the current one is required; Google accounts
  // (no local password) can set one directly.
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

  // Editing a user's data from the admin panel.
  async adminUpdate(id: string, dto: UpdateUserDto, actor: AuthUser) {
    const user = await this.ensureExists(id);

    if (dto.email && dto.email !== user.email) {
      const taken = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });
      if (taken) throw new ConflictException('El correo ya está registrado');
    }

    // Password change from the panel: local accounts only. Google accounts
    // have no local password, so setting one is not allowed.
    let hashed: string | undefined;
    if (dto.password) {
      if (user.googleId) {
        throw new BadRequestException(
          'Las cuentas de Google no usan contraseña local',
        );
      }
      hashed = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name != null ? { name: dto.name.trim() } : {}),
        ...(dto.email != null ? { email: dto.email.trim() } : {}),
        ...(dto.phone != null ? { phone: dto.phone.trim() || null } : {}),
        ...(hashed ? { password: hashed } : {}),
      },
      select: selectSafe,
    });
    await this.traces.record(
      TraceType.USER_UPDATED,
      `Usuario ${user.email} editado por ${actor.email}${
        hashed ? ' (contraseña actualizada)' : ''
      }`,
      actor,
      { resource: `user:${id}` },
    );
    return updated;
  }

  // Creating an administrator from the panel (email and password only).
  async createAdmin(dto: CreateAdminDto, actor: AuthUser) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('El correo ya está registrado');

    const admin = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: await bcrypt.hash(dto.password, 10),
        // The username is used to log in; if not given, derived from the email.
        name: dto.name?.trim() || dto.email.split('@')[0],
        isAdmin: true,
        // Account created by a trusted admin: no verification required.
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

  // Grants or revokes access to the admin panel.
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

  // Deletes all registered users. Administrators are kept on purpose:
  // they are only deleted one at a time or in batches.
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

  // Batch deletion from the panel, with a single summary trace. The actor
  // cannot delete themselves in the batch (avoids losing their session).
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
