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
import { Button, FormField, Input, Select } from '@/components/ui';

// Leaflet usa window: solo en cliente.
const MapPicker = dynamic(
  () => import('@/components/MapPicker').then((m) => m.MapPicker),
  { ssr: false, loading: () => <div className="h-64 rounded-md bg-gray-100" /> },
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

  useEffect(() => {
    if (editId) {
      api<Ad>(`/ads/${editId}`).then((a) => {
        setForm({
          description: a.description,
          requirements: a.requirements ?? '',
          location: a.location ?? '',
          department: a.department ?? '',
          category: a.category ?? '',
          schedule: a.schedule ?? '',
          salary: String(a.salary),
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
      const payload = {
        description: form.description,
        requirements: form.requirements.trim() || undefined,
        location: form.location,
        department: form.department,
        category: form.category,
        latitude: coords?.lat,
        longitude: coords?.lng,
        schedule: form.schedule.trim() || undefined,
        salary: Number(form.salary),
        phone: form.phone,
        jobType: form.jobType,
        durationDays: form.durationDays,
      };
      if (editId) {
        await api(`/ads/${editId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/ads', {
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
      {notVerified && (
        <div className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Verifica tu correo para poder publicar. Revisa el enlace que te
          enviamos o reenvíalo desde el aviso superior.
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Descripción del puesto">
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Requisitos del candidato (opcional)">
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            rows={3}
            placeholder="Experiencia, disponibilidad, documentación..."
            value={form.requirements}
            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
          />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Departamento">
            <Select
              value={form.department}
              onChange={(e) =>
                setForm({ ...form, department: e.target.value as Department })
              }
              required
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {Object.entries(DEPARTMENT_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Categoría / rubro">
            <Select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value as Category })
              }
              required
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField label="Ubicación del puesto">
          <Input
            placeholder="Zona o dirección de referencia"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
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
        <FormField label="Salario (Bs)">
          <Input
            type="number"
            min={1}
            value={form.salary}
            onChange={(e) => setForm({ ...form, salary: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Teléfono de contacto (WhatsApp)">
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Tipo de jornada">
          <Select
            value={form.jobType}
            onChange={(e) =>
              setForm({ ...form, jobType: e.target.value as JobType })
            }
          >
            <option value="DIARIA">Diaria</option>
            <option value="TIEMPO_COMPLETO">Tiempo completo</option>
            <option value="MEDIA_JORNADA">Media jornada</option>
          </Select>
        </FormField>
        <FormField label="Duración de la publicación">
          <Select
            value={form.durationDays}
            onChange={(e) =>
              setForm({ ...form, durationDays: Number(e.target.value) })
            }
          >
            {DURATION_DAYS.map((d) => (
              <option key={d} value={d}>
                {d} días{d === 3 ? ' (por defecto)' : ''}
              </option>
            ))}
          </Select>
        </FormField>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={saving || notVerified}>
          {saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Publicar'}
        </Button>
      </form>
    </div>
  );
}

export default function NewAdPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">Cargando...</p>}>
      <Form />
    </Suspense>
  );
}
