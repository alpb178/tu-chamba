import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

// Acceso al panel de administración: requiere sesión (JwtAuthGuard antes)
// y el flag isAdmin. Es la única distinción entre usuarios: los permisos
// de negocio dependen solo de la propiedad del recurso.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user?.isAdmin) {
      throw new ForbiddenException('No tienes permiso para esta acción');
    }
    return true;
  }
}
