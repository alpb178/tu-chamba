import { ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

function ctxWith(user: unknown) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as never;
}

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('deja pasar a un admin', () => {
    expect(guard.canActivate(ctxWith({ id: 'a', isAdmin: true }))).toBe(true);
  });

  it('bloquea a un usuario sin isAdmin', () => {
    expect(() => guard.canActivate(ctxWith({ id: 'u', isAdmin: false }))).toThrow(
      ForbiddenException,
    );
  });

  it('bloquea si no hay usuario (sin sesión)', () => {
    expect(() => guard.canActivate(ctxWith(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
