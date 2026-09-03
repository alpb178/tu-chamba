import { describe, it, expect } from 'vitest';
import { Ad } from './types';
import { sortAds } from './sort';

// Anuncio mínimo con lo único que mira `sortAds`. El resto del tipo no
// interviene en el orden, así que se completa con un molde y se castea.
function anuncio(
  id: string,
  opciones: { dias?: number; salary?: string | null; featured?: boolean } = {},
): Ad {
  const { dias = 0, salary = null, featured = false } = opciones;
  return {
    id,
    createdAt: new Date(Date.UTC(2026, 0, 1 + dias)).toISOString(),
    salary,
    featured,
  } as unknown as Ad;
}

const ids = (list: Ad[]) => list.map((a) => a.id);

describe('sortAds: los destacados van primero', () => {
  it('un destacado antiguo encabeza el orden por más recientes', () => {
    // La regresión que esto cubre: el backend devuelve el destacado primero y
    // el cliente volvía a ordenar la lista entera por fecha, así que el
    // anuncio priorizado desde el panel se hundía hasta su fecha.
    const lista = [
      anuncio('destacado-viejo', { dias: 0, featured: true }),
      anuncio('nuevo', { dias: 10 }),
      anuncio('medio', { dias: 5 }),
    ];

    expect(ids(sortAds(lista, 'recientes'))).toEqual([
      'destacado-viejo',
      'nuevo',
      'medio',
    ]);
  });

  it('mantienen su sitio con cualquier opción de orden', () => {
    const lista = [
      anuncio('destacado', { dias: 0, salary: '1000', featured: true }),
      anuncio('caro', { dias: 1, salary: '9000' }),
      anuncio('barato', { dias: 2, salary: '2000' }),
    ];

    expect(ids(sortAds(lista, 'salario-desc'))[0]).toBe('destacado');
    expect(ids(sortAds(lista, 'salario-asc'))[0]).toBe('destacado');
    expect(ids(sortAds(lista, 'antiguos'))[0]).toBe('destacado');
  });

  it('entre destacados manda el orden de llegada, no la opción elegida', () => {
    // La prioridad numérica no viaja al portal: la API los devuelve ya
    // ordenados por prioridad descendente, y esa posición es lo único que la
    // recuerda. Aquí «prio-alta» llega primero aunque sea el más antiguo y el
    // peor pagado, y tiene que seguir primero.
    const lista = [
      anuncio('prio-alta', { dias: 0, salary: '100', featured: true }),
      anuncio('prio-baja', { dias: 9, salary: '9000', featured: true }),
      anuncio('normal', { dias: 5, salary: '5000' }),
    ];

    expect(ids(sortAds(lista, 'recientes'))).toEqual([
      'prio-alta',
      'prio-baja',
      'normal',
    ]);
    expect(ids(sortAds(lista, 'salario-desc'))).toEqual([
      'prio-alta',
      'prio-baja',
      'normal',
    ]);
  });

  it('la opción elegida sigue mandando entre los no destacados', () => {
    const lista = [
      anuncio('destacado', { dias: 3, featured: true }),
      anuncio('viejo', { dias: 0, salary: '1000' }),
      anuncio('nuevo', { dias: 9, salary: '3000' }),
      anuncio('medio', { dias: 5, salary: '2000' }),
    ];

    expect(ids(sortAds(lista, 'recientes'))).toEqual([
      'destacado',
      'nuevo',
      'medio',
      'viejo',
    ]);
    expect(ids(sortAds(lista, 'antiguos'))).toEqual([
      'destacado',
      'viejo',
      'medio',
      'nuevo',
    ]);
    expect(ids(sortAds(lista, 'salario-desc'))).toEqual([
      'destacado',
      'nuevo',
      'medio',
      'viejo',
    ]);
  });

  it('sin destacados el orden es el de siempre', () => {
    const lista = [
      anuncio('viejo', { dias: 0 }),
      anuncio('nuevo', { dias: 9 }),
      anuncio('medio', { dias: 5 }),
    ];

    expect(ids(sortAds(lista, 'recientes'))).toEqual([
      'nuevo',
      'medio',
      'viejo',
    ]);
  });

  it('no toca la lista que recibe', () => {
    const lista = [
      anuncio('a', { dias: 0 }),
      anuncio('destacado', { dias: 1, featured: true }),
    ];

    sortAds(lista, 'recientes');

    expect(ids(lista)).toEqual(['a', 'destacado']);
  });

  it('los anuncios sin salario van al final en ambos sentidos', () => {
    const lista = [
      anuncio('a-convenir', { dias: 0, salary: null }),
      anuncio('caro', { dias: 1, salary: '9000' }),
      anuncio('barato', { dias: 2, salary: '1000' }),
    ];

    expect(ids(sortAds(lista, 'salario-desc'))).toEqual([
      'caro',
      'barato',
      'a-convenir',
    ]);
    expect(ids(sortAds(lista, 'salario-asc'))).toEqual([
      'barato',
      'caro',
      'a-convenir',
    ]);
  });
});
