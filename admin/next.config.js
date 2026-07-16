/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Rutas antiguas en español -> nuevas en inglés (marcadores de los admins).
  async redirects() {
    return [
      { source: '/anuncios/importar', destination: '/listings/import', permanent: true },
      { source: '/anuncios/nuevo', destination: '/listings/new', permanent: true },
      { source: '/anuncios', destination: '/listings', permanent: true },
      { source: '/top-anuncios', destination: '/top-listings', permanent: true },
      { source: '/reportes', destination: '/reports', permanent: true },
      { source: '/trazas', destination: '/traces', permanent: true },
      { source: '/usuarios', destination: '/users', permanent: true },
    ];
  },
};

module.exports = nextConfig;
