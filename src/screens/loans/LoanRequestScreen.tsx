import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { Button } from '@/components/common/Button';

export default function LoanRequestScreen() {
  const [amount] = useState(2000000);
  const duration = 12;
  const rate = 7.5;
  const processingFee = Math.round(amount * 0.015);
  const totalRepayment = Math.round(amount * (1 + rate / 100) + processingFee);
  const approvalProbability = 91;
  const borrowingStrengthIndex = 88;
  return (
    <Screen>
      <View className="gap-4">
        <Text className="text-2xl font-black text-navy">Demande de prêt</Text>
        <View className="rounded-3xl bg-navy p-5"><Text className="text-white/70">Montant recommandé</Text><Text className="text-4xl font-black text-white">2,000,000 FCFA</Text></View>
        <Text className="text-surface-700">Durée: {duration} mois · Taux estimé: {rate}%</Text>
        <View className="gap-3 rounded-3xl bg-white p-4">
          <Text className="font-black text-teal">Loan Approval Probability: {approvalProbability}%</Text>
          <Text className="font-black text-navy">Borrowing Strength Index: {borrowingStrengthIndex}%</Text>
          <Text className="text-surface-700">Remboursement total estimé: {totalRepayment.toLocaleString()} FCFA</Text>
        </View>
        <Button title="Envoyer la demande" />
      </View>
    </Screen>
  );
}
