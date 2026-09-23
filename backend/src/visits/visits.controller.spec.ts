import { BadRequestException } from '@nestjs/common';
import { VisitsController } from './visits.controller';
function build() {
  const visits = { record: jest.fn(), recordPageView: jest.fn() };
  return { c: new VisitsController(visits as never), visits };
}
describe('VisitsController', () => {
  it('with adId records the ad visit', () => {
    const { c, visits } = build();
    c.record({ adId: 'a1' } as never, null);
    expect(visits.record).toHaveBeenCalledWith('a1');
  });
  it('with path records the page view passing the session userId', () => {
    const { c, visits } = build();
    c.record({ path: '/x' } as never, { id: 'u1' } as never);
    expect(visits.recordPageView).toHaveBeenCalledWith('/x', 'u1');
  });
  it('without adId or path throws 400', () => {
    const { c } = build();
    expect(() => c.record({} as never, null)).toThrow(BadRequestException);
  });
});
