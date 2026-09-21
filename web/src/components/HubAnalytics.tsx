'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { resolveGroupSite } from '@/lib/hub-analytics';

/**
 * Manda al hub del grupo la visita y los clics que se van a un sitio hermano.
 *
 * Es independiente de `TrackPageView` y `TrackVisit`, que alimentan el panel de
 * administración de este propio sitio: aquel dato vive en nuestra base, este va
 * al hub, donde se comparan los sitios entre sí. Se cuenta dos veces a
 * propósito, porque son dos preguntas distintas.
 *
 * Todo pasa por `/api/hub-track`, que es quien tiene la clave: en el navegador
 * sería pública y cualquiera podría escribir métricas de este proyecto.
 *
 * Los clics se escuchan en el documento y no enlace por enlace, así el cintillo
 * del grupo, las tarjetas de la home o lo que se añada mañana se cuentan sin
 * que nadie se acuerde de ponerles un handler.
 */
export function HubAnalytics() {
  const pathname = usePathname();
  // Última ruta enviada: sin esto la misma página cuenta dos veces, porque
  // StrictMode ejecuta el efecto por duplicado y un remontaje lo repetiría.
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;

    send({ type: 'page_view', path: pathname });
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const anchor = (event.target as Element | null)?.closest?.('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const target = resolveGroupSite(anchor.href, window.location.host);
      if (!target) return;

      send(
        { type: 'site_click', path: pathname ?? '/', target, linkType: 'web' },
        // La página puede estar descargándose un milisegundo después: un fetch
        // normal se cancelaría, sendBeacon lo entrega el navegador igual.
        true,
      );
    }

    // En captura: el clic cuenta aunque algo más abajo llame a stopPropagation.
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [pathname]);

  return null;
}

interface HubEvent {
  type: 'page_view' | 'site_click';
  path: string;
  target?: string;
  linkType?: 'web';
}

function send(event: HubEvent, beacon = false): void {
  const body = JSON.stringify({ events: [event] });

  if (beacon && typeof navigator.sendBeacon === 'function') {
    navigator.sendBeacon('/api/hub-track', new Blob([body], { type: 'application/json' }));
    return;
  }

  void fetch('/api/hub-track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    /* noop: la analítica nunca rompe la navegación */
  });
}
