'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Messages } from '@/i18n/messages';
import { Company, COMPANIES } from '@/lib/companies';
import { trackSiteClick } from '@/lib/track-site-click';
import { Icon } from './Icon';
import { Tilt3D } from './fx/Tilt3D';
import { SlideBurst } from './fx/SlideBurst';

// Promotional card for a brand: site screenshot with the name as an overlay,
// description and a "Visitar sitio" CTA (safe external link).
// Slugs with localized copy in the `companies` namespace.
type CompanySlug = Exclude<keyof Messages['companies'], 'section'>;

function BrandCard({ company }: { company: Company }) {
  const t = useTranslations('companies');
  const track = () => trackSiteClick(company);
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-card border border-outline-variant bg-surface-container-lowest shadow-aceternity transition-shadow hover:shadow-derek">
      <a
        href={company.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={track}
        className="group relative block h-48 overflow-hidden"
        style={{ backgroundColor: company.background }}
        tabIndex={-1}
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={company.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <h3 className="absolute bottom-4 left-4 font-display text-lg font-semibold text-on-primary">
          {company.name}
        </h3>
      </a>

      <div className="flex flex-1 flex-col p-6">
        <p className="mb-6 flex-1 text-sm leading-relaxed text-on-surface-variant">
          {t(`${company.slug as CompanySlug}.description`)}
        </p>
        <a
          href={company.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={track}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-tertiary px-4 py-2.5 text-sm font-bold text-on-tertiary transition-all hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={t('section.visitLabel', { name: company.name })}
        >
          {t('section.visit')}
          <Icon name="open_in_new" className="text-sm" />
        </a>
      </div>
    </article>
  );
}

// "Sitios de interés" section: carousel with the other Grupo CorpSC
// platforms (auto-advance, arrows, indicator dots and a sparkle burst).
export function FeaturedBrands() {
  const t = useTranslations('companies.section');
  const scroller = useRef<HTMLDivElement>(null);
  // Incremented on every carousel move (arrow or auto-advance) to replay the
  // sparkle burst over the cards.
  const [burst, setBurst] = useState(0);
  // Active indicator dot: derived from the scroll position.
  const [active, setActive] = useState(0);
  const count = COMPANIES.length;

  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
    setBurst((b) => b + 1);
  };

  // Scrolls card `i` to the start of the view (used by the dots).
  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({
      left: (max * i) / Math.max(1, count - 1),
      behavior: 'smooth',
    });
    setBurst((b) => b + 1);
  };

  // Keeps the active dot in sync with the scroll (arrows, auto-advance or
  // manual drag). Maps the scroll range to card indexes.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      const frac = max > 0 ? el.scrollLeft / max : 0;
      setActive(Math.round(frac * (count - 1)));
    };
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [count]);

  // Auto-advance: every 5s moves to the next "page" and wraps back to the
  // start at the end. Pauses while hovered and respects
  // prefers-reduced-motion.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let paused = false;
    const pause = () => (paused = true);
    const resume = () => (paused = false);
    el.addEventListener('pointerenter', pause);
    el.addEventListener('pointerleave', resume);
    el.addEventListener('touchstart', pause, { passive: true });

    const id = setInterval(() => {
      if (paused) return;
      const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      el.scrollTo({
        left: nearEnd ? 0 : el.scrollLeft + el.clientWidth * 0.85,
        behavior: 'smooth',
      });
      setBurst((b) => b + 1);
    }, 5000);

    return () => {
      clearInterval(id);
      el.removeEventListener('pointerenter', pause);
      el.removeEventListener('pointerleave', resume);
      el.removeEventListener('touchstart', pause);
    };
  }, []);

  return (
    <section aria-label={t('label')} className="mt-20">
      <div className="mb-6 flex items-end justify-end gap-4">
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label={t('previous')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface shadow-sm transition-colors hover:bg-surface-container-high focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Icon name="chevron_left" className="text-2xl" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label={t('next')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface shadow-sm transition-colors hover:bg-surface-container-high focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Icon name="chevron_right" className="text-2xl" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scroller}
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {COMPANIES.map((c) => (
            <div
              key={c.slug}
              className="w-[85%] shrink-0 snap-start sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
            >
              <Tilt3D>
                <BrandCard company={c} />
              </Tilt3D>
            </div>
          ))}
        </div>

        {/* Sparkle burst when the carousel moves (doesn't capture clicks). */}
        <SlideBurst trigger={burst} />
      </div>

      {/* Count indicator (dots). */}
      <div className="mt-6 flex justify-center gap-1.5">
        {COMPANIES.map((company, i) => (
          <button
            key={company.slug}
            type="button"
            onClick={() => goTo(i)}
            aria-label={t('goTo', { name: company.name })}
            aria-current={i === active}
            className={`h-1.5 rounded-full transition-all ${
              i === active
                ? 'w-6 bg-primary'
                : 'w-1.5 bg-outline hover:bg-on-surface-variant'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
