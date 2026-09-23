import { describe, it, expect } from 'vitest';
import { adEffectiveStatus, formatUserAgent } from './types';

describe('adEffectiveStatus', () => {
  const future = new Date(Date.now() + 86400_000).toISOString();
  const past = new Date(Date.now() - 86400_000).toISOString();

  it('DADO_DE_BAJA takes precedence over expiry', () => {
    expect(adEffectiveStatus({ status: 'DADO_DE_BAJA', expiresAt: future })).toBe(
      'DADO_DE_BAJA',
    );
  });
  it('active: current / expired depending on expiresAt', () => {
    expect(adEffectiveStatus({ status: 'ACTIVO', expiresAt: future })).toBe('ACTIVO');
    expect(adEffectiveStatus({ status: 'ACTIVO', expiresAt: past })).toBe('VENCIDO');
  });
});

describe('formatUserAgent', () => {
  it('returns a dash when there is no value', () => {
    expect(formatUserAgent(null)).toBe('—');
  });
  it('detects Chrome on mobile', () => {
    expect(
      formatUserAgent('Mozilla/5.0 (iPhone) AppleWebKit Chrome/126 Safari/537'),
    ).toBe('Chrome · Móvil');
  });
  it('detects Firefox on desktop', () => {
    expect(formatUserAgent('Mozilla/5.0 (Windows NT 10) Firefox/120')).toBe(
      'Firefox · Escritorio',
    );
  });
  it('Edge takes precedence over Chrome (they share a string)', () => {
    expect(
      formatUserAgent('Mozilla/5.0 Chrome/126 Edg/126 Safari/537'),
    ).toBe('Edge · Escritorio');
  });
});
