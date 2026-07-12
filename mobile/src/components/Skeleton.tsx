import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

// Siluetas de carga con pulso de opacidad (equivalente al animate-pulse web).
export function Pulse({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <View className={`rounded bg-gray-200 ${className}`} />;
}

// Silueta de una AdCard del listado.
export function AdCardSkeleton() {
  return (
    <View className="mb-3 rounded-lg border border-gray-200 bg-white p-4">
      <View className="mb-2 flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <Skeleton className="mb-1.5 h-4 w-11/12" />
          <Skeleton className="h-4 w-2/3" />
        </View>
        <Skeleton className="h-5 w-16 rounded-full" />
      </View>
      <Skeleton className="h-6 w-24" />
    </View>
  );
}

export function AdListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Pulse>
      {Array.from({ length: count }, (_, i) => (
        <AdCardSkeleton key={i} />
      ))}
    </Pulse>
  );
}
