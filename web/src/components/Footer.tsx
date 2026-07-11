import Link from 'next/link';
import { CORPSC } from '@/lib/companies';
import { DEPARTMENT_LABEL, DEPARTMENT_SLUG, Department } from '@/lib/types';

const SUPPORT_EMAIL = 'alesx2soporte@gmail.com';

const linkClass =
  'text-sm text-on-surface-variant transition hover:text-primary focus:outline-none focus-visible:underline';

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="mb-2 text-xs font-bold uppercase tracking-widest text-on-surface">
        {title}
      </span>
      {children}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-12 w-full border-t border-outline-variant bg-surface-container-highest py-12">
      <div className="mx-auto max-w-7xl 2xl:max-w-screen-2xl px-4 sm:px-6 lg:px-12">
        <div className="mb-8 flex flex-col items-start justify-between gap-8 md:flex-row">
          <div>
            <span className="mb-4 block font-display text-2xl font-semibold text-on-surface">
              TuChamba
            </span>
            <p className="max-w-sm text-sm text-on-surface-variant">
              La plataforma líder en Bolivia para encontrar y publicar empleos
              de forma rápida y segura.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-4 sm:grid-cols-3">
            <FooterCol title="Compañía">
              <a
                href={CORPSC.url}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Sobre nosotros
              </a>
              <a href={`mailto:${SUPPORT_EMAIL}`} className={linkClass}>
                Contacto
              </a>
            </FooterCol>
            <FooterCol title="Legal">
              <Link href="/privacidad" className={linkClass}>
                Política de privacidad
              </Link>
              <Link href="/cookies" className={linkClass}>
                Política de cookies
              </Link>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Términos de servicio`}
                className={linkClass}
              >
                Términos de servicio
              </a>
            </FooterCol>
            <FooterCol title="Empresas">
              <Link
                href="/anuncios/nuevo"
                className="text-sm font-bold text-primary hover:underline"
              >
                Publicar anuncio
              </Link>
            </FooterCol>
          </div>
        </div>

        {/* Landing SEO por departamento (se conserva del footer anterior). */}
        <nav
          aria-label="Empleos por departamento"
          className="border-t border-outline-variant/30 pt-6"
        >
          <span className="mb-3 block text-xs font-bold uppercase tracking-widest text-on-surface">
            Empleos por departamento
          </span>
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

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-outline-variant/30 pt-8 md:flex-row">
          <p className="text-xs text-on-surface-variant">
            © {new Date().getFullYear()} TuChamba. Todos los derechos
            reservados.
          </p>
          <div className="flex gap-6">
            <a
              href={CORPSC.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Sitio de CorpSC"
              className="text-on-surface-variant transition-colors hover:text-primary"
            >
              <span aria-hidden="true" className="material-symbols-outlined">
                public
              </span>
            </a>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              aria-label="Escríbenos por correo"
              className="text-on-surface-variant transition-colors hover:text-primary"
            >
              <span aria-hidden="true" className="material-symbols-outlined">
                mail
              </span>
            </a>
            <a
              href="https://www.facebook.com/corpsc"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Síguenos en redes"
              className="text-on-surface-variant transition-colors hover:text-primary"
            >
              <span aria-hidden="true" className="material-symbols-outlined">
                share
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
