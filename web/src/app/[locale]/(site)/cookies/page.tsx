import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { localeAlternates } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'legal.cookies' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: localeAlternates(locale as Locale, '/cookies'),
  };
}

const SUPPORT_EMAIL = 'alesx2soporte@gmail.com';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-semibold text-on-surface">
        {title}
      </h2>
      <div className="space-y-2 text-sm leading-relaxed text-on-surface-variant">
        {children}
      </div>
    </section>
  );
}

const mail = (chunks: ReactNode) => (
  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
    {chunks}
  </a>
);

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations({ locale: locale as Locale, namespace: 'legal' });

  return (
    <div className="mx-auto max-w-3xl space-y-8 rounded-card border border-outline-variant bg-surface-container-lowest p-6 sm:p-10">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold text-on-surface">
          {t('cookies.title')}
        </h1>
        <p className="text-xs text-outline">
          {t('updated', { date: t('cookies.date') })}
        </p>
      </header>

      <Section title={t('cookies.essentials.title')}>
        <p>{t('cookies.essentials.body')}</p>
      </Section>

      <Section title={t('cookies.stored.title')}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-xs uppercase tracking-wider text-outline">
                <th className="py-2 pr-4 font-semibold">{t('cookies.stored.colItem')}</th>
                <th className="py-2 pr-4 font-semibold">{t('cookies.stored.colType')}</th>
                <th className="py-2 font-semibold">{t('cookies.stored.colPurpose')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              <tr>
                <td className="py-2 pr-4 font-mono text-xs">tuchamba_token</td>
                <td className="py-2 pr-4">{t('cookies.stored.tokenType')}</td>
                <td className="py-2">{t('cookies.stored.tokenPurpose')}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">{t('cookies.stored.googleItem')}</td>
                <td className="py-2 pr-4">{t('cookies.stored.googleType')}</td>
                <td className="py-2">{t('cookies.stored.googlePurpose')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={t('cookies.notDone.title')}>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t('cookies.notDone.item1')}</li>
          <li>{t('cookies.notDone.item2')}</li>
          <li>{t('cookies.notDone.item3')}</li>
        </ul>
      </Section>

      <Section title={t('cookies.control.title')}>
        <p>{t.rich('cookies.control.body', { email: SUPPORT_EMAIL, mail })}</p>
      </Section>
    </div>
  );
}
