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
  const waMessage = `Hola, vi tu anuncio en Tu Chamba (Ref. ${ad.id.slice(0, 8)}) y me interesa.`;

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
        <MapView lat={ad.latitude} lng={ad.longitude} />
      ) : (
        approx && (
          <div className="space-y-1">
            <MapView lat={approx.lat} lng={approx.lng} zoom={13} />
            <p className="text-xs text-gray-400">
              Ubicación aproximada según la dirección del anuncio.
            </p>
          </div>
        )
      )}

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
              <Link href="/login">
                <Button>Ingresar</Button>
              </Link>
              <Link href="/register">
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
