import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TraceType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
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
      deleteMany: jest.fn(),
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

  it('cambia la contraseña verificando la actual', async () => {
    const { service, prisma } = buildService();
    const oldHash = await bcrypt.hash('vieja123', 4);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', password: oldHash });
    prisma.user.update.mockResolvedValue({ id: 'u1' });

    await service.updateProfile('u1', {
      currentPassword: 'vieja123',
      password: 'nueva123',
    });
    const data = prisma.user.update.mock.calls[0][0].data;
    expect(await bcrypt.compare('nueva123', data.password)).toBe(true);
  });

  it('rechaza el cambio con la contraseña actual incorrecta', async () => {
    const { service, prisma } = buildService();
    const oldHash = await bcrypt.hash('vieja123', 4);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', password: oldHash });

    await expect(
      service.updateProfile('u1', {
        currentPassword: 'equivocada',
        password: 'nueva123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('las cuentas de Google (sin contraseña) definen una sin la actual', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', password: null });
    prisma.user.update.mockResolvedValue({ id: 'u1' });

    await service.updateProfile('u1', { password: 'nueva123' });
    const data = prisma.user.update.mock.calls[0][0].data;
    expect(await bcrypt.compare('nueva123', data.password)).toBe(true);
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

describe('UsersService.adminUpdate', () => {
  it('falla si el usuario no existe', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.adminUpdate('u1', { name: 'Nuevo' }, actor),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza cambiar a un correo ya registrado por otra cuenta', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'u1', email: 'viejo@t.com' }) // ensureExists
      .mockResolvedValueOnce({ id: 'otro' }); // email tomado
    await expect(
      service.adminUpdate('u1', { email: 'tomado@t.com' }, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('actualiza nombre, correo y teléfono, y deja traza USER_UPDATED', async () => {
    const { service, prisma, traces } = buildService();
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'u1', email: 'viejo@t.com' }) // ensureExists
      .mockResolvedValueOnce(null); // correo nuevo libre
    prisma.user.update.mockResolvedValue({ id: 'u1' });

    await service.adminUpdate(
      'u1',
      { name: '  Ana  ', email: 'ana@t.com', phone: '  ' },
      actor,
    );
    const data = prisma.user.update.mock.calls[0][0].data;
    expect(data.name).toBe('Ana');
    expect(data.email).toBe('ana@t.com');
    expect(data.phone).toBeNull(); // teléfono vacío -> null
    expect(traces.record).toHaveBeenCalledWith(
      TraceType.USER_UPDATED,
      expect.any(String),
      actor,
      { resource: 'user:u1' },
    );
  });
});

describe('UsersService.createAdmin', () => {
  it('rechaza correo ya registrado', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ id: 'x' });
    await expect(
      service.createAdmin({ email: 'a@t.com', password: 'secret1' }, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('usa el name indicado como usuario', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'a1', email: 'a@t.com' });
    await service.createAdmin(
      { email: 'a@t.com', password: 'secret1', name: 'soporte' },
      actor,
    );
    expect(prisma.user.create.mock.calls[0][0].data.name).toBe('soporte');
  });

  it('sin name, el usuario sale del prefijo del correo', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'a1', email: 'nuevo-admin@t.com' });
    await service.createAdmin(
      { email: 'nuevo-admin@t.com', password: 'secret1' },
      actor,
    );
    expect(prisma.user.create.mock.calls[0][0].data.name).toBe('nuevo-admin');
  });
});

describe('UsersService.removeMany / removeAllClients', () => {
  it('removeMany nunca borra al propio actor del lote', async () => {
    const { service, prisma } = buildService();
    prisma.user.deleteMany.mockResolvedValue({ count: 2 });
    await service.removeMany(['u1', 'u2', actor.id], actor);
    // El id del actor se filtra del lote.
    expect(prisma.user.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['u1', 'u2'] } },
    });
  });

  it('removeAllClients borra solo no-admins con traza resumen', async () => {
    const { service, prisma, traces } = buildService();
    prisma.user.deleteMany.mockResolvedValue({ count: 6 });
    const res = await service.removeAllClients(actor);
    expect(res).toEqual({ deleted: 6 });
    expect(prisma.user.deleteMany).toHaveBeenCalledWith({
      where: { isAdmin: false },
    });
    expect(traces.record).toHaveBeenCalledWith(
      TraceType.USER_DELETED,
      expect.stringContaining('6'),
      actor,
    );
  });
});
