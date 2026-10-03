import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

describe('OptionalJwtAuthGuard.handleRequest', () => {
  const guard = new OptionalJwtAuthGuard();

  it('returns the user when the token is valid', () => {
    const user = { id: 'u1' };
    expect(guard.handleRequest(null, user)).toBe(user);
  });

  it('returns null (anonymous) when there is no user, without throwing', () => {
    expect(guard.handleRequest(null, null)).toBeNull();
    expect(guard.handleRequest(new Error('no token'), undefined)).toBeNull();
  });
});
