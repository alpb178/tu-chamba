import Link from 'next/link';
import {
  Anuncio,
  CATEGORIA_LABEL,
  DEPARTAMENTO_LABEL,
  ESTADO_LABEL,
  estadoAnuncio,
} from '@/lib/types';
import { Badge } from './Badge';

const ESTADO_STYLE = {
  ACTIVO: 'bg-green-100 text-green-800',
  VENCIDO: 'bg-amber-100 text-amber-800',
  DADO_DE_BAJA: 'bg-gray-200 text-gray-600',
};

// mostrarEstado: solo en vistas del dueño ("Mis anuncios"); el listado
// público únicamente contiene anuncios vigentes.
export function AnuncioCard({
  anuncio,
  mostrarEstado = false,
}: {
  anuncio: Anuncio;
  mostrarEstado?: boolean;
}) {
  const estado = estadoAnuncio(anuncio);
  return (
    <Link
      href={`/anuncios/${anuncio.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-brand hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="line-clamp-2 text-sm text-gray-800">{anuncio.descripcion}</p>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge tipo={anuncio.tipoJornada} />
          {mostrarEstado && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_STYLE[estado]}`}
            >
              {ESTADO_LABEL[estado]}
            </span>
          )}
        </div>
      </div>
      {(anuncio.categoria || anuncio.departamento) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
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
      )}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-lg font-semibold text-brand">
          Bs {Number(anuncio.salario).toLocaleString('es-BO')}
        </span>
        {anuncio.ubicacion && (
          <span className="text-xs text-gray-500">📍 {anuncio.ubicacion}</span>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-400">
        Publicado: {new Date(anuncio.createdAt).toLocaleDateString('es-BO')}
      </p>
    </Link>
  );
}
