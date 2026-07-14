'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';

// Registra cada página vista del portal (métrica de visitas al sitio del
// panel admin). Corre en el cliente en cada cambio de ruta, así no cuenta
// prefetches ni bots de SSR; si falla, no afecta la navegación.
export function TrackPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    api('/visits', {
      method: 'POST',
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {
      /* noop: el tracking es best-effort */
    });
  }, [pathname]);

  return null;
}
