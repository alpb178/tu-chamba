import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { VerificationBanner } from '@/components/VerificationBanner';
import { TrackPageView } from '@/components/TrackPageView';
import { jsonLd, organizationJsonLd, webSiteJsonLd } from '@/lib/seo';

// SEO del sitio público. El layout raíz aporta metadataBase; aquí se define lo
// específico del portal (no aplica al panel /admin, que tiene el suyo).
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
    // Banner de marca al compartir enlaces en redes/WhatsApp.
    images: ['/banner.jpeg'],
  },
  // Verificación de Google Search Console (genera la <meta> en el <head>).
  verification: {
    google: 'RAbSkpDPrtoFPzaYMThMDULsfBn4bjGRobJb6z5krXQ',
  },
};

// Chrome del sitio público: barra de navegación, banner de verificación, área
// principal centrada y pie. La sesión (AuthProvider) la provee el layout raíz.
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Datos estructurados del sitio: buscador propio en Google
          (SearchAction) y la organización con su logo. */}
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
