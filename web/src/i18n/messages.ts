// Messages of every locale: one JSON file per namespace in web/locales/<locale>.
// Add new namespaces here for both locales.

import es_enums from '../../locales/es/enums.json';
import es_common from '../../locales/es/common.json';
import es_meta from '../../locales/es/meta.json';
import es_nav from '../../locales/es/nav.json';
import es_footer from '../../locales/es/footer.json';
import es_companies from '../../locales/es/companies.json';
import es_notifications from '../../locales/es/notifications.json';
import es_home from '../../locales/es/home.json';
import es_filters from '../../locales/es/filters.json';
import es_adCard from '../../locales/es/adCard.json';
import es_jobs from '../../locales/es/jobs.json';
import es_listing from '../../locales/es/listing.json';
import es_reviews from '../../locales/es/reviews.json';
import es_report from '../../locales/es/report.json';
import es_map from '../../locales/es/map.json';
import es_publish from '../../locales/es/publish.json';
import es_account from '../../locales/es/account.json';
import es_auth from '../../locales/es/auth.json';
import es_legal from '../../locales/es/legal.json';
import es_notFound from '../../locales/es/notFound.json';
import en_enums from '../../locales/en/enums.json';
import en_common from '../../locales/en/common.json';
import en_meta from '../../locales/en/meta.json';
import en_nav from '../../locales/en/nav.json';
import en_footer from '../../locales/en/footer.json';
import en_companies from '../../locales/en/companies.json';
import en_notifications from '../../locales/en/notifications.json';
import en_home from '../../locales/en/home.json';
import en_filters from '../../locales/en/filters.json';
import en_adCard from '../../locales/en/adCard.json';
import en_jobs from '../../locales/en/jobs.json';
import en_listing from '../../locales/en/listing.json';
import en_reviews from '../../locales/en/reviews.json';
import en_report from '../../locales/en/report.json';
import en_map from '../../locales/en/map.json';
import en_publish from '../../locales/en/publish.json';
import en_account from '../../locales/en/account.json';
import en_auth from '../../locales/en/auth.json';
import en_legal from '../../locales/en/legal.json';
import en_notFound from '../../locales/en/notFound.json';

import type { Locale } from './routing';

const es = {
  enums: es_enums,
  common: es_common,
  meta: es_meta,
  nav: es_nav,
  footer: es_footer,
  companies: es_companies,
  notifications: es_notifications,
  home: es_home,
  filters: es_filters,
  adCard: es_adCard,
  jobs: es_jobs,
  listing: es_listing,
  reviews: es_reviews,
  report: es_report,
  map: es_map,
  publish: es_publish,
  account: es_account,
  auth: es_auth,
  legal: es_legal,
  notFound: es_notFound,
};

const en = {
  enums: en_enums,
  common: en_common,
  meta: en_meta,
  nav: en_nav,
  footer: en_footer,
  companies: en_companies,
  notifications: en_notifications,
  home: en_home,
  filters: en_filters,
  adCard: en_adCard,
  jobs: en_jobs,
  listing: en_listing,
  reviews: en_reviews,
  report: en_report,
  map: en_map,
  publish: en_publish,
  account: en_account,
  auth: en_auth,
  legal: en_legal,
  notFound: en_notFound,
};

export type Messages = typeof es;

export const messages: Record<Locale, Messages> = { es, en };
