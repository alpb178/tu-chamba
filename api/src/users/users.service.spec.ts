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
  it('updates the name and phone of the user themselves', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.user.update.mockResolvedValue({ id: 'u1' });

    await service.updateProfile('u1', { name: ' Ana María ', phone: '7000' });
    const call = prisma.user.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: 'u1' });
    expect(call.data.name).toBe('Ana María');
    expect(call.data.phone).toBe('7000');
  });

  it('empty phone is saved as null (removes it)', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    prisma.user.update.mockResolvedValue({ id: 'u1' });

    await service.updateProfile('u1', { phone: '  ' });
    const call = prisma.user.update.mock.calls[0][0];
    expect(call.data.phone).toBeNull();
    expect(call.data).not.toHaveProperty('name');
  });

  it('changes the password after verifying the current one', async () => {
    const { service, prisma } = buildService();
    const oldHash = await bcrypt.hash('oldpw123', 4);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', password: oldHash });
    prisma.user.update.mockResolvedValue({ id: 'u1' });

    await service.updateProfile('u1', {
      currentPassword: 'oldpw123',
      password: 'newpw123',
    });
    const data = prisma.user.update.mock.calls[0][0].data;
    expect(await bcrypt.compare('newpw123', data.password)).toBe(true);
  });

  it('rejects the change with a wrong current password', async () => {
    const { service, prisma } = buildService();
    const oldHash = await bcrypt.hash('oldpw123', 4);
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', password: oldHash });

    await expect(
      service.updateProfile('u1', {
        currentPassword: 'wrongpass',
        password: 'newpw123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('Google accounts (no password) set one without the current one', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', password: null });
    prisma.user.update.mockResolvedValue({ id: 'u1' });

    await service.updateProfile('u1', { password: 'newpw123' });
    const data = prisma.user.update.mock.calls[0][0].data;
    expect(await bcrypt.compare('newpw123', data.password)).toBe(true);
  });
});

describe('UsersService.setAdmin', () => {
  it('grants and revokes the isAdmin flag', async () => {
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
  it('creates the account with isAdmin and a verified email', async () => {
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
  it('fails if the user does not exist', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.adminUpdate('u1', { name: 'New' }, actor),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects changing to an email already registered by another account', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'u1', email: 'old@t.com' }) // ensureExists
      .mockResolvedValueOnce({ id: 'other' }); // email taken
    await expect(
      service.adminUpdate('u1', { email: 'taken@t.com' }, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updates name, email and phone, and records a USER_UPDATED trace', async () => {
    const { service, prisma, traces } = buildService();
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'u1', email: 'old@t.com' }) // ensureExists
      .mockResolvedValueOnce(null); // new email is free
    prisma.user.update.mockResolvedValue({ id: 'u1' });

    await service.adminUpdate(
      'u1',
      { name: '  Ana  ', email: 'ana@t.com', phone: '  ' },
      actor,
    );
    const data = prisma.user.update.mock.calls[0][0].data;
    expect(data.name).toBe('Ana');
    expect(data.email).toBe('ana@t.com');
    expect(data.phone).toBeNull(); // empty phone -> null
    expect(traces.record).toHaveBeenCalledWith(
      TraceType.USER_UPDATED,
      expect.any(String),
      actor,
      { resource: 'user:u1' },
    );
  });
});

describe('UsersService.createAdmin', () => {
  it('rejects an already registered email', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ id: 'x' });
    await expect(
      service.createAdmin({ email: 'a@t.com', password: 'secret1' }, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('uses the given name as the username', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'a1', email: 'a@t.com' });
    await service.createAdmin(
      { email: 'a@t.com', password: 'secret1', name: 'support' },
      actor,
    );
    expect(prisma.user.create.mock.calls[0][0].data.name).toBe('support');
  });

  it('without name, the username comes from the email prefix', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'a1', email: 'new-admin@t.com' });
    await service.createAdmin(
      { email: 'new-admin@t.com', password: 'secret1' },
      actor,
    );
    expect(prisma.user.create.mock.calls[0][0].data.name).toBe('new-admin');
  });
});

describe('UsersService.removeMany / removeAllClients', () => {
  it('removeMany never deletes the actor from the batch', async () => {
    const { service, prisma } = buildService();
    prisma.user.deleteMany.mockResolvedValue({ count: 2 });
    await service.removeMany(['u1', 'u2', actor.id], actor);
    // The actor's id is filtered out of the batch.
    expect(prisma.user.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['u1', 'u2'] } },
    });
  });

  it('removeAllClients deletes only non-admins with a summary trace', async () => {
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
