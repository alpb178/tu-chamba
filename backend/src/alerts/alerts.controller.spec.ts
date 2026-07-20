import { AlertsController } from './alerts.controller';
const u = { id: 'u1', email: 'u@t.com', isAdmin: false };
function build() {
  const alerts = { findMine: jest.fn(), create: jest.fn(), remove: jest.fn() };
  return { c: new AlertsController(alerts as never), alerts };
}
describe('AlertsController (delegación)', () => {
  it('delega listar/crear/quitar', () => {
    const { c, alerts } = build();
    c.findMine(u); expect(alerts.findMine).toHaveBeenCalledWith('u1');
    c.create({} as never, u); expect(alerts.create).toHaveBeenCalledWith({}, 'u1');
    c.remove('al1', u); expect(alerts.remove).toHaveBeenCalledWith('al1', u);
  });
});
