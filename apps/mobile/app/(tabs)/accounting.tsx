import React from 'react';
import { Text, View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MiniBarChart } from '@/components/charts/MiniBarChart';
import { analytics } from '@/services/analytics/analytics.service';

export default function AccountingScreen() {
  return (
    <Screen>
      <View className="gap-4">
        <Text className="text-2xl font-black text-navy">Comptabilite IA</Text>
        <Card className="bg-navy">
          <Text className="text-sm font-semibold text-white/70">Profit net estime</Text>
          <Text className="mt-1 text-4xl font-black text-white">845,000 FCFA</Text>
          <Text className="mt-2 text-xs text-white/70">Marge nette 52% - TVA estimee 184K FCFA</Text>
        </Card>
        <View className="grid grid-cols-2 gap-3">
          <Card><Text className="text-xs text-surface-500">Ventes du jour</Text><Text className="text-xl font-black text-teal">125K</Text></Card>
          <Card><Text className="text-xs text-surface-500">Cash flow</Text><Text className="text-xl font-black text-teal">+845K</Text></Card>
          <Card><Text className="text-xs text-surface-500">Stock</Text><Text className="text-xl font-black text-navy">2.4M</Text></Card>
          <Card><Text className="text-xs text-surface-500">TVA</Text><Text className="text-xl font-black text-warning">184K</Text></Card>
        </View>
        <Card title="Revenus vs depenses"><MiniBarChart values={[12, 9, 21, 7, 15, 10, 6]} /></Card>
        <Card title="Insights Mosika AI">
          <Text className="text-sm leading-6 text-surface-700">
            Ventes +23% ce mois.{"\n"}
            Anomalie transport mercredi.{"\n"}
            Prevision profit mars: 1.4M FCFA.{"\n"}
            Economie possible: 45K FCFA/mois.
          </Text>
        </Card>
        <Button
          title="Ouvrir assistant IA"
          variant="secondary"
          onPress={() => analytics.featureUsed('ai_assistant', { source: 'accounting_screen' })}
        />
        <Button
          title="Generer rapport comptable IA"
          onPress={() => {
            analytics.featureUsed('ohada_report_generation', { source: 'accounting_screen' });
            analytics.track('report_generated', { reportType: 'ohada_accounting' });
          }}
        />
      </View>
    </Screen>
  );
}
