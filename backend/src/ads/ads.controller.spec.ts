import { AdsController } from './ads.controller';

const u = { id: 'u1', email: 'u@t.com', isAdmin: false };
function build() {
  const ads = {
    findAll: jest.fn(), facets: jest.fn(), findAllAdmin: jest.fn(),
    findMine: jest.fn(), findOnePublic: jest.fn(), getContact: jest.fn(),
    create: jest.fn(), bulkCreate: jest.fn(), bulkRemove: jest.fn(),
    update: jest.fn(), unpublish: jest.fn(), republish: jest.fn(),
    removeAll: jest.fn(), remove: jest.fn(),
  };
  return { c: new AdsController(ads as never), ads };
}

describe('AdsController (delegación)', () => {
  it('delega las lecturas', () => {
    const { c, ads } = build();
    c.findAll({} as never); expect(ads.findAll).toHaveBeenCalled();
    c.facets(); expect(ads.facets).toHaveBeenCalled();
    c.findAllAdmin({} as never); expect(ads.findAllAdmin).toHaveBeenCalled();
    c.findMine(u); expect(ads.findMine).toHaveBeenCalledWith('u1');
    c.findOne('a1', u); expect(ads.findOnePublic).toHaveBeenCalledWith('a1', u);
    c.getContact('a1'); expect(ads.getContact).toHaveBeenCalledWith('a1');
  });
  it('delega las escrituras y pasa el actor', () => {
    const { c, ads } = build();
    c.create({} as never, u); expect(ads.create).toHaveBeenCalledWith({}, u);
    c.bulkCreate({ items: [1] } as never, u); expect(ads.bulkCreate).toHaveBeenCalledWith([1], u);
    c.bulkRemove({ ids: ['a'] } as never, u); expect(ads.bulkRemove).toHaveBeenCalledWith(['a'], u);
    c.update('a1', {} as never, u); expect(ads.update).toHaveBeenCalledWith('a1', {}, u);
    c.unpublish('a1', u); expect(ads.unpublish).toHaveBeenCalledWith('a1', u);
    c.republish('a1', u); expect(ads.republish).toHaveBeenCalledWith('a1', u);
    c.remove('a1', u); expect(ads.remove).toHaveBeenCalledWith('a1', u);
  });
  it('removeAll respeta clientsOnly=true', () => {
    const { c, ads } = build();
    c.removeAll(u, 'true'); expect(ads.removeAll).toHaveBeenCalledWith(u, true);
    c.removeAll(u, undefined); expect(ads.removeAll).toHaveBeenCalledWith(u, false);
  });
});
