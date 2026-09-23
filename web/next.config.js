const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // The site and the admin panel have separate root layouts, so the 404 for
    // URLs that match no route at all lives in app/global-not-found.tsx.
    globalNotFound: true,
  },
  // Old Spanish routes -> new English ones, straight to the Spanish locale in
  // a single permanent hop (they were Spanish pages). Permanent because they
  // are indexed by Google and linked from emails already sent (verification
  // and password reset keep the ?token= when redirecting).
  async redirects() {
    return [
      { source: '/anuncios/nuevo', destination: '/es/listings/new', permanent: true },
      { source: '/anuncios/:path*', destination: '/es/listings/:path*', permanent: true },
      { source: '/mis-anuncios', destination: '/es/my-listings', permanent: true },
      { source: '/empleos/:path*', destination: '/es/jobs/:path*', permanent: true },
      { source: '/alertas', destination: '/es/alerts', permanent: true },
      { source: '/intereses', destination: '/es/interests', permanent: true },
      { source: '/perfil', destination: '/es/profile', permanent: true },
      { source: '/privacidad', destination: '/es/privacy', permanent: true },
      { source: '/recuperar', destination: '/es/forgot-password', permanent: true },
      { source: '/restablecer', destination: '/es/reset-password', permanent: true },
      { source: '/verificar', destination: '/es/verify', permanent: true },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
