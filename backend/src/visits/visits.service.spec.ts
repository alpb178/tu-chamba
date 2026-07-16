import { VisitsService } from './visits.service';

function buildService() {
  const prisma = {
    ad: { findUnique: jest.fn() },
    visit: { create: jest.fn() },
    pageView: { create: jest.fn() },
  };
  const service = new VisitsService(prisma as never);
  return { service, prisma };
}

describe('VisitsService.record', () => {
  it('registra la visita cuando el anuncio existe', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue({ id: 'a1' });

    await expect(service.record('a1')).resolves.toEqual({ ok: true });
    expect(prisma.visit.create).toHaveBeenCalledWith({ data: { adId: 'a1' } });
  });

  it('ignora anuncios inexistentes sin fallar', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(null);

    await expect(service.record('nope')).resolves.toEqual({ ok: true });
    expect(prisma.visit.create).not.toHaveBeenCalled();
  });
});

describe('VisitsService.recordPageView', () => {
  it('registra la página vista con la ruta', async () => {
    const { service, prisma } = buildService();

    await expect(service.recordPageView('/listings')).resolves.toEqual({
      ok: true,
    });
    expect(prisma.pageView.create).toHaveBeenCalledWith({
      data: { path: '/listings' },
    });
  });

  it('descarta query string y fragmento de la ruta', async () => {
    const { service, prisma } = buildService();

    await service.recordPageView('/listings?department=LA_PAZ#top');
    expect(prisma.pageView.create).toHaveBeenCalledWith({
      data: { path: '/listings' },
    });
  });

  it('recorta rutas más largas de 200 caracteres', async () => {
    const { service, prisma } = buildService();

    await service.recordPageView('/' + 'x'.repeat(300));
    const saved = prisma.pageView.create.mock.calls[0][0].data.path;
    expect(saved).toHaveLength(200);
  });
});
