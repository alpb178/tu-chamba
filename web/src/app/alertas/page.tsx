'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  JobAlert,
  Category,
  CATEGORY_LABEL,
  Department,
  DEPARTMENT_LABEL,
} from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { Button, FormField } from '@/components/ui';
import { CustomSelect } from '@/components/CustomSelect';
import { Skeleton } from '@/components/Skeleton';

export default function JobAlertsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [items, setItems] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState<Department | ''>('');
  const [category, setCategory] = useState<Category | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    api<JobAlert[]>('/alerts')
      .then(setItems)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!authLoading && user) load();
  }, [authLoading, user]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api('/alerts', {
        method: 'POST',
        body: JSON.stringify({
          department: department || undefined,
          category: category || undefined,
        }),
      });
      setDepartment('');
      setCategory('');
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await api(`/alerts/${id}`, { method: 'DELETE' });
    load();
  }

  function describe(a: JobAlert) {
    const cat = a.category ? CATEGORY_LABEL[a.category] : 'Cualquier categoría';
    const dep = a.department
      ? DEPARTMENT_LABEL[a.department]
      : 'todo el país';
    return `${cat} · ${dep}`;
  }

  if (authLoading || loading)
    return (
      <div className="mx-auto max-w-xl space-y-6" aria-hidden="true">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-40 w-full rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-on-surface">Alertas de empleo</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Te avisamos con una notificación cuando se publique una oferta que
          coincida con tus criterios.
        </p>
      </div>

      <form
        onSubmit={create}
        className="space-y-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Departamento">
            <CustomSelect
              value={department}
              onChange={(v) => setDepartment(v as Department | '')}
              options={[
                { value: '', label: 'Todo el país' },
                ...Object.entries(DEPARTMENT_LABEL).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
          </FormField>
          <FormField label="Categoría">
            <CustomSelect
              value={category}
              onChange={(v) => setCategory(v as Category | '')}
              options={[
                { value: '', label: 'Todas las categorías' },
                ...Object.entries(CATEGORY_LABEL).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
          </FormField>
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <Button type="submit" disabled={saving}>
          {saving ? 'Creando...' : 'Crear alerta'}
        </Button>
      </form>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-on-surface-variant">Tus alertas</h2>
        {items.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            Aún no tienes alertas. Crea una para recibir avisos de nuevas ofertas.
          </p>
        ) : (
          <ul className="divide-y divide-outline-variant/60 rounded-lg border border-outline-variant bg-surface-container-lowest">
            {items.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-on-surface">{describe(a)}</span>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  className="text-sm text-error hover:underline"
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
