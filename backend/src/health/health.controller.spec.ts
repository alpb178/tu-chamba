import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reporta database ok cuando la consulta responde', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    const res = await new HealthController(prisma as never).check();
    expect(res).toMatchObject({ status: 'ok', database: 'ok' });
    expect(typeof res.uptime).toBe('number');
  });

  it('reporta database down si la consulta falla (sin lanzar)', async () => {
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(new Error('down')) };
    const res = await new HealthController(prisma as never).check();
    expect(res).toMatchObject({ status: 'ok', database: 'down' });
  });
});
