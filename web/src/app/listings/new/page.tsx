'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import {
  Ad,
  Category,
  CATEGORY_LABEL,
  Department,
  DEPARTMENT_LABEL,
  DURATION_DAYS,
  JobType,
} from '@/lib/types';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { Button, FormField, Input } from '@/components/ui';
import { CustomSelect } from '@/components/CustomSelect';
import { PhoneField } from '@/components/PhoneField';

// Leaflet usa window: solo en cliente.
const MapPicker = dynamic(
  () => import('@/components/MapPicker').then((m) => m.MapPicker),
  { ssr: false, loading: () => <div className="h-64 rounded-md bg-surface-container" /> },
);

function Form() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get('id');
  const { user } = useRequireAuth();

  const [form, setForm] = useState({
    description: '',
    requirements: '',
    location: '',
    department: '' as Department | '',
    category: '' as Category | '',
    schedule: '',
    salary: '',
    phone: '',
    jobType: 'TIEMPO_COMPLETO' as JobType,
    durationDays: 3,
  });
  // Pin del mapa (opcional). Se guarda junto al anuncio.
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loaded, setLoaded] = useState(!editId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Con el correo sin verificar no se puede publicar (admins exentos).
  const notVerified = !!user && !user.isAdmin && !user.emailVerified;

  // Al admin solo se le exigen descripción y teléfono (mismas reglas que su
  // panel); al resto, todos los campos salvo el horario.
  const isAdmin = !!user?.isAdmin;

  // Campos obligatorios aún sin completar: deshabilitan Publicar y se
  // listan en el tooltip del botón. Jornada y duración siempre tienen valor.
  const missingFields = (
    [
      [form.description, 'Descripción'],
      ...(isAdmin
        ? []
        : ([
            [form.requirements, 'Requisitos'],
            [form.department, 'Departamento'],
            [form.category, 'Categoría'],
            [form.location, 'Ubicación'],
            [form.salary, 'Salario'],
          ] as const)),
      [form.phone, 'Teléfono'],
    ] as const
  )
    .filter(([value]) => !value.trim())
    .map(([, label]) => label);

  useEffect(() => {
    if (editId) {
      api<Ad>(`/listings/${editId}`).then((a) => {
        setForm({
          description: a.description,
          requirements: a.requirements ?? '',
          location: a.location ?? '',
          department: a.department ?? '',
          category: a.category ?? '',
          schedule: a.schedule ?? '',
          salary: a.salary != null ? String(a.salary) : '',
          phone: a.phone,
          jobType: a.jobType,
          durationDays: a.durationDays ?? 3,
        });
        if (a.latitude != null && a.longitude != null) {
          setCoords({ lat: a.latitude, lng: a.longitude });
        }
        setLoaded(true);
      });
    }
  }, [editId]);

  // Al crear, el teléfono se precarga con el del perfil del usuario
  // (es el que usarán los botones Llamar y Chatear). Sigue siendo editable.
  useEffect(() => {
    if (!editId && user?.phone) {
      setForm((f) => (f.phone ? f : { ...f, phone: user.phone! }));
    }
  }, [editId, user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      // Los valores vacíos solo pueden llegar del admin: se omiten (salario
      // "a convenir") o toman los mismos defaults que su panel e importación.
      const payload = {
        description: form.description,
        requirements: form.requirements.trim() || undefined,
        location: form.location.trim() || undefined,
        department: form.department || 'SANTA_CRUZ',
        category: form.category || 'OTRO',
        latitude: coords?.lat,
        longitude: coords?.lng,
        schedule: form.schedule.trim() || undefined,
        salary: form.salary.trim() ? Number(form.salary) : undefined,
        phone: form.phone,
        jobType: form.jobType,
        durationDays: form.durationDays,
      };
      if (editId) {
        await api(`/listings/${editId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/listings', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      router.push('/my-listings');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
      <h1 className="mb-4 text-xl font-semibold text-on-surface">
        {editId ? 'Editar anuncio' : 'Publicar anuncio'}
      </h1>
      {notVerified && (
        <div className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Verifica tu correo para poder publicar. Revisa el enlace que te
          enviamos o reenvíalo desde el aviso superior.
        </div>
      )}
      <p className="mb-3 text-xs text-on-surface-variant">
        Los campos marcados con <span className="text-error">*</span> son
        obligatorios.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Descripción del puesto" required>
          <textarea
            className="w-full rounded-md border border-outline-variant px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Requisitos del candidato" required={!isAdmin}>
          <textarea
            className="w-full rounded-md border border-outline-variant px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            rows={3}
            placeholder="Experiencia, disponibilidad, documentación..."
            value={form.requirements}
            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
            required={!isAdmin}
          />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Departamento" required={!isAdmin}>
            <CustomSelect
              value={form.department}
              onChange={(v) =>
                setForm({ ...form, department: v as Department })
              }
              required={!isAdmin}
              placeholder="Selecciona…"
              options={Object.entries(DEPARTMENT_LABEL).map(
                ([value, label]) => ({ value, label }),
              )}
            />
          </FormField>
          <FormField label="Categoría / rubro" required={!isAdmin}>
            <CustomSelect
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v as Category })}
              required={!isAdmin}
              placeholder="Selecciona…"
              options={Object.entries(CATEGORY_LABEL).map(
                ([value, label]) => ({ value, label }),
              )}
            />
          </FormField>
        </div>
        <FormField label="Ubicación del puesto" required={!isAdmin}>
          <Input
            placeholder="Zona o dirección de referencia"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required={!isAdmin}
          />
        </FormField>
        <FormField label="Marca el lugar en el mapa (opcional)">
          {/* Se monta cuando ya se cargaron los datos en edición, para centrar el pin existente. */}
          {loaded && (
            <MapPicker
              lat={coords?.lat ?? null}
              lng={coords?.lng ?? null}
              onChange={(lat, lng) => setCoords({ lat, lng })}
              onPlace={(name) =>
                setForm((f) => (f.location ? f : { ...f, location: name }))
              }
            />
          )}
        </FormField>
        <FormField label="Horario de trabajo (opcional)">
          <Input
            placeholder="Ej. Lun-Vie 8:00 a 16:00"
            value={form.schedule}
            onChange={(e) => setForm({ ...form, schedule: e.target.value })}
          />
        </FormField>
        <FormField label="Salario (Bs)" required={!isAdmin}>
          <Input
            type="number"
            min={1}
            value={form.salary}
            onChange={(e) => setForm({ ...form, salary: e.target.value })}
            required={!isAdmin}
          />
        </FormField>
        <FormField label="Teléfono de contacto (WhatsApp)" required>
          <PhoneField
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
            required
          />
        </FormField>
        <FormField label="Tipo de jornada" required>
          <CustomSelect
            value={form.jobType}
            onChange={(v) => setForm({ ...form, jobType: v as JobType })}
            options={[
              { value: 'DIARIA', label: 'Diaria' },
              { value: 'TIEMPO_COMPLETO', label: 'Tiempo completo' },
              { value: 'MEDIA_JORNADA', label: 'Media jornada' },
            ]}
          />
        </FormField>
        <FormField label="Duración de la publicación" required>
          <CustomSelect
            value={String(form.durationDays)}
            onChange={(v) => setForm({ ...form, durationDays: Number(v) })}
            options={DURATION_DAYS.map((d) => ({
              value: String(d),
              label: `${d} días${d === 3 ? ' (por defecto)' : ''}`,
            }))}
          />
        </FormField>
        {error && <p className="text-sm text-error">{error}</p>}
        {/* El hover se captura en el contenedor: un botón disabled no emite
            eventos de puntero, así el tooltip funciona igual. */}
        <div className="group relative">
          <Button
            type="submit"
            className="w-full"
            disabled={saving || notVerified || missingFields.length > 0}
          >
            {saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Publicar'}
          </Button>
          {missingFields.length > 0 && (
            <div
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max max-w-xs -translate-x-1/2 rounded-md bg-inverse-surface px-3 py-2 text-xs text-inverse-on-surface shadow-lg group-hover:block"
            >
              Completa los campos obligatorios:{' '}
              {missingFields.join(', ')}.
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

export default function NewAdPage() {
  return (
    <Suspense fallback={<p className="text-on-surface-variant">Cargando...</p>}>
      <Form />
    </Suspense>
  );
}
