'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button, FormField, Input, Select } from '@/components/ui';

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form);
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
        <FormField label="Teléfono">
          <Input
            value={form.telefono}
            onChange={(e) => set('telefono', e.target.value)}
            required
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creando...' : 'Crear cuenta'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-brand hover:underline">
          Ingresa
        </Link>
      </p>
    </div>
  );
}
