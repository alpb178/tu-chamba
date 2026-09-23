import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

/**
 * Collects this site's analytics and forwards it to the group's hub.
 *
 * It exists for one reason: **the hub key must never reach the browser**.
 * Whoever holds it can write metrics for this project, so the page writes to
 * its own origin and the key is added here, on the server.
 *
 * Nothing is aggregated or stored here: the raw event is sent and the hub
 * consolidates the days overnight. Contract in
 * corpsc-admin/docs/envio-de-metricas/eventos.md.
 *
 * Environment (without it the route sends nothing, which is what we want
 * locally and in previews):
 *   HUB_URL      https://hub.corpsc.com/api
 *   HUB_API_KEY  this project's key
 */

/** The same cap the hub applies. */
const MAX_EVENTS = 50;

/**
 * The visit cookie. Half an hour of inactivity closes it, which is the usual
 * session window, and it doesn't survive the browser being closed.
 *
 * It carries a random identifier and nothing else: no identity, no history.
 * It's the only thing that keeps five pages from counting as five visits.
 */
const SESSION_COOKIE = 'hub_v';
const SESSION_MINUTES = 30;

/**
 * Crawlers announce themselves and there's no reason to count them as people.
 * The filter is deliberately coarse: what slips through is a rounding error,
 * and what it would over-block is a reader.
 */
const BOT = /bot|crawl|spider|slurp|bingpreview|headless|lighthouse|monitor|pingdom|curl|wget/i;

interface IncomingEvent {
  type: 'page_view' | 'site_click' | 'click';
  path: string;
  section?: string;
  label?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  target?: string;
  linkType?: 'web' | 'android' | 'ios';
}

function isText(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max;
}

function isValid(event: unknown): event is IncomingEvent {
  if (typeof event !== 'object' || event === null) return false;
  const e = event as Record<string, unknown>;

  if (e.type !== 'page_view' && e.type !== 'site_click' && e.type !== 'click') return false;
  if (typeof e.path !== 'string' || e.path.length === 0 || e.path.length > 512) return false;
  if (e.type === 'site_click' && typeof e.target !== 'string') return false;
  // Same limits as the hub: a click must say where it happened.
  if (e.type === 'click' && (!isText(e.section, 64) || !isText(e.label, 120))) return false;
  if (e.section !== undefined && !isText(e.section, 64)) return false;
  if (e.label !== undefined && !isText(e.label, 120)) return false;
  // Only the domain: a full URL could carry the visitor's search or an id.
  if (e.referrer !== undefined && !(typeof e.referrer === 'string' && /^[a-z0-9.-]{1,255}$/.test(e.referrer))) {
    return false;
  }
  for (const utm of [e.utmSource, e.utmMedium, e.utmCampaign]) {
    if (utm !== undefined && !isText(utm, 100)) return false;
  }
  if (e.linkType !== undefined && !['web', 'android', 'ios'].includes(e.linkType as string)) {
    return false;
  }
  return true;
}

export async function POST(request: Request): Promise<NextResponse> {
  // Always 204, no matter what. For the page this is "fire and forget": an
  // analytics problem must not look like a broken site, and explaining to the
  // caller why their submission was dropped only helps whoever is probing it.
  const noContent = new NextResponse(null, { status: 204 });

  if (BOT.test(request.headers.get('user-agent') ?? '')) return noContent;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noContent;
  }

  const incoming = (body as { events?: unknown })?.events;
  if (!Array.isArray(incoming)) return noContent;

  const events = incoming.filter(isValid).slice(0, MAX_EVENTS);
  if (events.length === 0) return noContent;

  // The identifier is issued here and not on the page: as an httpOnly cookie
  // no script can read it, so a flaw in a third-party snippet can't steal it
  // or forge someone else's visit.
  const existing = request.headers
    .get('cookie')
    ?.split(';')
    .map((part) => part.trim().split('='))
    .find(([name]) => name === SESSION_COOKIE)?.[1];

  const sessionId = existing ?? randomUUID().replace(/-/g, '');

  noContent.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // Renewed with every event, so the visit ends after half an hour of
    // silence and not half an hour after it started.
    maxAge: SESSION_MINUTES * 60,
  });

  const hubUrl = process.env.HUB_URL;
  const apiKey = process.env.HUB_API_KEY;
  if (!hubUrl || !apiKey) return noContent;

  const at = new Date().toISOString();
  // Vercel resolves the country from the IP at its edge; the IP itself never
  // leaves this server.
  const countryHeader = request.headers.get('x-vercel-ip-country')?.toUpperCase();
  const country = countryHeader && /^[A-Z]{2}$/.test(countryHeader) ? countryHeader : undefined;

  try {
    await fetch(`${hubUrl}/ingest/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
      body: JSON.stringify({
        schemaVersion: 1,
        events: events.map((event) => ({
          type: event.type,
          sessionId,
          path: event.path,
          ...(country ? { country } : {}),
          ...(event.type === 'page_view'
            ? {
                referrer: event.referrer,
                utmSource: event.utmSource,
                utmMedium: event.utmMedium,
                utmCampaign: event.utmCampaign,
              }
            : {}),
          ...(event.type !== 'page_view' && event.section && event.label
            ? { section: event.section, label: event.label }
            : {}),
          ...(event.type === 'site_click'
            ? { target: event.target, linkType: event.linkType ?? 'web' }
            : {}),
          at,
        })),
      }),
      cache: 'no-store',
    });
  } catch {
    // The hub being down isn't the visitor's problem. The event is dropped on
    // purpose: queueing it would mean storage, which is exactly what this site
    // shouldn't have to provide.
  }

  return noContent;
}
