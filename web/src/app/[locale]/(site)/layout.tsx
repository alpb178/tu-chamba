import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Navbar } from '@/components/Navbar';
import { GroupTicker } from '@/components/GroupTicker';
import { Footer } from '@/components/Footer';
import { VerificationBanner } from '@/components/VerificationBanner';
import { TrackPageView } from '@/components/TrackPageView';
import { jsonLd, organizationJsonLd, webSiteJsonLd } from '@/lib/seo';

// SEO for the public site. The root layout provides metadataBase; here we
// define what is specific to the portal (not the /admin panel, which has its own).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: 'meta' });
  return {
    title: {
      default: t('site.title'),
      template: '%s',
    },
    description: t('site.description'),
    openGraph: {
      siteName: 'Tu Chamba',
      locale: locale === 'en' ? 'en_US' : 'es_BO',
      type: 'website',
      // Brand banner when sharing links on social media/WhatsApp.
      images: ['/banner.jpeg'],
    },
    // Google Search Console verification (generates the <meta> in the <head>).
    verification: {
      google: 'RAbSkpDPrtoFPzaYMThMDULsfBn4bjGRobJb6z5krXQ',
    },
  };
}

// Public site chrome: navigation bar, verification banner, centered main area
// and footer. The session (AuthProvider) is provided by the root layout.
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      {/* Site structured data: our own search box on Google
          (SearchAction) and the organization with its logo. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(webSiteJsonLd(locale as Locale)) }}
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
