import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // El JWT es stateless: el endpoint solo deja la traza de cierre de sesión
  // para la auditoría (el cliente descarta el token).
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: AuthUser) {
    return this.auth.logout(user);
  }

  // Registro/login con Google (requiere GOOGLE_CLIENT_ID configurado).
  @Post('google')
  google(@Body() dto: GoogleAuthDto) {
    return this.auth.googleAuth(dto);
  }

  // El Client ID de Google no es secreto: el frontend lo pide en runtime
  // para configurarlo en un solo lugar (el API) sin rebuilds del web.
  @Get('google-client')
  googleClient() {
    return { clientId: process.env.GOOGLE_CLIENT_ID || null };
  }

  // Verifica el correo con el token del enlace (público).
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  // Envía el enlace de restablecimiento (público; sin revelar si existe).
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  // Cambia la contraseña con el token del enlace (público).
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }

  // Reenvía el correo de verificación al usuario autenticado.
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  resend(@CurrentUser() user: AuthUser) {
    return this.auth.resendVerification(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}
