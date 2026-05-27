import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { FicheResult } from '../../../types/fiche.types';
import { formatFCFA } from '../../../utils/ficheCalculator';

const LEVEL_STYLES: Record<FicheResult['ecartLevel'], { bg: string; border: string; text: string; title: string }> = {
  ok: { bg: '#ECFDF5', border: '#10B981', text: '#047857', title: 'OK' },
  warning: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', title: 'A verifier' },
  danger: { bg: '#FFF7ED', border: '#F97316', text: '#C2410C', title: 'Deficit' },
  critical: { bg: '#FEF2F2', border: '#EF4444', text: '#B91C1C', title: 'Critique' },
};

type Props = {
  result: FicheResult;
};

export default function EcartBadge({ result }: Props) {
  const style = LEVEL_STYLES[result.ecartLevel];
  const isSurplus = result.ecart > 0;
  const isPerfect = result.ecart === 0;

  return (
    <View style={[styles.container, { backgroundColor: style.bg, borderColor: style.border }]}>
      <Text style={[styles.title, { color: style.text }]}>{isPerfect ? 'Caisse parfaite' : style.title}</Text>
      <Text style={[styles.amount, { color: style.text }]}>
        {isPerfect ? '0 FCFA' : `${isSurplus ? '+' : '-'}${formatFCFA(Math.abs(result.ecart))} FCFA`}
      </Text>
      <Text style={[styles.percent, { color: style.text }]}>
        {result.ecartPercentage.toFixed(1)}% de la caisse attendue
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
  },
  amount: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  percent: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
});
