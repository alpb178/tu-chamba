'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { MOTIVO_REPORTE_LABEL, MotivoReporte } from '@/lib/types';
import { Button, FormField, Select } from './ui';

// Reporte de spam/abuso. La visibilidad del anuncio la decide el admin.
export function ReportarAnuncio({ anuncioId }: { anuncioId: string }) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState<MotivoReporte>('SPAM');
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api('/reportes', {
        method: 'POST',
        body: JSON.stringify({
          anuncioId,
          motivo,
          comentario: comentario.trim() || undefined,
        }),
      });
      setEnviado(true);
      setOpen(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (enviado) {
    return (
      <p className="text-sm text-gray-500">
        Gracias, tu reporte fue enviado y será revisado por un administrador.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-gray-400 underline hover:text-red-600"
      >
        Reportar este anuncio
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-md border border-gray-200 p-3">
      <p className="text-sm font-medium text-gray-700">Reportar anuncio</p>
      <FormField label="Motivo">
        <Select
          value={motivo}
          onChange={(e) => setMotivo(e.target.value as MotivoReporte)}
        >
          {Object.entries(MOTIVO_REPORTE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Comentario (opcional)">
        <textarea
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          rows={2}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />
      </FormField>
      {error && <p className="text-sm text-red-600">{error}</p>}
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
