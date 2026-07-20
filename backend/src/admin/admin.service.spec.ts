import { AdminService } from './admin.service';

const MIN = 60_000;
const HOUR = 60 * MIN;

function buildService() {
  const prisma = {
    user: { count: jest.fn(), findMany: jest.fn() },
    ad: { count: jest.fn(), findMany: jest.fn() },
    visit: { count: jest.fn(), findMany: jest.fn(), groupBy: jest.fn() },
    pageView: { count: jest.fn(), findMany: jest.fn(), groupBy: jest.fn() },
  };
  const service = new AdminService(prisma as never);
  return { service, prisma };
}

describe('AdminService.userActivity (sesionización)', () => {
  it('excluye administradores del filtro base', async () => {
    const { service, prisma } = buildService();
    prisma.user.findMany.mockResolvedValue([]);
    prisma.pageView.groupBy.mockResolvedValue([]);
    prisma.pageView.findMany.mockResolvedValue([]);

    await service.userActivity({});
    expect(prisma.user.findMany.mock.calls[0][0].where).toEqual({
      isAdmin: false,
    });
  });

  it('agrega búsqueda por nombre o correo', async () => {
    const { service, prisma } = buildService();
    prisma.user.findMany.mockResolvedValue([]);
    prisma.pageView.groupBy.mockResolvedValue([]);
    prisma.pageView.findMany.mockResolvedValue([]);

    await service.userActivity({ search: '  ana ' });
    const where = prisma.user.findMany.mock.calls[0][0].where;
    expect(where.OR).toEqual([
      { name: { contains: 'ana', mode: 'insensitive' } },
      { email: { contains: 'ana', mode: 'insensitive' } },
    ]);
  });

  it('arma dos sesiones separadas por un hueco > 30 min y suma la estancia', async () => {
    const { service, prisma } = buildService();
    const now = Date.now();
    prisma.user.findMany.mockResolvedValue([
      { id: 'u1', name: 'Ana', email: 'a@t.com', phone: null, createdAt: new Date(now) },
    ]);
    const last = new Date(now - 55 * MIN);
    prisma.pageView.groupBy.mockResolvedValue([{ userId: 'u1', _max: { createdAt: last } }]);
    // Sesión A: -120, -115, -110 (10 min). Hueco de 50 min. Sesión B: -60, -55 (5 min).
    prisma.pageView.findMany.mockResolvedValue(
      [now - 120 * MIN, now - 115 * MIN, now - 110 * MIN, now - 60 * MIN, now - 55 * MIN].map(
        (t) => ({ userId: 'u1', createdAt: new Date(t) }),
      ),
    );

    const res = await service.userActivity({});
    const item = res.items[0];
    expect(item.sessionsLast30Days).toBe(2);
    expect(item.totalMinutesLast30Days).toBe(15); // 10 + 5
    expect(item.avgSessionMinutes).toBe(8); // round(15/2)
    expect(item.lastVisitAt).toBe(last);
    expect(res.total).toBe(1);
  });

  it('una sola vista cuenta como 1 sesión de 0 minutos', async () => {
    const { service, prisma } = buildService();
    const now = Date.now();
    prisma.user.findMany.mockResolvedValue([
      { id: 'u1', name: 'Ana', email: 'a@t.com', phone: null, createdAt: new Date(now) },
    ]);
    prisma.pageView.groupBy.mockResolvedValue([
      { userId: 'u1', _max: { createdAt: new Date(now - HOUR) } },
    ]);
    prisma.pageView.findMany.mockResolvedValue([
      { userId: 'u1', createdAt: new Date(now - HOUR) },
    ]);

    const res = await service.userActivity({});
    expect(res.items[0].sessionsLast30Days).toBe(1);
    expect(res.items[0].totalMinutesLast30Days).toBe(0);
    expect(res.items[0].avgSessionMinutes).toBe(0);
  });

  it('usuario sin visitas: 0 sesiones y última visita null', async () => {
    const { service, prisma } = buildService();
    prisma.user.findMany.mockResolvedValue([
      { id: 'u1', name: 'Ana', email: 'a@t.com', phone: null, createdAt: new Date() },
    ]);
    prisma.pageView.groupBy.mockResolvedValue([]);
    prisma.pageView.findMany.mockResolvedValue([]);

    const res = await service.userActivity({});
    expect(res.items[0].sessionsLast30Days).toBe(0);
    expect(res.items[0].lastVisitAt).toBeNull();
  });

  it('ordena por última visita descendente (sin visitas al final)', async () => {
    const { service, prisma } = buildService();
    const now = Date.now();
    prisma.user.findMany.mockResolvedValue([
      { id: 'sinVisita', name: 'Z', email: 'z@t.com', phone: null, createdAt: new Date(now) },
      { id: 'reciente', name: 'A', email: 'a@t.com', phone: null, createdAt: new Date(now) },
      { id: 'viejo', name: 'B', email: 'b@t.com', phone: null, createdAt: new Date(now) },
    ]);
    prisma.pageView.groupBy.mockResolvedValue([
      { userId: 'reciente', _max: { createdAt: new Date(now - MIN) } },
      { userId: 'viejo', _max: { createdAt: new Date(now - 10 * HOUR) } },
    ]);
    prisma.pageView.findMany.mockResolvedValue([]);

    const res = await service.userActivity({});
    expect(res.items.map((i) => i.id)).toEqual(['reciente', 'viejo', 'sinVisita']);
  });

  it('pagina el listado ya ordenado', async () => {
    const { service, prisma } = buildService();
    const users = Array.from({ length: 5 }, (_, i) => ({
      id: `u${i}`,
      name: `N${i}`,
      email: `e${i}@t.com`,
      phone: null,
      createdAt: new Date(Date.now() - i * 1000),
    }));
    prisma.user.findMany.mockResolvedValue(users);
    prisma.pageView.groupBy.mockResolvedValue([]);
    prisma.pageView.findMany.mockResolvedValue([]);

    const res = await service.userActivity({ page: 2, limit: 2 });
    expect(res.items).toHaveLength(2);
    expect(res.total).toBe(5);
    expect(res.totalPages).toBe(3);
    expect(res.page).toBe(2);
  });
});

