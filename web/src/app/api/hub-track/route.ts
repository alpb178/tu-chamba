import { after } from 'next/server';
import { createHubTrackHandler } from '@/lib/hub-tracker/handler';

/**
 * Collects this site's analytics and forwards it to the group's hub, with the
 * key added here, on the server: it must never reach the browser. Everything
 * it does lives in the shared tracker (corpsc-hub/tracker); `after()` lets the
 * response go out before the hub is called.
 *
 * Environment: HUB_URL, HUB_API_KEY. Without them nothing is forwarded, which
 * is what local and preview deployments want.
 */
export const POST = createHubTrackHandler({ after });
