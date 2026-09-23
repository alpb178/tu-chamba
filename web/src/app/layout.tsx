import type { Metadata } from 'next';
import { Libre_Franklin, Merriweather } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { HubAnalytics } from '@/components/HubAnalytics';

// Design system typefaces (editorial style ported from Iris Natural):
// Libre Franklin for body/UI and Merriweather (serif) for editorial
// headlines. Exposed as CSS variables for Tailwind and kept in the root
// layout so the site and the admin panel share them.
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

// Shared base metadata (resolves relative OpenGraph URLs, etc.). Site-specific
// SEO (title/openGraph/verification) lives in (site)/layout.
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
};

// Root layout: <html>/<body>, fonts and session. No "chrome" so the site
// —(site)/layout— and the panel —admin/layout— each define their own.
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
        {/* Renders nothing: sends the visit and clicks to the group hub. */}
        <HubAnalytics />
      </body>
    </html>
  );
}
