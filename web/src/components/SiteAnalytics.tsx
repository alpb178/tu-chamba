import { HubAnalytics } from '@/lib/hub-tracker/HubAnalytics';
import { locales } from '@/i18n/routing';

/**
 * Areas whose screen text must not reach the hub: what is shown there can be a
 * customer's name or email. Clicks there are still counted, with a generic
 * label.
 */
export const PRIVATE_SEGMENTS = ['admin', 'profile', 'my-listings', 'alerts', 'interests'] as const;

/**
 * Listing pages are one kind of page: a thousand ids would push every other
 * page out of the hub's top-100. Job pages by department stay apart — there
 * are few, and which one people visit is the point.
 */
export const PATH_PATTERNS = ['/listings/:id'] as const;

/**
 * Sends the group hub the page views and clicks of this site.
 *
 * It's independent from `TrackPageView` and `TrackVisit`, which feed this
 * site's own admin panel: that data lives in our database, this one goes to
 * the hub, where sites are compared against each other.
 */
export function SiteAnalytics() {
  return <HubAnalytics locales={locales} privateSegments={PRIVATE_SEGMENTS} pathPatterns={PATH_PATTERNS} />;
}
