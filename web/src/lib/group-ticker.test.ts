import { describe, expect, it } from 'vitest';
import { groupSiteUrl, siteDomain } from './group-ticker';

describe('groupSiteUrl', () => {
  it('marca el enlace con la campaña del cintillo', () => {
    const url = new URL(groupSiteUrl('https://dandomuela.com'));
    expect(url.searchParams.get('utm_source')).toBe('tu-chamba');
    expect(url.searchParams.get('utm_medium')).toBe('cintillo');
    expect(url.searchParams.get('utm_campaign')).toBe('grupo-corpsc');
  });

  it('conserva la ruta y los parámetros que ya traía la URL', () => {
    const url = new URL(groupSiteUrl('https://corpsc.com/es?ref=home'));
    expect(url.pathname).toBe('/es');
    expect(url.searchParams.get('ref')).toBe('home');
  });

  it('es idempotente', () => {
    const once = groupSiteUrl('https://invoices.corpsc.com/');
    expect(groupSiteUrl(once)).toBe(once);
  });
});

describe('siteDomain', () => {
  it('muestra el enlace sin protocolo ni barra final', () => {
    expect(siteDomain('https://invoices.corpsc.com/')).toBe('invoices.corpsc.com');
  });

  it('quita el www', () => {
    expect(siteDomain('https://www.corpsc.com/es')).toBe('corpsc.com');
  });
});
