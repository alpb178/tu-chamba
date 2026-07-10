import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ad } from '@/lib/types';
import { Badge } from './ui';

export function AdCard({ ad, onPress }: { ad: Ad; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="mb-3 rounded-lg border border-gray-200 bg-white p-4"
    >
      <View className="mb-2 flex-row items-start justify-between">
        <Text className="flex-1 pr-2 text-sm text-gray-800" numberOfLines={2}>
          {ad.description}
        </Text>
        <Badge jobType={ad.jobType} />
      </View>
      <Text className="text-lg font-bold text-brand">
        Bs {Number(ad.salary).toLocaleString('es-BO')}
      </Text>
    </TouchableOpacity>
  );
}
