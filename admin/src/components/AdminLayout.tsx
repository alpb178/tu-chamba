'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from './ui';

// Navegación del panel con su icono Material Symbols.
const NAV = [
  { href: '/', label: 'Dashboard', icon: 'monitoring' },
  { href: '/usuarios', label: 'Usuarios', icon: 'group' },
  { href: '/anuncios', label: 'Anuncios', icon: 'work' },
  { href: '/top-anuncios', label: 'Top anuncios', icon: 'trending_up' },
  { href: '/reportes', label: 'Reportes', icon: 'flag' },
  { href: '/trazas', label: 'Trazas', icon: 'receipt_long' },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Guard: exige sesión de admin en todas las páginas excepto /login.
  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [loading, user, pathname, router]);

  if (pathname === '/login') return <>{children}</>;
  if (loading) return <p className="p-6 text-on-surface-variant">Cargando...</p>;
  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-outline-variant bg-surface-container-low">
        {/* Misma altura que el navbar (h-16): las líneas quedan alineadas. */}
        <div className="flex h-16 flex-col justify-center border-b border-outline-variant px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-full.svg" alt="Tu Chamba" className="h-7 w-auto self-start" />
          <p className="mt-0.5 text-xs text-on-surface-variant">Administración</p>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
                pathname === n.href
                  ? 'bg-secondary-container font-bold text-on-secondary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-lg">
                {n.icon}
              </span>
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-6">
          <span className="flex items-center gap-3 text-sm font-medium text-on-surface">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-container text-xs font-bold text-on-secondary-container">
              {user.name.slice(0, 2).toUpperCase()}
            </span>
            {user.name}
          </span>
          <Button variant="outline" onClick={logout}>
            Salir
          </Button>
        </header>
        <main className="flex-1 p-6">{children}</main>
        <footer className="border-t border-outline-variant bg-surface-container-highest px-6 py-4">
          <p className="text-center text-xs text-on-surface-variant">
            © {new Date().getFullYear()} Tu Chamba — Panel de administración
          </p>
        </footer>
      </div>
    </div>
  );
}
