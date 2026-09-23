// Source of the traffic leaving this site toward its sibling sites in the group.
const SOURCE = 'tu-chamba';

// Tags the ticker links with UTM so the destination site (GA/GTM) can
// measure how much attention the group strip brings. Existing URL parameters
// are kept; calling it twice gives the same result.
export function groupSiteUrl(url: string): string {
  const target = new URL(url);
  target.searchParams.set('utm_source', SOURCE);
  target.searchParams.set('utm_medium', 'cintillo');
  target.searchParams.set('utm_campaign', 'grupo-corpsc');
  return target.toString();
}

// Domain shown next to the name in the ticker: the visible link, without
// protocol, without "www." and without the trailing slash.
export function siteDomain(url: string): string {
  return new URL(url).host.replace(/^www\./, '');
}
