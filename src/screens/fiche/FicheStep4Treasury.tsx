import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, ArrowRight, Calculator } from 'lucide-react-native';
import type { FicheData } from '../../types/fiche.types';
import { calculateFiche, formatFCFA } from '../../utils/ficheCalculator';

type Props = {
  data: Partial<FicheData>;
  onUpdate: (updates: Partial<FicheData>) => void;
  onNext: () => void;
  onBack: () => void;
};

function parseNumber(value: string) {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function FicheStep4Treasury({ data, onUpdate, onNext, onBack }: Props) {
  const [cash, setCash] = useState(data.caisseReelle ? String(data.caisseReelle) : '');
  const result = useMemo(() => calculateFiche({ ...data, caisseReelle: parseNumber(cash) }), [cash, data]);
  const keypadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', 'DEL'],
  ];

  const handleKeyPress = (key: string) => {
    if (key === 'C') {
      setCash('');
      return;
    }

    if (key === 'DEL') {
      setCash((value) => value.slice(0, -1));
      return;
    }

    setCash((value) => (value === '0' ? key : `${value}${key}`));
  };

  const handleNext = () => {
    onUpdate({
      caisseAttendue: result.caisseAttendue,
      caisseReelle: parseNumber(cash),
      ecart: result.ecart,
      ecartPercentage: result.ecartPercentage,
    });
    onNext();
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View>
        <Text style={styles.title}>💰 Saisie de caisse</Text>
        <Text style={styles.subtitle}>Etape 4 sur 5</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>RECAPITULATIF</Text>
        <Line label="Revenus theoriques" value={`${formatFCFA(result.totalRevenusTheoriques)} FCFA`} />
        <Line label="Depenses" value={`- ${formatFCFA(result.totalDepenses)} FCFA`} danger />
        <View style={styles.divider} />
        <Line label="Caisse attendue" value={`${formatFCFA(result.caisseAttendue)} FCFA`} strong />
      </View>

      <View style={styles.cashCard}>
        <View style={styles.cashIcon}>
          <Calculator size={24} color="#047857" />
        </View>
        <Text style={styles.cashPrompt}>Combien avez-vous en caisse EN CE MOMENT?</Text>
        <View style={styles.cashInputRow}>
          <Text style={styles.cashInput}>{cash ? formatFCFA(parseNumber(cash)) : '0'}</Text>
          <Text style={styles.currency}>FCFA</Text>
        </View>
        <Text style={styles.cashHint}>
          Comptez l'argent physique + votre solde MoMo si inclus.
        </Text>
        <View style={styles.keypad}>
          {keypadRows.map((row) => (
            <View key={row.join('-')} style={styles.keypadRow}>
              {row.map((key) => (
                <Pressable
                  key={key}
                  onPress={() => handleKeyPress(key)}
                  style={({ pressed }) => [
                    styles.keypadKey,
                    key !== 'DEL' && key !== 'C' && styles.keypadNumberKey,
                    pressed && styles.keypadKeyPressed,
                  ]}
                >
                  <Text style={[styles.keypadKeyText, key === 'DEL' && styles.keypadDeleteText]}>
                    {key}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>💡 Comment compter</Text>
        <Text style={styles.guideText}>1. Videz votre tiroir-caisse</Text>
        <Text style={styles.guideText}>2. Comptez tous les billets et pieces</Text>
        <Text style={styles.guideText}>3. Ajoutez votre solde MoMo recu pendant cette periode</Text>
        <Text style={styles.guideText}>4. Entrez le total ici</Text>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onBack} style={styles.secondaryButton}>
          <ArrowLeft size={17} color="#475569" />
          <Text style={styles.secondaryText}>Retour</Text>
        </Pressable>
        <Pressable onPress={handleNext} style={styles.primaryButton}>
          <Text style={styles.primaryText}>Calculer l'ecart</Text>
          <ArrowRight size={17} color="#FFFFFF" />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Line({ label, value, danger, strong }: { label: string; value: string; danger?: boolean; strong?: boolean }) {
  return (
    <View style={styles.summaryLine}>
      <Text style={[styles.summaryLabel, strong && styles.summaryStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, danger && styles.summaryDanger, strong && styles.summaryStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  summaryTitle: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  summaryLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  summaryLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  summaryDanger: {
    color: '#DC2626',
  },
  summaryStrong: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  divider: {
    backgroundColor: '#CBD5E1',
    height: 1,
  },
  cashCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#A7F3D0',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  cashIcon: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  cashPrompt: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
    marginTop: 12,
    textAlign: 'center',
  },
  cashInputRow: {
    alignItems: 'flex-end',
    borderBottomColor: '#059669',
    borderBottomWidth: 2,
    flexDirection: 'row',
    marginTop: 18,
    paddingHorizontal: 10,
    paddingBottom: 4,
  },
  cashInput: {
    color: '#0F172A',
    fontSize: 36,
    fontWeight: '900',
    minWidth: 170,
    padding: 0,
    textAlign: 'center',
  },
  currency: {
    color: '#047857',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
  },
  cashHint: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 12,
    textAlign: 'center',
  },
  keypad: {
    gap: 8,
    marginTop: 16,
    width: '100%',
  },
  keypadDeleteText: {
    fontSize: 14,
  },
  keypadKey: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  keypadKeyPressed: {
    backgroundColor: '#D1FAE5',
    borderColor: '#059669',
  },
  keypadKeyText: {
    color: '#0F172A',
    fontSize: 21,
    fontWeight: '900',
  },
  keypadNumberKey: {
    backgroundColor: '#FFFFFF',
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 8,
  },
  guideCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: 16,
    borderWidth: 1,
    gap: 7,
    padding: 14,
  },
  guideTitle: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '900',
  },
  guideText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 52,
  },
  secondaryText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '900',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 14,
    flex: 1.35,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
