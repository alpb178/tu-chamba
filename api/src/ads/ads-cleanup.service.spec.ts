import { AdsCleanupService } from './ads-cleanup.service';

function buildService() {
  const prisma = {
    ad: { findMany: jest.fn(), deleteMany: jest.fn() },
    notification: { createMany: jest.fn() },
    // $transaction receives the array of promises already built by the mocks.
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  };
  const traces = { record: jest.fn() };
  const metrics = { markCronRun: jest.fn() };
  const errors = { record: jest.fn() };
  const indexing = { notifyDeleted: jest.fn(), notifyUpdated: jest.fn() };
  const service = new AdsCleanupService(
    prisma as never,
    traces as never,
    metrics as never,
    errors as never,
    indexing as never,
  );
  return { service, prisma, traces, metrics, errors, indexing };
}

describe('AdsCleanupService.sweep', () => {
  it('does nothing when there are no expired listings', async () => {
    const { service, prisma, traces } = buildService();
    prisma.ad.findMany.mockResolvedValue([]);

    await expect(service.sweep()).resolves.toEqual({ deleted: 0 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(traces.record).not.toHaveBeenCalled();
  });

  it('notifies each owner and deletes the expired listings', async () => {
    const { service, prisma, traces } = buildService();
    prisma.ad.findMany.mockResolvedValue([
      { id: 'a1', description: 'Se busca vendedor', createdById: 'u1' },
      { id: 'a2', description: 'Ayudante de cocina', createdById: 'u2' },
    ]);

    await expect(service.sweep()).resolves.toEqual({ deleted: 2 });

    // Only listings whose validity period has already passed.
    const where = prisma.ad.findMany.mock.calls[0][0].where;
    expect(where.expiresAt.lte).toBeInstanceOf(Date);

    const notified = prisma.notification.createMany.mock.calls[0][0].data;
    expect(notified).toHaveLength(2);
    expect(notified[0]).toMatchObject({
      type: 'ANUNCIO_VENCIDO',
      userId: 'u1',
    });
    // No adId: the listing ceases to exist and the notification must survive.
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
