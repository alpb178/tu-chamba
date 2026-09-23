'use client';

import { Suspense, useMemo } from 'react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { getPathname, usePathname } from '@/i18n/navigation';
import { locales, type Locale } from '@/i18n/routing';
import { GROUP_LANGUAGES, LanguageSwitcher, type LanguageOption } from './LanguageSwitcher';

type Props = {
  /** Open upwards (footer) or downwards (navbar). */
  placement?: 'bottom' | 'top';
  align?: 'start' | 'end';
  /** "inverse" for dark backgrounds (the footer). */
  tone?: 'default' | 'inverse';
  className?: string;
  /** Called after a language is picked (e.g. to close the mobile menu). */
  onSelect?: () => void;
};

// Tu Chamba's wiring of the group's shared language menu (LanguageSwitcher.tsx,
// kept identical in every CORPSC site): each option links to the current page
// in that locale, query string included (?q=, ?dep=, ?token=...). The colours
// come from the .lang-menu classes in globals.css.
export function LanguageMenu(props: Props) {
  // useSearchParams needs a Suspense boundary on statically rendered pages;
  // until it resolves, the links point to the page without the query string.
  return (
    <Suspense fallback={<Menu {...props} search="" />}>
      <MenuWithSearch {...props} />
    </Suspense>
  );
}

function MenuWithSearch(props: Props) {
  const search = useSearchParams().toString();
  return <Menu {...props} search={search} />;
}

function Menu({
  placement = 'bottom',
  align = 'end',
  tone = 'default',
  className = '',
  onSelect,
  search,
}: Props & { search: string }) {
  const t = useTranslations('nav.language');
  const current = useLocale() as Locale;
  // Path without the locale, e.g. "/jobs/la-paz".
  const pathname = usePathname();

  // Memoized so the options (and their hrefs) are only rebuilt when the page
  // or its query string change.
  const options = useMemo<LanguageOption[]>(
    () =>
      GROUP_LANGUAGES.filter((l) => (locales as readonly string[]).includes(l.code)).map((l) => ({
        ...l,
        href: `${getPathname({ href: pathname, locale: l.code as Locale })}${search ? `?${search}` : ''}`,
      })),
    [pathname, search],
  );

  return (
    <LanguageSwitcher
      current={current}
      options={options}
      linkAs={NextLink}
      label={t('label')}
      placement={placement}
      align={align}
      className={`lang-menu ${tone === 'inverse' ? 'lang-menu--inverse' : ''} ${className}`}
      onSelect={(code) => {
        // Same cookie next-intl's own Link writes when switching locale, so
        // unprefixed URLs (e-mail links, old URLs) open in the chosen language.
        document.cookie = `NEXT_LOCALE=${code}; path=/; SameSite=Lax`;
        onSelect?.();
      }}
    />
  );
}
