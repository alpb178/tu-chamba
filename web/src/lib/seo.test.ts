import { describe, it, expect } from 'vitest';
import {
  adTitle,
  jsonLd,
  jobPostingJsonLd,
  webSiteJsonLd,
  organizationJsonLd,
  localePath,
  localeAlternates,
} from './seo';

describe('adTitle', () => {
  it('uses the title when present', () => {
    expect(adTitle({ title: 'Vendedor', description: 'x' })).toBe('Vendedor');
  });
  it('without a title takes the first part (before |) if it is 10-90 chars', () => {
    expect(
      adTitle({ title: '', description: 'Se busca cajero | zona centro' }),
    ).toBe('Se busca cajero');
  });
  it('truncates long descriptions without a valid heading', () => {
    const desc = 'x'.repeat(100);
    const res = adTitle({ title: '', description: desc });
    expect(res.endsWith('…')).toBe(true);
    expect(res.length).toBeLessThanOrEqual(71);
  });
});

describe('jsonLd (safe serialization)', () => {
  it('escapes "<" so it cannot close the <script> tag', () => {
    const out = jsonLd({ x: '</script><script>alert(1)' });
    expect(out).not.toContain('</script>');
    expect(out).toContain('\\u003c');
  });
});

describe('jobPostingJsonLd', () => {
  it('produces a JobPosting with title, dates and organization', () => {
    const ad = {
      id: 'a1',
      title: 'Mesero',
      description: 'Atención al cliente',
      requirements: 'Experiencia',
      jobType: 'DIARIA',
      createdAt: '2026-07-01T00:00:00.000Z',
      expiresAt: '2026-07-10T00:00:00.000Z',
      createdBy: { id: 'o', name: 'Bar Central', email: 'o@t.com' },
    } as never;
    const ld = jobPostingJsonLd(ad) as Record<string, unknown>;
    expect(ld['@type']).toBe('JobPosting');
    expect(ld.title).toBe('Mesero');
    expect((ld.description as string)).toContain('Requisitos: Experiencia');
    expect((ld.hiringOrganization as { name: string }).name).toBe('Bar Central');
  });
});

describe('locale URLs', () => {
  it('localePath prefixes the locale and drops the trailing slash of the home', () => {
    expect(localePath('es', '/')).toBe('/es');
    expect(localePath('en', '/listings/a1')).toBe('/en/listings/a1');
  });

  it('localeAlternates: self canonical plus hreflang for every locale and x-default', () => {
    expect(localeAlternates('en', '/jobs/la-paz')).toEqual({
      canonical: '/en/jobs/la-paz',
      languages: {
        es: '/es/jobs/la-paz',
        en: '/en/jobs/la-paz',
        'pt-BR': '/pt/jobs/la-paz',
        'x-default': '/es/jobs/la-paz',
      },
    });
  });

  it('jobPostingJsonLd points to the page in the given locale', () => {
    const ad = { id: 'a1', description: 'x', requirements: 'Experience', jobType: 'DIARIA' } as never;
    const ld = jobPostingJsonLd(ad, 'en') as Record<string, unknown>;
    expect(ld.url).toMatch(/\/en\/listings\/a1$/);
    expect(ld.description as string).toContain('Requirements: Experience');
    expect((jobPostingJsonLd(ad) as Record<string, unknown>).url).toMatch(/\/es\/listings\/a1$/);
    const pt = jobPostingJsonLd(ad, 'pt') as Record<string, unknown>;
    expect(pt.url).toMatch(/\/pt\/listings\/a1$/);
    expect(pt.description as string).toContain('Requisitos: Experience');
  });

  it('webSiteJsonLd declares the BCP 47 language of the locale', () => {
    expect((webSiteJsonLd('pt') as Record<string, unknown>).inLanguage).toBe('pt-BR');
    expect((webSiteJsonLd('pt') as Record<string, unknown>).url).toMatch(/\/pt$/);
  });
});

describe('site JSON-LD builders', () => {
  it('webSiteJsonLd declares a WebSite with a search action', () => {
    const ld = webSiteJsonLd() as Record<string, unknown>;
    expect(ld['@type']).toBe('WebSite');
    expect(ld).toHaveProperty('potentialAction');
  });
  it('organizationJsonLd declares the Organization', () => {
    const ld = organizationJsonLd() as Record<string, unknown>;
    expect(ld['@type']).toBe('Organization');
    expect(ld).toHaveProperty('name');
  });
});
