'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { DEPARTMENT_LABEL, Department } from '@/lib/types';
import { CustomSelect } from './CustomSelect';
import { Icon } from './Icon';

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
    // scroll: false — la búsqueda no debe saltar al inicio de la página;
    // los resultados se actualizan en su sitio.
    router.push(p.size ? `/?${p}` : '/', { scroll: false });
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
      {/* Banner de marca SIEMPRE a todo el ancho de la página, completo y sin
          recortar (tiene texto hasta el borde inferior). h-auto conserva su
          proporción natural; width/height reservan el espacio antes de
          cargar para que no salte el layout (sin CLS). El mensaje principal
          también va en HTML real debajo (indexable y accesible). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/banner.jpeg"
        alt="Ofrece o busca trabajo — conexión directa, sin CV"
        width={1936}
        height={544}
        className="h-auto w-full"
        fetchPriority="high"
      />

      <div className="relative z-20 mx-auto w-full max-w-4xl px-4 pb-10 pt-6 text-center sm:pb-14">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-secondary-container"
        >
          Trabajo diario en Bolivia
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="font-display text-3xl font-semibold leading-[1.1] tracking-tight text-on-primary text-balance sm:text-4xl md:text-5xl"
        >
          Encuentra trabajos diarios al instante
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="mx-auto mb-7 mt-3 max-w-2xl text-base text-surface-container-low opacity-90"
        >
          Conecta directo con empleadores locales — sin CV, por WhatsApp.
        </motion.p>

        {/* Buscador glass: qué + dónde. Esquinas rectas (estética editorial). */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          onSubmit={onSubmit}
          className="mx-auto flex max-w-3xl flex-col gap-2 border border-white/30 bg-white/70 p-3 shadow-derek backdrop-blur-md md:flex-row"
        >
          <div className="flex flex-grow items-center border border-outline-variant bg-white px-4 py-3 transition-all focus-within:ring-2 focus-within:ring-primary-container">
            <Icon name="search" className="mr-3 text-outline" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="¿Qué trabajo buscas hoy?"
              aria-label="Qué trabajo buscas"
              className="w-full border-none bg-transparent text-base text-on-surface outline-none placeholder:text-outline focus:ring-0"
            />
          </div>
          <div className="md:w-1/3">
            <CustomSelect
              value={dep}
              onChange={setDep}
              options={DEPARTMENT_OPTIONS}
              placeholder="Todo el país"
              icon="location_on"
              className="px-4 py-3 text-base"
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-primary px-8 py-3 font-bold uppercase tracking-[0.12em] text-on-primary shadow-lg transition-all hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-95"
          >
            <span>Buscar</span>
            <Icon name="search" />
          </button>
        </motion.form>
      </div>
    </section>
  );
}
