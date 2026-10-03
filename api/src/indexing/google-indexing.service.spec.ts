import { GoogleIndexingService } from './google-indexing.service';

describe('GoogleIndexingService', () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
    jest.restoreAllMocks();
  });

  it('is a no-op without configured credentials (no network call)', async () => {
    process.env = { ...env };
    delete process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
    delete process.env.GOOGLE_INDEXING_PRIVATE_KEY;
    const fetchSpy = jest.spyOn(global, 'fetch');

    const service = new GoogleIndexingService();
    await service.notifyUpdated('a1');

    expect(service.enabled).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('a network failure is not propagated (best-effort)', async () => {
    process.env = {
      ...env,
      GOOGLE_INDEXING_CLIENT_EMAIL: 'svc@project.iam.gserviceaccount.com',
      GOOGLE_INDEXING_PRIVATE_KEY: 'invalid-key',
    };
    jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new Error('no network'));

    const service = new GoogleIndexingService();
    await expect(service.notifyDeleted('a1')).resolves.toBeUndefined();
  });

  it('notifies the Spanish (locale-prefixed) URL of the listing', async () => {
    process.env = {
      ...env,
      WEB_URL: 'https://tu-chamba.test',
      GOOGLE_INDEXING_CLIENT_EMAIL: 'svc@project.iam.gserviceaccount.com',
      GOOGLE_INDEXING_PRIVATE_KEY: 'key',
    };
    jest
      .spyOn(GoogleIndexingService.prototype as never, 'accessToken' as never)
      .mockResolvedValue('tok' as never);
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true } as Response);

    await new GoogleIndexingService().notifyUpdated('a1');

    const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(body).toEqual({
      url: 'https://tu-chamba.test/es/listings/a1',
      type: 'URL_UPDATED',
    });
  });
});
