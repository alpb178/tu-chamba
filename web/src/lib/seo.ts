import { Ad, DEPARTMENT_LABEL, JobType } from './types';

export const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tu-chamba.corpsc.com';

// Los anuncios no tienen campo título: se deriva de la descripción
// (el tramo antes del separador "|" que traen muchas ofertas, o un corte).
export function adTitle(ad: Pick<Ad, 'description'>): string {
  const head = ad.description.split('|')[0].trim();
  if (head.length >= 10 && head.length <= 90) return head;
  return ad.description.length > 70
    ? `${ad.description.slice(0, 70).trim()}…`
    : ad.description;
}

// Mapeo al vocabulario de schema.org/JobPosting.
const EMPLOYMENT_TYPE: Record<JobType, string> = {
  TIEMPO_COMPLETO: 'FULL_TIME',
  MEDIA_JORNADA: 'PART_TIME',
  DIARIA: 'PER_DIEM',
};

// JSON-LD JobPosting para los rich results de Google for Jobs.
// Solo debe emitirse para anuncios vigentes (Google penaliza el markup
// en ofertas vencidas; validThrough cubre la expiración natural).
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
    ...(ad.salary != null
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: 'BOB',
            value: {
              '@type': 'QuantitativeValue',
              value: Number(ad.salary),
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

// WebSite con SearchAction: habilita la caja de búsqueda del sitio en Google.
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

// Serialización segura para <script type="application/ld+json">:
// escapa "<" para que un texto malicioso no pueda cerrar la etiqueta.
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
