import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

// Mocks mínimos de las dependencias del servicio.
function buildService() {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    verificationToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const jwt = { sign: jest.fn().mockReturnValue('token') };
  const mail = { sendVerification: jest.fn() };
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
  it('crea la cuenta sin rol y devuelve sesión sin password', async () => {
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

  it('rechaza correos ya registrados', async () => {
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
  it('inicia sesión con credenciales válidas', async () => {
    const { service, prisma } = buildService();
    const hash = await bcrypt.hash('secret123', 4);
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, password: hash });

    const res = await service.login({
      email: 'ana@test.com',
      password: 'secret123',
    });
    expect(res.user.email).toBe('ana@test.com');
  });

  it('rechaza contraseña incorrecta', async () => {
    const { service, prisma } = buildService();
    const hash = await bcrypt.hash('secret123', 4);
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, password: hash });

    await expect(
      service.login({ email: 'ana@test.com', password: 'otra' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza cuentas de Google sin contraseña local', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ ...baseUser, password: null });

    await expect(
      service.login({ email: 'ana@test.com', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('AuthService.googleAuth', () => {
  const OLD_ENV = process.env.GOOGLE_CLIENT_ID;

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'client-id-test';
    // tokeninfo de Google: token válido para ana@test.com.
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

  it('la cuenta nueva se crea verificada automáticamente', async () => {
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

  it('al vincular Google a una cuenta sin verificar, queda verificada', async () => {
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

  it('una cuenta ya vinculada y verificada no se re-escribe', async () => {
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
