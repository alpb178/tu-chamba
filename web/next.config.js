/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Old Spanish routes -> new English ones. Permanent because they are
  // indexed by Google and linked from emails already sent (verification and
  // password reset keep the ?token= when redirecting).
  async redirects() {
    return [
      { source: '/anuncios/nuevo', destination: '/listings/new', permanent: true },
      { source: '/anuncios/:path*', destination: '/listings/:path*', permanent: true },
      { source: '/mis-anuncios', destination: '/my-listings', permanent: true },
      { source: '/empleos/:path*', destination: '/jobs/:path*', permanent: true },
      { source: '/alertas', destination: '/alerts', permanent: true },
      { source: '/intereses', destination: '/interests', permanent: true },
      { source: '/perfil', destination: '/profile', permanent: true },
      { source: '/privacidad', destination: '/privacy', permanent: true },
      { source: '/recuperar', destination: '/forgot-password', permanent: true },
      { source: '/restablecer', destination: '/reset-password', permanent: true },
      { source: '/verificar', destination: '/verify', permanent: true },
    ];
  },
};

module.exports = nextConfig;
