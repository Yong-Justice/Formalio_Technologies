import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowLeft, ArrowRight, Check, Plus, X } from 'lucide-react-native';
import ExpenseRowInput from './components/ExpenseRowInput';
import { EXPENSE_CATEGORY_LABELS, FICHE_TEMPLATES } from '../../constants/ficheTemplates';
import type { ExpenseCategory, ExpenseItem, FicheData } from '../../types/fiche.types';
import { formatFCFA } from '../../utils/ficheCalculator';
import { createUuid } from '../../utils/uuid';

type Props = {
  data: Partial<FicheData>;
  onUpdate: (updates: Partial<FicheData>) => void;
  onNext: () => void;
  onBack: () => void;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function parseNumber(value: string) {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPeriod(data: Partial<FicheData>) {
  if (!data.dateDebut || !data.dateFin) return 'Periode selectionnee';
  return `Du ${data.dateDebut} au ${data.dateFin}`;
}

export default function FicheStep3Expenses({ data, onUpdate, onNext, onBack }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const template = FICHE_TEMPLATES.find((candidate) => candidate.type === data.ficheType);
  const defaultCategory = template?.defaultExpenseCategories[0] || 'transport';
  const [category, setCategory] = useState<ExpenseCategory>(defaultCategory);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayIso());
  const expenses = data.expenses || [];
  const total = useMemo(() => expenses.reduce((sum, expense) => sum + expense.montant, 0), [expenses]);
  const categories = useMemo(() => {
    const defaults = template?.defaultExpenseCategories || [];
    const all = Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[];
    return [...defaults, ...all.filter((item) => !defaults.includes(item))];
  }, [template]);

  const resetForm = () => {
    setCategory(defaultCategory);
    setAmount('');
    setDescription('');
    setDate(todayIso());
  };

  const saveExpense = () => {
    const montant = parseNumber(amount);
    if (montant <= 0) return;
    const next: ExpenseItem = {
      id: createUuid(),
      category,
      montant,
      description: description.trim() || EXPENSE_CATEGORY_LABELS[category].replace(/^.\s/, ''),
      date: date || todayIso(),
    };
    onUpdate({ expenses: [...expenses, next] });
    resetForm();
    setModalOpen(false);
  };

  const deleteExpense = (id: string) => {
    onUpdate({ expenses: expenses.filter((expense) => expense.id !== id) });
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.title}>💸 Depenses de la periode</Text>
          <Text style={styles.subtitle}>{formatPeriod(data)}</Text>
        </View>

        <View style={styles.card}>
          {expenses.length ? (
            expenses.map((expense) => (
              <ExpenseRowInput key={expense.id} item={expense} onDelete={() => deleteExpense(expense.id)} />
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Aucune depense ajoutee pour cette fiche.</Text>
            </View>
          )}

          <Pressable onPress={() => setModalOpen(true)} style={styles.addExpenseButton}>
            <Plus size={16} color="#047857" />
            <Text style={styles.addExpenseText}>Ajouter une depense</Text>
          </Pressable>

          <View style={styles.totalLine} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total depenses</Text>
            <Text style={styles.totalAmount}>{formatFCFA(total)} FCFA</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={onBack} style={styles.secondaryButton}>
            <ArrowLeft size={17} color="#475569" />
            <Text style={styles.secondaryText}>Retour</Text>
          </Pressable>
          <Pressable onPress={onNext} style={styles.primaryButton}>
            <Text style={styles.primaryText}>Suivant</Text>
            <ArrowRight size={17} color="#FFFFFF" />
          </Pressable>
        </View>

        <Pressable onPress={onNext} style={styles.skipButton}>
          <Text style={styles.skipText}>Passer cette etape</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setModalOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Ajouter une depense</Text>
              <Pressable onPress={() => setModalOpen(false)} style={styles.closeButton}>
                <X size={18} color="#64748B" />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14 }}>
              <View>
                <Text style={styles.modalLabel}>Categorie</Text>
                <View style={styles.categoryGrid}>
                  {categories.map((item) => {
                    const selected = item === category;
                    return (
                      <Pressable
                        key={item}
                        onPress={() => setCategory(item)}
                        style={[styles.categoryPill, selected && styles.categoryPillActive]}
                      >
                        <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>
                          {EXPENSE_CATEGORY_LABELS[item]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <ModalField label="Montant (FCFA)" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" />
              <ModalField label="Description" value={description} onChangeText={setDescription} placeholder="Ex: Transport marche" />
              <ModalField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
              <View style={styles.sheetActions}>
                <Pressable onPress={() => setModalOpen(false)} style={styles.cancelButton}>
                  <Text style={styles.cancelText}>Annuler</Text>
                </Pressable>
                <Pressable onPress={saveExpense} style={styles.confirmButton}>
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.confirmText}>Confirmer</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function ModalField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View>
      <Text style={styles.modalLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={styles.modalInput}
      />
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
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 14,
  },
  emptyBox: {
    alignItems: 'center',
    padding: 18,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  addExpenseButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 13,
  },
  addExpenseText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '900',
  },
  totalLine: {
    backgroundColor: '#E2E8F0',
    height: 1,
  },
  totalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
  },
  totalLabel: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  totalAmount: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '900',
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
    flex: 1,
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
  skipButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  skipText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,.35)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '84%',
    padding: 18,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  modalLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  categoryPillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  categoryText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
  },
  categoryTextActive: {
    color: '#047857',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    minHeight: 50,
    paddingHorizontal: 12,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 13,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '900',
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 13,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 50,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
