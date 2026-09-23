import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { OG_LOCALE, type Locale } from '@/i18n/routing';
import { localeAlternates } from '@/lib/seo';
import { fetchAds } from '@/lib/server-api';
import {
  DEPARTMENT_LABEL,
  DEPARTMENT_SLUG,
  SLUG_TO_DEPARTMENT,
} from '@/lib/types';
import { AdCard } from '@/components/AdCard';

// The param name must match the [department] route segment of the public
// SEO URL (/jobs/la-paz).
type Params = { params: Promise<{ locale: string; department: string }> };

// Generates the 9 department pages at build time (indexable and fast). The
// locale param comes from the [locale] layout's generateStaticParams.
export function generateStaticParams() {
  return Object.values(DEPARTMENT_SLUG).map((department) => ({ department }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, department: slug } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'jobs' });
  const department = SLUG_TO_DEPARTMENT[slug];
  if (!department) return { title: t('meta.fallbackTitle') };
  const departmentName = DEPARTMENT_LABEL[department];
  const title = t('meta.title', { department: departmentName });
  const description = t('meta.description', { department: departmentName });
  return {
    title,
    description,
    alternates: localeAlternates(locale as Locale, `/jobs/${slug}`),
    openGraph: {
      title,
      description,
      locale: OG_LOCALE[locale as Locale],
    },
  };
}

export default async function DepartmentJobsPage({ params }: Params) {
  const { locale, department: slug } = await params;
  setRequestLocale(locale as Locale);
  const department = SLUG_TO_DEPARTMENT[slug];
  if (!department) notFound();

  const t = await getTranslations({ locale: locale as Locale, namespace: 'jobs' });
  const departmentName = DEPARTMENT_LABEL[department];
  const data = await fetchAds({ department, limit: 50 });
  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <nav className="text-sm text-on-surface-variant">
        <Link href="/" className="hover:text-brand">
          {t('home')}
        </Link>{' '}
        / {t('heading', { department: departmentName })}
      </nav>

      <header>
        <h1 className="text-2xl font-bold text-brand">
          {t('heading', { department: departmentName })}
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          {items.length > 0
            ? t('count', { count: data?.total ?? 0, department: departmentName })
            : t('empty', { department: departmentName })}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3">
        {items.map((a) => (
          <AdCard key={a.id} ad={a} />
        ))}
      </div>
    </div>
  );
}
