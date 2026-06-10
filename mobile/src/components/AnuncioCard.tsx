import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Anuncio } from '@/lib/types';
import { Badge } from './ui';

export function AnuncioCard({
  anuncio,
  onPress,
}: {
  anuncio: Anuncio;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="mb-3 rounded-lg border border-gray-200 bg-white p-4"
    >
      <View className="mb-2 flex-row items-start justify-between">
        <Text className="flex-1 pr-2 text-sm text-gray-800" numberOfLines={2}>
          {anuncio.descripcion}
        </Text>
        <Badge tipo={anuncio.tipoJornada} />
      </View>
      <Text className="text-lg font-bold text-brand">
        Bs {Number(anuncio.salario).toLocaleString('es-BO')}
      </Text>
    </TouchableOpacity>
  );
}
