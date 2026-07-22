import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchAd } from '@/lib/server-api';
import {
  CATEGORY_LABEL,
  DEPARTMENT_LABEL,
  DEPARTMENT_SLUG,
  STATUS_LABEL,
  adEffectiveStatus,
} from '@/lib/types';
import { Badge } from '@/components/Badge';
import { AuthOnly } from '@/components/AuthOnly';
import { Icon } from '@/components/Icon';
import { Reviews } from '@/components/Reviews';
import { AdActions } from '@/components/AdActions';
import { TrackVisit } from '@/components/TrackVisit';
import { adTitle, jobPostingJsonLd, jsonLd } from '@/lib/seo';

type Params = { params: Promise<{ id: string }> };

// Metadata por anuncio (indexable en buscadores).
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const ad = await fetchAd(id);
  if (!ad) return { title: 'Oferta no encontrada — Tu Chamba' };

  const parts = [
    ad.category && CATEGORY_LABEL[ad.category],
    ad.department && `en ${DEPARTMENT_LABEL[ad.department]}`,
  ].filter(Boolean);
  const title = `${adTitle(ad)} — ${parts.join(' ') || 'Empleo'} | Tu Chamba`;
  const description = ad.description.slice(0, 155);
  return {
    title,
    description,
    alternates: { canonical: `/listings/${id}` },
    // Las ofertas vencidas o dadas de baja salen del índice.
    robots:
      adEffectiveStatus(ad) === 'ACTIVO' ? undefined : { index: false },
    openGraph: { title, description, type: 'article', images: ['/banner.jpeg'] },
  };
}

export default async function AdDetailPage({ params }: Params) {
  const { id } = await params;
  const ad = await fetchAd(id);
  if (!ad) notFound();

  const status = adEffectiveStatus(ad);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Ruta de navegación: sitúa al usuario y da salida al listado
          (clave cuando se llega por un enlace compartido o por Google). */}
      <nav
        aria-label="Ruta de navegación"
        className="mb-3 flex flex-wrap items-center gap-1 text-sm text-on-surface-variant"
      >
        <Link href="/" className="flex items-center gap-1 hover:text-primary hover:underline">
          <Icon name="arrow_back" className="text-base" /> Todas las ofertas
        </Link>
        {ad.department && (
          <>
            <span aria-hidden className="text-outline">/</span>
            <Link
              href={`/jobs/${DEPARTMENT_SLUG[ad.department]}`}
              className="hover:text-primary hover:underline"
            >
              {DEPARTMENT_LABEL[ad.department]}
            </Link>
          </>
        )}
      </nav>

      <div className="space-y-4 border border-outline-variant bg-surface-container-lowest p-6">
      {/* JobPosting para Google for Jobs: solo en ofertas vigentes. */}
      {status === 'ACTIVO' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(jobPostingJsonLd(ad)) }}
        />
      )}
      <TrackVisit adId={ad.id} />
      {status !== 'ACTIVO' && (
        <div className="bg-secondary-container px-3 py-2 text-sm text-on-secondary-container">
          Este anuncio está {STATUS_LABEL[status].toLowerCase()} y ya no se
          muestra en el portal.
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge jobType={ad.jobType} />
          {ad.category && (
            <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand">
              {CATEGORY_LABEL[ad.category]}
            </span>
          )}
          {ad.department && (
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant">
              {DEPARTMENT_LABEL[ad.department]}
            </span>
          )}
        </div>
        <span
          className="text-xs uppercase text-on-surface-variant"
          title="Referencia para mencionar el anuncio al contactar"
        >
          Ref. {ad.id.slice(0, 8)}
        </span>
      </div>

      <h1 className="font-display text-2xl font-bold text-on-surface">{ad.title}</h1>

      {/* Publicante con su señal de confianza, visible sin sesión. */}
      <p className="flex flex-wrap items-center gap-1.5 text-sm text-on-surface-variant">
        <Icon name="person" className="text-base" />
        {ad.createdBy?.name ?? 'Publicante'}
        {ad.createdBy?.emailVerified && (
          <span className="flex items-center gap-0.5 rounded-full bg-tertiary-container px-2 py-0.5 text-xs font-medium text-on-tertiary-container">
            <Icon name="verified" className="text-sm" /> Verificado
          </span>
        )}
      </p>

      <div>
        <h2 className="mb-1 text-sm font-semibold text-on-surface-variant">
          Descripción del puesto
        </h2>
        <p className="whitespace-pre-line text-on-surface">{ad.description}</p>
      </div>

      {ad.requirements && (
        <div>
          <h2 className="mb-1 text-sm font-semibold text-on-surface-variant">
            Requisitos del candidato
          </h2>
          <p className="whitespace-pre-line text-on-surface">{ad.requirements}</p>
        </div>
      )}

      {/* Título, descripción, requisitos y salario se ven sin sesión; el
          resto de los datos del anuncio requiere iniciar sesión. */}
      <div className="space-y-1 border-t border-outline-variant/60 pt-4">
        <p className="text-2xl font-bold text-brand">
          {ad.salary != null
            ? `Bs ${Number(ad.salary).toLocaleString('es-BO')}`
            : 'Salario a convenir'}
        </p>
        <AuthOnly>
          {/* La ubicación exacta solo se muestra con sesión (en AdActions);
              aquí queda el departamento como zona general. */}
          {ad.department && (
            <p className="flex items-center gap-1 text-sm text-on-surface-variant">
              <Icon name="location_on" className="text-base" /> Zona:{' '}
              {DEPARTMENT_LABEL[ad.department]}
            </p>
          )}
          {ad.schedule && (
            <p className="flex items-center gap-1 text-sm text-on-surface-variant">
              <Icon name="schedule" className="text-base" /> Horario: {ad.schedule}
            </p>
          )}
          <p className="flex flex-wrap items-center gap-1 text-xs text-on-surface-variant">
            Publicado: {new Date(ad.createdAt).toLocaleDateString('es-BO')} ·
            Vence: {new Date(ad.expiresAt).toLocaleDateString('es-BO')}
            {ad._count != null && (
              <>
                {' '}
                · <Icon name="visibility" className="text-sm" /> {ad._count.visits}{' '}
                {ad._count.visits === 1 ? 'visita' : 'visitas'}
              </>
            )}
          </p>
        </AuthOnly>
      </div>

      <AdActions ad={ad} />

      {/* Las reseñas son públicas: son la señal de confianza del publicante
          (calificar sí exige sesión; el formulario solo aparece con ella). */}
      <Reviews
        adId={ad.id}
        ownerId={ad.createdById}
        ownerName={ad.createdBy?.name ?? 'este publicante'}
      />

      {/* Holgura para la barra de contacto fija de AdActions en móvil. */}
      <div aria-hidden className="h-14 sm:hidden" />
      </div>
    </div>
  );
}
