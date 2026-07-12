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
  // encima del contenido siguiente. El clip vive en la capa de fondo.
  return (
    <section className="relative z-30 -mt-6 ml-[calc(50%-50vw)] flex min-h-[440px] w-screen items-center justify-center sm:min-h-[540px]">
      <div className="absolute inset-0 z-0 overflow-hidden">
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

      {/* py garantiza aire arriba y abajo del formulario aunque el
          contenido supere la altura mínima (pantallas pequeñas). */}
      <div className="relative z-20 w-full max-w-4xl px-4 py-12 text-center sm:py-16">
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
