import { api } from './api';
import type { Company } from './companies';

// Registra el acceso a un sitio del Grupo CorpSC (métrica "Sitios de interés"
// del panel admin). La consumen la sección de tarjetas de la home y el
// cintillo superior. Best-effort: los enlaces abren en pestaña nueva, así que
// el fetch alcanza a completarse; si falla, no afecta la navegación.
export function trackSiteClick(company: Company) {
  api('/visits', {
    method: 'POST',
    body: JSON.stringify({ company: company.slug, label: company.name }),
  }).catch(() => {
    /* noop: el tracking es best-effort */
  });
}
