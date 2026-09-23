'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useLabels } from '@/i18n/use-labels';
import { api } from '@/lib/api';
import { Interest } from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { AdCard } from '@/components/AdCard';
import { AdListSkeleton, Skeleton } from '@/components/Skeleton';
import { Button } from '@/components/ui';

// Listings the user showed interest in: every listing whose details they
// opened while logged in (and those they contacted via Chatear/Llamar).
export default function InterestsPage() {
  const t = useTranslations('account.interests');
  const labels = useLabels();
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
        {t('title')}
      </h1>
      {items.length === 0 ? (
        <p className="text-on-surface-variant">
          {t.rich('empty', {
            link: (chunks) => (
              <Link href="/" className="text-brand underline hover:text-brand-dark">
                {chunks}
              </Link>
            ),
          })}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {items.map((i) => (
            <div key={i.id} className="space-y-2">
              <AdCard ad={i.ad} showStatus />
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-outline">
                  {t('interestedOn', { date: labels.date(i.createdAt) })}
                </p>
                <Button variant="outline" onClick={() => remove(i.adId)}>
                  {t('remove')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
