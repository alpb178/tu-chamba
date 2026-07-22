import type { Metadata } from 'next';
import { Libre_Franklin, Merriweather } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';

// Tipografías del sistema de diseño (estilo editorial portado de Iris Natural):
// Libre Franklin para el cuerpo/UI y Merriweather (serif) para los titulares
// editoriales. Se exponen como variables CSS para Tailwind y viven en el layout
// raíz para que las compartan el sitio y el panel de administración.
const libreFranklin = Libre_Franklin({
  subsets: ['latin'],
  variable: '--font-libre-franklin',
});
const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-merriweather-garamond',
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
    <html
      lang="es"
      className={`${libreFranklin.variable} ${merriweather.variable}`}
    >
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
