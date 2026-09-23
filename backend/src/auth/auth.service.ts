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

// Relevant payload of the Google ID token (tokeninfo endpoint).
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

  // Creates a verification token and sends the email (or logs it in dev).
  private async sendVerification(user: User) {
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

  // hasPassword: the profile tells "cambiar" (accounts with a password)
  // apart from "definir" (accounts created with Google, no local password).
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

    await this.sendVerification(user);
    await this.traces.record(
      TraceType.REGISTER,
      `Nuevo usuario registrado: ${user.email}`,
      user,
    );
    return this.session(user);
  }

  // Verifies the email from the link token.
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

  // Resends the verification email to the authenticated user.
  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    if (user.emailVerified) {
      throw new BadRequestException('Tu correo ya está verificado');
    }
    await this.sendVerification(user);
    return { sent: true };
  }

  async login(dto: LoginDto) {
    const identifier = (dto.identifier ?? dto.email ?? '').trim();
    const user = await this.findByIdentifier(identifier);
    if (!user) {
      await this.failedLogin(identifier);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Accounts created with Google have no local password.
    if (!user.password) {
      throw new UnauthorizedException(
        'Esta cuenta usa Google para iniciar sesión',
      );
    }

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) {
      await this.failedLogin(user.email, user.id);
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

  // Finds the account by email or, if the text doesn't look like an email, by
  // username (case-insensitive). The name is not unique: if more than one
  // account has that name, the user is asked to use the email.
  private async findByIdentifier(identifier: string) {
    if (!identifier) return null;
    if (identifier.includes('@')) {
      return this.prisma.user.findUnique({ where: { email: identifier } });
    }
    const matches = await this.prisma.user.findMany({
      where: { name: { equals: identifier, mode: 'insensitive' } },
      take: 2,
    });
    if (matches.length > 1) {
      throw new UnauthorizedException(
        'Hay más de una cuenta con ese nombre; inicia sesión con tu correo',
      );
    }
    return matches[0] ?? null;
  }

  // Logout: the JWT is stateless, only the audit trace is recorded.
  async logout(user: { id: string; email: string }) {
    await this.traces.record(
      TraceType.LOGOUT,
      `Cierre de sesión de ${user.email}`,
      user,
      { resource: `user:${user.id}` },
    );
    return { ok: true };
  }

  // Failed login attempt (unknown user or wrong password): audited with
  // result ERROR, along with IP and browser.
  private async failedLogin(email: string, userId?: string) {
    await this.traces.record(
      TraceType.LOGIN,
      `Intento de inicio de sesión fallido para ${email}`,
      { id: userId ?? null, email },
      { result: TraceResult.ERROR },
    );
  }

  // Sign-up/login with Google: if the email doesn't exist, the account is
  // created directly (the phone is optional and filled in from the profile).
  async googleAuth(dto: GoogleAuthDto) {
    const payload = await this.verifyGoogleToken(dto.idToken);

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: payload.sub }, { email: payload.email }] },
    });

    if (user) {
      // Links the Google account to an existing user with the same email.
      // Google already verified that email (checked in verifyGoogleToken), so
      // the account becomes verified even if the user never confirmed it.
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
        // Google already verified the email (checked in verifyGoogleToken).
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

  // Password reset: always responds {sent:true} so as not to reveal
  // which emails are registered.
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

  // Changes the password with the emailed token. Proving ownership of the
  // email also verifies the account.
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
