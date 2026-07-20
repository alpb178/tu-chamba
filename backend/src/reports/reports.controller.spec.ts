import { ReportsController } from './reports.controller';
const u = { id: 'u1', email: 'u@t.com', isAdmin: false };
const a = { id: 'adm', email: 'a@t.com', isAdmin: true };
function build() {
  const reports = {
    create: jest.fn(), findAll: jest.fn(), resolve: jest.fn(),
    removeAll: jest.fn(), remove: jest.fn(), removeMany: jest.fn(),
  };
  return { c: new ReportsController(reports as never), reports };
}
describe('ReportsController (delegación)', () => {
  it('delega la cola de reportes', () => {
    const { c, reports } = build();
    c.create({} as never, u); expect(reports.create).toHaveBeenCalledWith({}, u);
    c.findAll('PENDIENTE' as never); expect(reports.findAll).toHaveBeenCalledWith('PENDIENTE');
    c.resolve('r1', { status: 'ATENDIDO' } as never, a); expect(reports.resolve).toHaveBeenCalledWith('r1', 'ATENDIDO', a);
    c.removeAll(a); expect(reports.removeAll).toHaveBeenCalledWith(a);
    c.remove('r1', a); expect(reports.remove).toHaveBeenCalledWith('r1', a);
    c.removeMany({ ids: ['r'] } as never, a); expect(reports.removeMany).toHaveBeenCalledWith(['r'], a);
  });
});
