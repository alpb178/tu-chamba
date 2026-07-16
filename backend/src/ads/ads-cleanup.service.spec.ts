import { AdsCleanupService } from './ads-cleanup.service';

function buildService() {
  const prisma = {
    ad: { findMany: jest.fn(), deleteMany: jest.fn() },
    notification: { createMany: jest.fn() },
    // $transaction recibe el array de promesas ya construidas por los mocks.
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  };
  const traces = { record: jest.fn() };
  const service = new AdsCleanupService(prisma as never, traces as never);
  return { service, prisma, traces };
}

describe('AdsCleanupService.sweep', () => {
  it('no hace nada cuando no hay anuncios vencidos', async () => {
    const { service, prisma, traces } = buildService();
    prisma.ad.findMany.mockResolvedValue([]);

    await expect(service.sweep()).resolves.toEqual({ deleted: 0 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(traces.record).not.toHaveBeenCalled();
  });

  it('notifica a cada dueño y elimina los vencidos', async () => {
    const { service, prisma, traces } = buildService();
    prisma.ad.findMany.mockResolvedValue([
      { id: 'a1', description: 'Se busca vendedor', createdById: 'u1' },
      { id: 'a2', description: 'Ayudante de cocina', createdById: 'u2' },
    ]);

    await expect(service.sweep()).resolves.toEqual({ deleted: 2 });

    // Solo anuncios con la vigencia ya pasada.
    const where = prisma.ad.findMany.mock.calls[0][0].where;
    expect(where.expiresAt.lte).toBeInstanceOf(Date);

    const notified = prisma.notification.createMany.mock.calls[0][0].data;
    expect(notified).toHaveLength(2);
    expect(notified[0]).toMatchObject({
      type: 'ANUNCIO_VENCIDO',
      userId: 'u1',
    });
    // Sin adId: el anuncio deja de existir y la notificación debe sobrevivir.
    expect(notified[0].adId).toBeUndefined();

    expect(prisma.ad.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['a1', 'a2'] } },
    });
    expect(traces.record).toHaveBeenCalledWith(
      'AD_DELETED',
      expect.stringContaining('2 anuncios vencidos eliminados'),
      null,
    );
  });
});
