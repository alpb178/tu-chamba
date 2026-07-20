import { describe, it, expect } from 'vitest';
import { adEffectiveStatus, waLink, safeNext } from './types';

describe('adEffectiveStatus', () => {
  const future = new Date(Date.now() + 86400_000).toISOString();
  const past = new Date(Date.now() - 86400_000).toISOString();

  it('DADO_DE_BAJA manda sobre la vigencia', () => {
    expect(
      adEffectiveStatus({ status: 'DADO_DE_BAJA', expiresAt: future }),
    ).toBe('DADO_DE_BAJA');
  });
  it('ACTIVO con vigencia futura es ACTIVO', () => {
    expect(adEffectiveStatus({ status: 'ACTIVO', expiresAt: future })).toBe(
      'ACTIVO',
    );
  });
  it('ACTIVO con vigencia pasada es VENCIDO', () => {
    expect(adEffectiveStatus({ status: 'ACTIVO', expiresAt: past })).toBe(
      'VENCIDO',
    );
  });
});

describe('waLink (enlace de WhatsApp)', () => {
  it('antepone 591 a un número local de 8 dígitos', () => {
    expect(waLink('70012345')).toBe('https://wa.me/59170012345');
  });
  it('respeta el número en formato internacional (+591…)', () => {
    expect(waLink('+59170012345')).toBe('https://wa.me/59170012345');
  });
  it('no duplica el 591 si ya está presente', () => {
    expect(waLink('59170012345')).toBe('https://wa.me/59170012345');
  });
  it('adjunta el mensaje codificado', () => {
    expect(waLink('70012345', 'Hola & chau')).toContain(
      '?text=Hola%20%26%20chau',
    );
  });
});

describe('safeNext (protección contra open redirect)', () => {
  it('acepta rutas internas', () => {
    expect(safeNext('/listings/123')).toBe('/listings/123');
  });
  it('rechaza URLs absolutas externas', () => {
    expect(safeNext('https://evil.com')).toBe('/');
  });
  it('rechaza el esquema //host (protocol-relative)', () => {
    expect(safeNext('//evil.com')).toBe('/');
  });
  it('null cae a la raíz', () => {
    expect(safeNext(null)).toBe('/');
  });
});
