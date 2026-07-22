'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { safeNext } from '@/lib/types';
import { Button, FormField, Input } from '@/components/ui';
import { PasswordInput } from '@/components/PasswordInput';
import { PhoneField } from '@/components/PhoneField';
import { GoogleSignIn } from '@/components/GoogleSignIn';

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone.trim() || undefined,
      });
      router.push(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md border border-outline-variant bg-surface-container-lowest p-6">
      <h1 className="mb-4 text-xl font-semibold text-on-surface">Crear cuenta</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Nombre">
          <Input
            autoComplete="name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
        </FormField>
        <FormField label="Correo">
          <Input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            required
          />
        </FormField>
        <FormField label="Contraseña (mín. 6)">
          <PasswordInput
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            minLength={6}
            required
          />
        </FormField>
        <FormField label="Confirmar contraseña">
          <PasswordInput
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => set('confirm', e.target.value)}
            minLength={6}
            required
          />
        </FormField>
        <FormField label="Teléfono (opcional)">
          <PhoneField value={form.phone} onChange={(v) => set('phone', v)} />
        </FormField>
        {error && <p className="text-sm text-error">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creando...' : 'Crear cuenta'}
        </Button>
      </form>

      <div className="mt-4">
        <GoogleSignIn next={next} />
      </div>

      <p className="mt-4 text-center text-sm text-on-surface-variant">
        ¿Ya tienes cuenta?{' '}
        <Link
          href={next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`}
          className="text-brand hover:underline"
        >
          Ingresa
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="text-on-surface-variant">Cargando...</p>}>
      <RegisterForm />
    </Suspense>
  );
}
