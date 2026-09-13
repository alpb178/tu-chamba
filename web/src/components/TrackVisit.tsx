'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';

// Registra la visita al detalle del anuncio (métrica del panel admin).
// Corre en el cliente para no contar prefetches ni bots de SSR; si falla,
// no afecta la navegación.
export function TrackVisit({ adId }: { adId: string }) {
  // Mismo motivo que en TrackPageView: un anuncio no se cuenta dos veces por
  // una sola apertura de su detalle.
  const lastAdId = useRef<string | null>(null);

  useEffect(() => {
    if (lastAdId.current === adId) return;
    lastAdId.current = adId;
    api('/visits', {
      method: 'POST',
      body: JSON.stringify({ adId }),
    }).catch(() => {
      /* noop: el tracking es best-effort */
    });
  }, [adId]);

  return null;
}
