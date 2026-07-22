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
import { Icon } from '@/components/Icon';
import { PhoneField } from '@/components/PhoneField';

// Leaflet usa window: solo en cliente.
const MapPicker = dynamic(
  () => import('@/components/MapPicker').then((m) => m.MapPicker),
  { ssr: false, loading: () => <div className="h-64 bg-surface-container" /> },
);

// Pasos del wizard: publicar de una sola página abrumaba (11 campos);
// en tres pantallas cortas se termina más rápido, sobre todo en móvil.
const STEPS = ['El puesto', 'Lugar y pago', 'Contacto'];

// Indicador de progreso: círculos numerados; los pasos ya visitados son
// clicables para volver.
function StepIndicator({
  step,
  onStep,
}: {
  step: number;
  onStep: (s: number) => void;
}) {
  return (
    <ol className="mb-5 flex items-center gap-1" aria-label="Progreso">
      {STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-1 last:flex-none">
          <button
            type="button"
            disabled={i >= step}
            onClick={() => onStep(i)}
            aria-current={i === step ? 'step' : undefined}
            className="flex items-center gap-2 disabled:cursor-default"
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i < step
                  ? 'bg-tertiary-container text-on-tertiary-container'
                  : i === step
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {i < step ? <Icon name="check" className="text-sm" /> : i + 1}
            </span>
            <span
              className={`hidden text-xs sm:block ${
                i === step
                  ? 'font-bold text-on-surface'
                  : 'text-on-surface-variant'
              }`}
            >
              {label}
            </span>
          </button>
          {i < STEPS.length - 1 && (
            <span
              aria-hidden
              className={`h-0.5 flex-1 rounded ${
                i < step ? 'bg-tertiary-container' : 'bg-surface-container-high'
              }`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}

function Form() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get('id');
  const { user } = useRequireAuth();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    title: '',
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

  // Campos obligatorios aún sin completar, POR PASO: deshabilitan el botón
  // del paso y se listan en un aviso visible (nada de tooltips por hover,
  // que en móvil no existen). Jornada y duración siempre tienen valor.
  const missing = (pairs: readonly (readonly [string, string])[]) =>
    pairs.filter(([value]) => !value.trim()).map(([, label]) => label);

  const missingByStep = [
    missing([
      [form.title, 'Título'],
      [form.description, 'Descripción'],
      ...(isAdmin
        ? []
        : ([
            [form.requirements, 'Requisitos'],
            [form.category, 'Categoría'],
          ] as const)),
    ] as const),
    missing(
      isAdmin
        ? []
        : ([
            [form.department, 'Departamento'],
            [form.location, 'Ubicación'],
            [form.salary, 'Salario'],
          ] as const),
    ),
    missing([[form.phone, 'Teléfono']] as const),
  ];
  const missingFields = missingByStep.flat();

  useEffect(() => {
    if (editId) {
      api<Ad>(`/listings/${editId}`).then((a) => {
        setForm({
          title: a.title,
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
        title: form.title.trim(),
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
    <div className="mx-auto max-w-xl border border-outline-variant bg-surface-container-lowest p-6">
      <h1 className="mb-4 text-xl font-semibold text-on-surface">
        {editId ? 'Editar oferta de trabajo' : 'Publicar oferta de trabajo'}
      </h1>
      {notVerified && (
        <div className="mb-4 bg-secondary-container px-3 py-2 text-sm text-on-secondary-container">
          Verifica tu correo para poder publicar. Revisa el enlace que te
          enviamos o reenvíalo desde el aviso superior.
        </div>
      )}
      <p className="mb-3 text-xs text-on-surface-variant">
        Los campos marcados con <span className="text-error">*</span> son
        obligatorios.
      </p>

      <StepIndicator step={step} onStep={setStep} />

      <form onSubmit={onSubmit} className="space-y-4">
        {/* ——— Paso 1: el puesto ——— */}
        {step === 0 && (
          <>
            <FormField label="Título del puesto" required>
              <Input
                placeholder="Ej. Vendedor de tienda"
                maxLength={120}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <span className="block text-right text-xs text-on-surface-variant">
                {form.title.length}/120
              </span>
            </FormField>
            <FormField label="Descripción del puesto" required>
              <textarea
                className="w-full border border-outline-variant px-3 py-2 text-base outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                rows={4}
                placeholder="Tareas, experiencia deseada, zona de trabajo…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
              <span className="block text-xs text-on-surface-variant">
                Los anuncios con descripción completa reciben más contactos.
              </span>
            </FormField>
            <FormField label="Requisitos del candidato" required={!isAdmin}>
              <textarea
                className="w-full border border-outline-variant px-3 py-2 text-base outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                rows={3}
                placeholder="Experiencia, disponibilidad, documentación..."
                value={form.requirements}
                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                required={!isAdmin}
              />
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </div>
          </>
        )}

        {/* ——— Paso 2: lugar y pago ——— */}
        {step === 1 && (
          <>
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
            <FormField label="Ubicación del puesto" required={!isAdmin}>
              <Input
                placeholder="Zona o dirección de referencia"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required={!isAdmin}
              />
            </FormField>
            <FormField label="Marca el lugar en el mapa (opcional)">
              {/* Se monta cuando ya se cargaron los datos en edición, para
                  centrar el pin existente. */}
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Salario (Bs)" required={!isAdmin}>
                <Input
                  type="number"
                  min={1}
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  required={!isAdmin}
                />
              </FormField>
              <FormField label="Horario de trabajo (opcional)">
                <Input
                  placeholder="Ej. Lun-Vie 8:00 a 16:00"
                  value={form.schedule}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                />
              </FormField>
            </div>
          </>
        )}

        {/* ——— Paso 3: contacto y publicación ——— */}
        {step === 2 && (
          <>
            <FormField label="Teléfono de contacto (WhatsApp)" required>
              <PhoneField
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                required
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
            <p className="bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
              Los interesados te contactarán por WhatsApp o llamada a este
              número. El teléfono solo se muestra a usuarios con sesión.
            </p>
          </>
        )}

        {error && <p className="text-sm text-error">{error}</p>}

        {/* Aviso SIEMPRE visible (no tooltip): en móvil no hay hover. */}
        {missingByStep[step].length > 0 && (
          <p className="bg-secondary-container px-3 py-2 text-xs text-on-secondary-container">
            Te falta completar: {missingByStep[step].join(', ')}.
          </p>
        )}

        <div className="flex gap-2">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
            >
              Atrás
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              className="flex-1"
              disabled={missingByStep[step].length > 0}
              onClick={() => setStep((s) => s + 1)}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              type="submit"
              className="flex-1"
              disabled={saving || notVerified || missingFields.length > 0}
            >
              {saving
                ? 'Guardando...'
                : editId
                  ? 'Guardar cambios'
                  : 'Publicar'}
            </Button>
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
