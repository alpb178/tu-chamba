'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Hero de la portada: imagen con degradado azul de marca y buscador
// "glass" de dos campos (qué + dónde). Navega a /?q=&loc= (la home los lee).
export function Hero({
  initialQuery = '',
  initialLocation = '',
}: {
  initialQuery?: string;
  initialLocation?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (query.trim()) p.set('q', query.trim());
    if (location.trim()) p.set('loc', location.trim());
    router.push(p.size ? `/?${p}` : '/');
  }

  return (
    <section className="relative -mt-6 ml-[calc(50%-50vw)] flex h-[440px] w-screen items-center justify-center overflow-hidden sm:h-[540px]">
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero.jpg"
          alt=""
          className="h-full w-full object-cover"
          fetchPriority="high"
        />
        <div
          className="absolute inset-0 z-10"
          style={{
            background:
              'linear-gradient(rgba(0, 74, 198, 0.85), rgba(0, 23, 75, 0.95))',
          }}
        />
      </div>

      <div className="relative z-20 w-full max-w-4xl px-4 pt-10 text-center">
        <h1 className="mb-6 font-display text-4xl font-bold leading-tight tracking-tight text-on-primary sm:text-5xl">
          Encuentra trabajos diarios al instante
        </h1>
        <p className="mx-auto mb-10 max-w-2xl font-display text-lg font-semibold text-surface-container-low opacity-90 sm:text-2xl">
          La forma más rápida de conectar con empleadores locales para
          oportunidades de corto plazo.
        </p>

        {/* Buscador glass: qué + dónde. */}
        <form
          onSubmit={onSubmit}
          className="mx-auto flex max-w-3xl flex-col gap-2 rounded-2xl border border-white/30 bg-white/70 p-3 shadow-lg backdrop-blur-md md:flex-row"
        >
          <div className="flex flex-grow items-center rounded-xl border border-outline-variant bg-white px-4 py-3 transition-all focus-within:ring-2 focus-within:ring-primary-container">
            <span
              aria-hidden="true"
              className="material-symbols-outlined mr-3 text-outline"
            >
              search
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="¿Qué trabajo buscas hoy?"
              aria-label="Qué trabajo buscas"
              className="w-full border-none bg-transparent text-base text-on-surface outline-none placeholder:text-outline-variant focus:ring-0"
            />
          </div>
          <div className="flex items-center rounded-xl border border-outline-variant bg-white px-4 py-3 transition-all focus-within:ring-2 focus-within:ring-primary-container md:w-1/3">
            <span
              aria-hidden="true"
              className="material-symbols-outlined mr-3 text-outline"
            >
              location_on
            </span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="La Paz, Bolivia"
              aria-label="Ciudad o zona"
              className="w-full border-none bg-transparent text-base text-on-surface outline-none placeholder:text-outline-variant focus:ring-0"
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 font-bold text-on-primary shadow-lg transition-all hover:brightness-110 active:scale-95"
          >
            <span>Buscar</span>
            <span aria-hidden="true" className="material-symbols-outlined">
              search
            </span>
          </button>
        </form>
      </div>
    </section>
  );
}
