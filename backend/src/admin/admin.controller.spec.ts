import { AdminController } from './admin.controller';
const a = { id: 'adm', email: 'a@t.com', isAdmin: true };
function build() {
  const admin = { stats: jest.fn(), topAds: jest.fn(), userActivity: jest.fn() };
  const traces = { findAll: jest.fn(), removeAll: jest.fn(), remove: jest.fn(), removeMany: jest.fn() };
  return { c: new AdminController(admin as never, traces as never), admin, traces };
}
describe('AdminController (delegación)', () => {
  it('delega KPIs y auditoría', () => {
    const { c, admin, traces } = build();
    c.stats(); expect(admin.stats).toHaveBeenCalled();
    c.topAds(); expect(admin.topAds).toHaveBeenCalled();
    c.userActivity({} as never); expect(admin.userActivity).toHaveBeenCalled();
    c.findTraces({} as never); expect(traces.findAll).toHaveBeenCalled();
    c.removeAllTraces(a); expect(traces.removeAll).toHaveBeenCalledWith(a);
    c.removeTrace('t1', a); expect(traces.remove).toHaveBeenCalledWith('t1', a);
    c.removeTraces({ ids: ['t'] } as never, a); expect(traces.removeMany).toHaveBeenCalledWith(['t'], a);
  });
});
