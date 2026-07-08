'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import {
  Anuncio,
  CATEGORIA_LABEL,
  DEPARTAMENTO_LABEL,
  ESTADO_LABEL,
  estadoAnuncio,
  waLink,
} from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/ui';
import { Reviews } from '@/components/Reviews';
import { ReportarAnuncio } from '@/components/ReportarAnuncio';

// Leaflet usa window: solo en cliente.
const MapView = dynamic(
  () => import('@/components/Mapa').then((m) => m.MapView),
  { ssr: false, loading: () => <div className="h-56 rounded-md bg-gray-100" /> },
);

export default function AnuncioDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // El detalle solo se consulta con sesión iniciada.
    if (authLoading || !user) return;
    api<Anuncio>(`/anuncios/${id}`)
      .then(setAnuncio)
      .catch((e) => setError((e as Error).message));
  }, [id, user, authLoading]);

  if (authLoading) return <p className="text-gray-500">Cargando...</p>;

  // Visitante sin sesión: pedimos registro/login para ver el detalle y el contacto.
  if (!user) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-800">
          Regístrate para ver esta oferta
        </h1>
        <p className="mt-2 text-gray-600">
          Crea una cuenta gratis o inicia sesión para ver la descripción
          completa y el teléfono de contacto.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/register">
            <Button>Registrarse</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline">Ya tengo cuenta</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!anuncio) return <p className="text-gray-500">Cargando...</p>;

  const esDueño = user.id === anuncio.createdById;
  const puedeEditar = user.role === 'ADMIN' || esDueño;
  const estado = estadoAnuncio(anuncio);
  const mensajeWa = `Hola, vi tu anuncio en Tu Chamba (Ref. ${anuncio.id.slice(0, 8)}) y me interesa.`;

  async function darDeBaja() {
    if (!confirm('¿Dar de baja este anuncio? Dejará de mostrarse en el portal.'))
      return;
    await api(`/anuncios/${anuncio!.id}/baja`, { method: 'POST' });
    router.push('/mis-anuncios');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-lg border border-gray-200 bg-white p-6">
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
        <h2 className="mb-1 text-sm font-semibold text-gray-700">
          Descripción del puesto
        </h2>
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

      {anuncio.latitud != null && anuncio.longitud != null && (
        <MapView lat={anuncio.latitud} lng={anuncio.longitud} />
      )}

      <div className="flex gap-2">
        <a
          href={waLink(anuncio.telefono, mensajeWa)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
          onClick={() => {
            // Avisa al dueño que alguien quiere chatear (best effort,
            // sin bloquear la apertura de WhatsApp).
            api('/notificaciones/chat-click', {
              method: 'POST',
              body: JSON.stringify({ anuncioId: anuncio.id }),
            }).catch(() => {});
          }}
        >
          <Button className="w-full">Chatear</Button>
        </a>
        <a href={`tel:${anuncio.telefono}`} className="flex-1">
          <Button variant="outline" className="w-full">
            Llamar: {anuncio.telefono}
          </Button>
        </a>
      </div>

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
            <Button
              onClick={async () => {
                await api(`/anuncios/${anuncio.id}/republicar`, {
                  method: 'POST',
                });
                router.refresh();
                location.reload();
              }}
            >
              Republicar ({anuncio.duracionDias} días)
            </Button>
          )}
        </div>
      )}

      <Reviews
        empleadorId={anuncio.createdById}
        empleadorNombre={anuncio.createdBy?.nombre ?? 'este empleador'}
      />

      {!esDueño && (
        <div className="border-t border-gray-100 pt-4">
          <ReportarAnuncio anuncioId={anuncio.id} />
        </div>
      )}
    </div>
  );
}
