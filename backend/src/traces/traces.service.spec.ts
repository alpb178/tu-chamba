import { TracesService } from './traces.service';
import { requestContext } from './request-context';

function buildService() {
  const prisma = {
    trace: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  };
  const service = new TracesService(prisma as never);
  return { service, prisma };
}

describe('TracesService.record', () => {
  it('captura IP y user-agent del contexto del request', async () => {
    const { service, prisma } = buildService();

    await requestContext.run(
      { ip: '200.87.1.1', userAgent: 'Mozilla/5.0 Chrome/126', startedAt: Date.now() },
      () => service.record('LOGIN', 'Inicio de sesión de ana@test.com', {
        id: 'u1',
        email: 'ana@test.com',
      }),
    );

    expect(prisma.trace.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'LOGIN',
        ip: '200.87.1.1',
        userAgent: 'Mozilla/5.0 Chrome/126',
        actorEmail: 'ana@test.com',
        result: 'OK',
      }),
    });
  });

  it('guarda recurso y resultado cuando se indican', async () => {
    const { service, prisma } = buildService();

    await service.record('LOGIN', 'Intento fallido', { email: 'x@y.z' }, {
      result: 'ERROR',
    });
    await service.record('AD_CREATED', 'Anuncio publicado', { id: 'u1' }, {
      resource: 'ad:a1',
    });

    expect(prisma.trace.create.mock.calls[0][0].data).toMatchObject({
      result: 'ERROR',
      // Fuera de un request (p. ej. cron) no hay contexto: quedan nulos.
      ip: null,
      userAgent: null,
    });
    expect(prisma.trace.create.mock.calls[1][0].data).toMatchObject({
      resource: 'ad:a1',
      result: 'OK',
    });
  });

  it('no propaga errores de la base de datos (best-effort)', async () => {
    const { service, prisma } = buildService();
    prisma.trace.create.mockRejectedValue(new Error('BD caída'));

    await expect(service.record('LOGIN', 'x')).resolves.toBeUndefined();
  });
});

describe('TracesService.findAll', () => {
  it('aplica los filtros de tipo, resultado, actor y fechas', async () => {
    const { service, prisma } = buildService();
    prisma.trace.findMany.mockResolvedValue([]);
    prisma.trace.count.mockResolvedValue(0);

    await service.findAll({
      type: 'LOGIN',
      result: 'ERROR',
      actor: 'ana@',
      from: '2026-07-01',
      to: '2026-07-31',
      page: 1,
      limit: 20,
    } as never);

    const where = prisma.trace.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({
      type: 'LOGIN',
      result: 'ERROR',
      actorEmail: { contains: 'ana@', mode: 'insensitive' },
    });
    expect(where.createdAt.gte).toEqual(new Date('2026-07-01'));
    expect(where.createdAt.lte).toEqual(new Date('2026-07-31T23:59:59.999Z'));
  });
});
