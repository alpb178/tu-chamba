import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation';
import { api } from '@/lib/api';
import { Ad, Paginated, JobType, JOB_TYPE_LABEL } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { AdCard } from '@/components/AdCard';

type Props = NativeStackScreenProps<RootStackParamList, 'List'>;
const JOB_TYPES: (JobType | '')[] = ['', 'DIARIA', 'TIEMPO_COMPLETO', 'MEDIA_JORNADA'];

export function ListScreen({ navigation }: Props) {
  const { user } = useAuth();
  const canPublish = user?.role === 'EMPLEADOR' || user?.role === 'ADMIN';
  const [items, setItems] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [jobType, setJobType] = useState<JobType | ''>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (jobType) params.set('jobType', jobType);
      if (search) params.set('search', search);
      params.set('limit', '50');
      const res = await api<Paginated<Ad>>(`/ads?${params}`);
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }, [jobType, search]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View className="flex-1 bg-gray-50 px-4 pt-3">
      <View className="mb-3 flex-row gap-2">
        <TextInput
          className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          placeholder="Buscar empleos..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={load}
        />
      </View>

      <View className="mb-3 flex-row flex-wrap gap-2">
        {JOB_TYPES.map((t) => (
          <TouchableOpacity
            key={t || 'all'}
            onPress={() => setJobType(t)}
            className={`rounded-full px-3 py-1 ${jobType === t ? 'bg-brand' : 'bg-gray-200'}`}
          >
            <Text className={`text-xs ${jobType === t ? 'text-white' : 'text-gray-700'}`}>
              {t ? JOB_TYPE_LABEL[t] : 'Todas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#102136" className="mt-6" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <AdCard
              ad={item}
              onPress={() => navigation.navigate('Detail', { id: item.id })}
            />
          )}
          ListEmptyComponent={
            <Text className="mt-6 text-center text-gray-500">
              No se encontraron anuncios.
            </Text>
          }
        />
      )}

      {canPublish && (
        <TouchableOpacity
          onPress={() => navigation.navigate('NewAd')}
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-brand shadow-lg"
        >
          <Text className="text-2xl text-white">+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
