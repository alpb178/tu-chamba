import Link from 'next/link';
import {
  Ad,
  Category,
  CATEGORY_LABEL,
  DEPARTMENT_LABEL,
  STATUS_LABEL,
  adEffectiveStatus,
} from '@/lib/types';
import { Badge } from './Badge';
import { Icon } from './Icon';

const STATUS_STYLE = {
  ACTIVO: 'bg-tertiary-container text-on-tertiary-container',
  VENCIDO: 'bg-amber-100 text-amber-800',
  DADO_DE_BAJA: 'bg-surface-container-high text-on-surface-variant',
};

// Icono Material Symbols por rubro para el tile de la tarjeta.
const CATEGORY_ICON: Record<Category, string> = {
  VENTAS: 'storefront',
  GASTRONOMIA: 'restaurant',
  CONSTRUCCION: 'construction',
  LIMPIEZA: 'cleaning_services',
  CUIDADO_PERSONAS: 'volunteer_activism',
  TRANSPORTE: 'local_shipping',
  ADMINISTRACION: 'badge',
  TECNOLOGIA: 'computer',
  EDUCACION: 'school',
  SALUD: 'medical_services',
  BELLEZA: 'content_cut',
  SEGURIDAD: 'shield_person',
  OTRO: 'business_center',
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
      href={`/listings/${ad.id}`}
      className="group relative block overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      {/* Detalle decorativo que crece al pasar el cursor. */}
      <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-outline-variant bg-surface-container sm:flex">
            <Icon
              name={CATEGORY_ICON[ad.category ?? 'OTRO']}
              className="text-3xl text-primary"
            />
          </div>
          <div className="min-w-0">
            <h3 className="line-clamp-2 font-display text-lg font-semibold text-on-surface transition-colors group-hover:text-primary">
              {ad.description}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
              {(ad.location || ad.department) && (
                <span className="flex items-center gap-1">
                  <Icon name="location_on" className="text-sm" />
                  {ad.location || DEPARTMENT_LABEL[ad.department!]}
                </span>
              )}
              <span className="hidden h-1 w-1 rounded-full bg-outline sm:block" />
              <span>
                Publicado: {new Date(ad.createdAt).toLocaleDateString('es-BO')}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="mb-2 flex flex-col items-end gap-1">
            <Badge jobType={ad.jobType} />
            {showStatus && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[status]}`}
              >
                {STATUS_LABEL[status]}
              </span>
            )}
          </div>
          <div className="font-display text-2xl font-bold text-primary">
            {ad.salary != null
              ? `Bs ${Number(ad.salary).toLocaleString('es-BO')}`
              : 'A convenir'}
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-6 flex items-center justify-between border-t border-outline-variant pt-4">
        <div className="flex items-center gap-1">
          {ad.ownerRating && ad.ownerRating.count > 0 ? (
            <>
              <Icon name="star" className="text-secondary-container" />
              <span className="text-sm font-bold text-on-surface">
                {Number(ad.ownerRating.average).toFixed(1)}
              </span>
              <span className="ml-1 text-xs text-outline">
                ({ad.ownerRating.count}{' '}
                {ad.ownerRating.count === 1 ? 'reseña' : 'reseñas'})
              </span>
            </>
          ) : (
            ad.category && (
              <span className="text-xs text-outline">
                {CATEGORY_LABEL[ad.category]}
              </span>
            )
          )}
        </div>
        <span className="rounded-lg bg-primary px-6 py-2 text-xs font-bold text-on-primary transition-all group-hover:brightness-110">
          Ver detalles
        </span>
      </div>
    </Link>
  );
}
