import { Empresa, EMPRESAS } from '@/lib/empresas';

// Tarjeta promocional de una marca: captura del sitio, nombre, descripción y
// CTA "Visitar sitio" (enlace externo seguro).
function MarcaCard({ empresa }: { empresa: Empresa }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <a
        href={empresa.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-40 overflow-hidden"
        style={{ backgroundColor: empresa.fondo }}
        tabIndex={-1}
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={empresa.imagen}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-105"
        />
      </a>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-lg font-semibold text-brand">{empresa.nombre}</h3>
        <p className="flex-1 text-sm leading-relaxed text-gray-600">
          {empresa.descripcion}
        </p>
        <a
          href={empresa.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center justify-center gap-1 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          aria-label={`Visitar el sitio de ${empresa.nombre} (se abre en una pestaña nueva)`}
        >
          Visitar sitio
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
        </a>
      </div>
    </article>
  );
}

// Tira de marcas recomendadas para el dashboard (estilo anuncio destacado).
export function MarcasDestacadas() {
  return (
    <section aria-labelledby="marcas-title">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 id="marcas-title" className="text-xl font-semibold text-gray-800">
          Descubre nuestras marcas
        </h2>
        <span className="text-xs uppercase tracking-wider text-gray-400">
          Publicidad
        </span>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {EMPRESAS.map((e) => (
          <MarcaCard key={e.slug} empresa={e} />
        ))}
      </div>
    </section>
  );
}
