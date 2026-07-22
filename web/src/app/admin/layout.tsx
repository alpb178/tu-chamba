import type { Metadata } from 'next';
import { AdminLayout } from '@/components/admin/AdminLayout';

export const metadata: Metadata = {
  title: 'Tu Chamba — Administración',
};

// Layout del panel: solo el "chrome" del administrador (riel lateral + guard
// de sesión). El <html>/<body>, las fuentes y el AuthProvider los provee el
// layout raíz, compartidos con el sitio.
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
