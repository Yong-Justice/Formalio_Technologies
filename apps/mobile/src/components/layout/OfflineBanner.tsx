import React from 'react';
import { Text, View } from 'react-native';
import { useNetworkStore } from '@/services/offline/network';

export function OfflineBanner() {
  const isOnline = useNetworkStore((state) => state.isOnline);
  if (isOnline) return null;
  return (
    <View className="bg-warning px-4 py-2">
      <Text className="text-center text-xs font-bold text-navy">Mode hors ligne · les actions seront synchronisées automatiquement</Text>
    </View>
  );
}