import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

// Admin panel access: requires a session (JwtAuthGuard first) and the
// isAdmin flag. It is the only distinction between users: business
// permissions depend only on resource ownership.
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
