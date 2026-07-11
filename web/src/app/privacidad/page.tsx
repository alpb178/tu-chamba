import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de privacidad — Tu Chamba',
  description:
    'Cómo Tu Chamba recopila, usa y protege tus datos personales al usar el portal de empleos.',
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

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 sm:p-10">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-semibold text-on-surface">
          Política de privacidad
        </h1>
        <p className="text-xs text-outline">Última actualización: {UPDATED}</p>
      </header>

      <Section title="Quiénes somos">
        <p>
          Tu Chamba es un portal de empleos de Bolivia operado por el Grupo
          CorpSC. Para cualquier consulta sobre esta política o sobre tus
          datos, escríbenos a{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section title="Qué datos recopilamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-on-surface">Datos de tu cuenta:</strong>{' '}
            nombre, correo electrónico y teléfono (opcional). La contraseña se
            guarda cifrada; si entras con Google, no guardamos contraseña.
          </li>
          <li>
            <strong className="text-on-surface">Anuncios que publicas:</strong>{' '}
            descripción, salario, ubicación y el teléfono de contacto que
            decidas incluir.
          </li>
          <li>
            <strong className="text-on-surface">Actividad en el portal:</strong>{' '}
            visitas a los anuncios (de forma agregada), los anuncios en los que
            muestras interés al contactar, tus reseñas y notificaciones.
          </li>
        </ul>
      </Section>

      <Section title="Para qué los usamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Operar el portal: publicar anuncios, buscar y contactar.</li>
          <li>
            Mostrar el teléfono y la ubicación de un anuncio únicamente a
            usuarios con sesión iniciada.
          </li>
          <li>
            Avisarte de actividad relevante (interesados en tus anuncios,
            reseñas recibidas, vencimientos, alertas de empleo que configures).
          </li>
          <li>Moderar contenido reportado y prevenir el spam.</li>
        </ul>
      </Section>

      <Section title="Con quién compartimos datos">
        <p>
          No vendemos tus datos ni los compartimos con terceros con fines
          publicitarios. El teléfono y la ubicación de un anuncio se muestran a
          los usuarios registrados, porque ese es el propósito del portal: que
          puedan contactarte. El contacto por WhatsApp o llamada ocurre fuera
          de Tu Chamba, directamente entre las personas.
        </p>
        <p>
          Si inicias sesión con Google, Google nos confirma tu correo conforme
          a su propia política de privacidad.
        </p>
      </Section>

      <Section title="Cuánto tiempo los conservamos">
        <p>
          Mientras tu cuenta exista. Si eliminas tu cuenta, se eliminan también
          tus anuncios, intereses, alertas y notificaciones. Las reseñas que
          escribiste se eliminan junto con tu cuenta.
        </p>
      </Section>

      <Section title="Tus derechos">
        <p>
          Puedes ver y corregir tus datos desde <strong className="text-on-surface">Mi perfil</strong>,
          eliminar tus anuncios desde <strong className="text-on-surface">Mis anuncios</strong> y
          quitar anuncios de tu lista de interés. Para eliminar tu cuenta o
          ejercer cualquier otro derecho sobre tus datos, escríbenos a{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section title="Cambios a esta política">
        <p>
          Si cambiamos esta política, actualizaremos la fecha de esta página.
          Los cambios importantes se anunciarán en el portal.
        </p>
      </Section>
    </div>
  );
}
