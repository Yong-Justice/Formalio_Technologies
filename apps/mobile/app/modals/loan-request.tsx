import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';

export default function LoanRequestModal() {
  const [amount] = useState(2000000);
  const duration = 12;
  const rate = 7.5;
  const monthly = Math.round((amount * (1 + rate / 100)) / duration);
  return (
    <Screen>
      <View className="gap-4">
        <Text className="text-2xl font-black text-navy">Demande de prêt</Text>
        <View className="rounded-3xl bg-navy p-5"><Text className="text-white/70">Montant recommandé</Text><Text className="text-4xl font-black text-white">2,000,000 FCFA</Text></View>
        <Text className="text-surface-700">Durée: {duration} mois · Taux estimé: {rate}%</Text>
        <Text className="text-xl font-black text-teal">Mensualité: {monthly.toLocaleString()} FCFA</Text>
        <Button title="Envoyer la demande" />
      </View>
    </Screen>
  );
}