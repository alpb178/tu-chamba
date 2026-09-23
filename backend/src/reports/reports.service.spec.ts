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
  it('rejects reporting a nonexistent listing', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(null);
    await expect(
      service.create({ adId: 'x', reason: 'SPAM' } as never, reporter),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects reporting your own listing', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue({ id: 'a1', createdById: 'u1' });
    await expect(
      service.create({ adId: 'a1', reason: 'SPAM' } as never, reporter),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates the report and leaves a trace', async () => {
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
    // The comment is trimmed.
    expect(prisma.report.create.mock.calls[0][0].data.comment).toBe('spam');
    expect(traces.record).toHaveBeenCalledWith(
      TraceType.REPORT_CREATED,
      expect.any(String),
      reporter,
      { resource: 'report:r1' },
    );
  });

  it('translates the unique violation (P2002) into a "ya reportaste" conflict', async () => {
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
  it('without status lists all (where undefined)', () => {
    const { service, prisma } = buildService();
    service.findAll();
    expect(prisma.report.findMany.mock.calls[0][0].where).toBeUndefined();
  });

  it('filters by status when given', () => {
    const { service, prisma } = buildService();
    service.findAll(ReportStatus.PENDIENTE);
    expect(prisma.report.findMany.mock.calls[0][0].where).toEqual({
      status: ReportStatus.PENDIENTE,
    });
  });
});

describe('ReportsService.resolve', () => {
  it('fails if the report does not exist', async () => {
    const { service, prisma } = buildService();
    prisma.report.findUnique.mockResolvedValue(null);
    await expect(
      service.resolve('r1', ReportStatus.ATENDIDO, admin),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates the status and leaves a trace', async () => {
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
  it('remove fails if it does not exist', async () => {
    const { service, prisma } = buildService();
    prisma.report.findUnique.mockResolvedValue(null);
    await expect(service.remove('r1', admin)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('remove deletes and leaves a trace', async () => {
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

  it('removeMany deletes in batch with a summary trace', async () => {
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

  it('removeAll empties the queue with a summary trace', async () => {
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
