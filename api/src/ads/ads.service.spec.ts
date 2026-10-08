import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdsService } from './ads.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';

function buildService() {
  const prisma = {
    ad: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    review: { groupBy: jest.fn().mockResolvedValue([]) },
  };
  const notifications = { notifyNewAd: jest.fn() };
  const traces = { record: jest.fn() };
  const indexing = { notifyUpdated: jest.fn(), notifyDeleted: jest.fn() };
  const service = new AdsService(
    prisma as never,
    notifications as never,
    traces as never,
    indexing as never,
  );
  return { service, prisma, notifications, traces, indexing };
}

const owner: AuthUser = { id: 'u1', email: 'a@t.com', isAdmin: false };
const other: AuthUser = { id: 'u2', email: 'b@t.com', isAdmin: false };
const admin: AuthUser = { id: 'u3', email: 'admin@t.com', isAdmin: true };

const dto = {
  description: 'Prueba',
  salary: 100,
  phone: '70000000',
  jobType: 'DIARIA',
} as never;

const existingAd = {
  id: 'a1',
  description: 'Prueba',
  createdById: 'u1',
  durationDays: 3,
  createdBy: { id: 'u1', name: 'Ana', email: 'a@t.com' },
};

describe('AdsService.create', () => {
  it('any verified user can publish', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ emailVerified: true });
    prisma.ad.create.mockResolvedValue(existingAd);

    await service.create(dto, owner);
    expect(prisma.ad.create).toHaveBeenCalled();
    expect(prisma.ad.create.mock.calls[0][0].data.createdById).toBe('u1');
  });

  it('blocks publishing with an unverified email (non-admin)', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ emailVerified: false });

    await expect(service.create(dto, owner)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('the admin publishes without a verification check', async () => {
    const { service, prisma } = buildService();
    prisma.ad.create.mockResolvedValue(existingAd);

    await service.create(dto, admin);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});

describe('resource ownership (edit/delete)', () => {
  it('the owner can edit their listing', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(existingAd);
    prisma.ad.update.mockResolvedValue(existingAd);

    await service.update('a1', {} as never, owner);
    expect(prisma.ad.update).toHaveBeenCalled();
  });

  it('another user cannot edit a listing they do not own', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(existingAd);

    await expect(
      service.update('a1', {} as never, other),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('the owner can delete their listing; another user cannot', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(existingAd);
    prisma.ad.delete.mockResolvedValue(existingAd);

    await service.remove('a1', owner);
    expect(prisma.ad.delete).toHaveBeenCalled();

    prisma.ad.delete.mockClear();
    await expect(service.remove('a1', other)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.ad.delete).not.toHaveBeenCalled();
  });

  it('the admin can modify listings owned by others', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(existingAd);
    prisma.ad.update.mockResolvedValue(existingAd);

    await service.unpublish('a1', admin);
    expect(prisma.ad.update).toHaveBeenCalled();
  });
});

describe('AdsService.bulkRemove', () => {
  it('deletes only existing ids and notifies de-indexing for each one', async () => {
    const { service, prisma, indexing } = buildService();
    // Of the three requested, one no longer exists.
    prisma.ad.findMany.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);
    prisma.ad.deleteMany.mockResolvedValue({ count: 2 });

    const result = await service.bulkRemove(['a1', 'a2', 'a9'], admin);

    expect(prisma.ad.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['a1', 'a2'] } },
    });
    expect(indexing.notifyDeleted).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ deleted: 2 });
  });
});

