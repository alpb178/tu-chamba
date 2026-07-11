import Link from 'next/link';
import { COMPANIES } from '@/lib/companies';
import { DEPARTMENT_LABEL, DEPARTMENT_SLUG, Department } from '@/lib/types';
import { NewsletterForm } from './NewsletterForm';

// Redes sociales del Grupo CorpSC.
const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/corpsc',
    path: 'M13 10h3l.5-3H13V5.5c0-.9.3-1.5 1.6-1.5H17V1.4A21 21 0 0 0 14.6 1C12.2 1 10.5 2.5 10.5 5.2V7H8v3h2.5v8H13z',
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/corpsc1992',
    path: 'M12 2.2c3.2 0 3.6 0 4.8.07 1.2.06 1.8.25 2.2.42.6.2 1 .5 1.4 1 .5.4.8.8 1 1.4.2.4.4 1 .4 2.2.07 1.2.07 1.6.07 4.8s0 3.6-.07 4.8c-.06 1.2-.25 1.8-.42 2.2-.2.6-.5 1-1 1.4-.4.5-.8.8-1.4 1-.4.2-1 .4-2.2.4-1.2.07-1.6.07-4.8.07s-3.6 0-4.8-.07c-1.2-.06-1.8-.25-2.2-.42-.6-.2-1-.5-1.4-1-.5-.4-.8-.8-1-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.8c.06-1.2.25-1.8.42-2.2.2-.6.5-1 1-1.4.4-.5.8-.8 1.4-1 .4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2m0 3.6A6.2 6.2 0 1 0 12 18.2 6.2 6.2 0 0 0 12 5.8m0 10.2a4 4 0 1 1 0-8 4 4 0 0 1 0 8m6.4-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0',
  },
];

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-outline">
        {title}
      </h3>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

const linkClass =
  'text-sm text-on-surface-variant transition hover:text-primary focus:outline-none focus-visible:underline';

export function Footer() {
  return (
    <footer className="mt-12 border-t border-outline-variant bg-surface-container-highest text-on-surface-variant">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <FooterCol title="Empleos">
            <li><Link href="/" className={linkClass}>Buscar empleos</Link></li>
            <li><Link href="/register" className={linkClass}>Crear cuenta</Link></li>
            <li><Link href="/login" className={linkClass}>Ingresar</Link></li>
          </FooterCol>

          <FooterCol title="Para empresas">
            <li><Link href="/anuncios/nuevo" className={linkClass}>Publicar anuncio</Link></li>
            <li><Link href="/mis-anuncios" className={linkClass}>Mis anuncios</Link></li>
          </FooterCol>

          <FooterCol title="Nuestras marcas">
            {COMPANIES.map((c) => (
              <li key={c.slug}>
                <a href={c.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {c.name}
                </a>
              </li>
            ))}
          </FooterCol>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-outline">
              Síguenos
            </h3>
            <div className="mb-4 flex gap-2">
              {SOCIAL_LINKS.map((r) => (
                <a
                  key={r.name}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={r.name}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface-variant transition hover:bg-primary hover:text-on-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={r.path} />
                  </svg>
                </a>
              ))}
            </div>
            <NewsletterForm />
          </div>
        </div>

        <nav
          aria-label="Empleos por departamento"
          className="mt-8 border-t border-outline-variant/50 pt-6"
        >
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-outline">
            Empleos por departamento
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {(Object.keys(DEPARTMENT_SLUG) as Department[]).map((dep) => (
              <Link
                key={dep}
                href={`/empleos/${DEPARTMENT_SLUG[dep]}`}
                className={linkClass}
              >
                {DEPARTMENT_LABEL[dep]}
              </Link>
            ))}
          </div>
        </nav>

        <div className="mt-8 flex flex-col gap-4 border-t border-outline-variant/50 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-lowest p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-icon.svg" alt="Tu Chamba" className="h-full w-auto" />
            </span>
            <p className="text-sm text-on-surface-variant">
              Tu Chamba · Portal de empleos de Bolivia
            </p>
          </div>
          <p className="text-xs text-on-surface-variant">
            © {new Date().getFullYear()} Tu Chamba ·{' '}
            <a href="mailto:alesx2soporte@gmail.com" className="hover:text-primary">
              alesx2soporte@gmail.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
