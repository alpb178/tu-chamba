import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('notFound');
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-outline">404</p>
      <h1 className="mt-2 font-display text-3xl text-on-surface">{t('title')}</h1>
      <p className="mt-3 text-on-surface-variant">{t('description')}</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-secondary-container px-5 py-2.5 text-sm font-bold text-on-secondary-container hover:brightness-105"
      >
        {t('backHome')}
      </Link>
    </div>
  );
}
