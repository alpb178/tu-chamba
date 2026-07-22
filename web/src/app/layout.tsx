import type { Metadata } from 'next';
import { Hanken_Grotesk, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';

// Tipografías del sistema de diseño: Inter (cuerpo) + Hanken Grotesk
// (titulares), expuestas como variables CSS para Tailwind. Viven en el layout
// raíz para que las compartan el sitio y el panel de administración.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-hanken',
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tu-chamba.corpsc.com';

// Metadata base común (resuelve las URLs relativas de OpenGraph, etc.). El SEO
// específico del sitio (title/openGraph/verification) vive en (site)/layout.
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
};

// Layout raíz: <html>/<body>, fuentes y sesión. Sin "chrome" para que el sitio
// —(site)/layout— y el panel —admin/layout— definan el suyo por separado.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${hanken.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
