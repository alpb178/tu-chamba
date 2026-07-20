import { ReviewsController } from './reviews.controller';
const u = { id: 'u1', email: 'u@t.com', isAdmin: false };
const a = { id: 'adm', email: 'a@t.com', isAdmin: true };
function build() {
  const reviews = {
    create: jest.fn(), findAllAdmin: jest.fn(), findByOwner: jest.fn(),
    removeMany: jest.fn(), update: jest.fn(), removeAll: jest.fn(), remove: jest.fn(),
  };
  return { c: new ReviewsController(reviews as never), reviews };
}
describe('ReviewsController (delegación)', () => {
  it('delega crear/moderar/leer', () => {
    const { c, reviews } = build();
    c.create({} as never, u); expect(reviews.create).toHaveBeenCalledWith({}, 'u1');
    c.findAllAdmin({} as never); expect(reviews.findAllAdmin).toHaveBeenCalled();
    c.findByOwner({ ownerId: 'o', page: 1, limit: 20 } as never, u); expect(reviews.findByOwner).toHaveBeenCalled();
    c.removeMany({ ids: ['r'] } as never, a); expect(reviews.removeMany).toHaveBeenCalledWith(['r'], a);
    c.update('r1', {} as never, a); expect(reviews.update).toHaveBeenCalledWith('r1', {}, a);
    c.removeAll(a); expect(reviews.removeAll).toHaveBeenCalledWith(a);
    c.remove('r1', u); expect(reviews.remove).toHaveBeenCalledWith('r1', u);
  });
});
