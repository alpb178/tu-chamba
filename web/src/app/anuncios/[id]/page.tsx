import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchAnuncio } from '@/lib/server-api';
import {
  CATEGORIA_LABEL,
  DEPARTAMENTO_LABEL,
  ESTADO_LABEL,
  estadoAnuncio,
} from '@/lib/types';
import { Badge } from '@/components/Badge';
import { Reviews } from '@/components/Reviews';
import { AnuncioAcciones } from '@/components/AnuncioAcciones';
import { TrackVisit } from '@/components/TrackVisit';

type Params = { params: Promise<{ id: string }> };

// Metadata por anuncio (indexable en buscadores).
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const a = await fetchAnuncio(id);
  if (!a) return { title: 'Oferta no encontrada — Tu Chamba' };

  const partes = [
    a.categoria && CATEGORIA_LABEL[a.categoria],
    a.departamento && `en ${DEPARTAMENTO_LABEL[a.departamento]}`,
  ].filter(Boolean);
  const title = `${partes.join(' ') || 'Oferta de empleo'} — Tu Chamba`;
  const description = a.descripcion.slice(0, 155);
  return {
    title,
    description,
    openGraph: { title, description, type: 'article' },
  };
}

export default async function AnuncioDetallePage({ params }: Params) {
  const { id } = await params;
  const anuncio = await fetchAnuncio(id);
  if (!anuncio) notFound();

  const estado = estadoAnuncio(anuncio);

  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <TrackVisit adId={anuncio.id} />
      {estado !== 'ACTIVO' && (
        <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Este anuncio está {ESTADO_LABEL[estado].toLowerCase()} y ya no se
          muestra en el portal.
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tipo={anuncio.tipoJornada} />
          {anuncio.categoria && (
            <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand">
              {CATEGORIA_LABEL[anuncio.categoria]}
            </span>
          )}
          {anuncio.departamento && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {DEPARTAMENTO_LABEL[anuncio.departamento]}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">Ref. {anuncio.id.slice(0, 8)}</span>
      </div>

      <div>
        <h1 className="mb-1 text-sm font-semibold text-gray-700">
          Descripción del puesto
        </h1>
        <p className="whitespace-pre-line text-gray-800">{anuncio.descripcion}</p>
      </div>

      {anuncio.requisitos && (
        <div>
          <h2 className="mb-1 text-sm font-semibold text-gray-700">
            Requisitos del candidato
          </h2>
          <p className="whitespace-pre-line text-gray-800">{anuncio.requisitos}</p>
        </div>
      )}

      <div className="space-y-1 border-t border-gray-100 pt-4">
        <p className="text-2xl font-bold text-brand">
          Bs {Number(anuncio.salario).toLocaleString('es-BO')}
        </p>
        <p className="text-sm text-gray-600">
          📍 Ubicación: {anuncio.ubicacion || 'No especificada'}
        </p>
        {anuncio.horario && (
          <p className="text-sm text-gray-600">🕐 Horario: {anuncio.horario}</p>
        )}
        <p className="text-sm text-gray-600">
          Publicado por: {anuncio.createdBy?.nombre ?? '—'}
        </p>
        <p className="text-xs text-gray-400">
          Publicado: {new Date(anuncio.createdAt).toLocaleDateString('es-BO')} ·
          Vence: {new Date(anuncio.expiraEn).toLocaleDateString('es-BO')}
        </p>
      </div>

      <AnuncioAcciones anuncio={anuncio} />

      <Reviews
        empleadorId={anuncio.createdById}
        empleadorNombre={anuncio.createdBy?.nombre ?? 'este empleador'}
      />
    </div>
  );
}
