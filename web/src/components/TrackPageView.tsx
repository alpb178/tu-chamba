'use client';

import { useEffect, useRef } from 'react';
// next-intl's usePathname strips the locale, so stats keep recording
// locale-less paths (/listings/1) like the historical rows.
import { usePathname } from '@/i18n/navigation';
import { api } from '@/lib/api';

// Records every portal page view (the admin panel's site visits metric).
// Runs on the client on each route change, so it doesn't count prefetches
// or SSR bots; if it fails, navigation is unaffected.
export function TrackPageView() {
  const pathname = usePathname();
  // Last recorded route: without this the same page is counted twice
  // (StrictMode runs the effect twice, and any layout remount would repeat it
  // too). Returning to an already visited route does count: another one came
  // in between, so the reference has already changed.
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;
    api('/visits', {
      method: 'POST',
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {
      /* noop: tracking is best-effort */
    });
  }, [pathname]);

  return null;
}
