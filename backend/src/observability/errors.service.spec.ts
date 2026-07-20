import { ErrorSeverity, ErrorStatus } from '@prisma/client';
import { ErrorsService } from './errors.service';

function buildService() {
  const prisma = {
    errorLog: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const service = new ErrorsService(prisma as never);
  return { service, prisma };
}

describe('ErrorsService.record', () => {
  it('recorta el mensaje y el stack, y no propaga fallos', async () => {
    const { service, prisma } = buildService();
    await service.record('api', 'x'.repeat(2000), {
      stack: 's'.repeat(5000),
      path: '/p',
      severity: ErrorSeverity.CRITICAL,
    });
    const data = prisma.errorLog.create.mock.calls[0][0].data;
    expect(data.message).toHaveLength(1000);
    expect(data.stack).toHaveLength(4000);
    expect(data.severity).toBe(ErrorSeverity.CRITICAL);
  });

  it('es best-effort: si create lanza, no relanza', async () => {
    const { service, prisma } = buildService();
    prisma.errorLog.create.mockRejectedValue(new Error('db down'));
    await expect(service.record('api', 'boom')).resolves.toBeUndefined();
  });
});

describe('ErrorsService.findAll', () => {
  it('aplica filtros de severidad, estado, servicio y rango de fechas', async () => {
    const { service, prisma } = buildService();
    await service.findAll({
      severity: ErrorSeverity.ERROR,
      status: ErrorStatus.NEW,
      service: 'cron',
      from: '2026-07-01',
      to: '2026-07-10',
      page: 2,
      limit: 5,
    } as never);
    const args = prisma.errorLog.findMany.mock.calls[0][0];
    expect(args.where.severity).toBe(ErrorSeverity.ERROR);
    expect(args.where.status).toBe(ErrorStatus.NEW);
    expect(args.where.service).toBe('cron');
    expect(args.where.createdAt.gte).toEqual(new Date('2026-07-01'));
    expect(args.where.createdAt.lte).toEqual(new Date('2026-07-10T23:59:59.999Z'));
    expect(args.skip).toBe(5); // (2-1)*5
    expect(args.take).toBe(5);
  });

  it('devuelve totales, pendientes y paginación', async () => {
    const { service, prisma } = buildService();
    prisma.errorLog.findMany.mockResolvedValue([{ id: 'e1' }]);
    prisma.errorLog.count
      .mockResolvedValueOnce(12) // total
      .mockResolvedValueOnce(4); // pending (status NEW)
    const res = await service.findAll({ limit: 5 } as never);
    expect(res).toMatchObject({ total: 12, pending: 4, page: 1, totalPages: 3 });
  });
});

describe('ErrorsService.resolve / remove', () => {
  it('resolve marca RESOLVED', async () => {
    const { service, prisma } = buildService();
    prisma.errorLog.update.mockResolvedValue({ id: 'e1', status: 'RESOLVED' });
    await service.resolve('e1');
    expect(prisma.errorLog.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { status: ErrorStatus.RESOLVED },
    });
  });

  it('remove borra una entrada', async () => {
    const { service, prisma } = buildService();
    prisma.errorLog.delete.mockResolvedValue({});
    await expect(service.remove('e1')).resolves.toEqual({ deleted: true });
    expect(prisma.errorLog.delete).toHaveBeenCalledWith({ where: { id: 'e1' } });
  });

  it('removeMany borra por lotes', async () => {
    const { service, prisma } = buildService();
    prisma.errorLog.deleteMany.mockResolvedValue({ count: 3 });
    await expect(service.removeMany(['e1', 'e2', 'e3'])).resolves.toEqual({
      deleted: 3,
    });
    expect(prisma.errorLog.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['e1', 'e2', 'e3'] } },
    });
  });

  it('removeAll vacía el registro', async () => {
    const { service, prisma } = buildService();
    prisma.errorLog.deleteMany.mockResolvedValue({ count: 7 });
    await expect(service.removeAll()).resolves.toEqual({ deleted: 7 });
    expect(prisma.errorLog.deleteMany).toHaveBeenCalledWith({});
  });
});
