import { Company, COMPANIES } from '@/lib/companies';

// Tarjeta promocional de una marca: captura del sitio con el nombre en
// overlay, descripción y CTA "Visitar sitio" (enlace externo seguro).
function BrandCard({ company }: { company: Company }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm transition-shadow hover:shadow-md">
      <a
        href={company.url}
        target="_blank"
        rel="noopener noreferrer"
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-inverse-surface px-4 py-2.5 text-sm font-bold text-on-primary transition-colors hover:bg-on-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={`Visitar el sitio de ${company.name} (se abre en una pestaña nueva)`}
        >
          Visitar sitio
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-sm"
          >
            open_in_new
          </span>
        </a>
      </div>
    </article>
  );
}

// Tira de marcas del grupo, con su encabezado de sección.
export function FeaturedBrands() {
  return (
    <section aria-label="Servicios destacados" className="mt-12">
      <h2 className="mb-6 font-display text-2xl font-semibold text-on-surface">
        Servicios destacados
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {COMPANIES.map((c) => (
          <BrandCard key={c.slug} company={c} />
        ))}
      </div>
    </section>
  );
}
