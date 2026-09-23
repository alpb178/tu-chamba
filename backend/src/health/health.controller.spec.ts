import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports database ok when the query responds', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    const res = await new HealthController(prisma as never).check();
    expect(res).toMatchObject({ status: 'ok', database: 'ok' });
    expect(typeof res.uptime).toBe('number');
  });

  it('reports database down if the query fails (without throwing)', async () => {
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(new Error('down')) };
    const res = await new HealthController(prisma as never).check();
    expect(res).toMatchObject({ status: 'ok', database: 'down' });
  });
});
