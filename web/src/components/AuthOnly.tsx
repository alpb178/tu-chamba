'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';

// Envuelve secciones del detalle que solo ven los usuarios con sesión
// (salario, zona, publicante, reseñas...). Sin sesión no se renderiza nada:
// el visitante anónimo solo ve la parte superior del anuncio y el aviso de
// iniciar sesión de AdActions. Es un gate de presentación (como el corte de
// la descripción); el teléfono y la ubicación siguen protegidos en el API.
export function AuthOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;
  return <>{children}</>;
}
