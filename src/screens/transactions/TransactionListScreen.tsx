import React from 'react';
import { Text, View } from 'react-native';
import { MobileMoneyIcon, getMobileMoneyProvider } from '@/components/momo/MobileMoneyIcon';
import { Screen } from '@/components/common/Screen';
import { Card } from '@/components/common/Card';

export default function TransactionListScreen() {
  const items = [
    { label: 'Vente marchandise +125,000', method: 'MTN MoMo' },
    { label: 'Achat stock -45,000', method: 'Espèces' },
    { label: 'Orange Money +89,000', method: 'Orange Money' },
  ];

  return (
    <Screen>
      <View className="gap-4">
        <Text className="text-2xl font-black text-navy">Transactions</Text>
        <Card title="Activité récente">
          {items.map((item) => {
            const provider = getMobileMoneyProvider(item.method);
            return (
              <View key={item.label} className="flex-row items-center gap-2 border-b border-surface-100 py-3">
                {provider ? <MobileMoneyIcon provider={provider} size={24} /> : null}
                <Text className="text-surface-700">{item.label}</Text>
              </View>
            );
          })}
        </Card>
      </View>
    </Screen>
  );
}
