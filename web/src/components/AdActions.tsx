'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { Ad, adEffectiveStatus, DEPARTMENT_LABEL, waLink } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { Button } from './ui';
import { ReportAd } from './ReportAd';

// Leaflet usa window: solo en cliente.
const MapView = dynamic(() => import('./MapPicker').then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="h-56 rounded-md bg-gray-100" />,
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
          className="absolute right-2 top-2 z-[1001] rounded-md border border-gray-200 bg-white/95 px-2 py-1 text-xs font-medium text-gray-700 shadow-sm hover:text-brand"
        >
          ⤢ Ampliar
        </button>
      </div>
      <div className="flex items-center justify-between gap-2">
        {approximate ? (
          <p className="text-xs text-gray-400">
            Ubicación aproximada según la dirección del anuncio.
          </p>
        ) : (
          <span />
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs text-brand underline hover:text-brand-dark"
        >
          Abrir en Google Maps ↗
        </a>
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setExpanded(false)}
          role="dialog"
          aria-label="Mapa ampliado"
        >
          <div
            className="relative z-0 h-[80vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <MapView
              lat={lat}
              lng={lng}
              zoom={approximate ? 14 : 16}
              className="h-full"
            />
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="absolute right-3 top-3 z-[1001] rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow hover:text-brand"
            >
              ✕ Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [approx, setApprox] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  // Sin pin exacto: geocodifica la dirección del anuncio para ubicarlo.
  useEffect(() => {
    if (ad.latitude != null || !ad.location) return;
    const department = ad.department ? DEPARTMENT_LABEL[ad.department] : '';
    geocode([ad.location, department, 'Bolivia'].filter(Boolean).join(', ')).then(
      setApprox,
    );
  }, [ad.latitude, ad.location, ad.department]);

  const status = adEffectiveStatus(ad);
  const isOwner = user?.id === ad.createdById;
  const canEdit = user?.role === 'ADMIN' || isOwner;
  const adRef = ad.id.slice(0, 8);
  const adPath = `/anuncios/${ad.id}`;
  const waMessage = `Hola, vi tu anuncio en Tu Chamba (Ref. ${adRef}) y me interesa.`;

  // Enlace compartido (?shared=1): sin sesión se exige crear cuenta y,
  // al terminar el registro, se vuelve a este anuncio (next=).
  useEffect(() => {
    if (loading || user) return;
    if (new URLSearchParams(window.location.search).has('shared')) {
      router.replace(`/register?next=${encodeURIComponent(adPath)}`);
    }
  }, [loading, user, adPath, router]);

  // Coordenadas a compartir: el pin exacto o la ubicación geocodificada.
  const coords =
    ad.latitude != null && ad.longitude != null
      ? { lat: ad.latitude, lng: ad.longitude }
      : approx;

  // wa.me sin número: WhatsApp deja elegir el contacto al que enviar.
  function shareByWhatsApp(text: string) {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  // El teléfono no viaja en el detalle público: se pide aparte con sesión.
  useEffect(() => {
    if (user && !phone) {
      api<{ phone: string }>(`/ads/${ad.id}/contact`)
        .then((r) => setPhone(r.phone))
        .catch(() => {});
    }
  }, [user, ad.id, phone]);

  async function unpublish() {
    if (!confirm('¿Dar de baja este anuncio? Dejará de mostrarse en el portal.'))
      return;
    await api(`/ads/${ad.id}/unpublish`, { method: 'POST' });
    router.push('/mis-anuncios');
  }

  async function republish() {
    await api(`/ads/${ad.id}/republish`, { method: 'POST' });
    router.refresh();
    location.reload();
  }

  return (
    <div className="space-y-4">
      {ad.latitude != null && ad.longitude != null ? (
        <LocationMap lat={ad.latitude} lng={ad.longitude} />
      ) : (
        approx && <LocationMap lat={approx.lat} lng={approx.lng} approximate />
      )}

      {/* Compartir por WhatsApp: la ubicación (Google Maps) o el anuncio. */}
      <div className="flex gap-2">
        {coords && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() =>
              shareByWhatsApp(
                `Ubicación del anuncio Ref. ${adRef} en Tu Chamba: https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`,
              )
            }
          >
            Compartir ubicación
          </Button>
        )}
        <Button
          variant="outline"
          className="flex-1"
          onClick={() =>
            shareByWhatsApp(
              `Mira este anuncio en Tu Chamba (Ref. ${adRef}): ${window.location.origin}${adPath}?shared=1`,
            )
          }
        >
          Compartir anuncio
        </Button>
      </div>

      {/* Contacto: con sesión muestra Chatear/Llamar; sin sesión, CTA. */}
      {phone ? (
        <div className="flex gap-2">
          <a
            href={waLink(phone, waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
            onClick={() => {
              api('/notifications/chat-click', {
                method: 'POST',
                body: JSON.stringify({ adId: ad.id }),
              }).catch(() => {});
            }}
          >
            <Button className="w-full">Chatear</Button>
          </a>
          <a href={`tel:${phone}`} className="flex-1">
            <Button variant="outline" className="w-full">
              Llamar: {phone}
            </Button>
          </a>
        </div>
      ) : (
        !loading &&
        !user && (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-700">
              Inicia sesión para ver el teléfono y contactar por WhatsApp.
            </p>
            <div className="mt-3 flex justify-center gap-2">
              <Link href={`/login?next=${encodeURIComponent(adPath)}`}>
                <Button>Ingresar</Button>
              </Link>
              <Link href={`/register?next=${encodeURIComponent(adPath)}`}>
                <Button variant="outline">Registrarse</Button>
              </Link>
            </div>
          </div>
        )
      )}

      {canEdit && (
        <div className="flex gap-2 border-t border-gray-100 pt-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/anuncios/nuevo?id=${ad.id}`)}
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
        <div className="border-t border-gray-100 pt-4">
          <ReportAd adId={ad.id} />
        </div>
      )}
    </div>
  );
}
