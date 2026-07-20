import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy.validate', () => {
  it('devuelve la identidad mínima del usuario del token', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'u1',
          email: 'u@t.com',
          isAdmin: true,
          password: 'secreto',
        }),
      },
    };
    const strategy = new JwtStrategy(prisma as never);
    const res = await strategy.validate({ sub: 'u1', email: 'u@t.com' });
    // Solo id/email/isAdmin (nunca la contraseña).
    expect(res).toEqual({ id: 'u1', email: 'u@t.com', isAdmin: true });
  });

  it('rechaza un token cuyo usuario ya no existe', async () => {
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue(null) } };
    const strategy = new JwtStrategy(prisma as never);
    await expect(
      strategy.validate({ sub: 'x', email: 'x@t.com' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
