import React from 'react';
import { Text, View } from 'react-native';

export function Card({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <View className={`rounded-3xl border border-surface-200 bg-white p-4 shadow-sm ${className}`}>
      {title ? <Text className="mb-3 text-base font-bold text-surface-900">{title}</Text> : null}
      {children}
    </View>
  );
}