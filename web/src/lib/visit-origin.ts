/**
 * Where this visit came from, read once, on the page the visitor lands on.
 *
 * Contract: corpsc-admin/docs/envio-de-metricas/eventos.md. This file is the
 * same in every site of the group; change it everywhere or nowhere.
 *
 * Only the referring DOMAIN leaves the browser, never the full URL: a search
 * results page or a shared link can carry the visitor's query or an id. The
 * country is not read here — the site's server adds it from its host's header.
 */

export interface VisitOrigin {
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

const MAX_UTM = 100;

export function visitOrigin(): VisitOrigin {
  const origin: VisitOrigin = {};

  try {
    if (document.referrer) {
      const host = new URL(document.referrer).host.toLowerCase();
      // Coming from our own pages is navigation, not a source.
      if (host && host !== window.location.host.toLowerCase()) origin.referrer = host;
    }
  } catch {
    // A referrer that is not a URL says nothing useful.
  }

  const params = new URLSearchParams(window.location.search);
  const utm = (name: string) => params.get(name)?.trim().slice(0, MAX_UTM) || undefined;
  origin.utmSource = utm('utm_source');
  origin.utmMedium = utm('utm_medium');
  origin.utmCampaign = utm('utm_campaign');

  return origin;
}
