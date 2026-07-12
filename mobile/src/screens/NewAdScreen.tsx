import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import { api } from '@/lib/api';
import { Ad, JobType, JOB_TYPE_LABEL } from '@/lib/types';
import { Button, Field } from '@/components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'NewAd'>;
const JOB_TYPES: JobType[] = ['DIARIA', 'TIEMPO_COMPLETO', 'MEDIA_JORNADA'];

export function NewAdScreen({ route, navigation }: Props) {
  const editId = route.params?.id;
  const [form, setForm] = useState({
    description: '',
    salary: '',
    phone: '',
    jobType: 'TIEMPO_COMPLETO' as JobType,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editId) {
      api<Ad>(`/listings/${editId}`).then((a) =>
        setForm({
          description: a.description,
          salary: String(a.salary),
          phone: a.phone,
          jobType: a.jobType,
        }),
      );
    }
  }, [editId]);

  async function onSubmit() {
    setError(null);
    setSaving(true);
    try {
      const payload = {
        description: form.description,
        salary: Number(form.salary),
        phone: form.phone,
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
        label="Teléfono de contacto"
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={(v) => setForm({ ...form, phone: v })}
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
