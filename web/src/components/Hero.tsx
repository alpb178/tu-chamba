'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { COMPANIES } from '@/lib/companies';
import { SlideBurst } from './fx/SlideBurst';

// Imágenes de la columna derecha (marco decorativo): las mismas del carrusel
// de "Sitios de interés" (banner de Tu Chamba + capturas de las empresas del
// grupo). El carrusel autoavanza y muestra flechas/puntos al haber varias.
const CAROUSEL_IMAGES = ['/banner.jpeg', ...COMPANIES.map((c) => c.image)];

// Carrusel de la imagen del hero (autoavance + flechas/puntos si hay >1).
// Portado del hero de Iris Natural y adaptado a los tokens M3 de tu-chamba.
const HeroCarousel = ({ images }: { images: string[] }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (images.length <= 1 || paused) return;
    const id = setInterval(
      () => setIndex((p) => (p + 1) % images.length),
      5000
    );
    return () => clearInterval(id);
  }, [images.length, paused]);

  const goPrev = () =>
    setIndex((p) => (p - 1 + images.length) % images.length);
  const goNext = () => setIndex((p) => (p + 1) % images.length);

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-background"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {images.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={i !== index}
        >
          <Image
            src={src}
            alt="Ofrece o busca trabajo en Bolivia con Tu Chamba"
            fill
            sizes="(max-width: 1024px) 90vw, 448px"
            className="object-cover object-center"
            priority={i === 0}
          />
        </div>
      ))}

      {/* Ráfaga de destellos al cambiar de slide (debajo de flechas/indicadores) */}
      <SlideBurst trigger={index} className="z-[5]" />

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Anterior"
            className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-on-surface/10 text-on-surface backdrop-blur-sm transition hover:bg-on-surface/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Siguiente"
            className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-on-surface/10 text-on-surface backdrop-blur-sm transition hover:bg-on-surface/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Imagen ${i + 1}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-6 bg-primary' : 'w-1.5 bg-on-surface/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Hero de la portada, estilo editorial split (portado del BrandHero de Iris
// Natural): a la izquierda el mensaje + CTA; a la derecha una imagen dentro de
// un marco decorativo con paneles rotados en los colores de marca. El buscador
// de empleos vive ahora en el encabezado del listado de resultados.
export function Hero() {
  return (
    <section
      className="relative z-30 -mt-6 ml-[calc(50%-50vw)] w-screen"
      aria-label="Tu Chamba — bienvenida"
    >
      <div className="mx-auto grid w-full max-w-screen-2xl grid-cols-1 lg:grid-cols-2">
        <div className="order-2 flex flex-col justify-center gap-6 px-6 py-12 sm:px-10 sm:py-16 lg:order-1 lg:px-16 lg:py-24">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xs font-semibold uppercase tracking-[0.22em] text-primary"
          >
            Tu Chamba · Empleos en Bolivia
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-on-surface sm:text-5xl lg:text-6xl"
          >
            Encuentra trabajos diarios al instante
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-xl text-base leading-relaxed text-on-surface-variant sm:text-lg"
          >
            Conecta directo con empleadores locales — sin CV, por WhatsApp.
            Publica u ofrece trabajo en toda Bolivia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-wrap items-center gap-6"
          >
            <Link
              href="#ofertas"
              className="group inline-flex items-center gap-3 bg-on-surface px-7 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-inverse-on-surface transition-colors hover:bg-on-surface/90"
            >
              Explorar ofertas
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/listings/new"
              className="inline-flex items-center gap-2 text-sm font-medium text-on-surface underline-offset-4 hover:underline"
            >
              <Briefcase className="h-4 w-4 text-primary" />
              Publicar oferta de trabajo
            </Link>
          </motion.div>
        </div>

        <div className="order-1 flex items-center justify-center px-6 py-8 lg:order-2 lg:px-10 lg:py-16">
          <div className="relative w-full max-w-md">
            {/* Paneles decorativos rotados en los colores de marca (azul + ámbar). */}
            <div
              aria-hidden
              className="absolute -inset-6 -rotate-3 rounded-3xl bg-gradient-to-r from-primary/25 to-secondary-container/30"
            />
            <div
              aria-hidden
              className="absolute -inset-6 rotate-3 rounded-3xl bg-gradient-to-r from-secondary-container/25 to-primary/20"
            />
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-outline-variant bg-background shadow-derek">
              <HeroCarousel images={CAROUSEL_IMAGES} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
