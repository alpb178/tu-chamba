import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de cookies — Tu Chamba',
  description:
    'Qué cookies y almacenamiento local usa Tu Chamba y con qué propósito.',
};

const UPDATED = '11 de julio de 2026';
const SUPPORT_EMAIL = 'alesx2soporte@gmail.com';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-semibold text-on-surface">
        {title}
      </h2>
      <div className="space-y-2 text-sm leading-relaxed text-on-surface-variant">
        {children}
      </div>
    </section>
  );
}

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 border border-outline-variant bg-surface-container-lowest p-6 sm:p-10">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold text-on-surface">
          Política de cookies
        </h1>
        <p className="text-xs text-outline">Última actualización: {UPDATED}</p>
      </header>

      <Section title="Lo esencial">
        <p>
          Tu Chamba no usa cookies de publicidad ni de seguimiento de
          terceros. Solo utilizamos el almacenamiento estrictamente necesario
          para que el portal funcione.
        </p>
      </Section>

      <Section title="Qué guardamos en tu navegador">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-xs uppercase tracking-wider text-outline">
                <th className="py-2 pr-4 font-semibold">Elemento</th>
                <th className="py-2 pr-4 font-semibold">Tipo</th>
                <th className="py-2 font-semibold">Para qué sirve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              <tr>
                <td className="py-2 pr-4 font-mono text-xs">tuchamba_token</td>
                <td className="py-2 pr-4">Almacenamiento local (técnico)</td>
                <td className="py-2">
                  Mantiene tu sesión iniciada. Se elimina al cerrar sesión.
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Cookies de Google</td>
                <td className="py-2 pr-4">Tercero (solo si lo usas)</td>
                <td className="py-2">
                  Si eliges &quot;Continuar con Google&quot;, Google puede usar
                  sus propias cookies para autenticarte, según su política.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Lo que NO hacemos">
        <ul className="list-disc space-y-1 pl-5">
          <li>No usamos cookies de publicidad ni remarketing.</li>
          <li>No compartimos tu navegación con redes publicitarias.</li>
          <li>
            Las visitas a los anuncios se cuentan de forma agregada en nuestro
            servidor, sin identificarte con cookies.
          </li>
        </ul>
      </Section>

      <Section title="Cómo controlarlo">
        <p>
          Puedes borrar el almacenamiento local desde la configuración de tu
          navegador (al hacerlo se cerrará tu sesión). Para cualquier duda,
          escríbenos a{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </Section>
    </div>
  );
}
