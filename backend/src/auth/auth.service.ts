import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { User } from '@prisma/client';

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
  ) {}

  private sanitize(user: User) {
    const { password, ...rest } = user;
    return rest;
  }

  private sign(user: User) {
    return this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
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
        nombre: dto.nombre,
        telefono: dto.telefono?.trim() || null,
        role: dto.role,
      },
    });

    return this.session(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    // Cuentas creadas con Google no tienen contraseña local.
    if (!user.password) {
      throw new UnauthorizedException(
        'Esta cuenta usa Google para iniciar sesión',
      );
    }

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    return this.session(user);
  }

  // Registro/login con Google. Si el correo no existe aún, el frontend debe
  // reintentar con role (+ telefono si EMPLEADOR): respondemos needsProfile.
  async googleAuth(dto: GoogleAuthDto) {
    const payload = await this.verifyGoogleToken(dto.idToken);

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: payload.sub }, { email: payload.email }] },
    });

    if (user) {
      // Vincula la cuenta Google a un usuario existente con el mismo correo.
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: payload.sub },
        });
      }
      return this.session(user);
    }

    if (!dto.role) {
      return {
        needsProfile: true,
        email: payload.email,
        nombre: payload.name ?? '',
      };
    }

    user = await this.prisma.user.create({
      data: {
        email: payload.email,
        password: null,
        nombre: payload.name || payload.email.split('@')[0],
        telefono: dto.telefono?.trim() || null,
        googleId: payload.sub,
        role: dto.role,
      },
    });
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

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }
}
