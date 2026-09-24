import { describe, expect, it } from 'vitest';
import { isPrivatePath } from '@/lib/hub-tracker/click-target';
import { normalizePath } from '@/lib/hub-tracker/path';
import { locales } from '@/i18n/routing';
import { PATH_PATTERNS, PRIVATE_SEGMENTS } from './SiteAnalytics';

describe('hub analytics settings of Tu Chamba', () => {
  it.each(['/admin', '/admin/users', '/es/profile', '/en/my-listings', '/pt/alerts', '/es/interests'])(
    'keeps screen text out of %s',
    (path) => {
      expect(isPrivatePath(path, PRIVATE_SEGMENTS)).toBe(true);
    },
  );

  it.each(['/es', '/es/listings/42', '/en/jobs/la-paz', '/es/empresas'])('treats %s as public', (path) => {
    expect(isPrivatePath(path, PRIVATE_SEGMENTS)).toBe(false);
  });

  it.each([
    ['/es/listings/812', '/listings/:id'],
    ['/pt/listings/813', '/listings/:id'],
    ['/en/jobs/la-paz', '/jobs/la-paz'],
    ['/es', '/'],
  ])('counts %s as %s', (raw, counted) => {
    expect(normalizePath(raw, { locales, patterns: PATH_PATTERNS })).toBe(counted);
  });
});
