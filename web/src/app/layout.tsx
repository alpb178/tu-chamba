import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { VerificacionBanner } from '@/components/VerificacionBanner';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tu-chamba.corpsc.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Tu Chamba — Empleos y trabajos en Bolivia',
    template: '%s',
  },
  description:
    'Encuentra empleo o publica ofertas de trabajo en Bolivia. Chamba por día, tiempo completo o media jornada, con contacto directo por WhatsApp.',
  openGraph: {
    siteName: 'Tu Chamba',
    locale: 'es_BO',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <VerificacionBanner />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
