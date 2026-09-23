import { endOfDay, startOfDay } from './date-range';

describe('date-range — Bolivian calendar days', () => {
  it('the day starts at 00:00 Bolivia time (04:00 UTC)', () => {
    expect(startOfDay('2026-07-01')).toEqual(new Date('2026-07-01T04:00:00.000Z'));
  });

  it('the day ends at 23:59:59.999 Bolivia time (03:59 UTC the next day)', () => {
    expect(endOfDay('2026-07-01')).toEqual(new Date('2026-07-02T03:59:59.999Z'));
  });

  it('a 21:00 Bolivia-time trace falls within its own day', () => {
    // 21:00 on July 1 in Bolivia = 01:00 UTC on July 2: with UTC days it
    // fell outside the "1st to 1st" filter.
    const trace = new Date('2026-07-02T01:00:00.000Z');
    expect(trace >= startOfDay('2026-07-01')).toBe(true);
    expect(trace <= endOfDay('2026-07-01')).toBe(true);
  });

  it('with a full timestamp the given instant is kept', () => {
    expect(startOfDay('2026-07-01T10:30:00.000Z')).toEqual(
      new Date('2026-07-01T10:30:00.000Z'),
    );
  });
});
