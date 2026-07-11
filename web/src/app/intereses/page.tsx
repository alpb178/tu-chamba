'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Interest } from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { AdCard } from '@/components/AdCard';
import { AdListSkeleton, Skeleton } from '@/components/Skeleton';
import { Button } from '@/components/ui';

// Anuncios en los que el usuario mostró interés (registrado al contactar
// por Chatear o Llamar desde el detalle del anuncio).
export default function InterestsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [items, setItems] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api<Interest[]>('/interests/mine')
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!authLoading && user) load();
  }, [authLoading, user]);

  async function remove(adId: string) {
    await api(`/interests/${adId}`, { method: 'DELETE' });
    setItems((list) => list.filter((i) => i.adId !== adId));
  }

  if (authLoading || loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-56" />
        <AdListSkeleton count={3} />
      </div>
    );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-on-surface">
        Anuncios de tu interés
      </h1>
      {items.length === 0 ? (
        <p className="text-on-surface-variant">
          Aún no tienes anuncios de interés. Cuando contactes a un publicante
          desde un anuncio (Chatear o Llamar), aparecerá aquí.{' '}
          <Link href="/" className="text-brand underline hover:text-brand-dark">
            Explora las ofertas
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {items.map((i) => (
            <div key={i.id} className="space-y-2">
              <AdCard ad={i.ad} showStatus />
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-outline">
                  Te interesaste el{' '}
                  {new Date(i.createdAt).toLocaleDateString('es-BO')}
                </p>
                <Button variant="outline" onClick={() => remove(i.adId)}>
                  Quitar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
