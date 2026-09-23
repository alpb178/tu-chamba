import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

// Minimal mocks of the service dependencies.
function buildService() {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    verificationToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    passwordResetToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn().mockResolvedValue([]),
  };
  const jwt = { sign: jest.fn().mockReturnValue('token') };
  const mail = { sendVerification: jest.fn(), sendPasswordReset: jest.fn() };
  const traces = { record: jest.fn() };
  const service = new AuthService(
    prisma as never,
    jwt as never,
    mail as never,
    traces as never,
  );
  return { service, prisma, jwt, mail, traces };
}

const baseUser = {
  id: 'u1',
  email: 'ana@test.com',
  emailVerified: false,
  password: 'hash',
  name: 'Ana',
  phone: null,
  googleId: null,
  isAdmin: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService.register', () => {
  it('creates the account without a role and returns a session without password', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ ...baseUser });

    const res = await service.register({
      email: 'ana@test.com',
      password: 'secret123',
      name: 'Ana',
    });

    const data = prisma.user.create.mock.calls[0][0].data;
    expect(data).not.toHaveProperty('role');
    expect(data.phone).toBeNull();
    expect(res.accessToken).toBe('token');
    expect(res.user).not.toHaveProperty('password');
  });

  it('rejects already registered emails', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(baseUser);

    await expect(
      service.register({
        email: 'ana@test.com',
        password: 'secret123',
        name: 'Ana',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('AuthService.login', () => {
  it('signs in with valid credentials', async () => {
    const { service, prisma } = buildService();
    const hash = await bcrypt.hash('secret123', 4);
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, password: hash });

    const res = await service.login({
      email: 'ana@test.com',
      password: 'secret123',
    });
    expect(res.user.email).toBe('ana@test.com');
  });

  it('rejects a wrong password', async () => {
    const { service, prisma } = buildService();
    const hash = await bcrypt.hash('secret123', 4);
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, password: hash });

    await expect(
      service.login({ email: 'ana@test.com', password: 'otra' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects Google accounts without a local password', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, password: null });

    await expect(
      service.login({ email: 'ana@test.com', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('AuthService.login by identifier (username or email)', () => {
  it('with @ looks up by email (findUnique)', async () => {
    const { service, prisma } = buildService();
    const hash = await bcrypt.hash('secret123', 4);
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, password: hash });

    await service.login({ identifier: 'ana@test.com', password: 'secret123' });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'ana@test.com' },
    });
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('without @ looks up by name case-insensitively', async () => {
    const { service, prisma } = buildService();
    const hash = await bcrypt.hash('secret123', 4);
    prisma.user.findMany.mockResolvedValue([{ ...baseUser, password: hash }]);

    const res = await service.login({ identifier: 'Ana', password: 'secret123' });
    expect(res.user.email).toBe('ana@test.com');
    expect(prisma.user.findMany.mock.calls[0][0].where).toEqual({
      name: { equals: 'Ana', mode: 'insensitive' },
    });
  });

  it('ambiguous name (2+ accounts) asks to use the email', async () => {
    const { service, prisma } = buildService();
    prisma.user.findMany.mockResolvedValue([
      { ...baseUser, id: 'a' },
      { ...baseUser, id: 'b' },
    ]);
    await expect(
      service.login({ identifier: 'Ana', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('nonexistent user: invalid credentials (401) and failure trace', async () => {
    const { service, prisma, traces } = buildService();
    prisma.user.findMany.mockResolvedValue([]);
    await expect(
      service.login({ identifier: 'ghost', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(traces.record).toHaveBeenCalled();
  });
});

describe('AuthService.googleAuth', () => {
  const OLD_ENV = process.env.GOOGLE_CLIENT_ID;

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'client-id-test';
    // Google tokeninfo: valid token for ana@test.com.
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        aud: 'client-id-test',
        sub: 'google-sub-1',
        email: 'ana@test.com',
        email_verified: 'true',
        name: 'Ana',
      }),
    }) as never;
  });

  afterAll(() => {
    process.env.GOOGLE_CLIENT_ID = OLD_ENV;
  });

  it('the new account is created automatically verified', async () => {
    const { service, prisma } = buildService();
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      ...baseUser,
      googleId: 'google-sub-1',
      emailVerified: true,
    });

    await service.googleAuth({ idToken: 'tok' });
    expect(prisma.user.create.mock.calls[0][0].data.emailVerified).toBe(true);
  });

  it('linking Google to an unverified account verifies it', async () => {
    const { service, prisma } = buildService();
    prisma.user.findFirst.mockResolvedValue({
      ...baseUser,
      emailVerified: false,
      googleId: null,
    });
    prisma.user.update.mockResolvedValue({
      ...baseUser,
      googleId: 'google-sub-1',
      emailVerified: true,
    });

    await service.googleAuth({ idToken: 'tok' });
    expect(prisma.user.update.mock.calls[0][0].data).toEqual({
      googleId: 'google-sub-1',
      emailVerified: true,
    });
  });

  it('an already linked and verified account is not rewritten', async () => {
    const { service, prisma } = buildService();
    prisma.user.findFirst.mockResolvedValue({
      ...baseUser,
      emailVerified: true,
      googleId: 'google-sub-1',
    });

    await service.googleAuth({ idToken: 'tok' });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

describe('AuthService.forgotPassword / resetPassword', () => {
  it('with an unregistered email responds sent without sending anything', async () => {
    const { service, prisma, mail } = buildService();
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await service.forgotPassword('nobody@test.com');
    expect(res).toEqual({ sent: true });
    expect(mail.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('with a registered email creates the token and sends the link', async () => {
    const { service, prisma, mail } = buildService();
    prisma.user.findUnique.mockResolvedValue(baseUser);
    prisma.passwordResetToken.create.mockResolvedValue({ id: 't1' });

    const res = await service.forgotPassword('ana@test.com');
    expect(res).toEqual({ sent: true });
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
    });
    expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    expect(mail.sendPasswordReset).toHaveBeenCalledWith(
      'ana@test.com',
      'Ana',
      expect.stringContaining('/reset-password?token='),
    );
  });

  it('invalid or expired token → 400', async () => {
    const { service, prisma } = buildService();
    prisma.passwordResetToken.findUnique.mockResolvedValue(null);
    await expect(
      service.resetPassword('nope', 'nueva123'),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.passwordResetToken.findUnique.mockResolvedValue({
      userId: 'u1',
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(
      service.resetPassword('old', 'nueva123'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('valid token changes the password and verifies the account', async () => {
    const { service, prisma } = buildService();
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      userId: 'u1',
      expiresAt: new Date(Date.now() + 1000),
    });

    const res = await service.resetPassword('tok', 'nueva123');
    expect(res).toEqual({ reset: true });
    const data = prisma.user.update.mock.calls[0][0].data;
    expect(data.emailVerified).toBe(true);
    expect(await bcrypt.compare('nueva123', data.password)).toBe(true);
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
    });
  });
});
