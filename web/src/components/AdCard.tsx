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
  // Visitas al detalle del anuncio (contador social en la tarjeta).
  const views = ad._count?.visits ?? 0;
  return (
    <Link
      href={`/listings/${ad.id}`}
      className="group relative block overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary md:p-6"
    >
      {/* Detalle decorativo que crece al pasar el cursor. */}
      <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" />

      {/* En móvil el salario baja bajo el título. */}
      <div className="relative z-10 flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
        <div className="flex min-w-0 gap-3 md:gap-4">
          {/* El tile del rubro también se ve en móvil (ancla visual de la
              tarjeta ahora que va una por fila). */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-outline-variant bg-surface-container sm:h-16 sm:w-16">
            <Icon
              name={CATEGORY_ICON[ad.category ?? 'OTRO']}
              className="text-2xl text-primary sm:text-3xl"
            />
          </div>
          <div className="min-w-0">
            <h3 className="line-clamp-2 font-display text-base font-semibold text-on-surface transition-colors group-hover:text-primary md:text-lg">
              {ad.title}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-sm text-on-surface-variant">
              {ad.description}
            </p>
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
              {views > 0 && (
                <>
                  <span className="hidden h-1 w-1 rounded-full bg-outline sm:block" />
                  <span
                    className="flex items-center gap-1"
                    title={`${views} ${views === 1 ? 'visita' : 'visitas'} a este anuncio`}
                  >
                    <Icon name="visibility" className="text-sm" />
                    {views.toLocaleString('es-BO')}{' '}
                    {views === 1 ? 'visita' : 'visitas'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 md:text-right">
          <div className="mb-2 flex flex-wrap items-center gap-1 md:flex-col md:items-end">
            <Badge jobType={ad.jobType} />
            {showStatus && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[status]}`}
              >
                {STATUS_LABEL[status]}
              </span>
            )}
          </div>
          <div className="font-display text-lg font-bold text-primary md:text-2xl">
            {ad.salary != null
              ? `Bs ${Number(ad.salary).toLocaleString('es-BO')}`
              : 'A convenir'}
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-4 flex items-center justify-between border-t border-outline-variant pt-3 md:mt-6 md:pt-4">
        <div className="flex flex-wrap items-center gap-1">
          {/* Señal de confianza: publicante con correo verificado. */}
          {ad.createdBy?.emailVerified && (
            <span className="mr-1 flex items-center gap-0.5 rounded-full bg-tertiary-container px-2 py-0.5 text-xs font-medium text-on-tertiary-container">
              <Icon name="verified" className="text-sm" /> Verificado
            </span>
          )}
          {ad.ownerRating && ad.ownerRating.count > 0 ? (
            <>
              <Icon name="star" className="text-secondary-container" />
              <span className="text-sm font-bold text-on-surface">
                {Number(ad.ownerRating.average).toFixed(1)}
              </span>
              <span className="ml-1 text-xs text-on-surface-variant">
                ({ad.ownerRating.count}{' '}
                {ad.ownerRating.count === 1 ? 'reseña' : 'reseñas'})
              </span>
            </>
          ) : (
            ad.category && (
              <span className="text-sm text-on-surface-variant">
                {CATEGORY_LABEL[ad.category]}
              </span>
            )
          )}
        </div>
        {/* Toda la tarjeta es el enlace; la acción "Ver detalles" queda
            como icono con tooltip. */}
        <span
          title="Ver detalles"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary transition-all group-hover:brightness-110 md:h-10 md:w-10"
        >
          <Icon name="arrow_forward" className="text-lg" />
          <span className="sr-only">Ver detalles</span>
        </span>
      </div>
    </Link>
  );
}
