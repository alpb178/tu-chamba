import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import { api } from '@/lib/api';
import { Anuncio, TipoJornada, TIPO_JORNADA_LABEL } from '@/lib/types';
import { Button, Field } from '@/components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Nuevo'>;
const TIPOS: TipoJornada[] = ['DIARIA', 'TIEMPO_COMPLETO', 'MEDIA_JORNADA'];

export function NuevoScreen({ route, navigation }: Props) {
  const editId = route.params?.id;
  const [form, setForm] = useState({
    descripcion: '',
    salario: '',
    telefono: '',
    tipoJornada: 'TIEMPO_COMPLETO' as TipoJornada,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editId) {
      api<Anuncio>(`/anuncios/${editId}`).then((a) =>
        setForm({
          descripcion: a.descripcion,
          salario: String(a.salario),
          telefono: a.telefono,
          tipoJornada: a.tipoJornada,
        }),
      );
    }
  }, [editId]);

  async function onSubmit() {
    setError(null);
    setSaving(true);
    try {
      const payload = {
        descripcion: form.descripcion,
        salario: Number(form.salario),
        telefono: form.telefono,
        tipoJornada: form.tipoJornada,
      };
      if (editId) {
        await api(`/anuncios/${editId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await api('/anuncios', { method: 'POST', body: JSON.stringify(payload) });
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
        value={form.descripcion}
        onChangeText={(v) => setForm({ ...form, descripcion: v })}
      />
      <Field
        label="Salario (Bs)"
        keyboardType="numeric"
        value={form.salario}
        onChangeText={(v) => setForm({ ...form, salario: v })}
      />
      <Field
        label="Teléfono de contacto"
        keyboardType="phone-pad"
        value={form.telefono}
        onChangeText={(v) => setForm({ ...form, telefono: v })}
      />

      <Text className="mb-1 text-sm font-medium text-gray-700">Tipo de jornada</Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {TIPOS.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setForm({ ...form, tipoJornada: t })}
            className={`rounded-full px-3 py-1.5 ${
              form.tipoJornada === t ? 'bg-brand' : 'bg-gray-200'
            }`}
          >
            <Text className={`text-xs ${form.tipoJornada === t ? 'text-white' : 'text-gray-700'}`}>
              {TIPO_JORNADA_LABEL[t]}
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
