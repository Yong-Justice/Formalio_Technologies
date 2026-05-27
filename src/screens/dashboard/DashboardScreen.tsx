import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { MiniBarChart } from '@/components/dashboard/MiniBarChart';
import { repositories } from '@/database/repositories';
import { useAuthStore } from '@/store/authStore';
import { useFinanceStore } from '@/store/financeStore';
import { analytics } from '@/services/analytics/analytics.service';

const demoTransactions = [
  { id: '1', type: 'income', amount: 125000, description: 'Vente marchandise', category: 'Ventes' },
  { id: '2', type: 'expense', amount: 45000, description: 'Achat stock', category: 'Achats' },
  { id: '3', type: 'income', amount: 89000, description: 'Vente boutique', category: 'Ventes' }
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

function shouldShowFicheReminder(lastCompletedAt: number | null) {
  return !lastCompletedAt || Date.now() - lastCompletedAt > DAY_MS;
}

function formatFicheAge(lastCompletedAt: number | null) {
  if (!lastCompletedAt) return 'aucune fiche recente';
  const elapsedDays = Math.max(1, Math.floor((Date.now() - lastCompletedAt) / DAY_MS));
  return elapsedDays === 1 ? 'il y a 1 jour' : `il y a ${elapsedDays} jours`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const transactions = useFinanceStore((s) => s.transactions);
  const list = transactions.length ? transactions : demoTransactions;
  const [lastFicheCompletedAt, setLastFicheCompletedAt] = useState<number | null>(null);
  const totals = useMemo(() => {
    const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = list.filter((t) => t.type === 'expense' || t.type === 'retrait').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [list]);
  const showFicheReminder = shouldShowFicheReminder(lastFicheCompletedAt);

  useEffect(() => {
    if (!userId || Platform.OS === 'web') return;
    let active = true;

    repositories.fiches
      .getRecords(userId, { limit: 1, orderBy: 'created_at', direction: 'desc' })
      .then((records) => {
        if (!active) return;
        const latest = records[0] as { created_at?: number } | undefined;
        setLastFicheCompletedAt(latest?.created_at ?? null);
      })
      .catch(() => {
        if (active) setLastFicheCompletedAt(null);
      });

    return () => {
      active = false;
    };
  }, [userId]);

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
            <Pressable
              key={label}
              onPress={() => {
                if (label === 'Voice') analytics.featureUsed('voice_input', { source: 'home_quick_action' });
                if (label === 'Income' || label === 'Expense') analytics.track('transaction_initiated', { source: 'home_quick_action', type: label.toLowerCase() });
              }}
              className="flex-1 items-center rounded-2xl bg-white p-3 border border-surface-200"
            >
              <Ionicons name={icon as any} size={22} color="#001F3F" />
              <Text className="mt-1 text-xs font-bold text-surface-700">{label}</Text>
            </Pressable>
          ))}
        </View>
        {showFicheReminder ? (
          <Pressable
            onPress={() => router.push('/FicheScreen')}
            className="rounded-2xl border border-[#F59E0B] bg-[#FEF3C7] p-4 active:opacity-80"
          >
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-base font-black text-amber-900">📋 Fiche non complétée</Text>
                <Text className="mt-1 text-xs font-bold text-amber-800">
                  Dernière fiche: {formatFicheAge(lastFicheCompletedAt)}
                </Text>
                <Text className="mt-1 text-sm font-semibold text-amber-900">
                  Réconciliez votre caisse maintenant
                </Text>
              </View>
              <View className="rounded-xl bg-amber-600 px-3 py-2">
                <Text className="text-xs font-black text-white">Commencer →</Text>
              </View>
            </View>
          </Pressable>
        ) : null}
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
