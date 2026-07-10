'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Ad, adEffectiveStatus } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { AdCard } from '@/components/AdCard';
import { AdListSkeleton, Skeleton } from '@/components/Skeleton';
import { Button } from '@/components/ui';

export default function MyAdsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api<Ad[]>('/ads/mine')
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

  async function unpublish(a: Ad) {
    if (!confirm('¿Dar de baja este anuncio? Dejará de mostrarse en el portal.'))
      return;
    await api(`/ads/${a.id}/unpublish`, { method: 'POST' });
    load();
  }

  async function republish(a: Ad) {
    await api(`/ads/${a.id}/republish`, { method: 'POST' });
    load();
  }

  if (authLoading || loading)
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
        <AdListSkeleton count={3} />
      </div>
    );

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
            const status = adEffectiveStatus(a);
            return (
              <div key={a.id} className="space-y-2">
                <AdCard ad={a} showStatus />
                <div className="flex items-center justify-end gap-2">
                  {status === 'ACTIVO' ? (
                    <>
                      <span className="text-xs text-gray-400">
                        Vence: {new Date(a.expiresAt).toLocaleDateString('es-BO')}
                      </span>
                      <Button variant="danger" onClick={() => unpublish(a)}>
                        Dar de baja
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => republish(a)}>
                      Republicar ({a.durationDays} días)
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
