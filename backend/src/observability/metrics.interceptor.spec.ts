import { HttpException } from '@nestjs/common';
import { of, throwError, lastValueFrom } from 'rxjs';
import { MetricsInterceptor } from './metrics.interceptor';

function ctx(user?: { id: string }) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
      getResponse: () => ({ statusCode: 200 }),
    }),
  } as never;
}

describe('MetricsInterceptor', () => {
  it('registra la solicitud exitosa con su código y el usuario', async () => {
    const metrics = { recordRequest: jest.fn() };
    const interceptor = new MetricsInterceptor(metrics as never);
    const next = { handle: () => of('ok') };
    await lastValueFrom(interceptor.intercept(ctx({ id: 'u1' }), next as never));
    expect(metrics.recordRequest).toHaveBeenCalledWith(
      expect.any(Number),
      200,
      'u1',
    );
  });

  it('registra el error con su estado HTTP', async () => {
    const metrics = { recordRequest: jest.fn() };
    const interceptor = new MetricsInterceptor(metrics as never);
    const next = { handle: () => throwError(() => new HttpException('no', 403)) };
    await expect(
      lastValueFrom(interceptor.intercept(ctx(), next as never)),
    ).rejects.toBeInstanceOf(HttpException);
    expect(metrics.recordRequest).toHaveBeenCalledWith(
      expect.any(Number),
      403,
      undefined,
    );
  });
});
