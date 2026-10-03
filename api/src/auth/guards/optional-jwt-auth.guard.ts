import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Optional authentication: with a valid token it populates request.user;
// otherwise it lets the request through as anonymous (no 401). Used on public
// routes that show more data to signed-in users.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Always allows continuing; the real outcome is resolved in handleRequest.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      /* no token or invalid token: continue as anonymous */
    }
    return true;
  }

  // Don't throw when there is no user; return null for anonymous.
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user || (null as TUser);
  }
}
