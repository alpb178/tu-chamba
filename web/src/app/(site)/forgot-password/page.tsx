'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button, FormField, Input } from '@/components/ui';

// Pide el enlace de restablecimiento. La API siempre responde "enviado"
// (no revela qué correos existen).
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
      <h1 className="mb-2 text-xl font-semibold text-on-surface">
        Recuperar contraseña
      </h1>
      {sent ? (
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            Si <strong className="text-on-surface">{email}</strong> está
            registrado, te enviamos un enlace para restablecer tu contraseña.
            Revisa tu bandeja (y el spam). El enlace vence en 1 hora.
          </p>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">
              Volver a ingresar
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-on-surface-variant">
            Escribe el correo de tu cuenta y te enviaremos un enlace para
            crear una contraseña nueva.
          </p>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField label="Correo">
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormField>
            {error && <p className="text-sm text-error">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-on-surface-variant">
            <Link href="/login" className="text-brand hover:underline">
              Volver a ingresar
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
