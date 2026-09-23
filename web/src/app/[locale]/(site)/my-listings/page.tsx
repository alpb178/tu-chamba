'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useLabels } from '@/i18n/use-labels';
import { api } from '@/lib/api';
import { Ad, adEffectiveStatus } from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { AdCard } from '@/components/AdCard';
import { AdListSkeleton, Skeleton } from '@/components/Skeleton';
import { Button, IconButton } from '@/components/ui';
import { Icon } from '@/components/Icon';

export default function MyAdsPage() {
  const t = useTranslations('account.myListings');
  const labels = useLabels();
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
    if (!confirm(t('confirmUnpublish'))) return;
    await api(`/listings/${a.id}/unpublish`, { method: 'POST' });
    load();
  }

  async function republish(a: Ad) {
    await api(`/listings/${a.id}/republish`, { method: 'POST' });
    load();
  }

  async function remove(a: Ad) {
    if (!confirm(t('confirmDelete'))) return;
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
        <h1 className="text-xl font-semibold text-on-surface">{t('title')}</h1>
        <Link href="/listings/new">
          <Button variant="accent">{t('postJob')}</Button>
        </Link>
      </div>
      {items.length === 0 ? (
        // Empty state with a clear path: publish the first listing.
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-14 text-center">
          <Icon name="publish" className="text-4xl text-outline" />
          <p className="text-base text-on-surface">
            {t('emptyTitle')}
          </p>
          <p className="text-sm text-on-surface-variant">
            {t('emptyText')}
          </p>
          <Link href="/listings/new" className="mt-1">
            <Button variant="accent">{t('postFirstJob')}</Button>
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
                  {/* Activity: how many people viewed it and showed interest. */}
                  <p className="text-xs text-on-surface-variant">
                    {t('visits', { count: a._count?.visits ?? 0 })} ·{' '}
                    {t('interested', { count: a._count?.interests ?? 0 })}
                  </p>
                  <div className="flex items-center gap-2">
                    {status === 'ACTIVO' ? (
                      <>
                        <span className="text-xs text-outline">
                          {t('expires', { date: labels.date(a.expiresAt) })}
                        </span>
                        <IconButton
                          icon="visibility_off"
                          label={t('unpublish')}
                          onClick={() => unpublish(a)}
                        />
                      </>
                    ) : (
                      <>
                        <IconButton
                          icon="publish"
                          label={t('republish', { days: a.durationDays })}
                          variant="primary"
                          onClick={() => republish(a)}
                        />
                        <IconButton
                          icon="delete"
                          label={t('delete')}
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