describe('AdsService.removeAll', () => {
  it('deletes all listings and notifies de-indexing for each one', async () => {
    const { service, prisma, indexing } = buildService();
    prisma.ad.findMany.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }]);
    prisma.ad.deleteMany.mockResolvedValue({ count: 3 });

    const result = await service.removeAll(admin);

    // Without clientsOnly the filter is empty (deletes everything).
    expect(prisma.ad.findMany).toHaveBeenCalledWith({
      where: {},
      select: { id: true },
    });
    expect(prisma.ad.deleteMany).toHaveBeenCalledWith({ where: {} });
    expect(indexing.notifyDeleted).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ deleted: 3 });
  });

  it('with clientsOnly deletes only client listings (not admins)', async () => {
    const { service, prisma, indexing } = buildService();
    prisma.ad.findMany.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }]);
    prisma.ad.deleteMany.mockResolvedValue({ count: 2 });

    const result = await service.removeAll(admin, true);

    const where = { createdBy: { isAdmin: false } };
    expect(prisma.ad.findMany).toHaveBeenCalledWith({ where, select: { id: true } });
    expect(prisma.ad.deleteMany).toHaveBeenCalledWith({ where });
    expect(indexing.notifyDeleted).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ deleted: 2 });
  });
});

describe('AdsService.findOne / findOnePublic / getContact', () => {
  it('findOne throws 404 if it does not exist', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findOnePublic hides phones and location from anonymous visitors', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue({
      id: 'a1',
      description: 'Prueba',
      phone: '70000000',
      extraPhones: ['71111111'],
      location: 'Centro',
      locationReference: 'Frente al mercado',
      latitude: -17,
      longitude: -63,
      department: 'LA_PAZ',
    });
    const res = (await service.findOnePublic('a1', null)) as Record<string, unknown>;
    expect(res).not.toHaveProperty('phone');
    // Additional numbers and the reference are contact data: they aren't
    // exposed without a session either.
    expect(res).not.toHaveProperty('extraPhones');
    expect(res).not.toHaveProperty('location');
    expect(res).not.toHaveProperty('locationReference');
    expect(res).not.toHaveProperty('latitude');
    // The department (general area) is kept.
    expect(res.department).toBe('LA_PAZ');
  });

  it('findOnePublic returns everything to a logged-in user', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue({
      id: 'a1',
      description: 'Prueba',
      phone: '70000000',
      location: 'Centro',
    });
    const res = (await service.findOnePublic('a1', owner)) as Record<string, unknown>;
    expect(res.phone).toBe('70000000');
    expect(res.location).toBe('Centro');
  });

  it('getContact returns only contact and location data', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue({
      phone: '70000000',
      location: 'Centro',
      latitude: null,
      longitude: null,
    });
    const res = await service.getContact('a1');
    expect(res.phone).toBe('70000000');
    expect(prisma.ad.findUnique.mock.calls[0][0].select).toEqual({
      phone: true,
      extraPhones: true,
      location: true,
      locationReference: true,
      latitude: true,
      longitude: true,
    });
  });
});

describe('AdsService.create (anti-spam)', () => {
  it('rejects publishing if the email is not verified (non-admin)', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ emailVerified: false });
    await expect(service.create(dto, owner)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.ad.create).not.toHaveBeenCalled();
  });

  it('publishes when the email is verified and records a trace + indexing', async () => {
    const { service, prisma, indexing } = buildService();
    prisma.user.findUnique.mockResolvedValue({ emailVerified: true });
    prisma.ad.create.mockResolvedValue({
      id: 'a1',
      description: 'Prueba',
      createdBy: { id: 'u1', email: 'a@t.com' },
    });
    const res = await service.create(dto, owner);
    expect(res.id).toBe('a1');
    expect(indexing.notifyUpdated).toHaveBeenCalledWith('a1');
  });

  it('the admin publishes without email verification', async () => {
    const { service, prisma } = buildService();
    prisma.ad.create.mockResolvedValue({
      id: 'a1',
      description: 'Prueba',
      createdBy: { id: 'u3', email: 'admin@t.com' },
    });
    await service.create(dto, admin);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});

