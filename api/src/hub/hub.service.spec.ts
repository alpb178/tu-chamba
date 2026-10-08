import { HubService } from './hub.service';

function buildService() {
  const prisma = { $queryRawUnsafe: jest.fn() };
  const service = new HubService(prisma as never);
  return { service, prisma };
}

describe('HubService.build', () => {
  it('sends only the signups metric, split by provider, with every day in range present', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRawUnsafe.mockResolvedValue([
      { day: '2026-03-01', provider: 'google', value: 2 },
      { day: '2026-03-01', provider: 'email', value: 1 },
      // 2026-03-02 has no rows at all: must still appear with zeros.
    ]);

    const payload = await service.build('2026-03-01', '2026-03-02');

    expect(payload).toMatchObject({
      schemaVersion: 1,
      project: 'tu-chamba',
      timezone: 'America/La_Paz',
      range: { from: '2026-03-01', to: '2026-03-02' },
      definitions: [{ key: 'signups', label: 'Altas', unit: 'count' }],
    });
    expect(payload.days).toEqual([
      {
        date: '2026-03-01',
        metrics: { signups: 3 },
        breakdowns: [
          { metric: 'signups', dimension: 'provider', values: { google: 2, email: 1 } },
        ],
      },
      {
        date: '2026-03-02',
        metrics: { signups: 0 },
        breakdowns: [
          { metric: 'signups', dimension: 'provider', values: { google: 0, email: 0 } },
        ],
      },
    ]);
    // No traffic metric (visits/page_views/...) is ever declared or sent:
    // that is owned by the events beacon pipeline.
    expect(payload.definitions).toHaveLength(1);
  });

  it('never sends a currency- or traffic-shaped definition', async () => {
    const { service, prisma } = buildService();
    prisma.$queryRawUnsafe.mockResolvedValue([]);

    const payload = await service.build('2026-03-01', '2026-03-01');

    const keys = payload.definitions.map((d) => d.key);
    expect(keys).toEqual(['signups']);
  });
});

describe('HubService.push', () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
    jest.restoreAllMocks();
  });

  it('is a no-op without HUB_URL/HUB_API_KEY configured (no network call, no query)', async () => {
    process.env = { ...env };
    delete process.env.HUB_URL;
    delete process.env.HUB_API_KEY;
    const { service, prisma } = buildService();
    const fetchSpy = jest.spyOn(global, 'fetch');

    await service.push();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('a network failure is not propagated (best-effort)', async () => {
    process.env = { ...env, HUB_URL: 'https://hub.test', HUB_API_KEY: 'k' };
    const { service, prisma } = buildService();
    prisma.$queryRawUnsafe.mockResolvedValue([]);
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('no network'));

    await expect(service.push()).resolves.toBeUndefined();
  });

  it('a non-ok response is not propagated either', async () => {
    process.env = { ...env, HUB_URL: 'https://hub.test', HUB_API_KEY: 'k' };
    const { service, prisma } = buildService();
    prisma.$queryRawUnsafe.mockResolvedValue([]);
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('bad request'),
    } as Response);

    await expect(service.push()).resolves.toBeUndefined();
  });

  it('posts to /api/ingest/metrics with the API key header', async () => {
    process.env = { ...env, HUB_URL: 'https://hub.test', HUB_API_KEY: 'secret' };
    const { service, prisma } = buildService();
    prisma.$queryRawUnsafe.mockResolvedValue([]);
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rowsWritten: 0, warnings: [] }),
    } as Response);

    await service.push();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://hub.test/api/ingest/metrics',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-Api-Key': 'secret' }),
      }),
    );
    const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(body.project).toBe('tu-chamba');
    expect(Object.keys(body.definitions[0])).toEqual(
      expect.arrayContaining(['key', 'label', 'unit']),
    );
    expect(body.definitions.map((d: { key: string }) => d.key)).toEqual(['signups']);
  });
});
