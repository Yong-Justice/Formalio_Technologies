import React from 'react';
import { Text, View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';

export default function TransactionsScreen() {
  return (
    <Screen>
      <View className="gap-4">
        <Text className="text-2xl font-black text-navy">Transactions</Text>
        <Card title="Activité récente">
          {['Vente marchandise +125,000', 'Achat stock -45,000', 'Orange Money +89,000'].map((item) => <Text key={item} className="border-b border-surface-100 py-3 text-surface-700">{item}</Text>)}
        </Card>
      </View>
    </Screen>
  );
}