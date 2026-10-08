import { ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

function ctxWith(user: unknown) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as never;
}

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('lets an admin through', () => {
    expect(guard.canActivate(ctxWith({ id: 'a', isAdmin: true }))).toBe(true);
  });

  it('blocks a user without isAdmin', () => {
    expect(() => guard.canActivate(ctxWith({ id: 'u', isAdmin: false }))).toThrow(
      ForbiddenException,
    );
  });

  it('blocks when there is no user (not logged in)', () => {
    expect(() => guard.canActivate(ctxWith(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
