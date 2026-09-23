'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { REPORT_REASON_LABEL, ReportReason } from '@/lib/types';
import { useLabels } from '@/i18n/use-labels';
import { Button, FormField } from './ui';
import { CustomSelect } from './CustomSelect';

// Spam/abuse report. The admin decides the listing's visibility.
export function ReportAd({ adId }: { adId: string }) {
  const t = useTranslations('report');
  const labels = useLabels();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('SPAM');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api('/reports', {
        method: 'POST',
        body: JSON.stringify({
          adId,
          reason,
          comment: comment.trim() || undefined,
        }),
      });
      setSent(true);
      setOpen(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-on-surface-variant">
        {t('sent')}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-outline underline hover:text-error"
      >
        {t('open')}
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border border-outline-variant p-3">
      <p className="text-sm font-medium text-on-surface-variant">{t('title')}</p>
      <FormField label={t('reason')}>
        <CustomSelect
          value={reason}
          onChange={(v) => setReason(v as ReportReason)}
          options={(Object.keys(REPORT_REASON_LABEL) as ReportReason[]).map(
            (value) => ({ value, label: labels.reportReason(value) }),
          )}
        />
      </FormField>
      <FormField label={t('comment')}>
        <textarea
          className="w-full border border-outline-variant px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </FormField>
      {error && <p className="text-sm text-error">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" variant="danger" disabled={saving}>
          {saving ? t('sending') : t('submit')}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
}
