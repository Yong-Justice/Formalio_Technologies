import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { EXPENSE_CATEGORY_LABELS } from '../../../constants/ficheTemplates';
import type { ExpenseItem } from '../../../types/fiche.types';
import { formatFCFA } from '../../../utils/ficheCalculator';

type Props = {
  item: ExpenseItem;
  onDelete: () => void;
};

export default function ExpenseRowInput({ item, onDelete }: Props) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={styles.title}>
          {EXPENSE_CATEGORY_LABELS[item.category]}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {item.description || item.date}
        </Text>
      </View>
      <Text style={styles.amount}>{formatFCFA(item.montant)} FCFA</Text>
      <Pressable onPress={onDelete} hitSlop={10} style={styles.deleteButton}>
        <Trash2 size={18} color="#DC2626" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
  },
  title: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 3,
  },
  amount: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});
