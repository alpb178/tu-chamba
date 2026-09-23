import { describe, expect, it } from 'vitest';
import { groupSiteUrl, siteDomain } from './group-ticker';

describe('groupSiteUrl', () => {
  it('tags the link with the ticker campaign', () => {
    const url = new URL(groupSiteUrl('https://dandomuela.com'));
    expect(url.searchParams.get('utm_source')).toBe('tu-chamba');
    expect(url.searchParams.get('utm_medium')).toBe('cintillo');
    expect(url.searchParams.get('utm_campaign')).toBe('grupo-corpsc');
  });

  it('keeps the path and query params the URL already had', () => {
    const url = new URL(groupSiteUrl('https://corpsc.com/es?ref=home'));
    expect(url.pathname).toBe('/es');
    expect(url.searchParams.get('ref')).toBe('home');
  });

  it('is idempotent', () => {
    const once = groupSiteUrl('https://invoices.corpsc.com/');
    expect(groupSiteUrl(once)).toBe(once);
  });
});

describe('siteDomain', () => {
  it('shows the link without protocol or trailing slash', () => {
    expect(siteDomain('https://invoices.corpsc.com/')).toBe('invoices.corpsc.com');
  });

  it('strips the www', () => {
    expect(siteDomain('https://www.corpsc.com/es')).toBe('corpsc.com');
  });
});