describe('AdsService.bulkCreate', () => {
  it('bulk creates with default duration 7 and a summary trace', async () => {
    const { service, prisma, traces } = buildService();
    prisma.ad.createMany.mockResolvedValue({ count: 2 });
    const res = await service.bulkCreate([dto, dto], admin);
    expect(res).toEqual({ created: 2 });
    const data = prisma.ad.createMany.mock.calls[0][0].data;
    expect(data[0].durationDays).toBe(7);
    expect(traces.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('2'),
      admin,
    );
  });

  // createMany builds a single INSERT with the union of the batch's columns: if
  // a row leaves extraPhones undefined, Postgres receives an explicit NULL and
  // the column is NOT NULL (the whole batch fails, not just that row).
  it('listings without additional phones get an empty list, not undefined', async () => {
    const { service, prisma } = buildService();
    prisma.ad.createMany.mockResolvedValue({ count: 2 });
    // dto is typed as never in this file (minimal test payload).
    const withExtras = { ...(dto as object), extraPhones: ['71111111'] };
    await service.bulkCreate([dto, withExtras] as never, admin);
    const data = prisma.ad.createMany.mock.calls[0][0].data;
    expect(data[0].extraPhones).toEqual([]);
    expect(data[1].extraPhones).toEqual(['71111111']);
  });
});

describe('AdsService.republish / permissions', () => {
  it('republish reactivates with a new validity period', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue({
      id: 'a1',
      description: 'Prueba',
      createdById: 'u1',
      durationDays: 3,
    });
    prisma.ad.update.mockResolvedValue({ id: 'a1', status: 'ACTIVO' });
    await service.republish('a1', owner);
    const data = prisma.ad.update.mock.calls[0][0].data;
    expect(data.status).toBe('ACTIVO');
    expect(data.expiresAt).toBeInstanceOf(Date);
  });

  it('another user cannot republish (Forbidden)', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue({
      id: 'a1',
      description: 'Prueba',
      createdById: 'u1',
      durationDays: 3,
    });
    await expect(service.republish('a1', other)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('AdsService.findMine', () => {
  it('lists own listings sorted by date desc', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany.mockResolvedValue([{ id: 'a1' }]);
    await service.findMine('u1');
    const args = prisma.ad.findMany.mock.calls[0][0];
    expect(args.where).toEqual({ createdById: 'u1' });
    expect(args.orderBy).toEqual({ createdAt: 'desc' });
  });
});

// Row as returned by the public listing's ranking query (only the fields used
// by the relevance order). `extra` fills in optional data.
function rankRow(
  id: string,
  salary: number | null,
  visits: number,
  extra: Record<string, unknown> = {},
) {
  return {
    id,
    priority: 0,
    salary,
    requirements: null,
    location: null,
    locationReference: null,
    department: null,
    category: null,
    schedule: null,
    latitude: null,
    longitude: null,
    createdAt: new Date('2026-07-01'),
    _count: { visits },
    ...extra,
  };
}

describe('AdsService.paginate (via findAll) — building the where', () => {
  it('findAll paginates active listings with enum, salary and search filters', async () => {
    const { service, prisma } = buildService();
    // 1st query: ranking fields of all active listings passing the filter;
    // 2nd: the already-sorted page, hydrated by id.
    prisma.ad.findMany
      .mockResolvedValueOnce([rankRow('a1', 1000, 3)])
      .mockResolvedValueOnce([{ id: 'a1', createdById: 'u1' }]);
    prisma.review.groupBy.mockResolvedValue([
      { ownerId: 'u1', _avg: { rating: 4.5 }, _count: 2 },
    ]);

    const res = await service.findAll({
      jobType: 'DIARIA',
      department: 'LA_PAZ',
      category: 'VENTAS',
      salaryMin: 500,
      salaryMax: 3000,
      search: 'mesero',
      location: 'centro',
      page: 1,
      limit: 5,
    } as never);

    const where = prisma.ad.findMany.mock.calls[0][0].where;
    expect(where.status).toBe('ACTIVO'); // whereActive
    expect(where.jobType).toEqual({ in: ['DIARIA'] });
    expect(where.department).toEqual({ in: ['LA_PAZ'] });
    expect(where.category).toEqual({ in: ['VENTAS'] });
    // Overlap with the requested range: the listing's floor doesn't exceed the
    // requested ceiling and its ceiling (salaryMax or salary itself) reaches
    // the requested floor.
    expect(where.salary).toEqual({ lte: 3000 });
    expect(where.AND).toEqual([
      {
        OR: [
          { salaryMax: { gte: 500 } },
          { salaryMax: null, salary: { gte: 500 } },
        ],
      },
    ]);
    // title/description/requirements/location/locationReference
    expect(where.OR).toHaveLength(5);
    expect(where.location).toEqual({ contains: 'centro', mode: 'insensitive' });
    // The page is hydrated by the already-sorted ids (no skip/take).
    expect(prisma.ad.findMany.mock.calls[1][0].where).toEqual({
      id: { in: ['a1'] },
    });
    // Attaches the poster's rating.
    expect(res.items[0]).toMatchObject({ ownerRating: { average: 4.5, count: 2 } });
    expect(res.total).toBe(1);
    expect(res.totalPages).toBe(1);
  });

  it('without reviews, ownerRating stays at 0', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany
      .mockResolvedValueOnce([rankRow('a1', null, 0)])
      .mockResolvedValueOnce([{ id: 'a1', createdById: 'u1' }]);
    prisma.review.groupBy.mockResolvedValue([]);
    const res = await service.findAll({} as never);
    expect(res.items[0]).toMatchObject({ ownerRating: { average: null, count: 0 } });
  });

  it('with no results it does not hydrate the page', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany.mockResolvedValueOnce([]);
    const res = await service.findAll({} as never);
    expect(prisma.ad.findMany).toHaveBeenCalledTimes(1);
    expect(res).toMatchObject({ items: [], total: 0, totalPages: 0 });
  });
});

