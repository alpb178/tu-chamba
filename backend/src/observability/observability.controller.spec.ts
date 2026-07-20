import { ObservabilityController } from './observability.controller';
function build() {
  const status = { services: jest.fn(), performance: jest.fn() };
  const errors = { findAll: jest.fn(), resolve: jest.fn(), removeAll: jest.fn(), remove: jest.fn(), removeMany: jest.fn() };
  return { c: new ObservabilityController(status as never, errors as never), status, errors };
}
describe('ObservabilityController (delegación)', () => {
  it('delega estado, métricas y registro de errores', () => {
    const { c, status, errors } = build();
    c.services(); expect(status.services).toHaveBeenCalled();
    c.metrics(); expect(status.performance).toHaveBeenCalled();
    c.findErrors({} as never); expect(errors.findAll).toHaveBeenCalled();
    c.resolveError('e1'); expect(errors.resolve).toHaveBeenCalledWith('e1');
    c.removeAllErrors(); expect(errors.removeAll).toHaveBeenCalled();
    c.removeError('e1'); expect(errors.remove).toHaveBeenCalledWith('e1');
    c.removeErrors({ ids: ['e'] } as never); expect(errors.removeMany).toHaveBeenCalledWith(['e']);
  });
});
