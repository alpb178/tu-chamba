'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Anuncio, TipoJornada } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { Button, FormField, Input, Select } from '@/components/ui';

function Form() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get('id');
  const { user, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    descripcion: '',
    salario: '',
    telefono: '',
    tipoJornada: 'TIEMPO_COMPLETO' as TipoJornada,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editId) {
      api<Anuncio>(`/anuncios/${editId}`).then((a) =>
        setForm({
          descripcion: a.descripcion,
          salario: String(a.salario),
          telefono: a.telefono,
          tipoJornada: a.tipoJornada,
        }),
      );
    }
  }, [editId]);

  // Guard de rol: solo EMPLEADOR/ADMIN.
  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/login');
      else if (user.role === 'TRABAJADOR') router.push('/');
    }
  }, [authLoading, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        descripcion: form.descripcion,
        salario: Number(form.salario),
        telefono: form.telefono,
        tipoJornada: form.tipoJornada,
      };
      if (editId) {
        await api(`/anuncios/${editId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/anuncios', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      router.push('/mis-anuncios');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-lg border border-gray-200 bg-white p-6">
      <h1 className="mb-4 text-xl font-semibold text-gray-800">
        {editId ? 'Editar anuncio' : 'Publicar anuncio'}
      </h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Descripción">
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            rows={4}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Salario (Bs)">
          <Input
            type="number"
            min={1}
            value={form.salario}
            onChange={(e) => setForm({ ...form, salario: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Teléfono de contacto">
          <Input
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Tipo de jornada">
          <Select
            value={form.tipoJornada}
            onChange={(e) =>
              setForm({ ...form, tipoJornada: e.target.value as TipoJornada })
            }
          >
            <option value="DIARIA">Diaria</option>
            <option value="TIEMPO_COMPLETO">Tiempo completo</option>
            <option value="MEDIA_JORNADA">Media jornada</option>
          </Select>
        </FormField>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Publicar'}
        </Button>
      </form>
    </div>
  );
}

export default function NuevoAnuncioPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">Cargando...</p>}>
      <Form />
    </Suspense>
  );
}
