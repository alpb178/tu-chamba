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

  it('findOnePublic oculta teléfonos y ubicación al visitante anónimo', async () => {
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
    // Los números adicionales y la referencia son datos de contacto: tampoco
    // se exponen sin sesión.
    expect(res).not.toHaveProperty('extraPhones');
    expect(res).not.toHaveProperty('location');
    expect(res).not.toHaveProperty('locationReference');
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
      extraPhones: true,
      location: true,
      locationReference: true,
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

  // createMany arma un solo INSERT con la unión de columnas del lote: si una
  // fila deja extraPhones en undefined, Postgres recibe NULL explícito y la
  // columna es NOT NULL (falla todo el lote, no solo esa fila).
  it('los anuncios sin teléfonos adicionales van con lista vacía, no undefined', async () => {
    const { service, prisma } = buildService();
    prisma.ad.createMany.mockResolvedValue({ count: 2 });
    // dto está tipado como never en este archivo (payload mínimo de prueba).
    const conExtras = { ...(dto as object), extraPhones: ['71111111'] };
    await service.bulkCreate([dto, conExtras] as never, admin);
    const data = prisma.ad.createMany.mock.calls[0][0].data;
    expect(data[0].extraPhones).toEqual([]);
    expect(data[1].extraPhones).toEqual(['71111111']);
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

// Fila tal como la devuelve la consulta de ranking del listado público (solo
// los campos que usa el orden por relevancia). `extra` llena datos opcionales.
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

describe('AdsService.paginate (vía findAll) — construcción del where', () => {
  it('findAll pagina anuncios vigentes con filtros de enums, salario y búsqueda', async () => {
    const { service, prisma } = buildService();
    // 1ª consulta: campos de ranking de todos los vigentes que pasan el
    // filtro; 2ª: la página ya ordenada, hidratada por id.
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
    // Solapamiento con el rango pedido: el piso del anuncio no pasa el techo
    // pedido y su techo (salaryMax o el propio salary) alcanza el piso pedido.
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
    // La página se hidrata por los ids ya ordenados (sin skip/take).
    expect(prisma.ad.findMany.mock.calls[1][0].where).toEqual({
      id: { in: ['a1'] },
    });
    // Adjunta la calificación del publicante.
    expect(res.items[0]).toMatchObject({ ownerRating: { average: 4.5, count: 2 } });
    expect(res.total).toBe(1);
    expect(res.totalPages).toBe(1);
  });

  it('sin reseñas, ownerRating queda en 0', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany
      .mockResolvedValueOnce([rankRow('a1', null, 0)])
      .mockResolvedValueOnce([{ id: 'a1', createdById: 'u1' }]);
    prisma.review.groupBy.mockResolvedValue([]);
    const res = await service.findAll({} as never);
    expect(res.items[0]).toMatchObject({ ownerRating: { average: null, count: 0 } });
  });

  it('sin resultados no hidrata la página', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany.mockResolvedValueOnce([]);
    const res = await service.findAll({} as never);
    expect(prisma.ad.findMany).toHaveBeenCalledTimes(1);
    expect(res).toMatchObject({ items: [], total: 0, totalPages: 0 });
  });
});

describe('AdsService.findAll — filtro de sueldo con rangos', () => {
  it('solo el piso pedido: el techo del anuncio puede ser su rango', async () => {
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

  it('solo el techo pedido: se compara contra el piso del anuncio', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany.mockResolvedValueOnce([]);
    await service.findAll({ salaryMax: 2000 } as never);
    const where = prisma.ad.findMany.mock.calls[0][0].where;
    expect(where.salary).toEqual({ lte: 2000 });
    expect(where.AND).toBeUndefined();
  });
});

describe('AdsService.facets', () => {
  it('el techo del deslizador considera los rangos salariales', async () => {
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

describe('AdsService.findAll — orden por relevancia', () => {
  // salario definido → más accesos → más datos completos → más reciente.
  const rows = [
    rankRow('sin-salario-popular', null, 99, {
      location: 'Centro',
      category: 'VENTAS',
    }),
    rankRow('salario-pocos-accesos', 900, 1),
    rankRow('salario-completo', 700, 5, {
      location: 'Miraflores',
      schedule: '8 a 16',
    }),
    rankRow('salario-incompleto', 800, 5),
  ];

  it('ordena por salario definido, accesos y completitud', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany
      .mockResolvedValueOnce(rows)
      .mockResolvedValueOnce([]);
    await service.findAll({} as never);

    expect(prisma.ad.findMany.mock.calls[1][0].where.id.in).toEqual([
      'salario-completo', // empata en accesos con el incompleto y gana por datos
      'salario-incompleto',
      'salario-pocos-accesos',
      'sin-salario-popular', // sin salario va al final aunque tenga más accesos
    ]);
  });

  it('el orden de la página se respeta aunque la BD devuelva otro', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany.mockResolvedValueOnce(rows).mockResolvedValueOnce([
      { id: 'salario-incompleto', createdById: 'u1' },
      { id: 'salario-completo', createdById: 'u1' },
    ]);
    const res = await service.findAll({ limit: 2 } as never);
    expect(res.items.map((i: { id: string }) => i.id)).toEqual([
      'salario-completo',
      'salario-incompleto',
    ]);
    expect(res.total).toBe(4);
    expect(res.totalPages).toBe(2);
  });

  it('la prioridad manual manda sobre salario, accesos y completitud', async () => {
    const { service, prisma } = buildService();
    const priorizado = rankRow('sin-salario-priorizado', null, 0, { priority: 5 });
    prisma.ad.findMany
      .mockResolvedValueOnce([...rows, priorizado])
      .mockResolvedValueOnce([]);
    await service.findAll({} as never);

    const ids = prisma.ad.findMany.mock.calls[1][0].where.id.in;
    expect(ids[0]).toBe('sin-salario-priorizado');
    // El resto conserva el orden por relevancia.
    expect(ids.slice(1)).toEqual([
      'salario-completo',
      'salario-incompleto',
      'salario-pocos-accesos',
      'sin-salario-popular',
    ]);
  });

  it('entre priorizados gana el de mayor prioridad', async () => {
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

  it('la segunda página sigue el mismo ranking', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany
      .mockResolvedValueOnce(rows)
      .mockResolvedValueOnce([{ id: 'salario-pocos-accesos', createdById: 'u1' }]);
    await service.findAll({ page: 3, limit: 1 } as never);
    expect(prisma.ad.findMany.mock.calls[1][0].where.id.in).toEqual([
      'salario-pocos-accesos',
    ]);
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
    // Días de Bolivia (UTC-4): el filtro abarca del 1 al 10 en hora local.
    expect(where.createdAt.gte).toEqual(new Date('2026-07-01T04:00:00.000Z'));
    expect(where.createdAt.lte).toEqual(new Date('2026-07-11T03:59:59.999Z'));
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

  it('lista los priorizados primero y luego los más recientes', async () => {
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

describe('AdsService — la prioridad es solo del panel', () => {
  it('el listado público no expone la prioridad', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany
      .mockResolvedValueOnce([rankRow('a1', 500, 1, { priority: 4 })])
      .mockResolvedValueOnce([{ id: 'a1', createdById: 'u1', priority: 4 }]);
    const res = await service.findAll({} as never);
    expect(res.items[0]).not.toHaveProperty('priority');
    // El portal solo sabe que va destacado, no en qué posición.
    expect(res.items[0]).toHaveProperty('featured', true);
  });

  it('sin prioridad el anuncio no va destacado', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany
      .mockResolvedValueOnce([rankRow('a1', 500, 1)])
      .mockResolvedValueOnce([{ id: 'a1', createdById: 'u1', priority: 0 }]);
    const res = await service.findAll({} as never);
    expect(res.items[0]).toHaveProperty('featured', false);
  });

  it('el detalle público y los anuncios propios tampoco', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue({ ...existingAd, priority: 4 });
    const detail = await service.findOnePublic('a1', owner);
    expect(detail).not.toHaveProperty('priority');

    prisma.ad.findMany.mockResolvedValue([{ ...existingAd, priority: 4 }]);
    const mine = await service.findMine('u1');
    expect(mine[0]).not.toHaveProperty('priority');
  });

  it('el visitante anónimo ve el destacado pero no la prioridad', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue({ ...existingAd, priority: 4 });
    const detail = await service.findOnePublic('a1', null);
    expect(detail).not.toHaveProperty('priority');
    expect(detail).toHaveProperty('featured', true);
  });

  it('el detalle sí la incluye para el admin (la edita en el formulario)', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue({ ...existingAd, priority: 4 });
    const detail = await service.findOnePublic('a1', admin);
    expect(detail).toHaveProperty('priority', 4);
  });

  it('el listado del panel sí la incluye (la tabla la edita)', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findMany.mockResolvedValue([{ ...existingAd, priority: 4, createdById: 'u1' }]);
    prisma.ad.count.mockResolvedValue(1);
    const res = await service.findAllAdmin({} as never);
    expect(res.items[0]).toHaveProperty('priority', 4);
  });

  it('descarta la prioridad que manda un cliente al publicar', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ emailVerified: true });
    prisma.ad.create.mockResolvedValue({ ...existingAd, createdBy: existingAd.createdBy });
    await service.create({ ...(dto as object), priority: 9 } as never, owner);
    expect(prisma.ad.create.mock.calls[0][0].data.priority).toBeUndefined();
  });

  it('el admin sí puede fijarla al publicar', async () => {
    const { service, prisma } = buildService();
    prisma.ad.create.mockResolvedValue({ ...existingAd, createdBy: existingAd.createdBy });
    await service.create({ ...(dto as object), priority: 9 } as never, admin);
    expect(prisma.ad.create.mock.calls[0][0].data.priority).toBe(9);
  });

  it('descarta la prioridad que manda el dueño al editar su anuncio', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(existingAd);
    prisma.ad.update.mockResolvedValue(existingAd);
    await service.update('a1', { priority: 9 } as never, owner);
    expect(prisma.ad.update.mock.calls[0][0].data.priority).toBeUndefined();
  });

  it('el admin cambia la prioridad de cualquier anuncio', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(existingAd);
    prisma.ad.update.mockResolvedValue(existingAd);
    await service.update('a1', { priority: 7 } as never, admin);
    expect(prisma.ad.update.mock.calls[0][0].data.priority).toBe(7);
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
