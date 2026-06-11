import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import { api } from '@/lib/api';
import { Anuncio } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { Badge, Button } from '@/components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Detalle'>;

export function DetalleScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { user } = useAuth();
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);

  useEffect(() => {
    api<Anuncio>(`/anuncios/${id}`).then(setAnuncio).catch(() => {});
  }, [id]);

  if (!anuncio) return <Text className="p-6 text-gray-500">Cargando...</Text>;

  const puedeEditar =
    user && (user.role === 'ADMIN' || user.id === anuncio.createdById);

  async function eliminar() {
    Alert.alert('Eliminar', '¿Eliminar este anuncio?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await api(`/anuncios/${id}`, { method: 'DELETE' });
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 px-5 pt-4">
      <Badge tipo={anuncio.tipoJornada} />
      <Text className="my-4 text-base text-gray-800">{anuncio.descripcion}</Text>
      <Text className="text-3xl font-bold text-brand">
        Bs {Number(anuncio.salario).toLocaleString('es-BO')}
      </Text>
      <Text className="mt-1 text-sm text-gray-600">
        Publicado por: {anuncio.createdBy?.nombre ?? '—'}
      </Text>

      <View className="mt-6">
        <Button
          title={`Llamar: ${anuncio.telefono}`}
          onPress={() => Linking.openURL(`tel:${anuncio.telefono}`)}
        />
      </View>

      {puedeEditar && (
        <View className="mt-4 gap-2">
          <Button
            title="Editar"
            variant="outline"
            onPress={() => navigation.navigate('Nuevo', { id: anuncio.id })}
          />
          <Button title="Eliminar" variant="danger" onPress={eliminar} />
        </View>
      )}
    </ScrollView>
  );
}
