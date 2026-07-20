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
  it('cualquier usuario verificado puede publicar', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ emailVerified: true });
    prisma.ad.create.mockResolvedValue(existingAd);

    await service.create(dto, owner);
    expect(prisma.ad.create).toHaveBeenCalled();
    expect(prisma.ad.create.mock.calls[0][0].data.createdById).toBe('u1');
  });

  it('bloquea publicar con correo sin verificar (no admin)', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ emailVerified: false });

    await expect(service.create(dto, owner)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('el admin publica sin comprobación de verificación', async () => {
    const { service, prisma } = buildService();
    prisma.ad.create.mockResolvedValue(existingAd);

    await service.create(dto, admin);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});

describe('propiedad del recurso (editar/eliminar)', () => {
  it('el dueño puede editar su anuncio', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(existingAd);
    prisma.ad.update.mockResolvedValue(existingAd);

    await service.update('a1', {} as never, owner);
    expect(prisma.ad.update).toHaveBeenCalled();
  });

  it('otro usuario no puede editar un anuncio ajeno', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(existingAd);

    await expect(
      service.update('a1', {} as never, other),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('el dueño puede eliminar su anuncio; otro usuario no', async () => {
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

  it('el admin puede modificar anuncios ajenos', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(existingAd);
    prisma.ad.update.mockResolvedValue(existingAd);

    await service.unpublish('a1', admin);
    expect(prisma.ad.update).toHaveBeenCalled();
  });
});

describe('AdsService.bulkRemove', () => {
  it('borra solo los ids existentes y notifica la desindexación de cada uno', async () => {
    const { service, prisma, indexing } = buildService();
    // De los tres pedidos, uno ya no existe.
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
  it('borra todos los anuncios y notifica la desindexación de cada uno', async () => {
    const { service, prisma, indexing } = buildService();
    prisma.ad.findMany.mockResolvedValue([{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }]);
    prisma.ad.deleteMany.mockResolvedValue({ count: 3 });

    const result = await service.removeAll(admin);

    // Sin clientsOnly el filtro es vacío (borra todos).
    expect(prisma.ad.findMany).toHaveBeenCalledWith({
      where: {},
      select: { id: true },
    });
    expect(prisma.ad.deleteMany).toHaveBeenCalledWith({ where: {} });
    expect(indexing.notifyDeleted).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ deleted: 3 });
  });

  it('con clientsOnly borra solo los anuncios de clientes (no admins)', async () => {
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
  it('findOne lanza 404 si no existe', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findOnePublic oculta teléfono y ubicación al visitante anónimo', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue({
      id: 'a1',
      description: 'Prueba',
      phone: '70000000',
      location: 'Centro',
      latitude: -17,
      longitude: -63,
      department: 'LA_PAZ',
    });
    const res = (await service.findOnePublic('a1', null)) as Record<string, unknown>;
    expect(res).not.toHaveProperty('phone');
    expect(res).not.toHaveProperty('location');
    expect(res).not.toHaveProperty('latitude');
    // El departamento (zona general) sí se conserva.
    expect(res.department).toBe('LA_PAZ');
  });

  it('findOnePublic devuelve todo al usuario con sesión', async () => {
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

  it('getContact devuelve solo los datos de contacto y ubicación', async () => {
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
      location: true,
      latitude: true,
      longitude: true,
    });
  });
});

describe('AdsService.create (anti-spam)', () => {
  it('rechaza publicar si el correo no está verificado (no admin)', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ emailVerified: false });
    await expect(service.create(dto, owner)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.ad.create).not.toHaveBeenCalled();
  });

  it('publica cuando el correo está verificado y deja traza + indexación', async () => {
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

  it('el admin publica sin verificación de correo', async () => {
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
  it('crea en lote con duración por defecto 7 y una traza resumen', async () => {
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
});

describe('AdsService.republish / permisos', () => {
  it('republish reactiva con nueva vigencia', async () => {
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

  it('un usuario ajeno no puede republicar (Forbidden)', async () => {
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
  it('lista los anuncios propios ordenados por fecha desc', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany.mockResolvedValue([{ id: 'a1' }]);
    await service.findMine('u1');
    const args = prisma.ad.findMany.mock.calls[0][0];
    expect(args.where).toEqual({ createdById: 'u1' });
    expect(args.orderBy).toEqual({ createdAt: 'desc' });
  });
});

describe('AdsService.paginate (vía findAll) — construcción del where', () => {
  it('findAll pagina anuncios vigentes con filtros de enums, salario y búsqueda', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany.mockResolvedValue([{ id: 'a1', createdById: 'u1' }]);
    prisma.ad.count.mockResolvedValue(1);
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
      page: 2,
      limit: 5,
    } as never);

    const where = prisma.ad.findMany.mock.calls[0][0].where;
    expect(where.status).toBe('ACTIVO'); // whereActive
    expect(where.jobType).toEqual({ in: ['DIARIA'] });
    expect(where.department).toEqual({ in: ['LA_PAZ'] });
    expect(where.category).toEqual({ in: ['VENTAS'] });
    expect(where.salary).toEqual({ gte: 500, lte: 3000 });
    expect(where.OR).toHaveLength(4); // title/description/requirements/location
    expect(where.location).toEqual({ contains: 'centro', mode: 'insensitive' });
    expect(prisma.ad.findMany.mock.calls[0][0].skip).toBe(5); // (2-1)*5
    // Adjunta la calificación del publicante.
    expect(res.items[0]).toMatchObject({ ownerRating: { average: 4.5, count: 2 } });
    expect(res.totalPages).toBe(1);
  });

  it('sin reseñas, ownerRating queda en 0', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany.mockResolvedValue([{ id: 'a1', createdById: 'u1' }]);
    prisma.ad.count.mockResolvedValue(1);
    prisma.review.groupBy.mockResolvedValue([]);
    const res = await service.findAll({} as never);
    expect(res.items[0]).toMatchObject({ ownerRating: { average: null, count: 0 } });
  });
});

describe('AdsService.findAllAdmin — filtros del reporte', () => {
  it('clientsOnly + owner + rango de fechas + estado VENCIDO', async () => {
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
    expect(where.createdAt.gte).toEqual(new Date('2026-07-01'));
    expect(where.createdAt.lte).toEqual(new Date('2026-07-10T23:59:59.999Z'));
    // VENCIDO = activo con vigencia pasada.
    expect(where.status).toBe('ACTIVO');
    expect(where.expiresAt.lte).toBeInstanceOf(Date);
  });

  it('estado DADO_DE_BAJA se traduce al status persistido', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany.mockResolvedValue([]);
    prisma.ad.count.mockResolvedValue(0);
    await service.findAllAdmin({ status: 'DADO_DE_BAJA' } as never);
    expect(prisma.ad.findMany.mock.calls[0][0].where.status).toBe('DADO_DE_BAJA');
  });
});

describe('AdsService.facets', () => {
  it('arma los conteos por opción y el rango salarial', async () => {
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
    expect(res.department).toEqual({ LA_PAZ: 2 }); // el null se ignora
    expect(res.category).toEqual({ VENTAS: 5 });
    expect(res.salaryMin).toBe(500);
    expect(res.salaryMax).toBe(8000);
  });
});
