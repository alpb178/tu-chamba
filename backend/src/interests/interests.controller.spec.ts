import { InterestsController } from './interests.controller';
const u = { id: 'u1', email: 'u@t.com', isAdmin: false };
function build() {
  const interests = { register: jest.fn(), findMine: jest.fn(), status: jest.fn(), remove: jest.fn() };
  return { c: new InterestsController(interests as never), interests };
}
describe('InterestsController (delegación)', () => {
  it('delega registrar/listar/estado/quitar', () => {
    const { c, interests } = build();
    c.register({ adId: 'a1', contact: true } as never, u); expect(interests.register).toHaveBeenCalledWith('a1', u, true);
    c.findMine(u); expect(interests.findMine).toHaveBeenCalledWith('u1');
    c.status('a1', u); expect(interests.status).toHaveBeenCalledWith('a1', 'u1');
    c.remove('a1', u); expect(interests.remove).toHaveBeenCalledWith('a1', 'u1');
  });
});
