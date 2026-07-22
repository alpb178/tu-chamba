'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

// Aviso persistente para usuarios con sesión y correo sin verificar.
export function VerificationBanner() {
  const { user, loading } = useAuth();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !user || user.emailVerified) return null;

  async function resend() {
    setSending(true);
    setError(null);
    try {
      await api('/auth/resend-verification', { method: 'POST' });
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-b border-outline-variant bg-secondary-container">
      <div className="mx-auto flex max-w-7xl 2xl:max-w-screen-2xl flex-col gap-1 px-4 py-2 text-sm sm:px-6 lg:px-12 text-on-secondary-container sm:flex-row sm:items-center sm:justify-between">
        <span>
          Verifica tu correo <strong>{user.email}</strong> para activar tu
          cuenta y poder publicar.
        </span>
        {sent ? (
          <span className="font-medium text-on-secondary-container">
            Te reenviamos el enlace. Revisa tu correo.
          </span>
        ) : (
          <button
            type="button"
            onClick={resend}
            disabled={sending}
            className="shrink-0 font-medium underline hover:opacity-80 disabled:opacity-50"
          >
            {sending ? 'Enviando...' : 'Reenviar enlace'}
          </button>
        )}
      </div>
      {error && <p className="px-4 pb-2 text-xs text-error">{error}</p>}
    </div>
  );
}
