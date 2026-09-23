import type { Metadata } from 'next';
import { AdminLayout } from '@/components/admin/AdminLayout';

export const metadata: Metadata = {
  title: 'Tu Chamba — Administración',
};

// Panel layout: only the admin "chrome" (side rail + session guard). The
// <html>/<body>, fonts and AuthProvider come from the root layout, shared
// with the site.
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
