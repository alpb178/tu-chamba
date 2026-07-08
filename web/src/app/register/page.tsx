'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button, FormField, Input, Select } from '@/components/ui';
import { GoogleSignIn } from '@/components/GoogleSignIn';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    role: 'TRABAJADOR' as 'TRABAJADOR' | 'EMPLEADOR',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const esEmpleador = form.role === 'EMPLEADOR';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        role: form.role,
        // El teléfono solo es obligatorio para empleadores.
        telefono: form.telefono.trim() || undefined,
      });
      router.push('/');
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
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
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
            esEmpleador
              ? 'Teléfono (WhatsApp, lo verán los candidatos)'
              : 'Teléfono (opcional)'
          }
        >
          <Input
            value={form.telefono}
            onChange={(e) => set('telefono', e.target.value)}
            required={esEmpleador}
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
        <GoogleSignIn />
      </div>

      <p className="mt-4 text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-brand hover:underline">
          Ingresa
        </Link>
      </p>
    </div>
  );
}
