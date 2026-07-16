import { GoogleIndexingService } from './google-indexing.service';

describe('GoogleIndexingService', () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
    jest.restoreAllMocks();
  });

  it('sin credenciales configuradas es un no-op (no llama a la red)', async () => {
    process.env = { ...env };
    delete process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
    delete process.env.GOOGLE_INDEXING_PRIVATE_KEY;
    const fetchSpy = jest.spyOn(global, 'fetch');

    const service = new GoogleIndexingService();
    await service.notifyUpdated('a1');

    expect(service.enabled).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('un fallo de red no se propaga (best-effort)', async () => {
    process.env = {
      ...env,
      GOOGLE_INDEXING_CLIENT_EMAIL: 'svc@proyecto.iam.gserviceaccount.com',
      GOOGLE_INDEXING_PRIVATE_KEY: 'clave-invalida',
    };
    jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new Error('sin red'));

    const service = new GoogleIndexingService();
    await expect(service.notifyDeleted('a1')).resolves.toBeUndefined();
  });
});
