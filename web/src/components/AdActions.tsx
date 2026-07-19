'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { Ad, adEffectiveStatus, DEPARTMENT_LABEL, waLink } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { Button } from './ui';
import { Icon } from './Icon';
import { ReportAd } from './ReportAd';

// Leaflet usa window: solo en cliente.
const MapView = dynamic(() => import('./MapPicker').then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="h-56 rounded-md bg-surface-container" />,
});

// Mapa del anuncio con botón para ampliarlo (modal) y enlace a Google Maps.
// Los panes de Leaflet usan z-index altos: el wrapper `relative z-0` los
// encierra en su propio stacking context para que no tapen el modal.
function LocationMap({
  lat,
  lng,
  approximate = false,
}: {
  lat: number;
  lng: number;
  approximate?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  // Cerrar el modal con Escape.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setExpanded(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  return (
    <div className="space-y-1">
      <div className="relative z-0">
        <MapView lat={lat} lng={lng} zoom={approximate ? 13 : undefined} />
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="absolute right-2 top-2 z-[1001] flex items-center gap-1 rounded-md border border-outline-variant bg-surface-container-lowest/95 px-2 py-1 text-xs font-medium text-on-surface-variant shadow-sm hover:text-brand"
        >
          <Icon name="open_in_full" className="text-sm" /> Ampliar
        </button>
      </div>
      <div className="flex items-center justify-between gap-2">
        {approximate ? (
          <p className="text-xs text-outline">
            Ubicación aproximada según la dirección del anuncio.
          </p>
        ) : (
          <span />
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-0.5 text-xs text-brand underline hover:text-brand-dark"
        >
          Abrir en Google Maps <Icon name="open_in_new" className="text-sm" />
        </a>
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setExpanded(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Mapa ampliado"
        >
          <div
            className="relative z-0 h-[80vh] w-full max-w-4xl overflow-hidden rounded-lg bg-surface-container-lowest"
            onClick={(e) => e.stopPropagation()}
          >
            <MapView
              lat={lat}
              lng={lng}
              zoom={approximate ? 14 : 16}
              className="h-full"
            />
            {/* autoFocus: el foco entra al diálogo al abrirse (Escape y el
                click en el fondo lo cierran). */}
            <button
              type="button"
              autoFocus
              onClick={() => setExpanded(false)}
              className="absolute right-3 top-3 z-[1001] flex items-center gap-1 rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm font-medium text-on-surface-variant shadow hover:text-brand"
            >
              <Icon name="close" className="text-base" /> Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Botón circular de acción secundaria (compartir): icono + tooltip nativo.
function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface-variant shadow-sm transition-colors hover:border-brand hover:text-brand"
    >
      {children}
    </button>
  );
}

const iconProps = {
  className: 'h-4 w-4',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
} as const;

function MapPinIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}

// Glifo oficial de WhatsApp (relleno): el CTA debe reconocerse como
// WhatsApp de un vistazo, no como un botón genérico.
function WhatsAppIcon({ className = 'h-4.5 w-4.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

function CallIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

// CTA verde de WhatsApp (color de marca) y botón secundario "Llamar".
// Ambos son <a>: con sesión apuntan a wa.me/tel:, sin sesión llevan a
// iniciar sesión y vuelven al anuncio (next=). El teléfono en sí nunca
// se muestra sin sesión.
const WA_BUTTON_CLASS =
  'flex w-full items-center justify-center gap-2 rounded-lg bg-[#25d366] px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25d366] focus-visible:ring-offset-2 active:scale-95';
const CALL_BUTTON_CLASS =
  'flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-medium text-on-surface-variant transition-all hover:border-primary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95';

// Coordenadas aproximadas de una dirección (Nominatim, best effort).
// Para anuncios sin pin: así el detalle siempre muestra el lugar en el mapa.
async function geocode(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=bo&accept-language=es&q=${encodeURIComponent(query)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: string; lon: string }[];
    if (!data.length) return null;
    return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  } catch {
    return null;
  }
}

// Parte interactiva del detalle: mapa, contacto (teléfono solo con sesión),
// acciones del dueño y reporte. El contenido textual lo renderiza el server.
export function AdActions({ ad }: { ad: Ad }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState<string | null>(ad.phone ?? null);
  // Ubicación del anuncio: solo viaja con sesión (vía /contact).
  const [location, setLocation] = useState<string | null>(ad.location ?? null);
  const [exact, setExact] = useState<{ lat: number; lng: number } | null>(
    ad.latitude != null && ad.longitude != null
      ? { lat: ad.latitude, lng: ad.longitude }
      : null,
  );
  const [approx, setApprox] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  // Sin pin exacto: geocodifica la dirección del anuncio para ubicarlo
  // (solo con sesión, que es cuando conocemos la dirección).
  useEffect(() => {
    if (!user || exact || !location) return;
    const department = ad.department ? DEPARTMENT_LABEL[ad.department] : '';
    geocode([location, department, 'Bolivia'].filter(Boolean).join(', ')).then(
      setApprox,
    );
  }, [user, exact, location, ad.department]);

  const status = adEffectiveStatus(ad);
  const isOwner = user?.id === ad.createdById;
  const canEdit = Boolean(user?.isAdmin) || isOwner;
  const adRef = ad.id.slice(0, 8);
  const adPath = `/listings/${ad.id}`;
  // Sin sesión, los CTA de contacto llevan al login y vuelven al anuncio.
  const loginNext = `/login?next=${encodeURIComponent(adPath)}`;
  const waMessage = `Hola, vi tu anuncio en Tu Chamba (Ref. ${adRef}) y me interesa.`;

  // Enlace compartido (?shared=1): sin sesión se exige crear cuenta y,
  // al terminar el registro, se vuelve a este anuncio (next=).
  useEffect(() => {
    if (loading || user) return;
    if (new URLSearchParams(window.location.search).has('shared')) {
      router.replace(`/register?next=${encodeURIComponent(adPath)}`);
    }
  }, [loading, user, adPath, router]);

  // Coordenadas a mostrar/compartir: el pin exacto o la geocodificada.
  const coords = exact ?? approx;

  // Abrir el detalle ya registra el interés (silencioso): alimenta
  // "anuncios de tu interés" y el conteo de interesados del dueño.
  useEffect(() => {
    if (loading || !user || user.id === ad.createdById) return;
    api('/interests', {
      method: 'POST',
      body: JSON.stringify({ adId: ad.id }),
    }).catch(() => {});
  }, [loading, user, ad.id, ad.createdById]);

  // Contactar (Chatear/Llamar) marca el interés como contacto: avisa al
  // dueño la primera vez (best effort).
  function registerInterest() {
    api('/interests', {
      method: 'POST',
      body: JSON.stringify({ adId: ad.id, contact: true }),
    }).catch(() => {});
  }

  // wa.me sin número: WhatsApp deja elegir el contacto al que enviar.
  function shareByWhatsApp(text: string) {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  // Teléfono y ubicación no viajan en el detalle público: se piden con sesión.
  useEffect(() => {
    if (user && (!phone || !location)) {
      api<{
        phone: string;
        location: string | null;
        latitude: number | null;
        longitude: number | null;
      }>(`/listings/${ad.id}/contact`)
        .then((r) => {
          setPhone(r.phone);
          setLocation(r.location);
          if (r.latitude != null && r.longitude != null) {
            setExact({ lat: r.latitude, lng: r.longitude });
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, ad.id]);

  async function unpublish() {
    if (!confirm('¿Dar de baja este anuncio? Dejará de mostrarse en el portal.'))
      return;
    await api(`/listings/${ad.id}/unpublish`, { method: 'POST' });
    router.push('/my-listings');
  }

  async function republish() {
    await api(`/listings/${ad.id}/republish`, { method: 'POST' });
    router.refresh();
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      {/* Ubicación exacta y mapa: solo con sesión. */}
      {user && location && (
        <p className="flex items-center gap-1 text-sm text-on-surface-variant">
          <Icon name="location_on" className="text-base" /> Ubicación: {location}
        </p>
      )}
      {user &&
        (exact ? (
          <LocationMap lat={exact.lat} lng={exact.lng} />
        ) : (
          approx && (
            <LocationMap lat={approx.lat} lng={approx.lng} approximate />
          )
        ))}

      {/* Compartir por WhatsApp: iconos discretos, no compiten con el CTA. */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-outline">Compartir:</span>
        {coords && (
          <IconButton
            label="Compartir ubicación por WhatsApp"
            onClick={() =>
              shareByWhatsApp(
                `Ubicación del anuncio Ref. ${adRef} en Tu Chamba: https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`,
              )
            }
          >
            <MapPinIcon />
          </IconButton>
        )}
        <IconButton
          label="Compartir anuncio por WhatsApp"
          onClick={() =>
            shareByWhatsApp(
              `Mira este anuncio en Tu Chamba (Ref. ${adRef}): ${window.location.origin}${adPath}?shared=1`,
            )
          }
        >
          <ShareIcon />
        </IconButton>
      </div>

      {/* Contacto: con sesión los botones abren WhatsApp/llamada y se ve el
          teléfono; sin sesión los MISMOS botones llevan a iniciar sesión y
          vuelven al anuncio (el teléfono queda oculto hasta entonces). */}
      {(phone || (!loading && !user)) && (
        <>
          {/* Escritorio: contacto en el flujo del detalle. */}
          <div className="hidden space-y-1.5 sm:block">
            <div className="flex gap-2">
              {phone ? (
                <a
                  href={waLink(phone, waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${WA_BUTTON_CLASS} flex-1`}
                  onClick={registerInterest}
                >
                  <WhatsAppIcon className="h-5 w-5" /> WhatsApp
                </a>
              ) : (
                <Link href={loginNext} className={`${WA_BUTTON_CLASS} flex-1`}>
                  <WhatsAppIcon className="h-5 w-5" /> WhatsApp
                </Link>
              )}
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className={`${CALL_BUTTON_CLASS} flex-1`}
                  onClick={registerInterest}
                >
                  <CallIcon /> Llamar
                </a>
              ) : (
                <Link href={loginNext} className={`${CALL_BUTTON_CLASS} flex-1`}>
                  <CallIcon /> Llamar
                </Link>
              )}
            </div>
            <p className="text-center text-xs text-on-surface-variant">
              {phone
                ? `Teléfono: ${phone}`
                : 'Inicia sesión para contactar: el teléfono se muestra al ingresar.'}
            </p>
          </div>

          {/* Móvil: barra fija al pie para que el contacto siempre esté a
              mano aunque la descripción sea larga (safe-area por el notch). */}
          <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-outline-variant bg-surface-container-lowest p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-2px_8px_rgba(0,0,0,0.08)] sm:hidden">
            {phone ? (
              <a
                href={waLink(phone, waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className={`${WA_BUTTON_CLASS} flex-1`}
                onClick={registerInterest}
              >
                <WhatsAppIcon className="h-5 w-5" /> WhatsApp
              </a>
            ) : (
              <Link href={loginNext} className={`${WA_BUTTON_CLASS} flex-1`}>
                <WhatsAppIcon className="h-5 w-5" /> WhatsApp
              </Link>
            )}
            {phone ? (
              <a
                href={`tel:${phone}`}
                className={`${CALL_BUTTON_CLASS} flex-1`}
                onClick={registerInterest}
              >
                <CallIcon /> Llamar
              </a>
            ) : (
              <Link href={loginNext} className={`${CALL_BUTTON_CLASS} flex-1`}>
                <CallIcon /> Llamar
              </Link>
            )}
          </div>
        </>
      )}

      {canEdit && (
        <div className="flex gap-2 border-t border-outline-variant/60 pt-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/listings/new?id=${ad.id}`)}
          >
            Editar
          </Button>
          {status === 'ACTIVO' ? (
            <Button variant="danger" onClick={unpublish}>
              Dar de baja
            </Button>
          ) : (
            <Button onClick={republish}>
              Republicar ({ad.durationDays} días)
            </Button>
          )}
        </div>
      )}

      {user && !isOwner && (
        <div className="border-t border-outline-variant/60 pt-4">
          <ReportAd adId={ad.id} />
        </div>
      )}
    </div>
  );
}
