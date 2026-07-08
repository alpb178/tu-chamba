'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { Anuncio, estadoAnuncio, waLink } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { Button } from './ui';
import { ReportarAnuncio } from './ReportarAnuncio';

// Leaflet usa window: solo en cliente.
const MapView = dynamic(() => import('./Mapa').then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="h-56 rounded-md bg-gray-100" />,
});

// Parte interactiva del detalle: mapa, contacto (teléfono solo con sesión),
// acciones del dueño y reporte. El contenido textual lo renderiza el server.
export function AnuncioAcciones({ anuncio }: { anuncio: Anuncio }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [telefono, setTelefono] = useState<string | null>(anuncio.telefono ?? null);

  const estado = estadoAnuncio(anuncio);
  const esDueno = user?.id === anuncio.createdById;
  const puedeEditar = user?.role === 'ADMIN' || esDueno;
  const mensajeWa = `Hola, vi tu anuncio en Tu Chamba (Ref. ${anuncio.id.slice(0, 8)}) y me interesa.`;

  // El teléfono no viaja en el detalle público: se pide aparte con sesión.
  useEffect(() => {
    if (user && !telefono) {
      api<{ telefono: string }>(`/anuncios/${anuncio.id}/contacto`)
        .then((r) => setTelefono(r.telefono))
        .catch(() => {});
    }
  }, [user, anuncio.id, telefono]);

  async function darDeBaja() {
    if (!confirm('¿Dar de baja este anuncio? Dejará de mostrarse en el portal.'))
      return;
    await api(`/anuncios/${anuncio.id}/baja`, { method: 'POST' });
    router.push('/mis-anuncios');
  }

  async function republicar() {
    await api(`/anuncios/${anuncio.id}/republicar`, { method: 'POST' });
    router.refresh();
    location.reload();
  }

  return (
    <div className="space-y-4">
      {anuncio.latitud != null && anuncio.longitud != null && (
        <MapView lat={anuncio.latitud} lng={anuncio.longitud} />
      )}

      {/* Contacto: con sesión muestra Chatear/Llamar; sin sesión, CTA. */}
      {telefono ? (
        <div className="flex gap-2">
          <a
            href={waLink(telefono, mensajeWa)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
            onClick={() => {
              api('/notificaciones/chat-click', {
                method: 'POST',
                body: JSON.stringify({ anuncioId: anuncio.id }),
              }).catch(() => {});
            }}
          >
            <Button className="w-full">Chatear</Button>
          </a>
          <a href={`tel:${telefono}`} className="flex-1">
            <Button variant="outline" className="w-full">
              Llamar: {telefono}
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

      {puedeEditar && (
        <div className="flex gap-2 border-t border-gray-100 pt-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/anuncios/nuevo?id=${anuncio.id}`)}
          >
            Editar
          </Button>
          {estado === 'ACTIVO' ? (
            <Button variant="danger" onClick={darDeBaja}>
              Dar de baja
            </Button>
          ) : (
            <Button onClick={republicar}>
              Republicar ({anuncio.duracionDias} días)
            </Button>
          )}
        </div>
      )}

      {user && !esDueno && (
        <div className="border-t border-gray-100 pt-4">
          <ReportarAnuncio anuncioId={anuncio.id} />
        </div>
      )}
    </div>
  );
}
