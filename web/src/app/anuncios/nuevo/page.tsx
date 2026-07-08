'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import {
  Anuncio,
  Categoria,
  CATEGORIA_LABEL,
  Departamento,
  DEPARTAMENTO_LABEL,
  DURACIONES_DIAS,
  TipoJornada,
} from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { Button, FormField, Input, Select } from '@/components/ui';

// Leaflet usa window: solo en cliente.
const MapPicker = dynamic(
  () => import('@/components/Mapa').then((m) => m.MapPicker),
  { ssr: false, loading: () => <div className="h-64 rounded-md bg-gray-100" /> },
);

function Form() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get('id');
  const { user, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    descripcion: '',
    requisitos: '',
    ubicacion: '',
    departamento: '' as Departamento | '',
    categoria: '' as Categoria | '',
    horario: '',
    salario: '',
    telefono: '',
    tipoJornada: 'TIEMPO_COMPLETO' as TipoJornada,
    duracionDias: 3,
  });
  // Pin del mapa (opcional). Se guarda junto al anuncio.
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cargado, setCargado] = useState(!editId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Empleador (no admin) con correo sin verificar no puede publicar.
  const noVerificado = !!user && user.role !== 'ADMIN' && !user.emailVerified;

  useEffect(() => {
    if (editId) {
      api<Anuncio>(`/anuncios/${editId}`).then((a) => {
        setForm({
          descripcion: a.descripcion,
          requisitos: a.requisitos ?? '',
          ubicacion: a.ubicacion ?? '',
          departamento: a.departamento ?? '',
          categoria: a.categoria ?? '',
          horario: a.horario ?? '',
          salario: String(a.salario),
          telefono: a.telefono,
          tipoJornada: a.tipoJornada,
          duracionDias: a.duracionDias ?? 3,
        });
        if (a.latitud != null && a.longitud != null) {
          setCoords({ lat: a.latitud, lng: a.longitud });
        }
        setCargado(true);
      });
    }
  }, [editId]);

  // Al crear, el teléfono se precarga con el del perfil del empleador
  // (es el que usarán los botones Llamar y Chatear). Sigue siendo editable.
  useEffect(() => {
    if (!editId && user?.telefono) {
      setForm((f) => (f.telefono ? f : { ...f, telefono: user.telefono! }));
    }
  }, [editId, user]);

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
        requisitos: form.requisitos.trim() || undefined,
        ubicacion: form.ubicacion,
        departamento: form.departamento,
        categoria: form.categoria,
        latitud: coords?.lat,
        longitud: coords?.lng,
        horario: form.horario.trim() || undefined,
        salario: Number(form.salario),
        telefono: form.telefono,
        tipoJornada: form.tipoJornada,
        duracionDias: form.duracionDias,
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
      {noVerificado && (
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
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Requisitos del candidato (opcional)">
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            rows={3}
            placeholder="Experiencia, disponibilidad, documentación..."
            value={form.requisitos}
            onChange={(e) => setForm({ ...form, requisitos: e.target.value })}
          />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Departamento">
            <Select
              value={form.departamento}
              onChange={(e) =>
                setForm({ ...form, departamento: e.target.value as Departamento })
              }
              required
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {Object.entries(DEPARTAMENTO_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Categoría / rubro">
            <Select
              value={form.categoria}
              onChange={(e) =>
                setForm({ ...form, categoria: e.target.value as Categoria })
              }
              required
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {Object.entries(CATEGORIA_LABEL).map(([value, label]) => (
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
            value={form.ubicacion}
            onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Marca el lugar en el mapa (opcional)">
          {/* Se monta cuando ya se cargaron los datos en edición, para centrar el pin existente. */}
          {cargado && (
            <MapPicker
              lat={coords?.lat ?? null}
              lng={coords?.lng ?? null}
              onChange={(lat, lng) => setCoords({ lat, lng })}
              onPlace={(nombre) =>
                setForm((f) => (f.ubicacion ? f : { ...f, ubicacion: nombre }))
              }
            />
          )}
        </FormField>
        <FormField label="Horario de trabajo (opcional)">
          <Input
            placeholder="Ej. Lun-Vie 8:00 a 16:00"
            value={form.horario}
            onChange={(e) => setForm({ ...form, horario: e.target.value })}
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
        <FormField label="Teléfono de contacto (WhatsApp)">
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
        <FormField label="Duración de la publicación">
          <Select
            value={form.duracionDias}
            onChange={(e) =>
              setForm({ ...form, duracionDias: Number(e.target.value) })
            }
          >
            {DURACIONES_DIAS.map((d) => (
              <option key={d} value={d}>
                {d} días{d === 3 ? ' (por defecto)' : ''}
              </option>
            ))}
          </Select>
        </FormField>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={saving || noVerificado}>
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
