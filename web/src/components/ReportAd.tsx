'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { REPORT_REASON_LABEL, ReportReason } from '@/lib/types';
import { Button, FormField } from './ui';
import { CustomSelect } from './CustomSelect';

// Reporte de spam/abuso. La visibilidad del anuncio la decide el admin.
export function ReportAd({ adId }: { adId: string }) {
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
        Gracias, tu reporte fue enviado y será revisado por un administrador.
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
        Reportar este anuncio
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border border-outline-variant p-3">
      <p className="text-sm font-medium text-on-surface-variant">Reportar anuncio</p>
      <FormField label="Motivo">
        <CustomSelect
          value={reason}
          onChange={(v) => setReason(v as ReportReason)}
          options={Object.entries(REPORT_REASON_LABEL).map(
            ([value, label]) => ({ value, label }),
          )}
        />
      </FormField>
      <FormField label="Comentario (opcional)">
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
          {saving ? 'Enviando...' : 'Enviar reporte'}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
