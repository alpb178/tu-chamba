import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

/**
 * Recoge la analítica de este sitio y la reenvía al hub del grupo.
 *
 * Existe por un motivo: **la clave del hub no puede bajar al navegador**. Quien
 * la tenga puede escribir métricas de este proyecto, así que la página escribe
 * a su propio origen y la clave se añade aquí, en el servidor.
 *
 * Aquí no se agrega nada ni se guarda nada: se manda el hecho suelto y el hub
 * consolida los días de madrugada. Contrato en
 * corpsc-admin/docs/envio-de-metricas/eventos.md.
 *
 * Entorno (sin él la ruta no envía nada, que es lo que se quiere en local y en
 * las vistas previas):
 *   HUB_URL      https://hub.corpsc.com/api
 *   HUB_API_KEY  la clave de este proyecto
 */

/** El mismo tope que aplica el hub. */
const MAX_EVENTS = 50;

/**
 * La cookie de visita. Media hora de inactividad la cierra, que es la ventana
 * de sesión habitual, y no sobrevive al navegador cerrado.
 *
 * Lleva un identificador aleatorio y nada más: ni identidad, ni historial. Es
 * lo único que impide que cinco páginas cuenten como cinco visitas.
 */
const SESSION_COOKIE = 'hub_v';
const SESSION_MINUTES = 30;

/**
 * Los rastreadores se anuncian y no hay razón para contarlos como personas.
 * El filtro es a propósito grueso: lo que deja pasar es un error de redondeo y
 * lo que bloquearía de más sería un lector.
 */
const BOT = /bot|crawl|spider|slurp|bingpreview|headless|lighthouse|monitor|pingdom|curl|wget/i;

interface IncomingEvent {
  type: 'page_view' | 'site_click';
  path: string;
  target?: string;
  linkType?: 'web' | 'android' | 'ios';
}

function isValid(event: unknown): event is IncomingEvent {
  if (typeof event !== 'object' || event === null) return false;
  const e = event as Record<string, unknown>;

  if (e.type !== 'page_view' && e.type !== 'site_click') return false;
  if (typeof e.path !== 'string' || e.path.length === 0 || e.path.length > 512) return false;
  if (e.type === 'site_click' && typeof e.target !== 'string') return false;
  if (e.linkType !== undefined && !['web', 'android', 'ios'].includes(e.linkType as string)) {
    return false;
  }
  return true;
}

export async function POST(request: Request): Promise<NextResponse> {
  // Siempre 204, pase lo que pase. Para la página esto es "mandar y olvidar":
  // un problema de analítica no puede parecerse a un sitio roto, y explicar a
  // quien llama por qué se descartó su envío solo ayuda a quien lo sondea.
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

  // El identificador se emite aquí y no en la página: como cookie httpOnly
  // ningún script puede leerlo, así que un fallo en un snippet de terceros no
  // puede llevárselo ni falsificar la visita de otro.
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
    // Se renueva con cada evento, así la visita acaba tras media hora de
    // silencio y no media hora después de haber empezado.
    maxAge: SESSION_MINUTES * 60,
  });

  const hubUrl = process.env.HUB_URL;
  const apiKey = process.env.HUB_API_KEY;
  if (!hubUrl || !apiKey) return noContent;

  const at = new Date().toISOString();

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
          ...(event.type === 'site_click'
            ? { target: event.target, linkType: event.linkType ?? 'web' }
            : {}),
          at,
        })),
      }),
      cache: 'no-store',
    });
  } catch {
    // Que el hub esté caído no es problema de quien navega. El evento se pierde
    // a propósito: encolarlo significaría almacenamiento, que es justo lo que
    // este sitio no tiene que poner.
  }

  return noContent;
}
