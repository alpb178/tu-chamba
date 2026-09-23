import type { ReactNode } from 'react';
import { Libre_Franklin, Merriweather } from 'next/font/google';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { AuthProvider } from '@/lib/auth';
import { HubAnalytics } from '@/components/HubAnalytics';

// Design system typefaces (editorial style ported from Iris Natural): Libre
// Franklin for body/UI and Merriweather (serif) for editorial headings.
// Exposed as CSS variables for Tailwind.
const libreFranklin = Libre_Franklin({
  subsets: ['latin'],
  variable: '--font-libre-franklin',
});
const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-merriweather-garamond',
});

// <html>/<body>, fonts, session and translations shared by the two root
// layouts: the public site (app/[locale]/layout) and the admin panel
// (app/admin/layout). They are separate root layouts so <html lang> can follow
// the URL locale while the panel stays Spanish without a prefix.
export function RootDocument({
  lang,
  messages,
  children,
}: {
  lang: string;
  // Messages sent to client components. Omitted = all of the locale's.
  messages?: AbstractIntlMessages;
  children: ReactNode;
}) {
  return (
    <html lang={lang} className={`${libreFranklin.variable} ${merriweather.variable}`}>
      <body>
        <NextIntlClientProvider {...(messages ? { messages } : {})}>
          <AuthProvider>{children}</AuthProvider>
          {/* Renders nothing: sends visits and clicks to the group hub. */}
          <HubAnalytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
