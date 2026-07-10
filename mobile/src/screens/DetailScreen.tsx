import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import { api } from '@/lib/api';
import { Ad } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { Badge, Button } from '@/components/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

export function DetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { user } = useAuth();
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    api<Ad>(`/ads/${id}`).then(setAd).catch(() => {});
  }, [id]);

  if (!ad) return <Text className="p-6 text-gray-500">Cargando...</Text>;

  const canEdit =
    user && (user.role === 'ADMIN' || user.id === ad.createdById);

  async function remove() {
    Alert.alert('Eliminar', '¿Eliminar este anuncio?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await api(`/ads/${id}`, { method: 'DELETE' });
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 px-5 pt-4">
      <Badge jobType={ad.jobType} />
      <Text className="my-4 text-base text-gray-800">{ad.description}</Text>
      <Text className="text-3xl font-bold text-brand">
        Bs {Number(ad.salary).toLocaleString('es-BO')}
      </Text>
      <Text className="mt-1 text-sm text-gray-600">
        Publicado por: {ad.createdBy?.name ?? '—'}
      </Text>

      <View className="mt-6">
        <Button
          title={`Llamar: ${ad.phone}`}
          onPress={() => Linking.openURL(`tel:${ad.phone}`)}
        />
      </View>

      {canEdit && (
        <View className="mt-4 gap-2">
          <Button
            title="Editar"
            variant="outline"
            onPress={() => navigation.navigate('NewAd', { id: ad.id })}
          />
          <Button title="Eliminar" variant="danger" onPress={remove} />
        </View>
      )}
    </ScrollView>
  );
}
