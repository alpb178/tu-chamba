'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from './ui';

export function Navbar() {
  const { user, logout } = useAuth();
  const puedePublicar = user?.role === 'EMPLEADOR' || user?.role === 'ADMIN';

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-full.svg" alt="Tu Chamba" className="h-9 w-auto" />
        </Link>

        <nav className="flex items-center gap-3">
          {puedePublicar && (
            <Link href="/anuncios/nuevo">
              <Button variant="accent">Publicar anuncio</Button>
            </Link>
          )}
          {user ? (
            <>
              {(user.role === 'EMPLEADOR' || user.role === 'ADMIN') && (
                <Link href="/mis-anuncios" className="text-sm text-gray-700 hover:text-brand">
                  Mis anuncios
                </Link>
              )}
              <span className="hidden text-sm text-gray-500 sm:inline">
                {user.nombre}
              </span>
              <Button variant="outline" onClick={logout}>
                Salir
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-700 hover:text-brand">
                Ingresar
              </Link>
              <Link href="/register">
                <Button variant="outline">Registrarse</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
