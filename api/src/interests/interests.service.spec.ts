import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { InterestsService } from './interests.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';

function buildService() {
  const prisma = {
    ad: { findUnique: jest.fn() },
    interest: {
      create: jest.fn(),
      update: jest.fn(),
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
const ad = { id: 'a1', createdById: 'owner1', description: 'Test' };

describe('InterestsService.register', () => {
  it('viewing the detail records the interest WITHOUT notifying', async () => {
    const { service, prisma, notifications } = buildService();
    prisma.ad.findUnique.mockResolvedValue(ad);
    prisma.interest.findUnique.mockResolvedValue(null);
    prisma.interest.create.mockResolvedValue({ id: 'i1' });

    const res = await service.register('a1', user);
    expect(res.interested).toBe(true);
    expect(prisma.interest.create.mock.calls[0][0].data.contacted).toBe(false);
    expect(notifications.notifyInterest).not.toHaveBeenCalled();
  });

  it('contacting first creates a contacted interest and notifies', async () => {
    const { service, prisma, notifications } = buildService();
    prisma.ad.findUnique.mockResolvedValue(ad);
    prisma.interest.findUnique.mockResolvedValue(null);
    prisma.interest.create.mockResolvedValue({ id: 'i1' });

    const res = await service.register('a1', user, true);
    expect(res.interested).toBe(true);
    expect(prisma.interest.create.mock.calls[0][0].data.contacted).toBe(true);
    expect(notifications.notifyInterest).toHaveBeenCalledWith(ad, 'u2');
  });

  it('contacting after viewing notifies only once (transition)', async () => {
    const { service, prisma, notifications } = buildService();
    prisma.ad.findUnique.mockResolvedValue(ad);
    prisma.interest.findUnique.mockResolvedValue({
      id: 'i1',
      contacted: false,
    });

    await service.register('a1', user, true);
    expect(prisma.interest.update).toHaveBeenCalledWith({
      where: { id: 'i1' },
      data: { contacted: true },
    });
    expect(notifications.notifyInterest).toHaveBeenCalledTimes(1);
  });

  it('contacting again does not notify again', async () => {
    const { service, prisma, notifications } = buildService();
    prisma.ad.findUnique.mockResolvedValue(ad);
    prisma.interest.findUnique.mockResolvedValue({
      id: 'i1',
      contacted: true,
    });

    const res = await service.register('a1', user, true);
    expect(res.interested).toBe(true);
    expect(prisma.interest.update).not.toHaveBeenCalled();
    expect(notifications.notifyInterest).not.toHaveBeenCalled();
  });

  it('revisiting does not duplicate (P2002 race tolerated)', async () => {
    const { service, prisma, notifications } = buildService();
    prisma.ad.findUnique.mockResolvedValue(ad);
    prisma.interest.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'i1', contacted: false });
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

  it('ignores interest in the own listing', async () => {
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

  it('nonexistent listing → 404', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(null);

    await expect(service.register('nope', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('InterestsService.remove / status', () => {
  it('remove deletes only the own interest in that listing', async () => {
    const { service, prisma } = buildService();
    prisma.interest.deleteMany.mockResolvedValue({ count: 1 });

    await service.remove('a1', 'u2');
    expect(prisma.interest.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u2', adId: 'a1' },
    });
  });

  it('status reflects whether interest was already shown', async () => {
    const { service, prisma } = buildService();
    prisma.interest.findUnique.mockResolvedValue({ id: 'i1' });
    expect((await service.status('a1', 'u2')).interested).toBe(true);

    prisma.interest.findUnique.mockResolvedValue(null);
    expect((await service.status('a1', 'u2')).interested).toBe(false);
  });
});
