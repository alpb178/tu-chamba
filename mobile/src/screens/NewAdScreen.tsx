import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import { api } from '@/lib/api';
import { Ad, JobType, JOB_TYPE_LABEL } from '@/lib/types';
import { Button, Field } from '@/components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'NewAd'>;
const JOB_TYPES: JobType[] = [
  'DIARIA',
  'TIEMPO_COMPLETO',
  'MEDIA_JORNADA',
  'POR_CONTRATO',
  'PASANTIA',
  'FREELANCE',
  'A_CONVENIR',
];

// Números adicionales en un solo campo ("67894829 / 3467010"), como en el
// panel: al guardar se reparten en principal y adicionales.
function splitPhones(raw: string) {
  const valid = raw
    .split(/[/,;|]/)
    .map((p) => p.trim())
    .filter((p) => p.replace(/\D/g, '').length >= 7);
  return [...new Set(valid)];
}

export function NewAdScreen({ route, navigation }: Props) {
  const editId = route.params?.id;
  const [form, setForm] = useState({
    description: '',
    salary: '',
    salaryMax: '',
    phone: '',
    extraPhones: '',
    locationReference: '',
    jobType: 'TIEMPO_COMPLETO' as JobType,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editId) {
      api<Ad>(`/listings/${editId}`).then((a) =>
        setForm({
          description: a.description,
          salary: a.salary != null ? String(a.salary) : '',
          salaryMax: a.salaryMax != null ? String(a.salaryMax) : '',
          phone: a.phone,
          extraPhones: (a.extraPhones ?? []).join(' / '),
          locationReference: a.locationReference ?? '',
          jobType: a.jobType,
        }),
      );
    }
  }, [editId]);

  async function onSubmit() {
    setError(null);
    setSaving(true);
    try {
      const extraPhones = splitPhones(form.extraPhones);
      const payload = {
        description: form.description,
        salary: form.salary.trim() ? Number(form.salary) : undefined,
        // El techo solo viaja si forma un rango válido con el piso.
        salaryMax:
          form.salary.trim() &&
          form.salaryMax.trim() &&
          Number(form.salaryMax) > Number(form.salary)
            ? Number(form.salaryMax)
            : undefined,
        phone: form.phone,
        extraPhones: extraPhones.length ? extraPhones : undefined,
        locationReference: form.locationReference.trim() || undefined,
        jobType: form.jobType,
      };
      if (editId) {
        await api(`/listings/${editId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/listings', { method: 'POST', body: JSON.stringify(payload) });
      }
      navigation.goBack();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 px-6 pt-4">
      <Text className="mb-4 text-xl font-bold text-gray-800">
        {editId ? 'Editar anuncio' : 'Publicar anuncio'}
      </Text>

      <Field
        label="Descripción"
        multiline
        numberOfLines={4}
        value={form.description}
        onChangeText={(v) => setForm({ ...form, description: v })}
      />
      <Field
        label="Salario (Bs)"
        keyboardType="numeric"
        value={form.salary}
        onChangeText={(v) => setForm({ ...form, salary: v })}
      />
      <Field
        label="Hasta (Bs, opcional: publica un rango)"
        keyboardType="numeric"
        value={form.salaryMax}
        onChangeText={(v) => setForm({ ...form, salaryMax: v })}
      />
      <Field
        label="Referencia de ubicación (opcional)"
        value={form.locationReference}
        onChangeText={(v) => setForm({ ...form, locationReference: v })}
      />
      <Field
        label="Teléfono de contacto"
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={(v) => setForm({ ...form, phone: v })}
      />
      <Field
        label="Otros teléfonos (opcional)"
        keyboardType="phone-pad"
        value={form.extraPhones}
        onChangeText={(v) => setForm({ ...form, extraPhones: v })}
      />

      <Text className="mb-1 text-sm font-medium text-gray-700">Tipo de jornada</Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {JOB_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setForm({ ...form, jobType: t })}
            className={`rounded-full px-3 py-1.5 ${
              form.jobType === t ? 'bg-brand' : 'bg-gray-200'
            }`}
          >
            <Text className={`text-xs ${form.jobType === t ? 'text-white' : 'text-gray-700'}`}>
              {JOB_TYPE_LABEL[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && <Text className="mb-2 text-sm text-red-600">{error}</Text>}
      <Button
        title={saving ? 'Guardando...' : editId ? 'Guardar cambios' : 'Publicar'}
        onPress={onSubmit}
        disabled={saving}
      />
    </ScrollView>
  );
}
