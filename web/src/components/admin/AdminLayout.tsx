'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Skeleton } from './ui';
import { Icon } from './Icon';

// Navegación del panel con su icono Material Symbols.
const NAV = [
  { href: '/admin', label: 'Dashboard', icon: 'monitoring' },
  { href: '/admin/users', label: 'Usuarios', icon: 'group' },
  { href: '/admin/listings', label: 'Anuncios', icon: 'work' },
  { href: '/admin/top-listings', label: 'Top anuncios', icon: 'trending_up' },
  { href: '/admin/site-clicks', label: 'Sitios de interés', icon: 'ads_click' },
  { href: '/admin/reports', label: 'Anuncios reportados', icon: 'flag' },
  { href: '/admin/reports/client-ads', label: 'Anuncios de clientes', icon: 'person_search' },
  { href: '/admin/reports/user-activity', label: 'Actividad de usuarios', icon: 'history' },
  { href: '/admin/reports/reviews', label: 'Reseñas', icon: 'star' },
  { href: '/admin/traces', label: 'Auditoría', icon: 'receipt_long' },
  { href: '/admin/activity', label: 'Actividad del sitio', icon: 'monitor_heart' },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // El menú vive colapsado como riel de iconos. Se expande superpuesto al
  // contenido: con hover/focus en escritorio (CSS) y con el botón ☰ en
  // táctil, donde no existe hover (estado "pinned").
  const [pinned, setPinned] = useState(false);
  // Al elegir una opción el menú se cierra al instante, aunque el cursor
  // siga encima: se apaga la expansión por hover hasta que el mouse salga.
  const [hoverEnabled, setHoverEnabled] = useState(true);
  // Menú del usuario en la cabecera (cerrar sesión).
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Guard: el panel exige un usuario administrador. Sin sesión o sin permisos
  // redirige al login del sitio (sesión compartida con el portal).
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Al navegar, el menú vuelve a colapsarse.
  useEffect(() => {
    setPinned(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Escape también lo colapsa.
  useEffect(() => {
    if (!pinned) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPinned(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pinned]);

  // Mientras se valida la sesión: silueta del panel (riel + contenido)
  // en lugar de un "Cargando..." plano.
  if (loading) {
    return (
      <div aria-hidden="true" className="flex min-h-screen">
        <aside className="flex w-16 shrink-0 flex-col items-center gap-2 border-r border-outline-variant bg-surface-container-low py-4">
          {Array.from({ length: NAV.length }, (_, i) => (
            <Skeleton key={i} className="h-10 w-10" />
          ))}
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
  if (!user || !user.isAdmin) return null;

  // Expandido = fijado con ☰ (táctil); el hover/focus lo expande solo por
  // CSS (clases group-hover/focus-within), sin JavaScript.
  const expanded = pinned;

  return (
    <div className="flex min-h-screen">
      {/* Hueco del riel en el layout: el aside real es fijo y al expandirse
          se superpone al contenido sin empujarlo. */}
      <div className="w-16 shrink-0" aria-hidden="true" />

      {/* Fondo oscurecido solo en modo fijado (táctil). */}
      <div
        aria-hidden="true"
        onClick={() => setPinned(false)}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          expanded ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* La expansión usa la curva "emphasized" de Material (arranque suave,
          frenado largo) y anima también la sombra para que no aparezca de
          golpe al final. */}
      <aside
        onMouseLeave={() => setHoverEnabled(true)}
        className={`group fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-outline-variant bg-surface-container-low transition-[width,box-shadow] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
          hoverEnabled ? 'hover:w-64 hover:shadow-derek focus-within:w-64' : ''
        } ${expanded ? 'w-64 shadow-derek' : 'w-16'}`}
      >
        {/* Cabecera del riel: ☰ fija el menú en táctil. */}
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-outline-variant px-3">
          <button
            type="button"
            onClick={() => setPinned((v) => !v)}
            aria-label={expanded ? 'Cerrar el menú' : 'Abrir el menú'}
            aria-expanded={expanded}
            className="flex h-10 w-10 shrink-0 items-center justify-center text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
          >
            <Icon name={expanded ? 'close' : 'menu'} className="text-2xl" />
          </button>
          {/* La etiqueta aparece con un pequeño retardo (cuando el ancho ya
              avanzó) y se desvanece sin retardo al colapsar. */}
          <p
            className={`whitespace-nowrap text-sm font-medium text-on-surface-variant transition-opacity duration-200 ease-out group-hover:delay-100 group-focus-within:delay-100 group-hover:opacity-100 group-focus-within:opacity-100 ${
              expanded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Menú
          </p>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              title={n.label}
              onClick={(e) => {
                // Cierra el menú al elegir una opción (también si se
                // navega a la página actual, donde pathname no cambia).
                setPinned(false);
                setHoverEnabled(false);
                e.currentTarget.blur();
              }}
              className={`flex h-10 items-center gap-3 px-2 transition-all ${
                pathname === n.href
                  ? 'bg-secondary-container font-bold text-on-secondary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                <Icon name={n.icon} className="text-xl" />
              </span>
              {/* La etiqueta solo se ve con el menú expandido (hover/fijado);
                  entra con retardo, siguiendo al ancho, y sale sin él. */}
              <span
                className={`whitespace-nowrap text-sm transition-opacity duration-200 ease-out group-hover:delay-100 group-focus-within:delay-100 group-hover:opacity-100 group-focus-within:opacity-100 ${
                  expanded ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {n.label}
              </span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-4 sm:px-6">
          {/* Logo a la izquierda de la pantalla (junto al riel). Lleva al
              portal principal de la aplicación. */}
          <Link href="/" className="flex min-w-0 items-center" aria-label="Ir al portal principal">
            <span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-full.png" alt="Tu Chamba" className="h-7 w-auto" />
              <span className="block text-[11px] leading-none text-on-surface-variant">
                Administración
              </span>
            </span>
          </Link>

          {/* Avatar del usuario: al hacer click se abre el menú de sesión. */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-container text-xs font-bold text-on-secondary-container">
                {user.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="hidden sm:inline">{user.name}</span>
              <Icon name="expand_more" className="text-lg text-on-surface-variant" />
            </button>

            {userMenuOpen && (
              <>
                {/* Click fuera cierra el menú. */}
                <div
                  aria-hidden="true"
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden border border-outline-variant bg-surface-container-lowest shadow-derek"
                >
                  <div className="border-b border-outline-variant px-4 py-3">
                    <p className="truncate text-sm font-medium text-on-surface">{user.name}</p>
                    <p className="truncate text-xs text-on-surface-variant">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm text-error transition-colors hover:bg-surface-container-low"
                  >
                    <Icon name="logout" className="text-lg" />
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
        <footer className="border-t border-outline-variant bg-surface-container-highest px-6 py-4">
          <p className="text-center text-xs text-on-surface-variant">
            © {new Date().getFullYear()} Tu Chamba — Panel de administración
          </p>
        </footer>
      </div>
    </div>
  );
}
