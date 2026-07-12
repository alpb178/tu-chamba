import type { Metadata } from 'next';
import { Hanken_Grotesk, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { AdminLayout } from '@/components/AdminLayout';

// Mismas tipografías que el portal: Inter (cuerpo) + Hanken Grotesk (títulos).
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-hanken',
});

export const metadata: Metadata = {
  title: 'Tu Chamba — Administración',
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
          <AdminLayout>{children}</AdminLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
