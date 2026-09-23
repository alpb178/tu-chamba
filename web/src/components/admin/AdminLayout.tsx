'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Skeleton } from './ui';
import { Icon } from './Icon';

// Panel navigation with its Material Symbols icon.
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
  // The menu stays collapsed as an icon rail. It expands over the content:
  // with hover/focus on desktop (CSS) and with the ☰ button on touch
  // devices, where there is no hover ("pinned" state).
  const [pinned, setPinned] = useState(false);
  // Picking an option closes the menu instantly, even if the cursor is still
  // over it: hover expansion is disabled until the mouse leaves.
  const [hoverEnabled, setHoverEnabled] = useState(true);
  // User menu in the header (sign out).
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Guard: the panel requires an admin user. Without a session or
  // permissions it redirects to the site login (session shared with the
  // portal).
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // On navigation, the menu collapses again.
  useEffect(() => {
    setPinned(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Escape also collapses it.
  useEffect(() => {
    if (!pinned) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPinned(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pinned]);

  // While the session is being validated: panel skeleton (rail + content)
  // instead of a plain "Cargando...".
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

  // Expanded = pinned with ☰ (touch); hover/focus expands it through CSS
  // alone (group-hover/focus-within classes), without JavaScript.
  const expanded = pinned;

  return (
    <div className="flex min-h-screen">
      {/* Rail gap in the layout: the actual aside is fixed and, when
          expanded, overlaps the content without pushing it. */}
      <div className="w-16 shrink-0" aria-hidden="true" />

      {/* Dimmed backdrop only in pinned mode (touch). */}
      <div
        aria-hidden="true"
        onClick={() => setPinned(false)}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          expanded ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* The expansion uses Material's "emphasized" curve (soft start, long
          deceleration) and also animates the shadow so it does not pop in
          at the end. */}
      <aside
        onMouseLeave={() => setHoverEnabled(true)}
        className={`group fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-outline-variant bg-surface-container-low transition-[width,box-shadow] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
          hoverEnabled ? 'hover:w-64 hover:shadow-derek focus-within:w-64' : ''
        } ${expanded ? 'w-64 shadow-derek' : 'w-16'}`}
      >
        {/* Rail header: ☰ pins the menu on touch devices. */}
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
          {/* The label appears with a small delay (once the width has
              grown) and fades out without delay on collapse. */}
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
                // Closes the menu when an option is picked (also when
                // navigating to the current page, where pathname does not change).
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
              {/* The label is only visible with the menu expanded
                  (hover/pinned); it enters with a delay, following the
                  width, and leaves without one. */}
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
          {/* Logo on the left of the screen (next to the rail). Links to
              the app's main portal. */}
          <Link href="/" className="flex min-w-0 items-center" aria-label="Ir al portal principal">
            <span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-full.png" alt="Tu Chamba" className="h-7 w-auto" />
              <span className="block text-[11px] leading-none text-on-surface-variant">
                Administración
              </span>
            </span>
          </Link>

          {/* User avatar: clicking it opens the session menu. */}
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
                {/* Clicking outside closes the menu. */}
                <div
                  aria-hidden="true"
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-tile border border-outline-variant bg-surface-container-lowest shadow-derek"
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
