import React from 'react';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';

const ACTIVE = '#059669';
const MUTED = '#CBD5E1';

type Props = {
  currentStep: number;
  totalSteps: number;
  labels: string[];
};

export default function FicheProgressBar({ currentStep, totalSteps, labels }: Props) {
  const steps = Array.from({ length: totalSteps }, (_, index) => index + 1);

  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {steps.map((step) => {
          const active = step <= currentStep;
          const connectorActive = step < currentStep;

          return (
            <React.Fragment key={step}>
              <View style={[styles.dot, active ? styles.dotActive : styles.dotInactive]}>
                <Text style={[styles.number, active ? styles.numberActive : styles.numberInactive]}>{step}</Text>
              </View>
              {step < totalSteps ? (
                <View style={[styles.line, connectorActive ? styles.lineActive : styles.lineInactive]} />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>

      <View style={styles.labelsRow}>
        {steps.map((step, index) => (
          <Text
            key={step}
            numberOfLines={1}
            style={[styles.label, step <= currentStep && styles.labelActive]}
          >
            {labels[index]}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingBottom: 10,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 10,
  },
  dot: {
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 2,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  dotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  dotActive: {
    backgroundColor: ACTIVE,
    borderColor: ACTIVE,
  },
  dotInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: MUTED,
  },
  number: {
    fontSize: 12,
    fontWeight: '800',
  },
  numberActive: {
    color: '#FFFFFF',
  },
  numberInactive: {
    color: '#94A3B8',
  },
  label: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  labelActive: {
    color: ACTIVE,
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    minWidth: 8,
  },
  lineActive: {
    backgroundColor: ACTIVE,
  },
  lineInactive: {
    backgroundColor: MUTED,
  },
});
