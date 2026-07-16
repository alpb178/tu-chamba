import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { TracesService } from '../traces/traces.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { TraceResult, TraceType, User } from '@prisma/client';

const VERIF_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

// Payload relevante del ID token de Google (endpoint tokeninfo).
interface GoogleTokenInfo {
  aud: string;
  sub: string;
  email: string;
  email_verified: string | boolean;
  name?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
    private traces: TracesService,
  ) {}

  // Crea un token de verificación y envía el correo (o lo registra en dev).
  private async enviarVerificacion(user: User) {
    await this.prisma.verificationToken.deleteMany({ where: { userId: user.id } });
    const token = randomBytes(32).toString('hex');
    await this.prisma.verificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + VERIF_TTL_MS),
      },
    });
    const base = process.env.WEB_URL ?? 'http://localhost:3000';
    await this.mail.sendVerification(
      user.email,
      user.name,
      `${base}/verify?token=${token}`,
    );
  }

  // hasPassword: el perfil distingue "cambiar" (cuentas con contraseña)
  // de "definir" (cuentas creadas con Google, sin contraseña local).
  private sanitize(user: User) {
    const { password, ...rest } = user;
    return { ...rest, hasPassword: Boolean(password) };
  }

  private sign(user: User) {
    return this.jwt.sign({
      sub: user.id,
      email: user.email,
    });
  }

  private session(user: User) {
    return { accessToken: this.sign(user), user: this.sanitize(user) };
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('El correo ya está registrado');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        name: dto.name,
        phone: dto.phone?.trim() || null,
      },
    });

    await this.enviarVerificacion(user);
    await this.traces.record(
      TraceType.REGISTER,
      `Nuevo usuario registrado: ${user.email}`,
      user,
    );
    return this.session(user);
  }

  // Verifica el correo a partir del token del enlace.
  async verifyEmail(token: string) {
    const vt = await this.prisma.verificationToken.findUnique({
      where: { token },
    });
    if (!vt || vt.expiresAt < new Date()) {
      throw new BadRequestException('El enlace de verificación no es válido o expiró');
    }
    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: vt.userId },
        data: { emailVerified: true },
      }),
      this.prisma.verificationToken.deleteMany({ where: { userId: vt.userId } }),
    ]);
    await this.traces.record(
      TraceType.EMAIL_VERIFIED,
      `Correo verificado: ${user.email}`,
      user,
    );
    return { verified: true };
  }

  // Reenvía el correo de verificación al usuario autenticado.
  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    if (user.emailVerified) {
      throw new BadRequestException('Tu correo ya está verificado');
    }
    await this.enviarVerificacion(user);
    return { sent: true };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      await this.failedLogin(dto.email);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Cuentas creadas con Google no tienen contraseña local.
    if (!user.password) {
      throw new UnauthorizedException(
        'Esta cuenta usa Google para iniciar sesión',
      );
    }

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) {
      await this.failedLogin(dto.email, user.id);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.traces.record(
      TraceType.LOGIN,
      `Inicio de sesión de ${user.email}`,
      user,
      { resource: `user:${user.id}` },
    );
    return this.session(user);
  }

  // Cierre de sesión: el JWT es stateless, solo queda la traza de auditoría.
  async logout(user: { id: string; email: string }) {
    await this.traces.record(
      TraceType.LOGOUT,
      `Cierre de sesión de ${user.email}`,
      user,
      { resource: `user:${user.id}` },
    );
    return { ok: true };
  }

  // Intento de inicio de sesión fallido (usuario inexistente o contraseña
  // incorrecta): queda auditado con resultado ERROR, junto a IP y navegador.
  private async failedLogin(email: string, userId?: string) {
    await this.traces.record(
      TraceType.LOGIN,
      `Intento de inicio de sesión fallido para ${email}`,
      { id: userId ?? null, email },
      { result: TraceResult.ERROR },
    );
  }

  // Registro/login con Google: si el correo no existe, la cuenta se crea
  // directamente (el teléfono es opcional y se completa desde el perfil).
  async googleAuth(dto: GoogleAuthDto) {
    const payload = await this.verifyGoogleToken(dto.idToken);

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: payload.sub }, { email: payload.email }] },
    });

    if (user) {
      // Vincula la cuenta Google a un usuario existente con el mismo correo.
      // Google ya verificó ese correo (validado en verifyGoogleToken), así
      // que la cuenta queda verificada aunque no hubiera confirmado el suyo.
      if (!user.googleId || !user.emailVerified) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: user.googleId ?? payload.sub, emailVerified: true },
        });
      }
      await this.traces.record(
        TraceType.LOGIN,
        `Inicio de sesión con Google de ${user.email}`,
        user,
      );
      return this.session(user);
    }

    user = await this.prisma.user.create({
      data: {
        email: payload.email,
        password: null,
        name: payload.name || payload.email.split('@')[0],
        googleId: payload.sub,
        // Google ya verificó el correo (validado en verifyGoogleToken).
        emailVerified: true,
      },
    });
    await this.traces.record(
      TraceType.REGISTER,
      `Nuevo usuario registrado con Google: ${user.email}`,
      user,
    );
    return this.session(user);
  }

  private async verifyGoogleToken(idToken: string): Promise<GoogleTokenInfo> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new ServiceUnavailableException(
        'El inicio de sesión con Google no está configurado',
      );
    }

    let payload: GoogleTokenInfo;
    try {
      const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      );
      if (!res.ok) throw new Error(`tokeninfo ${res.status}`);
      payload = (await res.json()) as GoogleTokenInfo;
    } catch {
      throw new UnauthorizedException('Token de Google inválido');
    }

    if (payload.aud !== clientId) {
      throw new UnauthorizedException('Token de Google inválido');
    }
    if (payload.email_verified !== 'true' && payload.email_verified !== true) {
      throw new BadRequestException('El correo de Google no está verificado');
    }
    return payload;
  }

  // Restablecimiento de contraseña: siempre responde {sent:true} para no
  // revelar qué correos están registrados.
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { sent: true };

    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });
    const token = randomBytes(32).toString('hex');
    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    });
    const base = process.env.WEB_URL ?? 'http://localhost:3000';
    await this.mail.sendPasswordReset(
      user.email,
      user.name,
      `${base}/reset-password?token=${token}`,
    );
    return { sent: true };
  }

  // Cambia la contraseña con el token del correo. Probar la propiedad del
  // correo también verifica la cuenta.
  async resetPassword(token: string, password: string) {
    const rt = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });
    if (!rt || rt.expiresAt < new Date()) {
      throw new BadRequestException(
        'El enlace de restablecimiento no es válido o expiró',
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: rt.userId },
        data: { password: hashed, emailVerified: true },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: { userId: rt.userId },
      }),
    ]);
    return { reset: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }
}
