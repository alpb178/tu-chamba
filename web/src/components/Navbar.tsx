'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from './ui';
import { NotificationsBell } from './NotificationsBell';
import { CORPSC } from '@/lib/companies';
import { Icon } from './Icon';

// Avatar initials (max. 2, taken from the user's name).
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

// First name for the "Hola, Ale" style greeting.
function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? '';
}

function ListingsIcon() {
  return (
    <svg className="h-4 w-4 text-outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a1 1 0 00-1 1v10a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1zM9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function InterestIcon() {
  return (
    <svg className="h-4 w-4 text-outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.05 4.5a1 1 0 011.9 0l1.6 4.1a1 1 0 00.9.64l4.4.2a1 1 0 01.58 1.78l-3.44 2.75a1 1 0 00-.34 1.06l1.18 4.24a1 1 0 01-1.53 1.1L12.55 18a1 1 0 00-1.1 0l-3.75 2.37a1 1 0 01-1.53-1.1l1.18-4.24a1 1 0 00-.34-1.06L3.57 11.2a1 1 0 01.58-1.78l4.4-.2a1 1 0 00.9-.63l1.6-4.1z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg className="h-4 w-4 text-outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM5 21a7 7 0 0114 0" />
    </svg>
  );
}

function AlertsIcon() {
  return (
    <svg className="h-4 w-4 text-outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4a2 2 0 01-.6-1.4V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg className="h-4 w-4 text-outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h6m4-2h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg className="h-4 w-4 text-outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12l1.8 1.8L15 10" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H9m4 7H6a1 1 0 01-1-1V6a1 1 0 011-1h7" />
    </svg>
  );
}

// Account dropdown menu item.
function MenuItem({
  href,
  external,
  icon,
  children,
}: {
  href: string;
  external?: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  const classes =
    'flex items-center gap-3 px-4 py-2.5 text-base text-on-surface-variant transition hover:bg-surface-container-low hover:text-brand';
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" role="menuitem" className={classes}>
        {icon}
        {children}
      </a>
    );
  }
  return (
    <Link href={href} role="menuitem" className={classes}>
      {icon}
      {children}
    </Link>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-outline">
      {children}
    </p>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  // The publish CTA is always shown: signed out it sends the user to sign up
  // and, once the account is created, straight back to the publish form.
  const publishHref = user
    ? '/listings/new'
    : `/register?next=${encodeURIComponent('/listings/new')}`;

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Compact bar on scroll (Iris editorial look): reduces the height and
  // strengthens the shadow once the page has been scrolled.
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close both menus on navigation.
  useEffect(() => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the user menu on outside click or Escape.
  useEffect(() => {
    if (!userMenuOpen) return;
    function onClick(e: MouseEvent) {
      if (!userMenuRef.current?.contains(e.target as Node)) setUserMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [userMenuOpen]);

  const activeLinkClass = (href: string) =>
    pathname === href ? 'text-brand' : 'text-on-surface-variant hover:text-brand';

  const chevron = (
    <Icon
      name="expand_more"
      className={`text-outline transition-all group-hover:text-primary ${
        userMenuOpen ? 'rotate-180' : ''
      }`}
    />
  );

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-surface/90 backdrop-blur-md transition-shadow duration-300 ${
        scrolled
          ? 'border-outline-variant shadow-md'
          : 'border-transparent shadow-[0_1px_0_0_rgba(0,0,0,0.04)]'
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl 2xl:max-w-screen-2xl items-center justify-between gap-4 px-4 transition-all duration-300 sm:px-6 lg:px-12 ${
          scrolled ? 'py-2.5' : 'py-4'
        }`}
      >
        <div className="flex flex-1 items-center gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-full.png" alt="Tu Chamba" className="h-9 w-auto" />
          </Link>
        </div>

        {/* Desktop navigation: CTA + bell + account menu */}
        <nav className="hidden items-center md:flex">
          <div className="flex items-center gap-4 border-l border-outline-variant pl-6">
            <Link href={publishHref}>
              <Button variant="accent" className="px-5 py-2.5">
                Publicar oferta de trabajo
              </Button>
            </Link>

            {user && <NotificationsBell />}

            {/* Account menu: avatar + chevron (mock style) */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                className="group flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-label={
                  user ? `Cuenta de ${firstName(user.name)}` : 'Cuenta y menú'
                }
              >
                {user ? (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-transparent bg-secondary-container text-sm font-bold text-on-secondary-container transition-all group-hover:border-primary">
                    {initials(user.name)}
                  </span>
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-transparent bg-surface-container text-on-surface-variant transition-all group-hover:border-primary">
                    <Icon name="person" />
                  </span>
                )}
                {chevron}
              </button>

            {userMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-tile border border-outline-variant bg-surface-container-lowest shadow-derek ring-1 ring-black/5"
              >
                {user ? (
                  <>
                    <div className="flex items-center gap-3 border-b border-outline-variant/60 bg-surface-container-low/70 px-4 py-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                        {initials(user.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-on-surface">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-on-surface-variant">{user.email}</p>
                      </div>
                    </div>

                    <div className="pb-1">
                      <SectionTitle>Mi cuenta</SectionTitle>
                      <MenuItem href="/my-listings" icon={<ListingsIcon />}>
                        Mis anuncios
                      </MenuItem>
                      <MenuItem href="/interests" icon={<InterestIcon />}>
                        Anuncios de tu interés
                      </MenuItem>
                      <MenuItem href="/alerts" icon={<AlertsIcon />}>
                        Alertas de empleo
                      </MenuItem>
                      <MenuItem href="/profile" icon={<ProfileIcon />}>
                        Mi perfil
                      </MenuItem>
                    </div>

                    {/* Panel access: admins only. */}
                    {user.isAdmin && (
                      <div className="border-t border-outline-variant/60 pb-1">
                        <SectionTitle>Administración</SectionTitle>
                        <MenuItem href="/admin" icon={<AdminIcon />}>
                          Panel de administración
                        </MenuItem>
                      </div>
                    )}

                    <div className="border-t border-outline-variant/60 pb-1">
                      <SectionTitle>Enlaces</SectionTitle>
                      <MenuItem href={CORPSC.url} external icon={<ExternalIcon />}>
                        {CORPSC.name}
                      </MenuItem>
                    </div>

                    <div className="border-t border-outline-variant/60">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={logout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-error transition hover:bg-error-container/40"
                      >
                        <LogoutIcon />
                        Cerrar sesión
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="border-b border-outline-variant/60 px-4 py-4 text-center">
                      <Link href="/login" className="block">
                        <Button variant="accent" className="w-full">
                          Ingresar
                        </Button>
                      </Link>
                      <p className="mt-3 text-xs text-on-surface-variant">
                        ¿Eres nuevo?{' '}
                        <Link href="/register" className="font-medium text-brand hover:underline">
                          Regístrate aquí
                        </Link>
                      </p>
                    </div>
                    <div className="pb-1">
                      <SectionTitle>Enlaces</SectionTitle>
                      <MenuItem href={CORPSC.url} external icon={<ExternalIcon />}>
                        {CORPSC.name}
                      </MenuItem>
                    </div>
                  </>
                )}
              </div>
            )}
            </div>
          </div>
        </nav>

        {/* Mobile controls: bell + hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          {user && <NotificationsBell />}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="p-2 text-on-surface-variant hover:bg-surface-container-low focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Abrir menú"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {mobileMenuOpen && (
        <nav
          id="mobile-menu"
          className="border-t border-outline-variant bg-surface-container-lowest px-4 py-3 md:hidden"
        >
          {user && (
            <div className="mb-2 flex items-center gap-2 border-b border-outline-variant/60 pb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                {initials(user.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-on-surface">{user.name}</p>
                <p className="truncate text-xs text-on-surface-variant">{user.email}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <Link href={publishHref} className="rounded-full bg-secondary-container px-3 py-2 text-center text-sm font-bold text-on-secondary-container hover:brightness-105">
              Publicar oferta de trabajo
            </Link>
            {user && (
              <>
                <Link href="/my-listings" className={`px-3 py-2 text-base hover:bg-surface-container-low ${activeLinkClass('/my-listings')}`}>
                  Mis anuncios
                </Link>
                <Link href="/interests" className={`px-3 py-2 text-base hover:bg-surface-container-low ${activeLinkClass('/interests')}`}>
                  Anuncios de tu interés
                </Link>
                <Link href="/alerts" className={`px-3 py-2 text-base hover:bg-surface-container-low ${activeLinkClass('/alerts')}`}>
                  Alertas de empleo
                </Link>
                <Link href="/profile" className={`px-3 py-2 text-base hover:bg-surface-container-low ${activeLinkClass('/profile')}`}>
                  Mi perfil
                </Link>
                {user.isAdmin && (
                  <Link href="/admin" className={`px-3 py-2 text-base hover:bg-surface-container-low ${activeLinkClass('/admin')}`}>
                    Panel de administración
                  </Link>
                )}
              </>
            )}
            <a
              href={CORPSC.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low"
            >
              {CORPSC.name} ↗
            </a>

            {user ? (
              <button
                type="button"
                onClick={logout}
                className="px-3 py-2 text-left text-sm text-error hover:bg-error-container/40"
              >
                Cerrar sesión
              </button>
            ) : (
              <>
                <Link href="/login" className={`px-3 py-2 text-base hover:bg-surface-container-low ${activeLinkClass('/login')}`}>
                  Ingresar
                </Link>
                <Link href="/register" className="rounded-full bg-primary-container px-3 py-2 text-center text-sm font-bold text-on-primary-container">
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
