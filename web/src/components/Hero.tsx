'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEPARTMENT_LABEL, Department } from '@/lib/types';
import { CustomSelect } from './CustomSelect';

// Todos los departamentos + "Todo el país" como opción vacía.
const DEPARTMENT_OPTIONS = [
  { value: '', label: 'Todo el país' },
  ...Object.entries(DEPARTMENT_LABEL).map(([value, label]) => ({
    value,
    label,
  })),
];

// Hero de la portada: imagen con degradado azul de marca y buscador
// "glass" de dos campos (qué + departamento). Navega a /?q=&dep=.
export function Hero({
  initialQuery = '',
  initialDep = '',
}: {
  initialQuery?: string;
  initialDep?: Department | '';
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [dep, setDep] = useState<string>(initialDep);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (query.trim()) p.set('q', query.trim());
    if (dep) p.set('dep', dep);
    router.push(p.size ? `/?${p}` : '/');
  }

  // z-30 (bajo el navbar z-40): el desplegable del select sobresale por
  // encima del contenido siguiente.
  return (
    <section
      className="relative z-30 -mt-6 ml-[calc(50%-50vw)] w-screen"
      style={{
        background:
          'linear-gradient(rgba(0, 74, 198, 0.95), rgba(0, 23, 75, 0.98))',
      }}
    >
      {/* Banner panorámico de marca como cabecera con altura acotada. El
          arte actual es 3.56:1: a pantalla completa con esta altura haría
          falta ~6:1 (ideal 2880x480), así que hasta tener esa versión se
          muestra completo y centrado, con los laterales en el degradado
          que se funde con el arte. */}
      <div className="px-4 pt-4 sm:pt-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/banner.jpeg"
          alt="Ofrece o busca trabajo — conexión directa, sin CV"
          className="mx-auto w-full max-w-full rounded-xl sm:w-auto sm:max-h-[300px] lg:max-h-[340px]"
          fetchPriority="high"
        />
      </div>

      <div className="relative z-20 mx-auto w-full max-w-4xl px-4 pb-10 pt-6 text-center sm:pb-12">
        {/* El titular queda para lectores de pantalla y SEO: el banner ya
            lleva el mensaje visual. */}
        <h1 className="sr-only">
          Encuentra trabajos diarios al instante en Bolivia
        </h1>

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
          <div className="md:w-1/3">
            <CustomSelect
              value={dep}
              onChange={setDep}
              options={DEPARTMENT_OPTIONS}
              placeholder="Todo el país"
              icon="location_on"
              className="rounded-xl px-4 py-3 text-base"
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