describe('AdsService.findAll — salary filter with ranges', () => {
  it('only the requested floor: the listing ceiling may be its range', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany.mockResolvedValueOnce([]);
    await service.findAll({ salaryMin: 4000 } as never);
    const where = prisma.ad.findMany.mock.calls[0][0].where;
    expect(where.salary).toBeUndefined();
    expect(where.AND).toEqual([
      {
        OR: [
          { salaryMax: { gte: 4000 } },
          { salaryMax: null, salary: { gte: 4000 } },
        ],
      },
    ]);
  });

  it('only the requested ceiling: compared against the listing floor', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany.mockResolvedValueOnce([]);
    await service.findAll({ salaryMax: 2000 } as never);
    const where = prisma.ad.findMany.mock.calls[0][0].where;
    expect(where.salary).toEqual({ lte: 2000 });
    expect(where.AND).toBeUndefined();
  });
});

describe('AdsService.facets', () => {
  it('the slider ceiling takes salary ranges into account', async () => {
    const { service, prisma } = buildService();
    prisma.ad.groupBy.mockResolvedValue([]);
    prisma.ad.count.mockResolvedValue(1);
    prisma.ad.aggregate.mockResolvedValue({
      _min: { salary: 950 },
      _max: { salary: 3500, salaryMax: 4500 },
    });
    const res = await service.facets();
    expect(res.salaryMin).toBe(950);
    expect(res.salaryMax).toBe(4500);
  });
});

