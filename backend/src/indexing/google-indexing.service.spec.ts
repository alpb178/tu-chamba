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
});
