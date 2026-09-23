import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Locale routing for the public site: adds the /es, /en or /pt prefix to
// unprefixed URLs (query string included, so ?token= links keep working).
const intl = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const response = intl(request);
  const location = response.headers.get('location');
  if (!location) return response;

  // The locale is picked from the NEXT_LOCALE cookie or Accept-Language, so
  // caches must key the redirect on both.
  response.headers.set('Vary', 'Accept-Language, Cookie');

  // Unprefixed public URLs (/listings/:id, /jobs/la-paz...) are indexed by
  // Google: move them permanently (308 keeps the method and the query). The
  // root stays temporary (307) because it's pure language detection.
  if (request.nextUrl.pathname === '/' || response.status !== 307) return response;
  const permanent = NextResponse.redirect(location, 308);
  response.headers.forEach((value, key) => {
    if (key !== 'location') permanent.headers.append(key, value);
  });
  return permanent;
}

export const config = {
  // Everything except the API route handlers, the admin panel (Spanish only,
  // no locale prefix), Next internals and files with an extension
  // (robots.txt, sitemap.xml, images...).
  matcher: ['/((?!api(?:/|$)|admin(?:/|$)|_next|_vercel|.*\\..*).*)'],
};
