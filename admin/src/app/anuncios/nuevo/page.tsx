'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Category,
  CATEGORY_LABEL,
  Department,
  DEPARTMENT_LABEL,
  DURATION_DAYS,
  JobType,
  JOB_TYPE_LABEL,
} from '@/lib/types';
import { Button, FormField, Input } from '@/components/ui';
import { CustomSelect } from '@/components/CustomSelect';

const TEXTAREA_CLASS =
  'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary';

export default function NewAdPage() {
  const router = useRouter();
  // Solo descripción y teléfono son obligatorios para el admin; los selects
  // arrancan con los mismos valores por defecto que la importación por CSV.
  const [form, setForm] = useState({
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
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api('/listings', {
        method: 'POST',
        body: JSON.stringify({
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
        }),
      });
      router.push('/anuncios');
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-on-surface">Nuevo anuncio</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          El anuncio se publica a nombre de tu cuenta de administrador.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm"
      >
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
          <Button type="button" variant="outline" onClick={() => router.push('/anuncios')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Publicando...' : 'Publicar anuncio'}
          </Button>
        </div>
      </form>
    </div>
  );
}
