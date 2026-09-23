/**
 * Group sites, by domain.
 *
 * The canonical slug registry lives in the hub (`api/prisma/seed.ts` in
 * corpsc-admin) and decides the name each click is stored under. It is
 * repeated here instead of read from this site's ticker because a different
 * slug —"dando-muela" instead of "dandomuela"— would split the same metric
 * into two buckets nobody would reconcile later.
 *
 * The domain is compared without "www.": it is the same site.
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
 * `null` if the link doesn't go to a group site: an anchor, a mailto, another
 * website.
 *
 * It is resolved WITHOUT a fallback base on purpose. With one, a relative
 * link —`/empleos`— would resolve against this very site's domain and would
 * count as an outbound click to ourselves.
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
  // A link to this same site is navigation, not an outbound click.
  if (ownHost && host === ownHost.replace(/^www\./, '')) return null;

  return GROUP_SITES[host] ?? null;
}
