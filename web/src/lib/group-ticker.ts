// Origen del tráfico que sale de este sitio hacia sus hermanos del grupo.
const SOURCE = 'tu-chamba';

// Marca los enlaces del cintillo con UTM para poder medir, del lado del sitio
// de destino (GA/GTM), cuánta atención trae la franja del grupo. Si la URL ya
// traía parámetros se conservan; llamarla dos veces da el mismo resultado.
export function groupSiteUrl(url: string): string {
  const target = new URL(url);
  target.searchParams.set('utm_source', SOURCE);
  target.searchParams.set('utm_medium', 'cintillo');
  target.searchParams.set('utm_campaign', 'grupo-corpsc');
  return target.toString();
}

// Dominio que se muestra junto al nombre en el cintillo: el enlace a la vista,
// sin protocolo, sin "www." y sin la barra final.
export function siteDomain(url: string): string {
  return new URL(url).host.replace(/^www\./, '');
}
