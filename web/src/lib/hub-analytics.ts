/**
 * Sitios del grupo, por dominio.
 *
 * El registro canónico de slugs vive en el hub (`api/prisma/seed.ts` de
 * corpsc-admin) y es el que decide con qué nombre se guarda cada clic. Se
 * repite aquí en lugar de leerlo del cintillo de este sitio porque un slug
 * distinto —"dando-muela" en vez de "dandomuela"— partiría la misma métrica en
 * dos cubos que nadie cuadraría después.
 *
 * El dominio se compara sin "www.": es el mismo sitio.
 */
const GROUP_SITES: Record<string, string> = {
  'corpsc.com': 'corpsc',
  'take.corpsc.com': 'take',
  'invoices.corpsc.com': 'invoices',
  'irisnatural.corpsc.com': 'iris-natural',
  'humancore.corpsc.com': 'humancore',
  'histolword.corpsc.com': 'histolword',
  'tu-chamba.corpsc.com': 'tu-chamba',
  'dandomuela.com': 'dandomuela',
  'kods.ai': 'kods-ai',
  'popyplan.com': 'popyplan',
  'zendinit.com': 'zendinit',
  'orlegitech.com': 'orlegitech',
  'tikneo.com': 'tikneo',
  'calculum.ai': 'calculum',
  'emasex.com': 'emasex',
};

/**
 * `null` si el enlace no va a un sitio del grupo: un ancla, un mailto, otra web.
 *
 * Se resuelve SIN base de respaldo a propósito. Con una, un enlace relativo
 * —`/empleos`— se resolvería contra el dominio de este mismo sitio y se
 * contaría como un clic que se va hacia nosotros mismos.
 */
export function resolveGroupSite(href: string, ownHost?: string): string | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const host = url.host.replace(/^www\./, '');
  // Un enlace a este mismo sitio es navegación, no un clic que se va.
  if (ownHost && host === ownHost.replace(/^www\./, '')) return null;

  return GROUP_SITES[host] ?? null;
}
