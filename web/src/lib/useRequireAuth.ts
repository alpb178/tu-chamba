'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth';

// Guard de sesión compartido por las páginas privadas: sin sesión
// redirige a /login conservando la ruta (?next=) para volver tras
// entrar. Devuelve user=null mientras carga o redirige.
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  return { user, loading };
}
