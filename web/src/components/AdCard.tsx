import Link from 'next/link';
import {
  Ad,
  CATEGORY_LABEL,
  DEPARTMENT_LABEL,
  STATUS_LABEL,
  adEffectiveStatus,
} from '@/lib/types';
import { Badge } from './Badge';

const STATUS_STYLE = {
  ACTIVO: 'bg-green-100 text-green-800',
  VENCIDO: 'bg-amber-100 text-amber-800',
  DADO_DE_BAJA: 'bg-gray-200 text-gray-600',
};

// showStatus: solo en vistas del dueño ("Mis anuncios"); el listado
// público únicamente contiene anuncios vigentes.
export function AdCard({
  ad,
  showStatus = false,
}: {
  ad: Ad;
  showStatus?: boolean;
}) {
  const status = adEffectiveStatus(ad);
  return (
    <Link
      href={`/anuncios/${ad.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-brand hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="line-clamp-2 text-sm text-gray-800">{ad.description}</p>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge jobType={ad.jobType} />
          {showStatus && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
            >
              {STATUS_LABEL[status]}
            </span>
          )}
        </div>
      </div>
      {(ad.category || ad.department) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
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
      )}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-lg font-semibold text-brand">
          Bs {Number(ad.salary).toLocaleString('es-BO')}
        </span>
        {ad.location && (
          <span className="text-xs text-gray-500">📍 {ad.location}</span>
        )}
      </div>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Publicado: {new Date(ad.createdAt).toLocaleDateString('es-BO')}
        </p>
        {ad.ownerRating && ad.ownerRating.count > 0 && (
          <span className="text-xs text-gray-600">
            <span aria-hidden="true" className="text-amber-500">★</span>{' '}
            {Number(ad.ownerRating.average).toFixed(1)} (
            {ad.ownerRating.count})
          </span>
        )}
      </div>
    </Link>
  );
}
