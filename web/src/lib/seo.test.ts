import { describe, it, expect } from 'vitest';
import {
  adTitle,
  jsonLd,
  jobPostingJsonLd,
  webSiteJsonLd,
  organizationJsonLd,
} from './seo';

describe('adTitle', () => {
  it('usa el título cuando existe', () => {
    expect(adTitle({ title: 'Vendedor', description: 'x' })).toBe('Vendedor');
  });
  it('sin título toma la primera parte (antes de |) si mide 10-90', () => {
    expect(
      adTitle({ title: '', description: 'Se busca cajero | zona centro' }),
    ).toBe('Se busca cajero');
  });
  it('recorta descripciones largas sin cabecera válida', () => {
    const desc = 'x'.repeat(100);
    const res = adTitle({ title: '', description: desc });
    expect(res.endsWith('…')).toBe(true);
    expect(res.length).toBeLessThanOrEqual(71);
  });
});

describe('jsonLd (serialización segura)', () => {
  it('escapa "<" para no cerrar la etiqueta <script>', () => {
    const out = jsonLd({ x: '</script><script>alert(1)' });
    expect(out).not.toContain('</script>');
    expect(out).toContain('\\u003c');
  });
});

describe('jobPostingJsonLd', () => {
  it('produce un JobPosting con título, fechas y organización', () => {
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

describe('builders JSON-LD del sitio', () => {
  it('webSiteJsonLd declara un WebSite con acción de búsqueda', () => {
    const ld = webSiteJsonLd() as Record<string, unknown>;
    expect(ld['@type']).toBe('WebSite');
    expect(ld).toHaveProperty('potentialAction');
  });
  it('organizationJsonLd declara la Organización', () => {
    const ld = organizationJsonLd() as Record<string, unknown>;
    expect(ld['@type']).toBe('Organization');
    expect(ld).toHaveProperty('name');
  });
});
