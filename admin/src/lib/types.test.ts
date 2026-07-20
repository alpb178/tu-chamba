import { describe, it, expect } from 'vitest';
import { adEffectiveStatus, formatUserAgent } from './types';

describe('adEffectiveStatus', () => {
  const future = new Date(Date.now() + 86400_000).toISOString();
  const past = new Date(Date.now() - 86400_000).toISOString();

  it('DADO_DE_BAJA manda sobre la vigencia', () => {
    expect(adEffectiveStatus({ status: 'DADO_DE_BAJA', expiresAt: future })).toBe(
      'DADO_DE_BAJA',
    );
  });
  it('activo vigente / vencido según expiresAt', () => {
    expect(adEffectiveStatus({ status: 'ACTIVO', expiresAt: future })).toBe('ACTIVO');
    expect(adEffectiveStatus({ status: 'ACTIVO', expiresAt: past })).toBe('VENCIDO');
  });
});

describe('formatUserAgent', () => {
  it('sin dato devuelve guion', () => {
    expect(formatUserAgent(null)).toBe('—');
  });
  it('detecta Chrome en móvil', () => {
    expect(
      formatUserAgent('Mozilla/5.0 (iPhone) AppleWebKit Chrome/126 Safari/537'),
    ).toBe('Chrome · Móvil');
  });
  it('detecta Firefox en escritorio', () => {
    expect(formatUserAgent('Mozilla/5.0 (Windows NT 10) Firefox/120')).toBe(
      'Firefox · Escritorio',
    );
  });
  it('Edge tiene prioridad sobre Chrome (comparten cadena)', () => {
    expect(
      formatUserAgent('Mozilla/5.0 Chrome/126 Edg/126 Safari/537'),
    ).toBe('Edge · Escritorio');
  });
});
