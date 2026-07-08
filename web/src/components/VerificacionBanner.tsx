'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

// Aviso persistente para usuarios con sesión y correo sin verificar.
export function VerificacionBanner() {
  const { user, loading } = useAuth();
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !user || user.emailVerified) return null;

  async function reenviar() {
    setEnviando(true);
    setError(null);
    try {
      await api('/auth/resend-verification', { method: 'POST' });
      setEnviado(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-2 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Verifica tu correo <strong>{user.email}</strong> para activar tu
          cuenta{user.role === 'EMPLEADOR' ? ' y poder publicar' : ''}.
        </span>
        {enviado ? (
          <span className="font-medium text-amber-800">
            Te reenviamos el enlace. Revisa tu correo.
          </span>
        ) : (
          <button
            type="button"
            onClick={reenviar}
            disabled={enviando}
            className="shrink-0 font-medium underline hover:text-amber-700 disabled:opacity-50"
          >
            {enviando ? 'Enviando...' : 'Reenviar enlace'}
          </button>
        )}
      </div>
      {error && <p className="px-4 pb-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
