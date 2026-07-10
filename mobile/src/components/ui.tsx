import React from 'react';
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { JobType, JOB_TYPE_LABEL } from '@/lib/types';

export function Button({
  title,
  variant = 'primary',
  className = '',
  ...props
}: TouchableOpacityProps & {
  title: string;
  variant?: 'primary' | 'outline' | 'danger';
}) {
  const box = {
    primary: 'bg-brand',
    outline: 'border border-brand',
    danger: 'bg-red-600',
  }[variant];
  const text = variant === 'outline' ? 'text-brand' : 'text-white';
  return (
    <TouchableOpacity
      className={`items-center rounded-md px-4 py-3 ${box} ${className}`}
      activeOpacity={0.8}
      {...props}
    >
      <Text className={`text-sm font-semibold ${text}`}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-sm font-medium text-gray-700">{label}</Text>
      <TextInput
        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        placeholderTextColor="#9ca3af"
        {...props}
      />
    </View>
  );
}

const BADGE_COLORS: Record<JobType, string> = {
  DIARIA: 'bg-orange-100',
  TIEMPO_COMPLETO: 'bg-green-100',
  MEDIA_JORNADA: 'bg-blue-100',
};
const BADGE_TEXT: Record<JobType, string> = {
  DIARIA: 'text-orange-800',
  TIEMPO_COMPLETO: 'text-green-800',
  MEDIA_JORNADA: 'text-blue-800',
};

export function Badge({ jobType }: { jobType: JobType }) {
  return (
    <View className={`self-start rounded-full px-2.5 py-0.5 ${BADGE_COLORS[jobType]}`}>
      <Text className={`text-xs font-medium ${BADGE_TEXT[jobType]}`}>
        {JOB_TYPE_LABEL[jobType]}
      </Text>
    </View>
  );
}
