import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useLabels } from '@/i18n/use-labels';
import { Ad, Category, adEffectiveStatus } from '@/lib/types';
import { Badge } from './Badge';
import { Icon } from './Icon';

const STATUS_STYLE = {
  ACTIVO: 'bg-tertiary-container text-on-tertiary-container',
  VENCIDO: 'bg-secondary-container text-on-secondary-container',
  DADO_DE_BAJA: 'bg-surface-container-high text-on-surface-variant',
};

// Icon marking the listing status (same approach as the admin panel).
const STATUS_ICON = {
  ACTIVO: 'check_circle',
  VENCIDO: 'schedule',
  DADO_DE_BAJA: 'block',
};

// Material Symbols icon per category for the card tile.
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
  AGROPECUARIA: 'agriculture',
  MECANICA: 'build',
  MARKETING_DISENO: 'campaign',
  OTRO: 'business_center',
};

// showStatus: only in owner views ("Mis anuncios"); the public list
// only contains active listings.
export function AdCard({
  ad,
  showStatus = false,
}: {
  ad: Ad;
  showStatus?: boolean;
}) {
  const t = useTranslations('adCard');
  const labels = useLabels();
  const status = adEffectiveStatus(ad);
  // Views of the listing detail (social counter on the card).
  const views = ad._count?.visits ?? 0;
  // Listings featured from the panel stand out by their border color (same
  // width, so they don't shift relative to the other cards), and that color
  // changes every 5 seconds: amber → green → blue, in a loop.
  //
  // The resting color is AMBER, not blue as it used to be: blue is the HOVER
  // color of a regular card (`hover:border-primary/40`), so hovering over any
  // listing disguised it as featured. Amber is also the color the portal
  // already uses to talk about promotion (the publish listing button), so the
  // border reads without a legend.
  //
  // `motion-safe:` rather than the bare animation: with
  // `prefers-reduced-motion: reduce` the border stays still on amber, the same
  // approach `FeaturedBrands` and `SlideBurst` already follow. A border that
  // keeps changing color is exactly what that preference exists to turn off.
  //
  // The `hover:` survives for the same reason: when the animation is off it
  // is still the only acknowledgement of the cursor. With the animation
  // running, the animation rule wins and the hover isn't visible — on purpose,
  // because the border is already saying something more important.
  //
  // It no longer has the old `ring`. It was there so the border looked 2 px
  // wide without taking up 2 px, and a `--tw-ring-color` can't be interpolated
  // (custom properties without `@property` jump abruptly): the ring would have
  // stayed amber, lurching, while the border crossed over to green.
  const border = ad.featured
    ? 'border-accent hover:border-accent-dark motion-safe:animate-featured-border'
    : 'border-outline-variant hover:border-primary/40';
  return (
    <Link
      href={`/listings/${ad.id}`}
      className={`group relative block overflow-hidden rounded-card border bg-surface-container-lowest p-4 shadow-aceternity transition-all duration-300 hover:-translate-y-1 hover:shadow-derek focus:outline-none focus-visible:ring-2 focus-visible:ring-primary md:p-6 ${border}`}
    >
      {/* Decorative detail that grows on hover. */}
      <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" />

      {/* On mobile the salary drops below the title. */}
      <div className="relative z-10 flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
        <div className="flex min-w-0 gap-3 md:gap-4">
          {/* The category tile is also shown on mobile (visual anchor of the
              card now that there is one per row). */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-tile border border-outline-variant bg-surface-container sm:h-16 sm:w-16">
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
                  {ad.location || labels.department(ad.department!)}
                </span>
              )}
              <span className="hidden h-1 w-1 rounded-full bg-outline sm:block" />
              <span>
                {t('published', { date: labels.date(ad.createdAt) })}
              </span>
              {views > 0 && (
                <>
                  <span className="hidden h-1 w-1 rounded-full bg-outline sm:block" />
                  <span
                    className="flex items-center gap-1"
                    title={t('viewsTitle', { count: views })}
                  >
                    <Icon name="visibility" className="text-sm" />
                    {t('views', { count: views, formatted: labels.number(views) })}
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
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em] ${STATUS_STYLE[status]}`}
              >
                <Icon name={STATUS_ICON[status]} className="text-sm" />
                {labels.status(status)}
              </span>
            )}
          </div>
          {/* Fixed amount or range ("Bs 3.500 a 4.500"); the range is smaller
              so it doesn't break the card. */}
          <div
            className={`font-display font-bold text-primary ${
              ad.salaryMax != null ? 'text-base md:text-xl' : 'text-lg md:text-2xl'
            }`}
          >
            {labels.salary(ad)}
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-4 flex items-center justify-between border-t border-outline-variant pt-3 md:mt-6 md:pt-4">
        <div className="flex flex-wrap items-center gap-1">
          {/* Trust signal: publisher with a verified email. */}
          {ad.createdBy?.emailVerified && (
            <span className="mr-1 flex items-center gap-0.5 rounded-full bg-tertiary-container px-2 py-0.5 text-xs font-medium text-on-tertiary-container">
              <Icon name="verified" className="text-sm" /> {t('verified')}
            </span>
          )}
          {ad.ownerRating && ad.ownerRating.count > 0 ? (
            <>
              <Icon name="star" className="text-secondary-container" />
              <span className="text-sm font-bold text-on-surface">
                {Number(ad.ownerRating.average).toFixed(1)}
              </span>
              <span className="ml-1 text-xs text-on-surface-variant">
                {t('reviews', { count: ad.ownerRating.count })}
              </span>
            </>
          ) : (
            ad.category && (
              <span className="text-sm text-on-surface-variant">
                {labels.category(ad.category)}
              </span>
            )
          )}
        </div>
        {/* The whole card is the link; the "Ver detalles" action is shown
            as an icon with a tooltip. */}
        <span
          title={t('viewDetails')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary transition-all group-hover:brightness-110 md:h-10 md:w-10"
        >
          <Icon name="arrow_forward" className="text-lg" />
          <span className="sr-only">{t('viewDetails')}</span>
        </span>
      </div>
    </Link>
  );
}