describe('AdminService.stats', () => {
  it('agrega usuarios (sin admins), anuncios y visitas por día/hora', async () => {
    const { service, prisma } = buildService();
    const now = Date.now();
    prisma.user.count.mockResolvedValueOnce(10).mockResolvedValueOnce(3); // total, admins
    prisma.user.findMany.mockResolvedValue([{ createdAt: new Date(now) }]); // recentUsers (no admins)
    prisma.ad.count.mockResolvedValue(20);
    prisma.ad.findMany.mockResolvedValue([{ createdAt: new Date(now) }]);
    prisma.visit.count.mockResolvedValueOnce(100).mockResolvedValueOnce(5);
    prisma.visit.findMany.mockResolvedValue([{ createdAt: new Date(now) }]);
    prisma.pageView.count.mockResolvedValueOnce(200).mockResolvedValueOnce(8);
    prisma.pageView.findMany.mockResolvedValue([{ createdAt: new Date(now) }]);

    const res = await service.stats();
    expect(res.users).toMatchObject({ total: 10, admins: 3 });
    expect(res.users.byDay).toHaveLength(14);
    expect(res.ads.total).toBe(20);
    expect(res.visits.total).toBe(100);
    expect(res.siteVisits.total).toBe(200);
    // 24 franjas horarias.
    expect(res.siteVisits.byHour).toHaveLength(24);
    expect(res.siteVisits.byHour.reduce((s, h) => s + h.total, 0)).toBe(1);
    // Los registros por día solo miran usuarios no admin.
    expect(prisma.user.findMany.mock.calls[0][0].where.isAdmin).toBe(false);
  });
});

describe('AdminService.topAds', () => {
  it('conserva el orden del ranking y descarta anuncios ya borrados', async () => {
    const { service, prisma } = buildService();
    prisma.visit.groupBy
      // primer groupBy: totales por anuncio (orden del ranking)
      .mockResolvedValueOnce([
        { adId: 'a1', _count: { _all: 30 } },
        { adId: 'a2', _count: { _all: 20 } },
        { adId: 'borrado', _count: { _all: 15 } },
      ])
      // segundo groupBy: últimos 7 días
      .mockResolvedValueOnce([{ adId: 'a1', _count: { _all: 7 } }]);
    // 'borrado' no vuelve del findMany -> se excluye del ranking.
    prisma.ad.findMany.mockResolvedValue([
      { id: 'a1', createdBy: { id: 'o', name: 'O', email: 'o@t' } },
      { id: 'a2', createdBy: { id: 'o', name: 'O', email: 'o@t' } },
    ]);

    const res = await service.topAds();
    expect(res.map((r) => r.id)).toEqual(['a1', 'a2']);
    expect(res[0]).toMatchObject({ visitsTotal: 30, visitsLast7Days: 7 });
    expect(res[1]).toMatchObject({ visitsTotal: 20, visitsLast7Days: 0 });
  });
});
