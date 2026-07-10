import { Company, COMPANIES } from '@/lib/companies';

// Tarjeta promocional de una marca: captura del sitio, nombre, descripción y
// CTA "Visitar sitio" (enlace externo seguro).
function BrandCard({ company }: { company: Company }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <a
        href={company.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-40 overflow-hidden"
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
          className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-105"
        />
      </a>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-lg font-semibold text-brand">{company.name}</h3>
        <p className="flex-1 text-sm leading-relaxed text-gray-600">
          {company.description}
        </p>
        <a
          href={company.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center justify-center gap-1 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          aria-label={`Visitar el sitio de ${company.name} (se abre en una pestaña nueva)`}
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

// Tira de marcas del grupo, sin encabezado (solo las tarjetas).
export function FeaturedBrands() {
  return (
    <section aria-label="Nuestras marcas" className="mt-12">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {COMPANIES.map((c) => (
          <BrandCard key={c.slug} company={c} />
        ))}
      </div>
    </section>
  );
}
