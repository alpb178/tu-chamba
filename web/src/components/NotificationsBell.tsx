'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useLabels } from '@/i18n/use-labels';
import { api } from '@/lib/api';
import { AppNotification, NotificationsResponse, NotificationType } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { Icon } from './Icon';

const POLL_MS = 30_000;

const ICON: Record<NotificationType, string> = {
  CHAT_INICIADO: '💬',
  NUEVA_REVIEW: '⭐',
  ANUNCIO_VENCIDO: '⏰',
  NUEVO_ANUNCIO: '📢',
};

function timeAgo(
  date: string,
  t: ReturnType<typeof useTranslations<'notifications.timeAgo'>>,
  formatDate: (iso: string) => string,
) {
  const min = Math.floor((Date.now() - new Date(date).getTime()) / 60_000);
  if (min < 1) return t('now');
  if (min < 60) return t('minutes', { count: min });
  const h = Math.floor(min / 60);
  if (h < 24) return t('hours', { count: h });
  return formatDate(date);
}

// In-app notifications bell (authenticated users only).
// Refreshes by polling; on click the notification is marked as read and, if
// it references an ad, navigates to its detail.
export function NotificationsBell() {
  const t = useTranslations('notifications.bell');
  const tAgo = useTranslations('notifications.timeAgo');
  const labels = useLabels();
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    api<NotificationsResponse>('/notifications')
      .then(setData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [user, load]);

  // Close the panel when clicking outside.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!user) return null;

  async function openNotification(n: AppNotification) {
    setOpen(false);
    if (!n.read) {
      // Optimistic: we don't block navigation on marking it read.
      api(`/notifications/${n.id}/read`, { method: 'PATCH' })
        .then(load)
        .catch(() => {});
    }
    if (n.adId) router.push(`/listings/${n.adId}`);
  }

  async function markAllRead() {
    await api('/notifications/read-all', { method: 'POST' }).catch(() => {});
    load();
  }

  const unread = data?.unread ?? 0;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 transition-colors hover:bg-surface-container-high"
        aria-label={t('ariaLabel', { unread })}
      >
        <Icon name="notifications" className="text-on-surface-variant" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-error" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-tile border border-outline-variant bg-surface-container-lowest shadow-derek">
          <div className="flex items-center justify-between border-b border-outline-variant/60 px-3 py-2">
            <span className="text-sm font-semibold text-on-surface-variant">
              {t('title')}
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-brand underline hover:text-brand-dark"
              >
                {t('markAllRead')}
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {!data || data.items.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-on-surface-variant">
                {t('empty')}
              </li>
            ) : (
              data.items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openNotification(n)}
                    className={`flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-surface-container-low ${
                      n.read ? 'opacity-60' : 'bg-brand-light/30'
                    }`}
                  >
                    <span className="mt-0.5">{ICON[n.type]}</span>
                    <span className="flex-1">
                      <span className="block text-sm text-on-surface">
                        {n.message}
                      </span>
                      <span className="text-xs text-outline">
                        {timeAgo(n.createdAt, tAgo, labels.date)}
                        {n.adId ? ` · ${t('viewDetails')}` : ''}
                      </span>
                    </span>
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
