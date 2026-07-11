import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InterestsService } from './interests.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';

function buildService() {
  const prisma = {
    ad: { findUnique: jest.fn() },
    interest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const notifications = { notifyInterest: jest.fn() };
  const service = new InterestsService(
    prisma as never,
    notifications as never,
  );
  return { service, prisma, notifications };
}

const user: AuthUser = { id: 'u2', email: 'b@t.com', isAdmin: false };
const ad = { id: 'a1', createdById: 'owner1', description: 'Prueba' };

describe('InterestsService.register', () => {
  it('registra el interés y notifica al dueño la primera vez', async () => {
    const { service, prisma, notifications } = buildService();
    prisma.ad.findUnique.mockResolvedValue(ad);
    prisma.interest.create.mockResolvedValue({ id: 'i1' });

    const res = await service.register('a1', user);
    expect(res.interested).toBe(true);
    expect(notifications.notifyInterest).toHaveBeenCalledWith(ad, 'u2');
  });

  it('repetir no duplica ni re-notifica (P2002)', async () => {
    const { service, prisma, notifications } = buildService();
    prisma.ad.findUnique.mockResolvedValue(ad);
    prisma.interest.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    const res = await service.register('a1', user);
    expect(res.interested).toBe(true);
    expect(notifications.notifyInterest).not.toHaveBeenCalled();
  });

  it('ignora el interés en el anuncio propio', async () => {
    const { service, prisma, notifications } = buildService();
    prisma.ad.findUnique.mockResolvedValue(ad);

    const res = await service.register('a1', {
      ...user,
      id: 'owner1',
    });
    expect(res.interested).toBe(false);
    expect(prisma.interest.create).not.toHaveBeenCalled();
    expect(notifications.notifyInterest).not.toHaveBeenCalled();
  });

  it('anuncio inexistente → 404', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(null);

    await expect(service.register('nope', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('InterestsService.remove / status', () => {
  it('quitar borra solo el interés propio sobre ese anuncio', async () => {
    const { service, prisma } = buildService();
    prisma.interest.deleteMany.mockResolvedValue({ count: 1 });

    await service.remove('a1', 'u2');
    expect(prisma.interest.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u2', adId: 'a1' },
    });
  });

  it('status refleja si ya mostró interés', async () => {
    const { service, prisma } = buildService();
    prisma.interest.findUnique.mockResolvedValue({ id: 'i1' });
    expect((await service.status('a1', 'u2')).interested).toBe(true);

    prisma.interest.findUnique.mockResolvedValue(null);
    expect((await service.status('a1', 'u2')).interested).toBe(false);
  });
});
