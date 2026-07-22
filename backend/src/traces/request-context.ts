import { Injectable, NestMiddleware } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { NextFunction, Request, Response } from 'express';

// Contexto del request vigente, disponible en cualquier punto del call stack
// sin pasarlo por parámetro: TracesService lo lee al registrar una traza.
export interface RequestContext {
  ip?: string;
  userAgent?: string;
  // País (ISO-2) si un CDN lo aporta por cabecera; si no, TracesService lo
  // resuelve por geo-IP a partir de `ip`.
  country?: string;
  // Origen del request: utm_source o el host del Referer.
  source?: string;
  // Inicio del request: las trazas calculan con esto su tiempo de ejecución.
  startedAt: number;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

// País desde cabeceras que suelen inyectar los CDN/proxies (Cloudflare,
// Vercel, App Engine). Devuelve el ISO-2 en mayúsculas, o undefined.
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
  // "XX"/"T1" son marcadores de "desconocido"/Tor de Cloudflare.
  return iso === 'XX' || iso === 'T1' ? undefined : iso;
}

// Fuente/origen: prioriza utm_source (campañas); si no, el host del Referer
// (sin "www."). Se recorta para no guardar cadenas enormes.
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

// Captura IP y user-agent de cada request (con trust proxy, req.ip trae la
// IP real del cliente detrás del proxy de Render), más país (cabecera de CDN)
// y fuente (utm/Referer).
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    requestContext.run(
      {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        country: countryFromHeaders(req),
        source: sourceFromRequest(req),
        startedAt: Date.now(),
      },
      next,
    );
  }
}
