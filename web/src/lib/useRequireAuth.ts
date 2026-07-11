'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth';

// Guard de sesión compartido por las páginas privadas: sin sesión
// redirige a /login. Devuelve user=null mientras carga o redirige.
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  return { user, loading };
}
