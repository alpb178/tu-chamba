import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy.validate', () => {
  it('returns the minimal identity of the token user', async () => {
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
    // Only id/email/isAdmin (never the password).
    expect(res).toEqual({ id: 'u1', email: 'u@t.com', isAdmin: true });
  });

  it('rejects a token whose user no longer exists', async () => {
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue(null) } };
    const strategy = new JwtStrategy(prisma as never);
    await expect(
      strategy.validate({ sub: 'x', email: 'x@t.com' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
