import Link from 'next/link';
import { CORPSC } from '@/lib/companies';
import { DEPARTMENT_LABEL, DEPARTMENT_SLUG, Department } from '@/lib/types';
import { Icon } from './Icon';

const SUPPORT_EMAIL = 'alesx2soporte@gmail.com';

// Footer invertido (fondo tinta, texto claro) al estilo editorial de Iris.
const linkClass =
  'text-sm text-inverse-on-surface/70 transition hover:text-inverse-on-surface focus:outline-none focus-visible:underline';

// Micro-etiqueta de columna: mayúsculas con tracking amplio.
const colTitleClass =
  'mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-inverse-on-surface/60';

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className={colTitleClass}>{title}</span>
      {children}
    </div>
  );
}

// Botón social circular con leve elevación al hover.
function SocialLink({
  href,
  label,
  icon,
  external = true,
}: {
  href: string;
  label: string;
  icon: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-inverse-on-surface/20 text-inverse-on-surface/80 transition-all hover:-translate-y-0.5 hover:border-inverse-on-surface/50 hover:text-inverse-on-surface"
    >
      <Icon name={icon} />
    </a>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 w-full bg-on-surface py-14 text-inverse-on-surface">
      <div className="mx-auto max-w-7xl 2xl:max-w-screen-2xl px-4 sm:px-6 lg:px-12">
        <div className="mb-10 flex flex-col items-start justify-between gap-8 md:flex-row">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-full.png"
              alt="Tu Chamba"
              className="mb-4 h-10 w-auto brightness-0 invert"
            />
            <p className="max-w-sm text-sm text-inverse-on-surface/70">
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
              <Link href="/privacy" className={linkClass}>
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
                href="/listings/new"
                className="text-sm font-bold text-secondary-container transition hover:brightness-110"
              >
                Publicar oferta de trabajo
              </Link>
            </FooterCol>
          </div>
        </div>

        {/* Landing SEO por departamento (se conserva del footer anterior). */}
        <nav
          aria-label="Empleos por departamento"
          className="border-t border-inverse-on-surface/15 pt-6"
        >
          <span className={`block ${colTitleClass}`}>
            Empleos por departamento
          </span>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {(Object.keys(DEPARTMENT_SLUG) as Department[]).map((dep) => (
              <Link
                key={dep}
                href={`/jobs/${DEPARTMENT_SLUG[dep]}`}
                className={linkClass}
              >
                {DEPARTMENT_LABEL[dep]}
              </Link>
            ))}
          </div>
        </nav>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-inverse-on-surface/15 pt-8 md:flex-row">
          <p className="text-xs text-inverse-on-surface/60">
            © {new Date().getFullYear()} TuChamba. Todos los derechos
            reservados.
          </p>
          <div className="flex gap-3">
            <SocialLink href={CORPSC.url} label="Sitio de CorpSC" icon="public" />
            <SocialLink
              href={`mailto:${SUPPORT_EMAIL}`}
              label="Escríbenos por correo"
              icon="mail"
              external={false}
            />
            <SocialLink
              href="https://www.facebook.com/corpsc"
              label="Síguenos en Facebook"
              icon="facebook"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
