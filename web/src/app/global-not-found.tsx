import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Página no encontrada · Page not found — Tu Chamba',
  robots: { index: false, follow: false },
};

// 404 for URLs that match no route at all (outside the locale tree, e.g. an
// unknown /admin/... path). Unknown paths under /es or /en use the localized
// (site)/not-found.tsx instead. There's no locale here, so it's bilingual.
export default function GlobalNotFound() {
  return (
    <html lang="es">
      <body>
        <main className="mx-auto max-w-lg px-4 py-24 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-outline">404</p>
          <h1 className="mt-2 text-3xl text-on-surface">Página no encontrada</h1>
          <p lang="en" className="mt-1 text-on-surface-variant">Page not found</p>
          <p className="mt-6 flex justify-center gap-4 text-sm font-semibold text-brand">
            <a href="/es">Ir al inicio</a>
            <a href="/en" lang="en">Go to the home page</a>
          </p>
        </main>
      </body>
    </html>
  );
}
