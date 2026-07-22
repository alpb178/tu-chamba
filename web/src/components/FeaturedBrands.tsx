'use client';

import { useEffect, useRef, useState } from 'react';
import { Company, COMPANIES } from '@/lib/companies';
import { api } from '@/lib/api';
import { Icon } from './Icon';
import { Heading } from './ui';
import { Tilt3D } from './fx/Tilt3D';
import { SlideBurst } from './fx/SlideBurst';

// Registra el acceso a la tarjeta de una empresa del grupo (métrica del panel
// admin). Best-effort: los enlaces abren en pestaña nueva, así que el fetch
// alcanza a completarse; si falla, no afecta la navegación.
function trackSiteClick(company: Company) {
  api('/visits', {
    method: 'POST',
    body: JSON.stringify({ company: company.slug, label: company.name }),
  }).catch(() => {
    /* noop: el tracking es best-effort */
  });
}

// Tarjeta promocional de una marca: captura del sitio con el nombre en
// overlay, descripción y CTA "Visitar sitio" (enlace externo seguro).
function BrandCard({ company }: { company: Company }) {
  const track = () => trackSiteClick(company);
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-aceternity transition-shadow hover:shadow-derek">
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
          {company.description}
        </p>
        <a
          href={company.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={track}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-tertiary px-4 py-2.5 text-sm font-bold text-on-tertiary transition-all hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={`Visitar el sitio de ${company.name} (se abre en una pestaña nueva)`}
        >
          Visitar sitio
          <Icon name="open_in_new" className="text-sm" />
        </a>
      </div>
    </article>
  );
}

// Sección "Sitios de interés": carrusel con las demás plataformas del Grupo
// CorpSC (auto-avance, flechas, puntos indicadores y ráfaga de destellos).
export function FeaturedBrands() {
  const scroller = useRef<HTMLDivElement>(null);
  // Se incrementa en cada movimiento del carrusel (flecha o auto-avance) para
  // relanzar la ráfaga de destellos sobre las tarjetas.
  const [burst, setBurst] = useState(0);
  // Punto activo del indicador: se deriva de la posición de scroll.
  const [active, setActive] = useState(0);
  const count = COMPANIES.length;

  const scroll = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
    setBurst((b) => b + 1);
  };

  // Lleva la tarjeta `i` al inicio de la vista (usado por los puntos).
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

  // Mantiene el punto activo sincronizado con el scroll (flechas, auto-avance
  // o arrastre manual). Mapea el rango de scroll a los índices de tarjeta.
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

  // Auto-avance: cada 5s pasa a la siguiente "página" y al llegar al final
  // vuelve al inicio. Se pausa con el puntero encima y respeta
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
    <section aria-label="Sitios de interés" className="mt-20">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-secondary-container">
            Grupo CorpSC
          </p>
          <Heading as="h2" size="sm">
            Sitios de interés
          </Heading>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Anterior"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface shadow-sm transition-colors hover:bg-surface-container-high focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Icon name="chevron_left" className="text-2xl" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Siguiente"
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

        {/* Ráfaga de destellos al mover el carrusel (no captura clics). */}
        <SlideBurst trigger={burst} />
      </div>

      {/* Indicador de cantidad (puntos). */}
      <div className="mt-6 flex justify-center gap-1.5">
        {COMPANIES.map((company, i) => (
          <button
            key={company.slug}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Ir a ${company.name}`}
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
