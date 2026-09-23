'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { resolveGroupSite } from '@/lib/hub-analytics';
import { visitOrigin, type VisitOrigin } from '@/lib/visit-origin';
import { describeClick, isPrivatePath } from '@/lib/click-target';

/**
 * Areas whose screen text must not reach the hub: what is shown there can be a
 * customer's name or email. Clicks there are still counted, with a generic
 * label. See lib/click-target.ts.
 */
const PRIVATE_SEGMENTS = ['admin', 'profile', 'my-listings', 'alerts', 'interests'] as const;

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
  // The first page view of this load is the landing: only it carries the
  // source. Later client-side navigations keep the same document.referrer.
  const landed = useRef(false);

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;

    const origin = landed.current ? {} : visitOrigin();
    landed.current = true;
    send({ type: 'page_view', path: pathname, ...origin });
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const path = pathname ?? '/';
      const click = describeClick(event.target, isPrivatePath(path, PRIVATE_SEGMENTS));
      if (!click) return;

      const { section, label } = click;
      const anchor = click.element.closest('a[href]');
      const target =
        anchor instanceof HTMLAnchorElement
          ? resolveGroupSite(anchor.href, window.location.host)
          : null;

      send(
        target
          ? { type: 'site_click', path, section, label, target, linkType: 'web' }
          : { type: 'click', path, section, label },
        // The page may be unloading a millisecond later: a normal fetch would
        // be cancelled, sendBeacon is handed to the browser and survives.
        true,
      );
    }

    // En captura: el clic cuenta aunque algo más abajo llame a stopPropagation.
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [pathname]);

  return null;
}

interface HubEvent extends VisitOrigin {
  type: 'page_view' | 'site_click' | 'click';
  path: string;
  section?: string;
  label?: string;
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
