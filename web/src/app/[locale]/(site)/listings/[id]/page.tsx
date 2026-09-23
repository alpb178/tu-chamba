import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getLabels } from '@/i18n/labels-server';
import { OG_LOCALE, type Locale } from '@/i18n/routing';
import { fetchAd } from '@/lib/server-api';
import {
  DEPARTMENT_LABEL,
  DEPARTMENT_SLUG,
  adEffectiveStatus,
} from '@/lib/types';
import { Badge } from '@/components/Badge';
import { AuthOnly } from '@/components/AuthOnly';
import { Icon } from '@/components/Icon';
import { Reviews } from '@/components/Reviews';
import { AdActions } from '@/components/AdActions';
import { TrackVisit } from '@/components/TrackVisit';
import { adTitle, jobPostingJsonLd, jsonLd, localeAlternates } from '@/lib/seo';

type Params = { params: Promise<{ locale: string; id: string }> };

// Per-listing metadata (indexable by search engines).
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'listing' });
  const ad = await fetchAd(id);
  if (!ad) return { title: t('metadata.notFoundTitle') };

  const labels = await getLabels(locale as Locale);
  const parts = [
    ad.category && labels.category(ad.category),
    ad.department &&
      t('metadata.inDepartment', { department: labels.department(ad.department) }),
  ].filter(Boolean);
  const title = `${adTitle(ad)} — ${parts.join(' ') || t('metadata.fallbackCategory')} | Tu Chamba`;
  const description = ad.description.slice(0, 155);
  return {
    title,
    description,
    alternates: localeAlternates(locale as Locale, `/listings/${id}`),
    // Expired or taken-down listings drop out of the index.
    robots:
      adEffectiveStatus(ad) === 'ACTIVO' ? undefined : { index: false },
    openGraph: {
      title,
      description,
      type: 'article',
      images: ['/banner.jpeg'],
      locale: OG_LOCALE[locale as Locale],
    },
  };
}

export default async function AdDetailPage({ params }: Params) {
  const { locale, id } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations({ locale: locale as Locale, namespace: 'listing' });
  const labels = await getLabels(locale as Locale);
  const ad = await fetchAd(id);
  if (!ad) notFound();

  const status = adEffectiveStatus(ad);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Breadcrumb: orients the user and offers a way back to the list
          (key when arriving via a shared link or from Google). */}
      <nav
        aria-label={t('breadcrumb.label')}
        className="mb-3 flex flex-wrap items-center gap-1 text-sm text-on-surface-variant"
      >
        <Link href="/" className="flex items-center gap-1 hover:text-primary hover:underline">
          <Icon name="arrow_back" className="text-base" /> {t('breadcrumb.allListings')}
        </Link>
        {ad.department && (
          <>
            <span aria-hidden className="text-outline">/</span>
            <Link
              href={`/jobs/${DEPARTMENT_SLUG[ad.department]}`}
              className="hover:text-primary hover:underline"
            >
              {DEPARTMENT_LABEL[ad.department]}
            </Link>
          </>
        )}
      </nav>

      <div className="space-y-4 rounded-card border border-outline-variant bg-surface-container-lowest p-6">
      {/* JobPosting for Google for Jobs: only on active listings. */}
      {status === 'ACTIVO' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(jobPostingJsonLd(ad, locale as Locale)) }}
        />
      )}
      <TrackVisit adId={ad.id} />
      {status !== 'ACTIVO' && (
        <div className="bg-secondary-container px-3 py-2 text-sm text-on-secondary-container">
          {t('inactiveNotice', { status: labels.status(status).toLowerCase() })}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge jobType={ad.jobType} />
          {ad.category && (
            <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand">
              {labels.category(ad.category)}
            </span>
          )}
          {ad.department && (
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant">
              {DEPARTMENT_LABEL[ad.department]}
            </span>
          )}
        </div>
        <span
          className="text-xs uppercase text-on-surface-variant"
          title={t('refTitle')}
        >
          {t('ref', { ref: ad.id.slice(0, 8) })}
        </span>
      </div>

      <h1 className="font-display text-2xl font-bold text-on-surface">{ad.title}</h1>

      {/* Publisher with their trust signal, visible without logging in. */}
      <p className="flex flex-wrap items-center gap-1.5 text-sm text-on-surface-variant">
        <Icon name="person" className="text-base" />
        {ad.createdBy?.name ?? t('publisherFallback')}
        {ad.createdBy?.emailVerified && (
          <span className="flex items-center gap-0.5 rounded-full bg-tertiary-container px-2 py-0.5 text-xs font-medium text-on-tertiary-container">
            <Icon name="verified" className="text-sm" /> {t('verified')}
          </span>
        )}
      </p>

      <div>
        <h2 className="mb-1 text-sm font-semibold text-on-surface-variant">
          {t('descriptionHeading')}
        </h2>
        <p className="whitespace-pre-line text-on-surface">{ad.description}</p>
      </div>

      {ad.requirements && (
        <div>
          <h2 className="mb-1 text-sm font-semibold text-on-surface-variant">
            {t('requirementsHeading')}
          </h2>
          <p className="whitespace-pre-line text-on-surface">{ad.requirements}</p>
        </div>
      )}

      {/* Title, description, requirements and salary are visible without a
          session; the rest of the listing's data requires logging in. */}
      <div className="space-y-1 border-t border-outline-variant/60 pt-4">
        <p className="text-2xl font-bold text-brand">
          {labels.salary(ad, t('salaryNegotiable'))}
        </p>
        <AuthOnly>
          {/* The exact location is only shown with a session (in AdActions);
              here the department stays as the general area. */}
          {ad.department && (
            <p className="flex items-center gap-1 text-sm text-on-surface-variant">
              <Icon name="location_on" className="text-base" />{' '}
              {t('zone', { department: DEPARTMENT_LABEL[ad.department] })}
            </p>
          )}
          {ad.schedule && (
            <p className="flex items-center gap-1 text-sm text-on-surface-variant">
              <Icon name="schedule" className="text-base" />{' '}
              {t('schedule', { schedule: ad.schedule })}
            </p>
          )}
          <p className="flex flex-wrap items-center gap-1 text-xs text-on-surface-variant">
            {t('dates', {
              published: labels.date(ad.createdAt),
              expires: labels.date(ad.expiresAt),
            })}
            {ad._count != null && (
              <>
                {' '}
                · <Icon name="visibility" className="text-sm" />{' '}
                {t('visits', { count: ad._count.visits })}
              </>
            )}
          </p>
        </AuthOnly>
      </div>

      <AdActions ad={ad} />

      {/* Reviews are public: they are the publisher's trust signal (rating
          does require a session; the form only appears with one). */}
      <Reviews
        adId={ad.id}
        ownerId={ad.createdById}
        ownerName={ad.createdBy?.name ?? t('reviewsOwnerFallback')}
      />

      {/* Spacing for AdActions' fixed contact bar on mobile. */}
      <div aria-hidden className="h-14 sm:hidden" />
      </div>
    </div>
  );
}
