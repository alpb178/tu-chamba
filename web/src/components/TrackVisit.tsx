'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';

// Registra la visita al detalle del anuncio (métrica del panel admin).
// Corre en el cliente para no contar prefetches ni bots de SSR; si falla,
// no afecta la navegación.
export function TrackVisit({ adId }: { adId: string }) {
  useEffect(() => {
    api('/visits', {
      method: 'POST',
      body: JSON.stringify({ adId }),
    }).catch(() => {
      /* noop: el tracking es best-effort */
    });
  }, [adId]);

  return null;
}
