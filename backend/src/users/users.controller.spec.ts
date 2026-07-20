import { UsersController } from './users.controller';
const a = { id: 'adm', email: 'a@t.com', isAdmin: true };
function build() {
  const users = {
    updateProfile: jest.fn(), findAll: jest.fn(), createAdmin: jest.fn(),
    adminUpdate: jest.fn(), setAdmin: jest.fn(), removeAllClients: jest.fn(),
    remove: jest.fn(), removeMany: jest.fn(),
  };
  return { c: new UsersController(users as never), users };
}
describe('UsersController (delegación)', () => {
  it('delega cada endpoint al servicio con el actor correcto', () => {
    const { c, users } = build();
    c.updateProfile(a, {} as never); expect(users.updateProfile).toHaveBeenCalledWith('adm', {});
    c.findAll(); expect(users.findAll).toHaveBeenCalled();
    c.createAdmin({} as never, a); expect(users.createAdmin).toHaveBeenCalledWith({}, a);
    c.update('u1', {} as never, a); expect(users.adminUpdate).toHaveBeenCalledWith('u1', {}, a);
    c.setAdmin('u1', { isAdmin: true } as never, a); expect(users.setAdmin).toHaveBeenCalledWith('u1', true, a);
    c.removeAll(a); expect(users.removeAllClients).toHaveBeenCalledWith(a);
    c.remove('u1', a); expect(users.remove).toHaveBeenCalledWith('u1', a);
    c.removeMany({ ids: ['u1'] } as never, a); expect(users.removeMany).toHaveBeenCalledWith(['u1'], a);
  });
});
