'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Button, Skeleton } from './ui';
import { Icon } from './Icon';

// Navegación del panel con su icono Material Symbols.
const NAV = [
  { href: '/', label: 'Dashboard', icon: 'monitoring' },
  { href: '/users', label: 'Usuarios', icon: 'group' },
  { href: '/listings', label: 'Anuncios', icon: 'work' },
  { href: '/top-listings', label: 'Top anuncios', icon: 'trending_up' },
  { href: '/reports', label: 'Anuncios reportados', icon: 'flag' },
  { href: '/reports/client-ads', label: 'Anuncios de clientes', icon: 'person_search' },
  { href: '/reports/reviews', label: 'Reseñas', icon: 'star' },
  { href: '/traces', label: 'Auditoría', icon: 'receipt_long' },
  { href: '/activity', label: 'Actividad del sitio', icon: 'monitor_heart' },
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
  // Mientras se valida la sesión: silueta del panel (sidebar + contenido)
  // en lugar de un "Cargando..." plano.
  if (loading) {
    return (
      <div aria-hidden="true" className="flex min-h-screen">
        <aside className="w-60 shrink-0 space-y-2 border-r border-outline-variant bg-surface-container-low p-4">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2 pt-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        </aside>
        <div className="flex-1">
          <div className="flex h-16 items-center justify-between border-b border-outline-variant px-6">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-16" />
          </div>
          <div className="space-y-4 p-6">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-outline-variant bg-surface-container-low">
        {/* Misma altura que el navbar (h-16): las líneas quedan alineadas. */}
        <div className="flex h-16 flex-col justify-center border-b border-outline-variant px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-full.png" alt="Tu Chamba" className="h-7 w-auto self-start" />
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
              <Icon name={n.icon} className="text-lg" />
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
