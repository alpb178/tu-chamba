import { endOfDay, startOfDay } from './date-range';

describe('date-range — días calendario de Bolivia', () => {
  it('el día empieza a las 00:00 de Bolivia (04:00 UTC)', () => {
    expect(startOfDay('2026-07-01')).toEqual(new Date('2026-07-01T04:00:00.000Z'));
  });

  it('el día termina a las 23:59:59.999 de Bolivia (03:59 UTC del siguiente)', () => {
    expect(endOfDay('2026-07-01')).toEqual(new Date('2026-07-02T03:59:59.999Z'));
  });

  it('una traza de las 21:00 de Bolivia cae dentro de su propio día', () => {
    // 21:00 del 1 de julio en Bolivia = 01:00 UTC del 2 de julio: con días
    // UTC quedaba fuera del filtro "del 1 al 1".
    const trace = new Date('2026-07-02T01:00:00.000Z');
    expect(trace >= startOfDay('2026-07-01')).toBe(true);
    expect(trace <= endOfDay('2026-07-01')).toBe(true);
  });

  it('con marca de tiempo completa se respeta el instante recibido', () => {
    expect(startOfDay('2026-07-01T10:30:00.000Z')).toEqual(
      new Date('2026-07-01T10:30:00.000Z'),
    );
  });
});
