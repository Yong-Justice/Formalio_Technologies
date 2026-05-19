import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MiniBarChart } from '@/components/charts/MiniBarChart';
import { useFinanceStore } from '@/features/finance/state/finance.store';

const demoTransactions = [
  { id: '1', type: 'income', amount: 125000, description: 'Vente marchandise', category: 'Ventes' },
  { id: '2', type: 'expense', amount: 45000, description: 'Achat stock', category: 'Achats' },
  { id: '3', type: 'income', amount: 89000, description: 'Vente boutique', category: 'Ventes' }
] as const;

export default function HomeScreen() {
  const transactions = useFinanceStore((s) => s.transactions);
  const list = transactions.length ? transactions : demoTransactions;
  const totals = useMemo(() => {
    const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [list]);
  return (
    <Screen>
      <View className="gap-4">
        <Text className="text-2xl font-black text-navy">Bonjour Marie</Text>
        <Card className={totals.balance >= 0 ? 'bg-navy' : 'bg-danger'}>
          <Text className="text-sm font-semibold text-white/70">Solde net</Text>
          <Text className="mt-1 text-4xl font-black text-white">{totals.balance.toLocaleString()} FCFA</Text>
          <Text className="mt-2 text-xs font-semibold text-white/70">Revenus {totals.income.toLocaleString()} · Dépenses {totals.expense.toLocaleString()}</Text>
        </Card>
        <View className="grid grid-cols-2 gap-3">
          <Card><Text className="text-xs text-surface-500">Revenus</Text><Text className="text-xl font-black text-teal">{totals.income.toLocaleString()}</Text></Card>
          <Card><Text className="text-xs text-surface-500">Dépenses</Text><Text className="text-xl font-black text-danger">{totals.expense.toLocaleString()}</Text></Card>
        </View>
        <Card title="Performance 7 jours"><MiniBarChart values={[12, 8, 20, 6, 14, 9, 5]} /></Card>
        <View className="flex-row gap-2">
          {[['Income', 'add-circle'], ['Expense', 'remove-circle'], ['Voice', 'mic'], ['Scan', 'scan']].map(([label, icon]) => (
            <Pressable key={label} className="flex-1 items-center rounded-2xl bg-white p-3 border border-surface-200">
              <Ionicons name={icon as any} size={22} color="#001F3F" />
              <Text className="mt-1 text-xs font-bold text-surface-700">{label}</Text>
            </Pressable>
          ))}
        </View>
        <Card title="Transactions récentes">
          {list.slice(0, 5).map((t) => (
            <View key={t.id} className="flex-row items-center justify-between border-b border-surface-100 py-3 last:border-b-0">
              <View><Text className="font-semibold text-surface-900">{t.description}</Text><Text className="text-xs text-surface-500">{t.category}</Text></View>
              <Text className={`font-black ${t.type === 'income' ? 'text-teal' : 'text-danger'}`}>{t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}</Text>
            </View>
          ))}
        </Card>
        <Button title="Ajouter une transaction" />
      </View>
    </Screen>
  );
}