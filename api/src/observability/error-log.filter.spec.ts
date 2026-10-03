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
  it('persists 5xx errors to the log', () => {
    const errors = { record: jest.fn() };
    const filter = new ErrorLogFilter(errors as never);
    // Keeps the base filter from actually trying to respond.
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

  it('does not log 4xx (client) errors', () => {
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
