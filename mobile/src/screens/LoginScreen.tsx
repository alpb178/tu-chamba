import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import { useAuth } from '@/lib/auth';
import { Button, Field } from '@/components/ui';
import { Logo } from '@/components/Logo';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 justify-center bg-gray-50 px-6">
      <View className="mb-6 items-center">
        <Logo width={220} />
        <Text className="mt-1 text-sm text-gray-500">Empleos</Text>
      </View>

      <Field
        label="Correo"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Field
        label="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text className="mb-2 text-sm text-red-600">{error}</Text>}
      <Button title={loading ? 'Ingresando...' : 'Ingresar'} onPress={onSubmit} disabled={loading} />
      <Button
        title="Crear cuenta"
        variant="outline"
        className="mt-3"
        onPress={() => navigation.navigate('Register')}
      />
    </View>
  );
}
