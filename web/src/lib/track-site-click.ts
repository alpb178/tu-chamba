import { api } from './api';
import type { Company } from './companies';

// Records a click on a Grupo CorpSC site (the admin panel's "Sitios de
// interés" metric). Used by the home page card section and the top ticker.
// Best-effort: links open in a new tab, so the fetch has time to complete; if
// it fails, navigation is unaffected.
export function trackSiteClick(company: Company) {
  api('/visits', {
    method: 'POST',
    body: JSON.stringify({ company: company.slug, label: company.name }),
  }).catch(() => {
    /* noop: tracking is best-effort */
  });
}
