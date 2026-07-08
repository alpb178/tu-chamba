'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  AlertaEmpleo,
  Categoria,
  CATEGORIA_LABEL,
  Departamento,
  DEPARTAMENTO_LABEL,
} from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { Button, FormField, Select } from '@/components/ui';

export default function AlertasPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<AlertaEmpleo[]>([]);
  const [loading, setLoading] = useState(true);
  const [departamento, setDepartamento] = useState<Departamento | ''>('');
  const [categoria, setCategoria] = useState<Categoria | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    api<AlertaEmpleo[]>('/alertas')
      .then(setItems)
      .finally(() => setLoading(false));
  }

  // Solo TRABAJADOR gestiona alertas de empleo.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'TRABAJADOR') {
      router.push('/');
      return;
    }
    load();
  }, [authLoading, user, router]);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api('/alertas', {
        method: 'POST',
        body: JSON.stringify({
          departamento: departamento || undefined,
          categoria: categoria || undefined,
        }),
      });
      setDepartamento('');
      setCategoria('');
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function eliminar(id: string) {
    await api(`/alertas/${id}`, { method: 'DELETE' });
    load();
  }

  function describir(a: AlertaEmpleo) {
    const cat = a.categoria ? CATEGORIA_LABEL[a.categoria] : 'Cualquier categoría';
    const dep = a.departamento
      ? DEPARTAMENTO_LABEL[a.departamento]
      : 'todo el país';
    return `${cat} · ${dep}`;
  }

  if (authLoading || loading) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Alertas de empleo</h1>
        <p className="mt-1 text-sm text-gray-600">
          Te avisamos con una notificación cuando se publique una oferta que
          coincida con tus criterios.
        </p>
      </div>

      <form
        onSubmit={crear}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Departamento">
            <Select
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value as Departamento | '')}
            >
              <option value="">Todo el país</option>
              {Object.entries(DEPARTAMENTO_LABEL).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Categoría">
            <Select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as Categoria | '')}
            >
              <option value="">Todas las categorías</option>
              {Object.entries(CATEGORIA_LABEL).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={saving}>
          {saving ? 'Creando...' : 'Crear alerta'}
        </Button>
      </form>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700">Tus alertas</h2>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aún no tienes alertas. Crea una para recibir avisos de nuevas ofertas.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
            {items.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-800">{describir(a)}</span>
                <button
                  type="button"
                  onClick={() => eliminar(a.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
