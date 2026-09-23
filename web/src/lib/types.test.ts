import { describe, it, expect } from 'vitest';
import {
  adEffectiveStatus,
  adPhones,
  salaryLabel,
  waLink,
  safeNext,
} from './types';

describe('adEffectiveStatus', () => {
  const future = new Date(Date.now() + 86400_000).toISOString();
  const past = new Date(Date.now() - 86400_000).toISOString();

  it('DADO_DE_BAJA takes precedence over validity', () => {
    expect(
      adEffectiveStatus({ status: 'DADO_DE_BAJA', expiresAt: future }),
    ).toBe('DADO_DE_BAJA');
  });
  it('ACTIVO with future expiry is ACTIVO', () => {
    expect(adEffectiveStatus({ status: 'ACTIVO', expiresAt: future })).toBe(
      'ACTIVO',
    );
  });
  it('ACTIVO with past expiry is VENCIDO', () => {
    expect(adEffectiveStatus({ status: 'ACTIVO', expiresAt: past })).toBe(
      'VENCIDO',
    );
  });
});

describe('salaryLabel (amount, range or "a convenir")', () => {
  it('uses the default text when there is no salary', () => {
    expect(salaryLabel({ salary: null })).toBe('A convenir');
    expect(salaryLabel({ salary: '' }, 'Salario a convenir')).toBe(
      'Salario a convenir',
    );
  });
  it('shows a fixed amount in Bs', () => {
    expect(salaryLabel({ salary: '3500' })).toBe('Bs 3.500');
  });
  it('shows the range when the ceiling exceeds the floor', () => {
    expect(salaryLabel({ salary: 3500, salaryMax: 4500 })).toBe(
      'Bs 3.500 a 4.500',
    );
  });
  it('a ceiling equal or lower is not a range', () => {
    expect(salaryLabel({ salary: 3500, salaryMax: 3500 })).toBe('Bs 3.500');
    expect(salaryLabel({ salary: 3500, salaryMax: 2000 })).toBe('Bs 3.500');
  });
});

describe('adPhones (contact numbers)', () => {
  it('puts the main one first and drops blanks and duplicates', () => {
    expect(
      adPhones({ phone: '70012345', extraPhones: ['', '70012345', '3467010'] }),
    ).toEqual(['70012345', '3467010']);
  });
  it('returns an empty list without a phone (anonymous visitor)', () => {
    expect(adPhones({ phone: undefined as unknown as string })).toEqual([]);
  });
});

describe('waLink (WhatsApp link)', () => {
  it('prepends 591 to an 8-digit local number', () => {
    expect(waLink('70012345')).toBe('https://wa.me/59170012345');
  });
  it('keeps a number in international format (+591…)', () => {
    expect(waLink('+59170012345')).toBe('https://wa.me/59170012345');
  });
  it('does not duplicate 591 when already present', () => {
    expect(waLink('59170012345')).toBe('https://wa.me/59170012345');
  });
  it('appends the encoded message', () => {
    expect(waLink('70012345', 'Hola & chau')).toContain(
      '?text=Hola%20%26%20chau',
    );
  });
});

describe('safeNext (open redirect protection)', () => {
  it('accepts internal routes', () => {
    expect(safeNext('/listings/123')).toBe('/listings/123');
  });
  it('rejects external absolute URLs', () => {
    expect(safeNext('https://evil.com')).toBe('/');
  });
  it('rejects the //host scheme (protocol-relative)', () => {
    expect(safeNext('//evil.com')).toBe('/');
  });
  it('null falls back to the root', () => {
    expect(safeNext(null)).toBe('/');
  });
});
