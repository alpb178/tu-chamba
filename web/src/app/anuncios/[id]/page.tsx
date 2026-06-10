'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Anuncio } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/ui';

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

  const puedeEditar =
    user && (user.role === 'ADMIN' || user.id === anuncio.createdById);

  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <Badge tipo={anuncio.tipoJornada} />
        <span className="text-xs text-gray-400">Ref. {anuncio.id.slice(0, 8)}</span>
      </div>

      <p className="whitespace-pre-line text-gray-800">{anuncio.descripcion}</p>

      <div className="space-y-1 border-t border-gray-100 pt-4">
        <p className="text-2xl font-bold text-brand">
          Bs {Number(anuncio.salario).toLocaleString('es-BO')}
        </p>
        <p className="text-sm text-gray-600">
          Publicado por: {anuncio.createdBy?.nombre ?? '—'}
        </p>
      </div>

      <a href={`tel:${anuncio.telefono}`}>
        <Button className="w-full">Llamar: {anuncio.telefono}</Button>
      </a>

      {puedeEditar && (
        <div className="flex gap-2 border-t border-gray-100 pt-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/anuncios/nuevo?id=${anuncio.id}`)}
          >
            Editar
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!confirm('¿Eliminar este anuncio?')) return;
              await api(`/anuncios/${anuncio.id}`, { method: 'DELETE' });
              router.push('/mis-anuncios');
            }}
          >
            Eliminar
          </Button>
        </div>
      )}
    </div>
  );
}
