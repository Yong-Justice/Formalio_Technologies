import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { Card } from '@/components/common/Card';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  return (
    <Screen>
      <View className="gap-4">
        <Text className="text-2xl font-black text-navy">Transaction</Text>
        <Card title="Payment details">
          <Text className="text-surface-700">
            This transaction was opened from a Formalio notification. Full payment details will load from the backend when connected.
          </Text>
          {id ? <Text className="mt-3 text-xs font-semibold text-surface-500">Transaction ID: {id}</Text> : null}
        </Card>
      </View>
    </Screen>
  );
}
