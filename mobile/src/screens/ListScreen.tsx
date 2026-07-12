import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
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
import { AdListSkeleton } from '@/components/Skeleton';

type Props = NativeStackScreenProps<RootStackParamList, 'List'>;
const JOB_TYPES: (JobType | '')[] = ['', 'DIARIA', 'TIEMPO_COMPLETO', 'MEDIA_JORNADA'];

// Tamaño de página compartido con la web (paginación de 10 en 10).
const PAGE_SIZE = 10;

export function ListScreen({ navigation }: Props) {
  const { user } = useAuth();
  // Cualquier usuario con sesión puede publicar.
  const canPublish = Boolean(user);
  const [items, setItems] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [jobType, setJobType] = useState<JobType | ''>('');
  // Página actual en ref: onEndReached no debe recrear el callback.
  const pageRef = useRef(1);

  const fetchPage = useCallback(
    async (page: number) => {
      const params = new URLSearchParams();
      if (jobType) params.set('jobType', jobType);
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));
      return api<Paginated<Ad>>(`/listings?${params}`);
    },
    [jobType, search],
  );

  // Primera página (también para pull-to-refresh y cambio de filtros).
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPage(1);
      pageRef.current = 1;
      setItems(res.items);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  // Scroll infinito: agrega la página siguiente al llegar al final.
  const loadMore = useCallback(async () => {
    if (loadingMore || loading || pageRef.current >= totalPages) return;
    setLoadingMore(true);
    try {
      const res = await fetchPage(pageRef.current + 1);
      pageRef.current = res.page;
      // Evita duplicados si un anuncio nuevo desplazó los resultados.
      setItems((prev) => {
        const seen = new Set(prev.map((a) => a.id));
        return [...prev, ...res.items.filter((a) => !seen.has(a.id))];
      });
      setTotalPages(res.totalPages);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, loading, loadingMore, totalPages]);

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

      {loading && items.length === 0 ? (
        <AdListSkeleton />
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
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} tintColor="#102136" />
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color="#102136" className="my-4" />
            ) : null
          }
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
