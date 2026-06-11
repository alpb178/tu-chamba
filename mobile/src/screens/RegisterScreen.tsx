import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import { useAuth } from '@/lib/auth';
import { Button, Field } from '@/components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;
type RolReg = 'TRABAJADOR' | 'EMPLEADOR';

export function RegisterScreen(_props: Props) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    role: 'TRABAJADOR' as RolReg,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await register({ ...form, email: form.email.trim() });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 px-6 pt-6">
      <Text className="mb-4 text-xl font-bold text-gray-800">Crear cuenta</Text>
      <Field label="Nombre" value={form.nombre} onChangeText={(v) => set('nombre', v)} />
      <Field
        label="Correo"
        autoCapitalize="none"
        keyboardType="email-address"
        value={form.email}
        onChangeText={(v) => set('email', v)}
      />
      <Field label="Teléfono" keyboardType="phone-pad" value={form.telefono} onChangeText={(v) => set('telefono', v)} />
      <Field label="Contraseña (mín. 6)" secureTextEntry value={form.password} onChangeText={(v) => set('password', v)} />

      <Text className="mb-1 text-sm font-medium text-gray-700">Quiero registrarme como</Text>
      <View className="mb-4 flex-row gap-2">
        {(['TRABAJADOR', 'EMPLEADOR'] as RolReg[]).map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => set('role', r)}
            className={`flex-1 rounded-md border px-3 py-2 ${
              form.role === r ? 'border-brand bg-brand-light' : 'border-gray-300'
            }`}
          >
            <Text className={`text-center text-sm ${form.role === r ? 'font-semibold text-brand' : 'text-gray-700'}`}>
              {r === 'TRABAJADOR' ? 'Trabajador' : 'Empleador'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && <Text className="mb-2 text-sm text-red-600">{error}</Text>}
      <Button title={loading ? 'Creando...' : 'Crear cuenta'} onPress={onSubmit} disabled={loading} />
    </ScrollView>
  );
}
