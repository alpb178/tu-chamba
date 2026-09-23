import { useTranslations } from 'next-intl';

// Home page hero ("banner" variant): shows the Tu Chamba brand banner full
// bleed and uncropped. The job search bar lives in the list header
// (CatalogHeader), same as in the editorial variant.
export function Hero() {
  const t = useTranslations('home.hero');
  return (
    <section className="relative z-30 -mt-6 ml-[calc(50%-50vw)] w-screen">
      {/* Full-width, uncropped banner (it has text up to the edge). h-auto
          keeps its aspect ratio; width/height reserve the space to avoid
          layout shifts (no CLS). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/banner.jpeg"
        alt={t('bannerAlt')}
        width={1936}
        height={544}
        className="h-auto w-full"
        fetchPriority="high"
      />
    </section>
  );
}
