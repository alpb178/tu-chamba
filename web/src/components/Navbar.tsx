'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from './ui';
import { NotificacionesBell } from './NotificacionesBell';
import { CORPSC } from '@/lib/empresas';

// Iniciales para el avatar (máx. 2, a partir del nombre del usuario).
function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || '?';
}

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const puedePublicar = user?.role === 'EMPLEADOR' || user?.role === 'ADMIN';

  const [menuUsuario, setMenuUsuario] = useState(false);
  const [menuMovil, setMenuMovil] = useState(false);
  const usuarioRef = useRef<HTMLDivElement>(null);

  // Cierra ambos menús al navegar.
  useEffect(() => {
    setMenuUsuario(false);
    setMenuMovil(false);
  }, [pathname]);

  // Cierra el menú de usuario al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!menuUsuario) return;
    function onClick(e: MouseEvent) {
      if (!usuarioRef.current?.contains(e.target as Node)) setMenuUsuario(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuUsuario(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuUsuario]);

  const linkActivo = (href: string) =>
    pathname === href ? 'text-brand' : 'text-gray-700 hover:text-brand';

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-full.svg" alt="Tu Chamba" className="h-9 w-auto" />
        </Link>

        {/* Navegación de escritorio */}
        <nav className="hidden items-center gap-2 md:flex">
          <a
            href={CORPSC.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {CORPSC.nombre}
            <span aria-hidden="true">↗</span>
          </a>

          {puedePublicar && (
            <Link
              href="/mis-anuncios"
              className={`rounded-md px-3 py-2 text-sm transition hover:bg-gray-50 ${linkActivo('/mis-anuncios')}`}
            >
              Mis anuncios
            </Link>
          )}

          {puedePublicar && (
            <Link href="/anuncios/nuevo" className="ml-1">
              <Button variant="accent">Publicar anuncio</Button>
            </Link>
          )}

          {user ? (
            <div className="ml-1 flex items-center gap-2">
              <NotificacionesBell />
              {/* Menú de usuario */}
              <div className="relative" ref={usuarioRef}>
                <button
                  type="button"
                  onClick={() => setMenuUsuario((o) => !o)}
                  className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-haspopup="menu"
                  aria-expanded={menuUsuario}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                    {iniciales(user.nombre)}
                  </span>
                  <span className="max-w-[8rem] truncate text-sm text-gray-700">
                    {user.nombre}
                  </span>
                  <span className="text-gray-400" aria-hidden="true">
                    ▾
                  </span>
                </button>

                {menuUsuario && (
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
                  >
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {user.nombre}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {user.email}
                      </p>
                    </div>
                    {puedePublicar && (
                      <Link
                        href="/mis-anuncios"
                        role="menuitem"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Mis anuncios
                      </Link>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={logout}
                      className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="ml-1 flex items-center gap-2">
              <Link
                href="/login"
                className={`rounded-md px-3 py-2 text-sm transition hover:bg-gray-50 ${linkActivo('/login')}`}
              >
                Ingresar
              </Link>
              <Link href="/register">
                <Button variant="accent">Registrarse</Button>
              </Link>
            </div>
          )}
        </nav>

        {/* Controles móviles: campana + hamburguesa */}
        <div className="flex items-center gap-1 md:hidden">
          {user && <NotificacionesBell />}
          <button
            type="button"
            onClick={() => setMenuMovil((o) => !o)}
            className="rounded-md p-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Abrir menú"
            aria-expanded={menuMovil}
            aria-controls="menu-movil"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              {menuMovil ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Panel móvil desplegable */}
      {menuMovil && (
        <nav
          id="menu-movil"
          className="border-t border-gray-200 bg-white px-4 py-3 md:hidden"
        >
          {user && (
            <div className="mb-2 flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                {iniciales(user.nombre)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">{user.nombre}</p>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            {puedePublicar && (
              <>
                <Link href="/anuncios/nuevo" className="rounded-md bg-accent px-3 py-2 text-center text-sm font-medium text-brand">
                  Publicar anuncio
                </Link>
                <Link href="/mis-anuncios" className={`rounded-md px-3 py-2 text-sm hover:bg-gray-50 ${linkActivo('/mis-anuncios')}`}>
                  Mis anuncios
                </Link>
              </>
            )}
            <a
              href={CORPSC.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              {CORPSC.nombre} ↗
            </a>

            {user ? (
              <button
                type="button"
                onClick={logout}
                className="rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Cerrar sesión
              </button>
            ) : (
              <>
                <Link href="/login" className={`rounded-md px-3 py-2 text-sm hover:bg-gray-50 ${linkActivo('/login')}`}>
                  Ingresar
                </Link>
                <Link href="/register" className="rounded-md bg-accent px-3 py-2 text-center text-sm font-medium text-brand">
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
