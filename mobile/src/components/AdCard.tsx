import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ad, salaryLabel } from '@/lib/types';
import { Badge } from './ui';

export function AdCard({ ad, onPress }: { ad: Ad; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`mb-3 rounded-lg border bg-white p-4 ${
        // Los destacados por el panel se distinguen por el color del borde.
        // Ámbar, el mismo criterio que en la web: es el color con el que la
        // app ya habla de promoción, y el azul marino de `brand` es el color
        // de todo lo demás.
        ad.featured ? 'border-accent' : 'border-gray-200'
      }`}
    >
      <View className="mb-2 flex-row items-start justify-between">
        <Text className="flex-1 pr-2 text-sm text-gray-800" numberOfLines={2}>
          {ad.description}
        </Text>
        <Badge jobType={ad.jobType} />
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-brand">{salaryLabel(ad)}</Text>
        {ad.ownerRating && ad.ownerRating.count > 0 && (
          <Text className="text-xs text-gray-600">
            <Text className="text-amber-500">★</Text>{' '}
            {Number(ad.ownerRating.average).toFixed(1)} (
            {ad.ownerRating.count})
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
