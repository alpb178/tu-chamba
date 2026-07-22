'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Ad,
  Category,
  CATEGORY_LABEL,
  Department,
  DEPARTMENT_LABEL,
  DURATION_DAYS,
  JobType,
  JOB_TYPE_LABEL,
} from '@/lib/admin/types';
import { Button, FormField, Input, Skeleton } from '@/components/admin/ui';
import { CustomSelect } from '@/components/admin/CustomSelect';

const TEXTAREA_CLASS =
  'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary';

function AdForm() {
  const router = useRouter();
  // Con ?id= el formulario pasa a modo edición (mismo patrón que el portal).
  const editId = useSearchParams().get('id');
  // Solo título, descripción y teléfono son obligatorios para el admin; los
  // selects arrancan con los mismos valores por defecto que la importación CSV.
  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    department: 'SANTA_CRUZ' as Department,
    category: 'OTRO' as Category,
    schedule: '',
    salary: '',
    phone: '',
    jobType: 'TIEMPO_COMPLETO' as JobType,
    durationDays: 3,
  });
  const [loaded, setLoaded] = useState(!editId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editId) return;
    api<Ad>(`/listings/${editId}`)
      .then((a) => {
        setForm({
          title: a.title,
          description: a.description,
          requirements: a.requirements ?? '',
          location: a.location ?? '',
          department: a.department ?? 'SANTA_CRUZ',
          category: a.category ?? 'OTRO',
          schedule: a.schedule ?? '',
          salary: a.salary != null ? String(a.salary) : '',
          phone: a.phone,
          jobType: a.jobType,
          durationDays: a.durationDays ?? 3,
        });
        setLoaded(true);
      })
      .catch((e) => setError((e as Error).message));
  }, [editId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description,
        requirements: form.requirements.trim() || undefined,
        location: form.location.trim() || undefined,
        department: form.department,
        category: form.category,
        schedule: form.schedule.trim() || undefined,
        // Sin salario el anuncio queda "a convenir".
        salary: form.salary.trim() ? Number(form.salary) : undefined,
        phone: form.phone,
        jobType: form.jobType,
        durationDays: form.durationDays,
      };
      await api(editId ? `/listings/${editId}` : '/admin/listings', {
        method: editId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      router.push('/admin/listings');
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">
          {editId ? 'Editar anuncio' : 'Nuevo anuncio'}
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          {editId
            ? 'Los cambios se publican de inmediato.'
            : 'El anuncio se publica a nombre de tu cuenta de administrador.'}
        </p>
      </div>

      {!loaded ? (
        error ? (
          <p className="text-sm text-error">{error}</p>
        ) : (
          <div
            aria-hidden="true"
            className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm"
          >
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )
      ) : (
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm"
      >
        <FormField label="Título del puesto">
          <Input
            placeholder="Ej. Vendedor de tienda"
            maxLength={120}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Descripción del puesto">
          <textarea
            className={TEXTAREA_CLASS}
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Requisitos del candidato (opcional)">
          <textarea
            className={TEXTAREA_CLASS}
            rows={3}
            placeholder="Experiencia, disponibilidad, documentación..."
            value={form.requirements}
            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
          />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Departamento">
            <CustomSelect
              value={form.department}
              onChange={(v) => setForm({ ...form, department: v as Department })}
              options={Object.entries(DEPARTMENT_LABEL).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </FormField>
          <FormField label="Categoría / rubro">
            <CustomSelect
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v as Category })}
              options={Object.entries(CATEGORY_LABEL).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </FormField>
        </div>
        <FormField label="Ubicación del puesto (opcional)">
          <Input
            placeholder="Zona o dirección de referencia"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </FormField>
        <FormField label="Horario de trabajo (opcional)">
          <Input
            placeholder="Ej. Lun-Vie 8:00 a 16:00"
            value={form.schedule}
            onChange={(e) => setForm({ ...form, schedule: e.target.value })}
          />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Salario (Bs, opcional)">
            <Input
              type="number"
              min={1}
              placeholder="Vacío = a convenir"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
            />
          </FormField>
          <FormField label="Teléfono de contacto (WhatsApp)">
            <Input
              type="tel"
              placeholder="71111111"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </FormField>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Tipo de jornada">
            <CustomSelect
              value={form.jobType}
              onChange={(v) => setForm({ ...form, jobType: v as JobType })}
              options={Object.entries(JOB_TYPE_LABEL).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </FormField>
          <FormField label="Duración de la publicación">
            <CustomSelect
              value={String(form.durationDays)}
              onChange={(v) => setForm({ ...form, durationDays: Number(v) })}
              options={DURATION_DAYS.map((d) => ({
                value: String(d),
                label: `${d} días${d === 3 ? ' (por defecto)' : ''}`,
              }))}
            />
          </FormField>
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/listings')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving
              ? 'Guardando...'
              : editId
                ? 'Guardar cambios'
                : 'Publicar anuncio'}
          </Button>
        </div>
      </form>
      )}
    </div>
  );
}

// useSearchParams exige un límite de Suspense al prerenderizar la página.
export default function NewAdPage() {
  return (
    <Suspense>
      <AdForm />
    </Suspense>
  );
}
