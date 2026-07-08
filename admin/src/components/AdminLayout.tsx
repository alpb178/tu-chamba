'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from './ui';
import { CORPSC, EMPRESAS } from '@/lib/empresas';

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/usuarios', label: 'Usuarios' },
  { href: '/anuncios', label: 'Anuncios' },
  { href: '/reportes', label: 'Reportes' },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Guard: exige sesión ADMIN en todas las páginas excepto /login.
  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [loading, user, pathname, router]);

  if (pathname === '/login') return <>{children}</>;
  if (loading) return <p className="p-6 text-gray-500">Cargando...</p>;
  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-full.svg" alt="Tu Chamba" className="h-8 w-auto" />
          <p className="mt-1 text-xs text-gray-500">Administración</p>
        </div>
        <nav className="flex flex-col p-2">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-md px-3 py-2 text-sm ${
                pathname === n.href
                  ? 'bg-brand-light font-medium text-brand'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {n.label}
            </Link>
          ))}
          {/* Acceso destacado a la matriz del grupo. */}
          <a
            href={CORPSC.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center gap-1 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-brand"
          >
            {CORPSC.nombre}
            <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <span className="text-sm text-gray-600">{user.nombre}</span>
          <Button variant="outline" onClick={logout}>
            Salir
          </Button>
        </header>
        <main className="flex-1 p-6">{children}</main>
        <footer className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex flex-col items-center gap-2 text-xs text-gray-500 sm:flex-row sm:justify-between">
            <span>© {new Date().getFullYear()} Tu Chamba — Panel de administración</span>
            <nav aria-label="Nuestras marcas" className="flex items-center gap-3">
              <span className="text-gray-400">Nuestras marcas:</span>
              {EMPRESAS.map((e) => (
                <a
                  key={e.slug}
                  href={e.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-brand focus:outline-none focus-visible:underline"
                >
                  {e.nombre}
                </a>
              ))}
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
