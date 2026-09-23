import { describe, it, expect } from 'vitest';
import { Ad } from './types';
import { sortAds } from './sort';

// Minimal ad with only what `sortAds` looks at. The rest of the type plays no
// part in the order, so it is filled with a stub and cast.
function makeAd(
  id: string,
  options: { days?: number; salary?: string | null; featured?: boolean } = {},
): Ad {
  const { days = 0, salary = null, featured = false } = options;
  return {
    id,
    createdAt: new Date(Date.UTC(2026, 0, 1 + days)).toISOString(),
    salary,
    featured,
  } as unknown as Ad;
}

const ids = (list: Ad[]) => list.map((a) => a.id);

describe('sortAds: featured ads go first', () => {
  it('an old featured ad heads the newest-first order', () => {
    // The regression this covers: the backend returns the featured ad first
    // and the client re-sorted the whole list by date, so the ad prioritized
    // from the panel sank down to its date.
    const list = [
      makeAd('featured-old', { days: 0, featured: true }),
      makeAd('new', { days: 10 }),
      makeAd('mid', { days: 5 }),
    ];

    expect(ids(sortAds(list, 'newest'))).toEqual([
      'featured-old',
      'new',
      'mid',
    ]);
  });

  it('featured ads keep their place with any sort option', () => {
    const list = [
      makeAd('featured', { days: 0, salary: '1000', featured: true }),
      makeAd('pricey', { days: 1, salary: '9000' }),
      makeAd('cheap', { days: 2, salary: '2000' }),
    ];

    expect(ids(sortAds(list, 'salary-desc'))[0]).toBe('featured');
    expect(ids(sortAds(list, 'salary-asc'))[0]).toBe('featured');
    expect(ids(sortAds(list, 'oldest'))[0]).toBe('featured');
  });

  it('among featured ads arrival order rules, not the chosen option', () => {
    // The numeric priority isn't sent to the portal: the API returns them
    // already sorted by descending priority, and that position is the only
    // thing that remembers it. Here 'prio-high' arrives first even though it
    // is the oldest and the worst paid, and it has to stay first.
    const list = [
      makeAd('prio-high', { days: 0, salary: '100', featured: true }),
      makeAd('prio-low', { days: 9, salary: '9000', featured: true }),
      makeAd('normal', { days: 5, salary: '5000' }),
    ];

    expect(ids(sortAds(list, 'newest'))).toEqual([
      'prio-high',
      'prio-low',
      'normal',
    ]);
    expect(ids(sortAds(list, 'salary-desc'))).toEqual([
      'prio-high',
      'prio-low',
      'normal',
    ]);
  });

  it('the chosen option still rules among non-featured ads', () => {
    const list = [
      makeAd('featured', { days: 3, featured: true }),
      makeAd('old', { days: 0, salary: '1000' }),
      makeAd('new', { days: 9, salary: '3000' }),
      makeAd('mid', { days: 5, salary: '2000' }),
    ];

    expect(ids(sortAds(list, 'newest'))).toEqual([
      'featured',
      'new',
      'mid',
      'old',
    ]);
    expect(ids(sortAds(list, 'oldest'))).toEqual([
      'featured',
      'old',
      'mid',
      'new',
    ]);
    expect(ids(sortAds(list, 'salary-desc'))).toEqual([
      'featured',
      'new',
      'mid',
      'old',
    ]);
  });

  it('without featured ads the order is the usual one', () => {
    const list = [
      makeAd('old', { days: 0 }),
      makeAd('new', { days: 9 }),
      makeAd('mid', { days: 5 }),
    ];

    expect(ids(sortAds(list, 'newest'))).toEqual([
      'new',
      'mid',
      'old',
    ]);
  });

  it('does not mutate the list it receives', () => {
    const list = [
      makeAd('a', { days: 0 }),
      makeAd('featured', { days: 1, featured: true }),
    ];

    sortAds(list, 'newest');

    expect(ids(list)).toEqual(['a', 'featured']);
  });

  it('ads without salary go last in both directions', () => {
    const list = [
      makeAd('no-salary', { days: 0, salary: null }),
      makeAd('pricey', { days: 1, salary: '9000' }),
      makeAd('cheap', { days: 2, salary: '1000' }),
    ];

    expect(ids(sortAds(list, 'salary-desc'))).toEqual([
      'pricey',
      'cheap',
      'no-salary',
    ]);
    expect(ids(sortAds(list, 'salary-asc'))).toEqual([
      'cheap',
      'pricey',
      'no-salary',
    ]);
  });
});
