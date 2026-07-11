'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { safeNext } from '@/lib/types';
import { Button, FormField, Input, Select } from '@/components/ui';
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
    role: 'TRABAJADOR' as 'TRABAJADOR' | 'EMPLEADOR',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isEmployer = form.role === 'EMPLEADOR';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        // El teléfono solo es obligatorio para empleadores.
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
    <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-6">
      <h1 className="mb-4 text-xl font-semibold text-gray-800">Crear cuenta</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Quiero registrarme como">
          <Select
            value={form.role}
            onChange={(e) =>
              set('role', e.target.value as 'TRABAJADOR' | 'EMPLEADOR')
            }
          >
            <option value="TRABAJADOR">Trabajador (busco empleo)</option>
            <option value="EMPLEADOR">Empleador (publico empleos)</option>
          </Select>
        </FormField>
        <FormField label="Nombre">
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
        </FormField>
        <FormField label="Correo">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            required
          />
        </FormField>
        <FormField
          label={
            isEmployer
              ? 'Teléfono (WhatsApp, lo verán los candidatos)'
              : 'Teléfono (opcional)'
          }
        >
          <Input
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            required={isEmployer}
          />
        </FormField>
        <FormField label="Contraseña (mín. 6)">
          <Input
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            minLength={6}
            required
          />
        </FormField>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creando...' : 'Crear cuenta'}
        </Button>
      </form>

      <div className="mt-4">
        <GoogleSignIn next={next} />
      </div>

      <p className="mt-4 text-center text-sm text-gray-600">
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
    <Suspense fallback={<p className="text-gray-500">Cargando...</p>}>
      <RegisterForm />
    </Suspense>
  );
}
