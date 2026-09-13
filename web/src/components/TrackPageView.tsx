'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';

// Registra cada página vista del portal (métrica de visitas al sitio del
// panel admin). Corre en el cliente en cada cambio de ruta, así no cuenta
// prefetches ni bots de SSR; si falla, no afecta la navegación.
export function TrackPageView() {
  const pathname = usePathname();
  // Última ruta registrada: sin esto la misma página se cuenta dos veces
  // (StrictMode ejecuta el efecto por duplicado, y cualquier remontaje del
  // layout lo repetiría igual). Volver a una ruta ya visitada sí cuenta: en el
  // medio hubo otra, así que la referencia ya cambió.
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;
    api('/visits', {
      method: 'POST',
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {
      /* noop: el tracking es best-effort */
    });
  }, [pathname]);

  return null;
}
