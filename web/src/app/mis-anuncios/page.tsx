'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Anuncio, estadoAnuncio } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { AnuncioCard } from '@/components/AnuncioCard';
import { Button } from '@/components/ui';

export default function MisAnunciosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api<Anuncio[]>('/anuncios/mis-anuncios')
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    load();
  }, [authLoading, user, router]);

  async function darDeBaja(a: Anuncio) {
    if (!confirm('¿Dar de baja este anuncio? Dejará de mostrarse en el portal.'))
      return;
    await api(`/anuncios/${a.id}/baja`, { method: 'POST' });
    load();
  }

  async function republicar(a: Anuncio) {
    await api(`/anuncios/${a.id}/republicar`, { method: 'POST' });
    load();
  }

  if (authLoading || loading)
    return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Mis anuncios</h1>
        <Link href="/anuncios/nuevo">
          <Button>Publicar anuncio</Button>
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-gray-500">Aún no has publicado anuncios.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {items.map((a) => {
            const estado = estadoAnuncio(a);
            return (
              <div key={a.id} className="space-y-2">
                <AnuncioCard anuncio={a} mostrarEstado />
                <div className="flex items-center justify-end gap-2">
                  {estado === 'ACTIVO' ? (
                    <>
                      <span className="text-xs text-gray-400">
                        Vence: {new Date(a.expiraEn).toLocaleDateString('es-BO')}
                      </span>
                      <Button variant="danger" onClick={() => darDeBaja(a)}>
                        Dar de baja
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => republicar(a)}>
                      Republicar ({a.duracionDias} días)
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
