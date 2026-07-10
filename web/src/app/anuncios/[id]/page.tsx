import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchAd } from '@/lib/server-api';
import {
  CATEGORY_LABEL,
  DEPARTMENT_LABEL,
  STATUS_LABEL,
  adEffectiveStatus,
} from '@/lib/types';
import { Badge } from '@/components/Badge';
import { Reviews } from '@/components/Reviews';
import { AdActions } from '@/components/AdActions';
import { TrackVisit } from '@/components/TrackVisit';

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
  const title = `${parts.join(' ') || 'Oferta de empleo'} — Tu Chamba`;
  const description = ad.description.slice(0, 155);
  return {
    title,
    description,
    openGraph: { title, description, type: 'article' },
  };
}

export default async function AdDetailPage({ params }: Params) {
  const { id } = await params;
  const ad = await fetchAd(id);
  if (!ad) notFound();

  const status = adEffectiveStatus(ad);

  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <TrackVisit adId={ad.id} />
      {status !== 'ACTIVO' && (
        <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
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
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {DEPARTMENT_LABEL[ad.department]}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">Ref. {ad.id.slice(0, 8)}</span>
      </div>

      <div>
        <h1 className="mb-1 text-sm font-semibold text-gray-700">
          Descripción del puesto
        </h1>
        <p className="whitespace-pre-line text-gray-800">{ad.description}</p>
      </div>

      {ad.requirements && (
        <div>
          <h2 className="mb-1 text-sm font-semibold text-gray-700">
            Requisitos del candidato
          </h2>
          <p className="whitespace-pre-line text-gray-800">{ad.requirements}</p>
        </div>
      )}

      <div className="space-y-1 border-t border-gray-100 pt-4">
        <p className="text-2xl font-bold text-brand">
          Bs {Number(ad.salary).toLocaleString('es-BO')}
        </p>
        <p className="text-sm text-gray-600">
          📍 Ubicación: {ad.location || 'No especificada'}
        </p>
        {ad.schedule && (
          <p className="text-sm text-gray-600">🕐 Horario: {ad.schedule}</p>
        )}
        <p className="text-sm text-gray-600">
          Publicado por: {ad.createdBy?.name ?? '—'}
        </p>
        <p className="text-xs text-gray-400">
          Publicado: {new Date(ad.createdAt).toLocaleDateString('es-BO')} ·
          Vence: {new Date(ad.expiresAt).toLocaleDateString('es-BO')}
        </p>
      </div>

      <AdActions ad={ad} />

      <Reviews
        employerId={ad.createdById}
        employerName={ad.createdBy?.name ?? 'este empleador'}
      />
    </div>
  );
}
