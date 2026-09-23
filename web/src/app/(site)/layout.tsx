import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { GroupTicker } from '@/components/GroupTicker';
import { Footer } from '@/components/Footer';
import { VerificationBanner } from '@/components/VerificationBanner';
import { TrackPageView } from '@/components/TrackPageView';
import { jsonLd, organizationJsonLd, webSiteJsonLd } from '@/lib/seo';

// SEO for the public site. The root layout provides metadataBase; here we
// define what is specific to the portal (not the /admin panel, which has its own).
export const metadata: Metadata = {
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
    // Brand banner when sharing links on social media/WhatsApp.
    images: ['/banner.jpeg'],
  },
  // Google Search Console verification (generates the <meta> in the <head>).
  verification: {
    google: 'RAbSkpDPrtoFPzaYMThMDULsfBn4bjGRobJb6z5krXQ',
  },
};

// Public site chrome: navigation bar, verification banner, centered main area
// and footer. The session (AuthProvider) is provided by the root layout.
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Site structured data: our own search box on Google
          (SearchAction) and the organization with its logo. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(webSiteJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(organizationJsonLd()) }}
      />
      <TrackPageView />
      <div className="flex min-h-screen flex-col">
        <GroupTicker />
        <Navbar />
        <VerificationBanner />
        <main className="mx-auto w-full max-w-7xl 2xl:max-w-screen-2xl flex-1 px-4 py-6 sm:px-6 lg:px-12">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
