import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { FICHE_TEMPLATES } from '../../../constants/ficheTemplates';
import type { BusinessFicheType } from '../../../types/fiche.types';

type Props = {
  value?: BusinessFicheType;
  onChange: (type: BusinessFicheType) => void;
};

export default function FicheTypeSelector({ value, onChange }: Props) {
  return (
    <View style={styles.grid}>
      {FICHE_TEMPLATES.map((template) => {
        const selected = value === template.type;
        return (
          <Pressable
            key={template.type}
            onPress={() => onChange(template.type)}
            style={[styles.tile, selected && styles.tileSelected]}
          >
            <View style={styles.tileTop}>
              <Text style={styles.emoji}>{template.emoji}</Text>
              {selected ? <CheckCircle2 size={18} color="#059669" /> : null}
            </View>
            <Text numberOfLines={2} style={[styles.label, selected && styles.labelSelected]}>
              {template.label}
            </Text>
            <Text numberOfLines={2} style={styles.description}>
              {template.description}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 112,
    padding: 12,
    width: '47.8%',
  },
  tileSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
    borderWidth: 2,
  },
  tileTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emoji: {
    fontSize: 24,
  },
  label: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 8,
  },
  labelSelected: {
    color: '#047857',
  },
  description: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
  },
});
