import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LogoMark } from '@/screens/prototype/shared';

export type RestoreStepState = 'pending' | 'loading' | 'done';

type RestoreStatus = {
  profile?: RestoreStepState;
  transactions?: RestoreStepState;
  fiches?: RestoreStepState;
  versements?: RestoreStepState;
  treasury?: RestoreStepState;
};

const steps: { key: keyof RestoreStatus; label: string }[] = [
  { key: 'profile', label: 'Profil récupéré' },
  { key: 'transactions', label: 'Transactions récupérées' },
  { key: 'fiches', label: 'Fiches en cours...' },
  { key: 'versements', label: 'Retraits' },
  { key: 'treasury', label: 'Trésorerie' },
];

export default function DataRestoreScreen({ status = {} }: { status?: RestoreStatus }) {
  return (
    <View style={styles.root}>
      <LogoMark size={72} light />
      <Text style={styles.title}>Restauration de vos données...</Text>
      <View style={styles.list}>
        {steps.map((step) => {
          const state = status[step.key] ?? (step.key === 'profile' || step.key === 'transactions' ? 'done' : 'pending');
          return (
            <View key={step.key} style={styles.row}>
              {state === 'loading' ? <ActivityIndicator color="#34D399" size="small" /> : <Text style={[styles.icon, state === 'done' ? styles.done : styles.pending]}>{state === 'done' ? '✓' : '○'}</Text>}
              <Text style={styles.label}>{step.label}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.footer}>Veuillez patienter.{"\n"}Ne fermez pas l'application.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', backgroundColor: '#0F2419', flex: 1, justifyContent: 'center', padding: 28 },
  title: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', marginTop: 26, textAlign: 'center' },
  list: { alignSelf: 'stretch', gap: 14, marginTop: 32 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  icon: { fontSize: 20, fontWeight: '900', width: 22 },
  done: { color: '#34D399' },
  pending: { color: '#6B7280' },
  label: { color: '#FFFFFF', flex: 1, fontSize: 14, fontWeight: '700' },
  footer: { color: 'rgba(255,255,255,.72)', fontSize: 13, lineHeight: 20, marginTop: 34, textAlign: 'center' },
});