describe('AdsService.findAll — relevance order', () => {
  // defined salary → more visits → more complete data → most recent.
  const rows = [
    rankRow('no-salary-popular', null, 99, {
      location: 'Centro',
      category: 'VENTAS',
    }),
    rankRow('salary-few-visits', 900, 1),
    rankRow('salary-complete', 700, 5, {
      location: 'Miraflores',
      schedule: '8 a 16',
    }),
    rankRow('salary-incomplete', 800, 5),
  ];

  it('sorts by defined salary, visits and completeness', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany
      .mockResolvedValueOnce(rows)
      .mockResolvedValueOnce([]);
    await service.findAll({} as never);

    expect(prisma.ad.findMany.mock.calls[1][0].where.id.in).toEqual([
      'salary-complete', // ties on visits with the incomplete one and wins on data
      'salary-incomplete',
      'salary-few-visits',
      'no-salary-popular', // no salary goes last even with more visits
    ]);
  });

  it('the page order is kept even if the DB returns another one', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany.mockResolvedValueOnce(rows).mockResolvedValueOnce([
      { id: 'salary-incomplete', createdById: 'u1' },
      { id: 'salary-complete', createdById: 'u1' },
    ]);
    const res = await service.findAll({ limit: 2 } as never);
    expect(res.items.map((i: { id: string }) => i.id)).toEqual([
      'salary-complete',
      'salary-incomplete',
    ]);
    expect(res.total).toBe(4);
    expect(res.totalPages).toBe(2);
  });

  it('manual priority overrides salary, visits and completeness', async () => {
    const { service, prisma } = buildService();
    const prioritized = rankRow('no-salary-prioritized', null, 0, { priority: 5 });
    prisma.ad.findMany
      .mockResolvedValueOnce([...rows, prioritized])
      .mockResolvedValueOnce([]);
    await service.findAll({} as never);

    const ids = prisma.ad.findMany.mock.calls[1][0].where.id.in;
    expect(ids[0]).toBe('no-salary-prioritized');
    // The rest keeps the relevance order.
    expect(ids.slice(1)).toEqual([
      'salary-complete',
      'salary-incomplete',
      'salary-few-visits',
      'no-salary-popular',
    ]);
  });

  it('among prioritized listings the highest priority wins', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany
      .mockResolvedValueOnce([
        rankRow('p2', null, 0, { priority: 2 }),
        rankRow('p9', null, 0, { priority: 9 }),
        rankRow('normal', 500, 50),
      ])
      .mockResolvedValueOnce([]);
    await service.findAll({} as never);

    expect(prisma.ad.findMany.mock.calls[1][0].where.id.in).toEqual([
      'p9',
      'p2',
      'normal',
    ]);
  });

  it('the second page follows the same ranking', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany
      .mockResolvedValueOnce(rows)
      .mockResolvedValueOnce([{ id: 'salary-few-visits', createdById: 'u1' }]);
    await service.findAll({ page: 3, limit: 1 } as never);
    expect(prisma.ad.findMany.mock.calls[1][0].where.id.in).toEqual([
      'salary-few-visits',
    ]);
  });
});

describe('AdsService.findAllAdmin — report filters', () => {
  it('clientsOnly + owner + date range + VENCIDO status', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany.mockResolvedValue([]);
    prisma.ad.count.mockResolvedValue(0);

    await service.findAllAdmin({
      clientsOnly: 'true',
      owner: 'ana',
      from: '2026-07-01',
      to: '2026-07-10',
      status: 'VENCIDO',
    } as never);

    const where = prisma.ad.findMany.mock.calls[0][0].where;
    expect(where.createdBy.isAdmin).toBe(false);
    expect(where.createdBy.OR).toHaveLength(2);
    // Bolivia days (UTC-4): the filter spans the 1st to the 10th in local time.
    expect(where.createdAt.gte).toEqual(new Date('2026-07-01T04:00:00.000Z'));
    expect(where.createdAt.lte).toEqual(new Date('2026-07-11T03:59:59.999Z'));
    // VENCIDO = active with a past expiry.
    expect(where.status).toBe('ACTIVO');
    expect(where.expiresAt.lte).toBeInstanceOf(Date);
  });

  it('DADO_DE_BAJA status maps to the persisted status', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany.mockResolvedValue([]);
    prisma.ad.count.mockResolvedValue(0);
    await service.findAllAdmin({ status: 'DADO_DE_BAJA' } as never);
    expect(prisma.ad.findMany.mock.calls[0][0].where.status).toBe('DADO_DE_BAJA');
  });

  it('lists prioritized ones first and then the most recent', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany.mockResolvedValue([]);
    prisma.ad.count.mockResolvedValue(0);
    await service.findAllAdmin({} as never);
    expect(prisma.ad.findMany.mock.calls[0][0].orderBy).toEqual([
      { priority: 'desc' },
      { createdAt: 'desc' },
    ]);
  });
});

