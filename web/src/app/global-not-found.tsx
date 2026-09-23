import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Página no encontrada · Page not found · Página não encontrada — Tu Chamba',
  robots: { index: false, follow: false },
};

// 404 for URLs that match no route at all (outside the locale tree, e.g. an
// unknown /admin/... path). Unknown paths under /es, /en or /pt use the
// localized (site)/not-found.tsx instead. There's no locale here, so it shows
// every language.
export default function GlobalNotFound() {
  return (
    <html lang="es">
      <body>
        <main className="mx-auto max-w-lg px-4 py-24 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-outline">404</p>
          <h1 className="mt-2 text-3xl text-on-surface">Página no encontrada</h1>
          <p lang="en" className="mt-1 text-on-surface-variant">Page not found</p>
          <p lang="pt-BR" className="mt-1 text-on-surface-variant">Página não encontrada</p>
          <p className="mt-6 flex justify-center gap-4 text-sm font-semibold text-brand">
            <a href="/es">Ir al inicio</a>
            <a href="/en" lang="en">Go to the home page</a>
            <a href="/pt" lang="pt-BR">Ir para o início</a>
          </p>
        </main>
      </body>
    </html>
  );
}
