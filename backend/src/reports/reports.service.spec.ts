import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReportStatus, TraceType } from '@prisma/client';
import { ReportsService } from './reports.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';

function buildService() {
  const prisma = {
    ad: { findUnique: jest.fn() },
    report: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const traces = { record: jest.fn() };
  const service = new ReportsService(prisma as never, traces as never);
  return { service, prisma, traces };
}

const reporter: AuthUser = { id: 'u1', email: 'u1@t.com', isAdmin: false };
const admin: AuthUser = { id: 'adm', email: 'admin@t.com', isAdmin: true };

describe('ReportsService.create', () => {
  it('rechaza reportar un anuncio inexistente', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(null);
    await expect(
      service.create({ adId: 'x', reason: 'SPAM' } as never, reporter),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza reportar el anuncio propio', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue({ id: 'a1', createdById: 'u1' });
    await expect(
      service.create({ adId: 'a1', reason: 'SPAM' } as never, reporter),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('crea el reporte y deja traza', async () => {
    const { service, prisma, traces } = buildService();
    prisma.ad.findUnique.mockResolvedValue({
      id: 'a1',
      createdById: 'otro',
      description: 'Vendedor',
    });
    prisma.report.create.mockResolvedValue({ id: 'r1', reason: 'SPAM' });

    const res = await service.create(
      { adId: 'a1', reason: 'SPAM', comment: '  spam  ' } as never,
      reporter,
    );
    expect(res).toEqual({ id: 'r1', reason: 'SPAM' });
    // El comentario se recorta.
    expect(prisma.report.create.mock.calls[0][0].data.comment).toBe('spam');
    expect(traces.record).toHaveBeenCalledWith(
      TraceType.REPORT_CREATED,
      expect.any(String),
      reporter,
      { resource: 'report:r1' },
    );
  });

  it('traduce la violación de único (P2002) a conflicto "ya reportaste"', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue({
      id: 'a1',
      createdById: 'otro',
      description: 'x',
    });
    prisma.report.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: '5',
      }),
    );
    await expect(
      service.create({ adId: 'a1', reason: 'SPAM' } as never, reporter),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('ReportsService.findAll', () => {
  it('sin estado lista todos (where undefined)', () => {
    const { service, prisma } = buildService();
    service.findAll();
    expect(prisma.report.findMany.mock.calls[0][0].where).toBeUndefined();
  });

  it('filtra por estado cuando se indica', () => {
    const { service, prisma } = buildService();
    service.findAll(ReportStatus.PENDIENTE);
    expect(prisma.report.findMany.mock.calls[0][0].where).toEqual({
      status: ReportStatus.PENDIENTE,
    });
  });
});

describe('ReportsService.resolve', () => {
  it('falla si el reporte no existe', async () => {
    const { service, prisma } = buildService();
    prisma.report.findUnique.mockResolvedValue(null);
    await expect(
      service.resolve('r1', ReportStatus.ATENDIDO, admin),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('actualiza el estado y deja traza', async () => {
    const { service, prisma, traces } = buildService();
    prisma.report.findUnique.mockResolvedValue({ id: 'r1', reason: 'SPAM' });
    prisma.report.update.mockResolvedValue({ id: 'r1', status: 'ATENDIDO' });

    const res = await service.resolve('r1', ReportStatus.ATENDIDO, admin);
    expect(res.status).toBe('ATENDIDO');
    expect(prisma.report.update.mock.calls[0][0].data).toEqual({
      status: ReportStatus.ATENDIDO,
    });
    expect(traces.record).toHaveBeenCalledWith(
      TraceType.REPORT_RESOLVED,
      expect.any(String),
      admin,
      { resource: 'report:r1' },
    );
  });
});

describe('ReportsService.remove / removeMany', () => {
  it('remove falla si no existe', async () => {
    const { service, prisma } = buildService();
    prisma.report.findUnique.mockResolvedValue(null);
    await expect(service.remove('r1', admin)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('remove borra y deja traza', async () => {
    const { service, prisma, traces } = buildService();
    prisma.report.findUnique.mockResolvedValue({ id: 'r1', reason: 'SPAM' });
    prisma.report.delete.mockResolvedValue({});
    const res = await service.remove('r1', admin);
    expect(res).toEqual({ deleted: true });
    expect(prisma.report.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
    expect(traces.record).toHaveBeenCalledWith(
      TraceType.REPORT_DELETED,
      expect.any(String),
      admin,
      { resource: 'report:r1' },
    );
  });

  it('removeMany borra por lotes con traza resumen', async () => {
    const { service, prisma, traces } = buildService();
    prisma.report.deleteMany.mockResolvedValue({ count: 4 });
    const res = await service.removeMany(['r1', 'r2', 'r3', 'r4'], admin);
    expect(res).toEqual({ deleted: 4 });
    expect(prisma.report.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['r1', 'r2', 'r3', 'r4'] } },
    });
    expect(traces.record).toHaveBeenCalledWith(
      TraceType.REPORT_DELETED,
      expect.stringContaining('4'),
      admin,
    );
  });

  it('removeAll vacía la cola con traza resumen', async () => {
    const { service, prisma, traces } = buildService();
    prisma.report.deleteMany.mockResolvedValue({ count: 9 });
    const res = await service.removeAll(admin);
    expect(res).toEqual({ deleted: 9 });
    expect(prisma.report.deleteMany).toHaveBeenCalledWith({});
    expect(traces.record).toHaveBeenCalledWith(
      TraceType.REPORT_DELETED,
      expect.stringContaining('9'),
      admin,
    );
  });
});
