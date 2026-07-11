import { UsersService } from './users.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';

function buildService() {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const traces = { record: jest.fn() };
  const service = new UsersService(prisma as never, traces as never);
  return { service, prisma, traces };
}

const actor: AuthUser = { id: 'adm', email: 'admin@t.com', isAdmin: true };

describe('UsersService.updateProfile', () => {
  it('actualiza nombre y teléfono del propio usuario', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.user.update.mockResolvedValue({ id: 'u1' });

    await service.updateProfile('u1', { name: ' Ana María ', phone: '7000' });
    const call = prisma.user.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: 'u1' });
    expect(call.data.name).toBe('Ana María');
    expect(call.data.phone).toBe('7000');
  });

  it('teléfono vacío se guarda como null (quitarlo)', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.user.update.mockResolvedValue({ id: 'u1' });

    await service.updateProfile('u1', { phone: '  ' });
    const call = prisma.user.update.mock.calls[0][0];
    expect(call.data.phone).toBeNull();
    expect(call.data).not.toHaveProperty('name');
  });
});

describe('UsersService.setAdmin', () => {
  it('concede y revoca el flag esAdmin', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@t.com' });
    prisma.user.update.mockResolvedValue({ id: 'u1', isAdmin: true });

    await service.setAdmin('u1', true, actor);
    expect(prisma.user.update.mock.calls[0][0].data).toEqual({
      isAdmin: true,
    });
  });
});

describe('UsersService.createAdmin', () => {
  it('crea la cuenta con isAdmin y correo verificado', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'u9', email: 'n@t.com' });

    await service.createAdmin(
      { email: 'n@t.com', password: 'secret123' },
      actor,
    );
    const data = prisma.user.create.mock.calls[0][0].data;
    expect(data.isAdmin).toBe(true);
    expect(data.emailVerified).toBe(true);
    expect(data).not.toHaveProperty('role');
  });
});
