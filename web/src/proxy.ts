import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Locale routing for the public site: adds the /es or /en prefix to
// unprefixed URLs (query string included, so ?token= links keep working).
export default createMiddleware(routing);

export const config = {
  // Everything except the API route handlers, the admin panel (Spanish only,
  // no locale prefix), Next internals and files with an extension
  // (robots.txt, sitemap.xml, images...).
  matcher: ['/((?!api(?:/|$)|admin(?:/|$)|_next|_vercel|.*\\..*).*)'],
};
