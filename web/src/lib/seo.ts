import { Ad, DEPARTMENT_LABEL, JobType } from './types';

export const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tu-chamba.corpsc.com';

// Listing title. The field is required since the July 2026 migration;
// deriving it from the description remains as a safety net.
export function adTitle(ad: Pick<Ad, 'title' | 'description'>): string {
  if (ad.title) return ad.title;
  const head = ad.description.split('|')[0].trim();
  if (head.length >= 10 && head.length <= 90) return head;
  return ad.description.length > 70
    ? `${ad.description.slice(0, 70).trim()}…`
    : ad.description;
}

// Mapping to the schema.org/JobPosting vocabulary.
const EMPLOYMENT_TYPE: Record<JobType, string> = {
  TIEMPO_COMPLETO: 'FULL_TIME',
  MEDIA_JORNADA: 'PART_TIME',
  DIARIA: 'PER_DIEM',
  POR_CONTRATO: 'CONTRACTOR',
  PASANTIA: 'INTERN',
  FREELANCE: 'CONTRACTOR',
  // No declared work schedule (imported listings): OTHER is the generic
  // value in the schema.org vocabulary.
  A_CONVENIR: 'OTHER',
};

// JSON-LD JobPosting for Google for Jobs rich results.
// Must only be emitted for live listings (Google penalizes the markup on
// expired listings; validThrough covers natural expiration).
export function jobPostingJsonLd(ad: Ad) {
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: adTitle(ad),
    description: [ad.description, ad.requirements && `Requisitos: ${ad.requirements}`]
      .filter(Boolean)
      .join('\n\n'),
    datePosted: ad.createdAt,
    validThrough: ad.expiresAt,
    employmentType: EMPLOYMENT_TYPE[ad.jobType],
    hiringOrganization: {
      '@type': 'Organization',
      name: ad.createdBy?.name ?? 'Tu Chamba',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        ...(ad.department
          ? { addressRegion: DEPARTMENT_LABEL[ad.department] }
          : {}),
        addressCountry: 'BO',
      },
    },
    // A range is declared with minValue/maxValue; a fixed amount, with value
    // (both valid forms for Google for Jobs QuantitativeValue).
    ...(ad.salary != null
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: 'BOB',
            value: {
              '@type': 'QuantitativeValue',
              ...(ad.salaryMax != null && Number(ad.salaryMax) > Number(ad.salary)
                ? {
                    minValue: Number(ad.salary),
                    maxValue: Number(ad.salaryMax),
                  }
                : { value: Number(ad.salary) }),
              unitText: 'MONTH',
            },
          },
        }
      : {}),
    identifier: {
      '@type': 'PropertyValue',
      name: 'Tu Chamba',
      value: ad.id,
    },
    url: `${SITE}/listings/${ad.id}`,
    directApply: true,
  };
}

// WebSite with SearchAction: enables the sitelinks search box in Google.
export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tu Chamba',
    url: SITE,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Tu Chamba',
    url: SITE,
    logo: `${SITE}/logo-full.png`,
  };
}

// Safe serialization for <script type="application/ld+json">:
// escapes "<" so malicious text cannot close the tag.
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
