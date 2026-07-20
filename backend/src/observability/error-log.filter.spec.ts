import { HttpException } from '@nestjs/common';
import { ErrorLogFilter } from './error-log.filter';

function host() {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ originalUrl: '/api/x' }),
      getResponse: () => ({}),
    }),
    getArgByIndex: () => ({}),
  } as never;
}

describe('ErrorLogFilter', () => {
  it('persiste los errores 5xx en el registro', () => {
    const errors = { record: jest.fn() };
    const filter = new ErrorLogFilter(errors as never);
    // Evita que el filtro base intente responder de verdad.
    jest.spyOn(ErrorLogFilter.prototype, 'catch');
    const superCatch = jest
      .spyOn(Object.getPrototypeOf(ErrorLogFilter.prototype), 'catch')
      .mockImplementation(() => undefined);

    filter.catch(new Error('boom'), host());
    expect(errors.record).toHaveBeenCalledWith(
      'api',
      'boom',
      expect.objectContaining({ path: '/api/x' }),
    );
    superCatch.mockRestore();
  });

  it('no registra errores 4xx (cliente)', () => {
    const errors = { record: jest.fn() };
    const filter = new ErrorLogFilter(errors as never);
    const superCatch = jest
      .spyOn(Object.getPrototypeOf(ErrorLogFilter.prototype), 'catch')
      .mockImplementation(() => undefined);

    filter.catch(new HttpException('no', 404), host());
    expect(errors.record).not.toHaveBeenCalled();
    superCatch.mockRestore();
  });
});
