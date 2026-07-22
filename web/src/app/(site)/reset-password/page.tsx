'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button, FormField } from '@/components/ui';
import { PasswordInput } from '@/components/PasswordInput';

// Define la contraseña nueva con el token del enlace del correo.
function ResetForm() {
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-on-surface-variant">
        Falta el token de restablecimiento. Abre el enlace desde el correo que
        te enviamos, o{' '}
        <Link href="/forgot-password" className="text-brand hover:underline">
          pide uno nuevo
        </Link>
        .
      </p>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-on-surface-variant">
          Tu contraseña se cambió correctamente. Ya puedes ingresar con ella.
        </p>
        <Link href="/login" className="block">
          <Button className="w-full">Ingresar</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField label="Nueva contraseña (mín. 6)">
        <PasswordInput
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </FormField>
      <FormField label="Confirmar nueva contraseña">
        <PasswordInput
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={6}
          required
        />
      </FormField>
      {error && <p className="text-sm text-error">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Guardando...' : 'Cambiar contraseña'}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md border border-outline-variant bg-surface-container-lowest p-6">
      <h1 className="mb-4 text-xl font-semibold text-on-surface">
        Restablecer contraseña
      </h1>
      <Suspense fallback={<p className="text-on-surface-variant">Cargando...</p>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
