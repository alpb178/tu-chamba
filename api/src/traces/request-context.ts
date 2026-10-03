import { Injectable, NestMiddleware } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { NextFunction, Request, Response } from 'express';

// Context of the current request, available anywhere in the call stack
// without passing it as a parameter: TracesService reads it when recording a
// trace.
export interface RequestContext {
  ip?: string;
  userAgent?: string;
  // Country (ISO-2) if a CDN provides it via header; otherwise TracesService
  // resolves it by geo-IP from `ip`.
  country?: string;
  // Request source: utm_source or the Referer host.
  source?: string;
  // Request start: traces use it to compute their execution time.
  startedAt: number;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

// The visitor's real IP. Behind Render's proxy the header arrives as
// "client, proxy1, proxy2…": the first value is the client and the rest are
// infrastructure hops. req.ip doesn't work here because, with `trust proxy`
// set to 1, Express returns the hop closest to the server (the edge IP, which
// geolocates to the US and says nothing about the visitor).
function clientIp(req: Request): string | undefined {
  const raw = req.headers['x-forwarded-for'];
  const xff = Array.isArray(raw) ? raw[0] : raw;
  const first = xff?.split(',')[0]?.trim();
  return first || req.ip;
}

// Country from headers commonly injected by CDNs/proxies (Cloudflare,
// Vercel, App Engine). Returns the uppercase ISO-2 code, or undefined.
function countryFromHeaders(req: Request): string | undefined {
  const h = req.headers;
  const raw =
    h['cf-ipcountry'] ??
    h['x-vercel-ip-country'] ??
    h['x-country-code'] ??
    h['x-appengine-country'];
  const code = Array.isArray(raw) ? raw[0] : raw;
  if (!code || typeof code !== 'string') return undefined;
  const iso = code.toUpperCase().slice(0, 2);
  // "XX"/"T1" are Cloudflare's "unknown"/Tor markers.
  return iso === 'XX' || iso === 'T1' ? undefined : iso;
}

// Source/origin: prefers utm_source (campaigns); otherwise the Referer host
// (without "www."). Truncated to avoid storing huge strings.
function sourceFromRequest(req: Request): string | undefined {
  const utm = req.query?.utm_source;
  const utmStr = Array.isArray(utm) ? utm[0] : utm;
  if (typeof utmStr === 'string' && utmStr.trim()) {
    return utmStr.trim().slice(0, 100);
  }
  const ref = req.headers['referer'] ?? req.headers['referrer'];
  const refStr = Array.isArray(ref) ? ref[0] : ref;
  if (!refStr) return undefined;
  try {
    return new URL(refStr).hostname.replace(/^www\./, '').slice(0, 100);
  } catch {
    return String(refStr).slice(0, 100);
  }
}

// Captures the IP and user-agent of each request, plus country (CDN header or,
// failing that, geo-IP on the client IP) and source (utm/Referer).
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    requestContext.run(
      {
        ip: clientIp(req),
        userAgent: req.headers['user-agent'],
        country: countryFromHeaders(req),
        source: sourceFromRequest(req),
        startedAt: Date.now(),
      },
      next,
    );
  }
}
