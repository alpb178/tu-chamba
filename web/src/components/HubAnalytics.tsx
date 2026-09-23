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
 * Sends the group hub the page view and the clicks that go to a sister site.
 *
 * It's independent from `TrackPageView` and `TrackVisit`, which feed this
 * site's own admin panel: that data lives in our database, this one goes to
 * the hub, where sites are compared against each other. Counting twice is on
 * purpose, because they answer two different questions.
 *
 * Everything goes through `/api/hub-track`, which holds the key: in the browser
 * it would be public and anyone could write metrics for this project.
 *
 * Clicks are listened for on the document rather than link by link, so the
 * group banner, the home cards or whatever gets added tomorrow are counted
 * without anyone having to remember to attach a handler.
 */
export function HubAnalytics() {
  const pathname = usePathname();
  // Last route sent: without this the same page counts twice, because
  // StrictMode runs the effect twice and a remount would repeat it.
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

    // Capture phase: the click counts even if something below calls stopPropagation.
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
    /* noop: analytics never breaks navigation */
  });
}
