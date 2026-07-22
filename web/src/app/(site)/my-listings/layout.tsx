import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Página privada o de sesión: fuera del índice de buscadores.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
