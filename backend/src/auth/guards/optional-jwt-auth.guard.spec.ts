import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

describe('OptionalJwtAuthGuard.handleRequest', () => {
  const guard = new OptionalJwtAuthGuard();

  it('devuelve el usuario cuando hay token válido', () => {
    const user = { id: 'u1' };
    expect(guard.handleRequest(null, user)).toBe(user);
  });

  it('devuelve null (anónimo) cuando no hay usuario, sin lanzar', () => {
    expect(guard.handleRequest(null, null)).toBeNull();
    expect(guard.handleRequest(new Error('sin token'), undefined)).toBeNull();
  });
});