describe('AdsService — priority belongs to the panel only', () => {
  it('the public listing does not expose the priority', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany
      .mockResolvedValueOnce([rankRow('a1', 500, 1, { priority: 4 })])
      .mockResolvedValueOnce([{ id: 'a1', createdById: 'u1', priority: 4 }]);
    const res = await service.findAll({} as never);
    expect(res.items[0]).not.toHaveProperty('priority');
    // The portal only knows it's featured, not at which position.
    expect(res.items[0]).toHaveProperty('featured', true);
  });

  it('without priority the listing is not featured', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany
      .mockResolvedValueOnce([rankRow('a1', 500, 1)])
      .mockResolvedValueOnce([{ id: 'a1', createdById: 'u1', priority: 0 }]);
    const res = await service.findAll({} as never);
    expect(res.items[0]).toHaveProperty('featured', false);
  });

  it('neither do the public detail and own listings', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue({ ...existingAd, priority: 4 });
    const detail = await service.findOnePublic('a1', owner);
    expect(detail).not.toHaveProperty('priority');

    prisma.ad.findMany.mockResolvedValue([{ ...existingAd, priority: 4 }]);
    const mine = await service.findMine('u1');
    expect(mine[0]).not.toHaveProperty('priority');
  });

  it('the anonymous visitor sees featured but not the priority', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue({ ...existingAd, priority: 4 });
    const detail = await service.findOnePublic('a1', null);
    expect(detail).not.toHaveProperty('priority');
    expect(detail).toHaveProperty('featured', true);
  });

  it('the detail does include it for the admin (edited in the form)', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue({ ...existingAd, priority: 4 });
    const detail = await service.findOnePublic('a1', admin);
    expect(detail).toHaveProperty('priority', 4);
  });

  it('the panel listing does include it (the table edits it)', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany.mockResolvedValue([{ ...existingAd, priority: 4, createdById: 'u1' }]);
    prisma.ad.count.mockResolvedValue(1);
    const res = await service.findAllAdmin({} as never);
    expect(res.items[0]).toHaveProperty('priority', 4);
  });

  it('drops the priority a client sends when publishing', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ emailVerified: true });
    prisma.ad.create.mockResolvedValue({ ...existingAd, createdBy: existingAd.createdBy });
    await service.create({ ...(dto as object), priority: 9 } as never, owner);
    expect(prisma.ad.create.mock.calls[0][0].data.priority).toBeUndefined();
  });

  it('the admin can set it when publishing', async () => {
    const { service, prisma } = buildService();
    prisma.ad.create.mockResolvedValue({ ...existingAd, createdBy: existingAd.createdBy });
    await service.create({ ...(dto as object), priority: 9 } as never, admin);
    expect(prisma.ad.create.mock.calls[0][0].data.priority).toBe(9);
  });

  it('drops the priority the owner sends when editing their listing', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(existingAd);
    prisma.ad.update.mockResolvedValue(existingAd);
    await service.update('a1', { priority: 9 } as never, owner);
    expect(prisma.ad.update.mock.calls[0][0].data.priority).toBeUndefined();
  });

  it('the admin changes the priority of any listing', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(existingAd);
    prisma.ad.update.mockResolvedValue(existingAd);
    await service.update('a1', { priority: 7 } as never, admin);
    expect(prisma.ad.update.mock.calls[0][0].data.priority).toBe(7);
  });
});

describe('AdsService.facets', () => {
  it('builds per-option counts and the salary range', async () => {
    const { service, prisma } = buildService();
    prisma.ad.groupBy
      .mockResolvedValueOnce([{ jobType: 'DIARIA', _count: 3 }])
      .mockResolvedValueOnce([{ department: 'LA_PAZ', _count: 2 }, { department: null, _count: 1 }])
      .mockResolvedValueOnce([{ category: 'VENTAS', _count: 5 }]);
    prisma.ad.aggregate
      .mockResolvedValue({ _min: { salary: 500 }, _max: { salary: 8000 } });
    prisma.ad.count.mockResolvedValue(9);

    const res = await service.facets();
    expect(res.total).toBe(9);
    expect(res.jobType).toEqual({ DIARIA: 3 });
    expect(res.department).toEqual({ LA_PAZ: 2 }); // null is ignored
    expect(res.category).toEqual({ VENTAS: 5 });
    expect(res.salaryMin).toBe(500);
    expect(res.salaryMax).toBe(8000);
  });
});
