'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

const SHORT: Record<Locale, string> = { es: 'ES', en: 'EN' };

// ES | EN toggle. They are real links to the same page in the other locale
// (crawlable, work without JS); on click the current query string (?q=, ?dep=,
// ?token=...) is carried over too.
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const t = useTranslations('nav.language');
  const current = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div role="group" aria-label={t('label')} className={`flex items-center gap-1 text-xs font-semibold ${className}`}>
      {routing.locales.map((locale, i) => (
        <span key={locale} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden="true" className="opacity-40">|</span>}
          {locale === current ? (
            <span aria-current="true" className="rounded px-1.5 py-0.5 underline underline-offset-4">
              {SHORT[locale]}
            </span>
          ) : (
            <Link
              href={pathname}
              locale={locale}
              hrefLang={locale}
              lang={locale}
              title={t(locale)}
              aria-label={t(locale)}
              className="rounded px-1.5 py-0.5 opacity-70 transition hover:opacity-100"
              onClick={(e) => {
                const search = window.location.search;
                if (!search) return;
                e.preventDefault();
                router.replace(`${pathname}${search}`, { locale });
              }}
            >
              {SHORT[locale]}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
