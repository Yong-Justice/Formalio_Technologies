import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { Card } from '@/components/common/Card';
import { MiniBarChart } from '@/components/dashboard/MiniBarChart';

export default function TreasuryScreen() {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  return (
    <Screen>
      <View className="gap-4">
        <Text className="text-2xl font-black text-navy">Trésorerie</Text>
        <View className="flex-row gap-2">
          {(['all', 'income', 'expense'] as const).map((f) => <Pressable key={f} onPress={() => setFilter(f)} className={`flex-1 rounded-2xl p-3 ${filter === f ? 'bg-navy' : 'bg-white border border-surface-200'}`}><Text className={`text-center text-xs font-black ${filter === f ? 'text-white' : 'text-surface-600'}`}>{f === 'all' ? 'Global' : f === 'income' ? 'Revenue' : 'Dépense'}</Text></Pressable>)}
        </View>
        <Card className="bg-navy"><Text className="text-sm text-white/70">Cash flow net</Text><Text className="text-4xl font-black text-white">845K FCFA</Text><Text className="text-xs text-white/70">Runway 7.2 mois · Net margin 52%</Text></Card>
        <View className="grid grid-cols-2 gap-3">
          {filter !== 'expense' ? <Card><Text className="text-xs text-surface-500">Revenus</Text><Text className="text-xl font-black text-teal">784K</Text></Card> : null}
          {filter !== 'income' ? <Card><Text className="text-xs text-surface-500">Dépenses</Text><Text className="text-xl font-black text-danger">240K</Text></Card> : null}
          <Card><Text className="text-xs text-surface-500">Prévision</Text><Text className="text-xl font-black text-warning">1.45M</Text></Card>
        </View>
        <Card title={filter === 'income' ? 'Analytics revenus' : filter === 'expense' ? 'Analytics dépenses' : 'Flux global'}><MiniBarChart values={filter === 'expense' ? [4, 6, 8, 3, 4, 2, 1] : [12, 9, 21, 7, 15, 10, 6]} color={filter === 'expense' ? '#DC3545' : '#28A745'} /></Card>
      </View>
    </Screen>
  );
}