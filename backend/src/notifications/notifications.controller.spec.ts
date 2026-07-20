import { NotificationsController } from './notifications.controller';
const u = { id: 'u1', email: 'u@t.com', isAdmin: false };
function build() {
  const notifications = { findMine: jest.fn(), markAllRead: jest.fn(), markRead: jest.fn() };
  return { c: new NotificationsController(notifications as never), notifications };
}
describe('NotificationsController (delegación)', () => {
  it('delega listar/marcar', () => {
    const { c, notifications } = build();
    c.findMine(u); expect(notifications.findMine).toHaveBeenCalledWith(u);
    c.markAllRead(u); expect(notifications.markAllRead).toHaveBeenCalledWith('u1');
    c.markRead('n1', u); expect(notifications.markRead).toHaveBeenCalledWith('n1', 'u1');
  });
});
