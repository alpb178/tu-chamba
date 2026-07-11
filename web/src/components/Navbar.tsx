'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from './ui';
import { NotificationsBell } from './NotificationsBell';
import { CORPSC } from '@/lib/companies';

// Iniciales para el avatar (máx. 2, a partir del nombre del usuario).
function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || '?';
}

// Primer nombre para el saludo estilo "Hola, Ale".
function primerNombre(nombre: string) {
  return nombre.trim().split(/\s+/)[0] ?? '';
}

function IconoAnuncios() {
  return (
    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a1 1 0 00-1 1v10a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1zM9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function IconoInteres() {
  return (
    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.05 4.5a1 1 0 011.9 0l1.6 4.1a1 1 0 00.9.64l4.4.2a1 1 0 01.58 1.78l-3.44 2.75a1 1 0 00-.34 1.06l1.18 4.24a1 1 0 01-1.53 1.1L12.55 18a1 1 0 00-1.1 0l-3.75 2.37a1 1 0 01-1.53-1.1l1.18-4.24a1 1 0 00-.34-1.06L3.57 11.2a1 1 0 01.58-1.78l4.4-.2a1 1 0 00.9-.63l1.6-4.1z" />
    </svg>
  );
}

function IconoPerfil() {
  return (
    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM5 21a7 7 0 0114 0" />
    </svg>
  );
}

function IconoAlertas() {
  return (
    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4a2 2 0 01-.6-1.4V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function IconoExterno() {
  return (
    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h6m4-2h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function IconoSalir() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H9m4 7H6a1 1 0 01-1-1V6a1 1 0 011-1h7" />
    </svg>
  );
}

// Ítem del menú desplegable de cuenta.
function ItemMenu({
  href,
  externo,
  icono,
  children,
}: {
  href: string;
  externo?: boolean;
  icono: ReactNode;
  children: ReactNode;
}) {
  const clases =
    'flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50 hover:text-brand';
  if (externo) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" role="menuitem" className={clases}>
        {icono}
        {children}
      </a>
    );
  }
  return (
    <Link href={href} role="menuitem" className={clases}>
      {icono}
      {children}
    </Link>
  );
}

function TituloSeccion({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
      {children}
    </p>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

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

  const chevron = (
    <svg
      className={`h-4 w-4 text-gray-400 transition-transform ${menuUsuario ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-full.svg" alt="Tu Chamba" className="h-9 w-auto" />
        </Link>

        {/* Navegación de escritorio: solo el CTA queda fuera; el resto vive en el menú de cuenta */}
        <nav className="hidden items-center gap-3 md:flex">
          {user && (
            <Link href="/anuncios/nuevo">
              <Button variant="accent">Publicar anuncio</Button>
            </Link>
          )}

          {user && <NotificationsBell />}

          {/* Menú de cuenta (estilo Amazon: "Hola, Nombre / Cuenta y menú") */}
          <div className="relative" ref={usuarioRef}>
            <button
              type="button"
              onClick={() => setMenuUsuario((o) => !o)}
              className="flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-haspopup="menu"
              aria-expanded={menuUsuario}
            >
              {user ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                  {iniciales(user.name)}
                </span>
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM5 21a7 7 0 0114 0" />
                  </svg>
                </span>
              )}
              <span className="flex flex-col items-start leading-tight">
                <span className="max-w-[9rem] truncate text-[11px] text-gray-500">
                  {user ? `Hola, ${primerNombre(user.name)}` : 'Hola, identifícate'}
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold text-gray-800">
                  Cuenta y menú
                  {chevron}
                </span>
              </span>
            </button>

            {menuUsuario && (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl ring-1 ring-black/5"
              >
                {user ? (
                  <>
                    <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                        {iniciales(user.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>

                    <div className="pb-1">
                      <TituloSeccion>Mi cuenta</TituloSeccion>
                      <ItemMenu href="/mis-anuncios" icono={<IconoAnuncios />}>
                        Mis anuncios
                      </ItemMenu>
                      <ItemMenu href="/intereses" icono={<IconoInteres />}>
                        Anuncios de tu interés
                      </ItemMenu>
                      <ItemMenu href="/alertas" icono={<IconoAlertas />}>
                        Alertas de empleo
                      </ItemMenu>
                      <ItemMenu href="/perfil" icono={<IconoPerfil />}>
                        Mi perfil
                      </ItemMenu>
                    </div>

                    <div className="border-t border-gray-100 pb-1">
                      <TituloSeccion>Enlaces</TituloSeccion>
                      <ItemMenu href={CORPSC.url} externo icono={<IconoExterno />}>
                        {CORPSC.name}
                      </ItemMenu>
                    </div>

                    <div className="border-t border-gray-100">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={logout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                      >
                        <IconoSalir />
                        Cerrar sesión
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="border-b border-gray-100 px-4 py-4 text-center">
                      <Link href="/login" className="block">
                        <Button variant="accent" className="w-full">
                          Ingresar
                        </Button>
                      </Link>
                      <p className="mt-3 text-xs text-gray-500">
                        ¿Eres nuevo?{' '}
                        <Link href="/register" className="font-medium text-brand hover:underline">
                          Regístrate aquí
                        </Link>
                      </p>
                    </div>
                    <div className="pb-1">
                      <TituloSeccion>Enlaces</TituloSeccion>
                      <ItemMenu href={CORPSC.url} externo icono={<IconoExterno />}>
                        {CORPSC.name}
                      </ItemMenu>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Controles móviles: campana + hamburguesa */}
        <div className="flex items-center gap-1 md:hidden">
          {user && <NotificationsBell />}
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
                {iniciales(user.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">{user.name}</p>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            {user && (
              <>
                <Link href="/anuncios/nuevo" className="rounded-md bg-accent px-3 py-2 text-center text-sm font-medium text-brand">
                  Publicar anuncio
                </Link>
                <Link href="/mis-anuncios" className={`rounded-md px-3 py-2 text-sm hover:bg-gray-50 ${linkActivo('/mis-anuncios')}`}>
                  Mis anuncios
                </Link>
                <Link href="/intereses" className={`rounded-md px-3 py-2 text-sm hover:bg-gray-50 ${linkActivo('/intereses')}`}>
                  Anuncios de tu interés
                </Link>
                <Link href="/alertas" className={`rounded-md px-3 py-2 text-sm hover:bg-gray-50 ${linkActivo('/alertas')}`}>
                  Alertas de empleo
                </Link>
                <Link href="/perfil" className={`rounded-md px-3 py-2 text-sm hover:bg-gray-50 ${linkActivo('/perfil')}`}>
                  Mi perfil
                </Link>
              </>
            )}
            <a
              href={CORPSC.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              {CORPSC.name} ↗
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
