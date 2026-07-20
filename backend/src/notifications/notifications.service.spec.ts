import { NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from './notifications.service';

function build() {
  const prisma = {
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      createMany: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    jobAlert: { findMany: jest.fn() },
  };
  return { service: new NotificationsService(prisma as never), prisma };
}
const user = { id: 'u1', email: 'u@t.com', isAdmin: false };

describe('NotificationsService.findMine / markRead / markAllRead', () => {
  it('findMine devuelve items y conteo de no leídas', async () => {
    const { service, prisma } = build();
    prisma.notification.findMany.mockResolvedValue([{ id: 'n1' }]);
    prisma.notification.count.mockResolvedValue(2);
    const res = await service.findMine(user);
    expect(res).toEqual({ items: [{ id: 'n1' }], unread: 2 });
  });

  it('markRead falla si la notificación es de otro usuario', async () => {
    const { service, prisma } = build();
    prisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'otro' });
    await expect(service.markRead('n1', 'u1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('markRead marca la propia como leída', async () => {
    const { service, prisma } = build();
    prisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'u1' });
    prisma.notification.update.mockResolvedValue({ id: 'n1', read: true });
    await service.markRead('n1', 'u1');
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'n1' },
      data: { read: true },
    });
  });

  it('markAllRead marca todas las no leídas del usuario', () => {
    const { service, prisma } = build();
    service.markAllRead('u1');
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', read: false },
      data: { read: true },
    });
  });
});

describe('NotificationsService.notify*', () => {
  it('notifyInterest avisa al dueño con el nombre del interesado', async () => {
    const { service, prisma } = build();
    prisma.user.findUnique.mockResolvedValue({ name: 'Ana' });
    await service.notifyInterest(
      { id: 'a1', description: 'Vendedor', createdById: 'owner' } as never,
      'u2',
    );
    const data = prisma.notification.create.mock.calls[0][0].data;
    expect(data.type).toBe(NotificationType.CHAT_INICIADO);
    expect(data.userId).toBe('owner');
    expect(data.message).toContain('Ana');
  });

  it('notifyReview avisa al calificado', async () => {
    const { service, prisma } = build();
    await service.notifyReview(
      { ownerId: 'owner', rating: 5, comment: 'Excelente' } as never,
      'Ana',
    );
    const data = prisma.notification.create.mock.calls[0][0].data;
    expect(data.type).toBe(NotificationType.NUEVA_REVIEW);
    expect(data.userId).toBe('owner');
    expect(data.message).toContain('5★');
  });

  it('notifyNewAd notifica a los suscriptores coincidentes (sin duplicar)', async () => {
    const { service, prisma } = build();
    prisma.jobAlert.findMany.mockResolvedValue([
      { userId: 'x' },
      { userId: 'y' },
      { userId: 'x' }, // duplicado -> una sola notificación
    ]);
    await service.notifyNewAd({
      id: 'a1',
      description: 'Vendedor',
      location: 'La Paz',
      createdById: 'owner',
    } as never);
    const rows = prisma.notification.createMany.mock.calls[0][0].data;
    expect(rows).toHaveLength(2);
    expect(rows.map((r: { userId: string }) => r.userId).sort()).toEqual(['x', 'y']);
  });

  it('notifyNewAd no crea nada si no hay suscriptores', async () => {
    const { service, prisma } = build();
    prisma.jobAlert.findMany.mockResolvedValue([]);
    await service.notifyNewAd({ id: 'a1', description: 'x', createdById: 'o' } as never);
    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });
});
