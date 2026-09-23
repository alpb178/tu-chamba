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
  const t = await getTranslations({ locale: locale as Locale, namespace: 'legal.privacy' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: localeAlternates(locale as Locale, '/privacy'),
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
const b = (chunks: ReactNode) => (
  <strong className="text-on-surface">{chunks}</strong>
);

export default async function PrivacyPage({
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
          {t('privacy.title')}
        </h1>
        <p className="text-xs text-outline">
          {t('updated', { date: t('privacy.date') })}
        </p>
      </header>

      <Section title={t('privacy.whoWeAre.title')}>
        <p>{t.rich('privacy.whoWeAre.body', { email: SUPPORT_EMAIL, mail })}</p>
      </Section>

      <Section title={t('privacy.dataCollected.title')}>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t.rich('privacy.dataCollected.account', { b })}</li>
          <li>{t.rich('privacy.dataCollected.listings', { b })}</li>
          <li>{t.rich('privacy.dataCollected.activity', { b })}</li>
        </ul>
      </Section>

      <Section title={t('privacy.purposes.title')}>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t('privacy.purposes.item1')}</li>
          <li>{t('privacy.purposes.item2')}</li>
          <li>{t('privacy.purposes.item3')}</li>
          <li>{t('privacy.purposes.item4')}</li>
        </ul>
      </Section>

      <Section title={t('privacy.sharing.title')}>
        <p>{t('privacy.sharing.p1')}</p>
        <p>{t('privacy.sharing.p2')}</p>
      </Section>

      <Section title={t('privacy.retention.title')}>
        <p>{t('privacy.retention.body')}</p>
      </Section>

      <Section title={t('privacy.rights.title')}>
        <p>{t.rich('privacy.rights.body', { email: SUPPORT_EMAIL, mail, b })}</p>
      </Section>

      <Section title={t('privacy.changes.title')}>
        <p>{t('privacy.changes.body')}</p>
      </Section>
    </div>
  );
}
