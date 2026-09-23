'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';

// Records the visit to the ad detail page (admin panel metric).
// Runs on the client so prefetches and SSR bots aren't counted; if it fails,
// navigation is unaffected.
export function TrackVisit({ adId }: { adId: string }) {
  // Same reason as in TrackPageView: an ad isn't counted twice for a single
  // opening of its detail page.
  const lastAdId = useRef<string | null>(null);

  useEffect(() => {
    if (lastAdId.current === adId) return;
    lastAdId.current = adId;
    api('/visits', {
      method: 'POST',
      body: JSON.stringify({ adId }),
    }).catch(() => {
      /* noop: tracking is best-effort */
    });
  }, [adId]);

  return null;
}
