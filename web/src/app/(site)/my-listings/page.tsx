'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Ad, adEffectiveStatus } from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { AdCard } from '@/components/AdCard';
import { AdListSkeleton, Skeleton } from '@/components/Skeleton';
import { Button, IconButton } from '@/components/ui';
import { Icon } from '@/components/Icon';

export default function MyAdsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [items, setItems] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api<Ad[]>('/listings/mine')
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!authLoading && user) load();
  }, [authLoading, user]);

  async function unpublish(a: Ad) {
    if (!confirm('¿Dar de baja este anuncio? Dejará de mostrarse en el portal.'))
      return;
    await api(`/listings/${a.id}/unpublish`, { method: 'POST' });
    load();
  }

  async function republish(a: Ad) {
    await api(`/listings/${a.id}/republish`, { method: 'POST' });
    load();
  }

  async function remove(a: Ad) {
    if (
      !confirm(
        '¿Eliminar este anuncio definitivamente? Esta acción no se puede deshacer.',
      )
    )
      return;
    await api(`/listings/${a.id}`, { method: 'DELETE' });
    load();
  }

  if (authLoading || loading)
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-36" />
        </div>
        <AdListSkeleton count={3} />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-on-surface">Mis anuncios</h1>
        <Link href="/listings/new">
          <Button variant="accent">Publicar oferta de trabajo</Button>
        </Link>
      </div>
      {items.length === 0 ? (
        // Estado vacío con camino claro: publicar el primer anuncio.
        <div className="flex flex-col items-center gap-3 border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-14 text-center">
          <Icon name="publish" className="text-4xl text-outline" />
          <p className="text-base text-on-surface">
            Aún no has publicado anuncios.
          </p>
          <p className="text-sm text-on-surface-variant">
            Publica tu primera oferta: es gratis y los interesados te
            escriben directo por WhatsApp.
          </p>
          <Link href="/listings/new" className="mt-1">
            <Button variant="accent">Publicar mi primera oferta de trabajo</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {items.map((a) => {
            const status = adEffectiveStatus(a);
            return (
              <div key={a.id} className="space-y-2">
                <AdCard ad={a} showStatus />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Actividad: cuántas personas accedieron y se interesaron. */}
                  <p className="text-xs text-on-surface-variant">
                    {a._count?.visits ?? 0}{' '}
                    {(a._count?.visits ?? 0) === 1 ? 'acceso' : 'accesos'} ·{' '}
                    {a._count?.interests ?? 0}{' '}
                    {(a._count?.interests ?? 0) === 1
                      ? 'interesado'
                      : 'interesados'}
                  </p>
                  <div className="flex items-center gap-2">
                    {status === 'ACTIVO' ? (
                      <>
                        <span className="text-xs text-outline">
                          Vence:{' '}
                          {new Date(a.expiresAt).toLocaleDateString('es-BO')}
                        </span>
                        <IconButton
                          icon="visibility_off"
                          label="Dar de baja"
                          onClick={() => unpublish(a)}
                        />
                      </>
                    ) : (
                      <>
                        <IconButton
                          icon="publish"
                          label={`Republicar (${a.durationDays} días)`}
                          variant="primary"
                          onClick={() => republish(a)}
                        />
                        <IconButton
                          icon="delete"
                          label="Eliminar"
                          variant="danger"
                          onClick={() => remove(a)}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
