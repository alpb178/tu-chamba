import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import '../globals.css';
import { RootDocument } from '@/components/RootDocument';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { messages } from '@/i18n/messages';
import { SITE } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: 'Tu Chamba — Administración',
};

// Root layout of the admin panel: Spanish only and outside the locale routing
// (no /es prefix). Only the messages of the shared components it uses
// (PasswordInput) are sent to the browser, in Spanish.
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  setRequestLocale('es');
  return (
    <RootDocument
      lang="es"
      messages={{ auth: { passwordInput: messages.es.auth.passwordInput } }}
    >
      <AdminLayout>{children}</AdminLayout>
    </RootDocument>
  );
}
