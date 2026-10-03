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
  it('records the visit when the ad exists', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue({ id: 'a1' });

    await expect(service.record('a1')).resolves.toEqual({ ok: true });
    expect(prisma.visit.create).toHaveBeenCalledWith({ data: { adId: 'a1' } });
  });

  it('ignores nonexistent ads without failing', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(null);

    await expect(service.record('nope')).resolves.toEqual({ ok: true });
    expect(prisma.visit.create).not.toHaveBeenCalled();
  });
});

describe('VisitsService.recordPageView', () => {
  it('records the page view with the path', async () => {
    const { service, prisma } = buildService();

    await expect(service.recordPageView('/listings')).resolves.toEqual({
      ok: true,
    });
    // Without a session, the page view stays anonymous (userId null).
    expect(prisma.pageView.create).toHaveBeenCalledWith({
      data: { path: '/listings', userId: null },
    });
  });

  it('strips the query string and fragment from the path', async () => {
    const { service, prisma } = buildService();

    await service.recordPageView('/listings?department=LA_PAZ#top');
    expect(prisma.pageView.create).toHaveBeenCalledWith({
      data: { path: '/listings', userId: null },
    });
  });

  it('links the page view to the user when a session is present', async () => {
    const { service, prisma } = buildService();

    await service.recordPageView('/listings', 'user-1');
    expect(prisma.pageView.create).toHaveBeenCalledWith({
      data: { path: '/listings', userId: 'user-1' },
    });
  });

  it('truncates paths longer than 200 characters', async () => {
    const { service, prisma } = buildService();

    await service.recordPageView('/' + 'x'.repeat(300));
    const saved = prisma.pageView.create.mock.calls[0][0].data.path;
    expect(saved).toHaveLength(200);
  });
});
