import type { Metadata } from 'next';
import { Hanken_Grotesk, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { VerificationBanner } from '@/components/VerificationBanner';

// Tipografías del sistema de diseño: Inter (cuerpo) + Hanken Grotesk
// (titulares), expuestas como variables CSS para Tailwind.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-hanken',
});

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
    <html lang="es" className={`${inter.variable} ${hanken.variable}`}>
      <head>
        {/* Iconos Material Symbols (fuente variable de Google Fonts). */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <VerificationBanner />
            <main className="mx-auto w-full max-w-7xl 2xl:max-w-screen-2xl flex-1 px-4 py-6 sm:px-6 lg:px-12">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
