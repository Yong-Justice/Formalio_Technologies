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
import { Check, PackagePlus, Pencil, Plus, Trash2, X } from 'lucide-react-native';
import type { EntreeItem, StockEntry } from '../../../types/fiche.types';
import { calculateStockRow, formatFCFA } from '../../../utils/ficheCalculator';
import { createUuid } from '../../../utils/uuid';

type Props = {
  item: StockEntry;
  onChange: (item: StockEntry) => void;
  onDelete: () => void;
  onEdit: () => void;
};

function parseNumber(value: string) {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function StockRowInput({ item, onChange, onDelete, onEdit }: Props) {
  const [entryOpen, setEntryOpen] = useState(false);
  const [entryQuantity, setEntryQuantity] = useState('');
  const [entryDate, setEntryDate] = useState(todayIso());
  const [entryPrice, setEntryPrice] = useState('');
  const [entrySupplier, setEntrySupplier] = useState('');
  const rowCalc = useMemo(() => calculateStockRow(item), [item]);

  const patch = (updates: Partial<StockEntry>) => {
    const next = { ...item, ...updates };
    const calc = calculateStockRow(next);
    onChange({
      ...next,
      quantiteVendueTheorique: calc.venduTheorique,
      montantTheorique: calc.montantTheorique,
    });
  };

  const addEntry = () => {
    const quantite = parseNumber(entryQuantity);
    if (quantite <= 0) return;
    const nextEntry: EntreeItem = {
      id: createUuid(),
      date: entryDate || todayIso(),
      quantite,
      prixAchat: entryPrice ? parseNumber(entryPrice) : undefined,
      fournisseur: entrySupplier.trim() || undefined,
    };
    patch({ entrees: [...(item.entrees || []), nextEntry] });
    setEntryQuantity('');
    setEntryDate(todayIso());
    setEntryPrice('');
    setEntrySupplier('');
    setEntryOpen(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={styles.title}>{item.productName}</Text>
          <Text style={styles.price}>Prix unitaire: {formatFCFA(item.prixUnitaire)} FCFA</Text>
        </View>
        <Pressable onPress={onEdit} style={styles.iconButton}>
          <Pencil size={17} color="#475569" />
        </Pressable>
        <Pressable onPress={onDelete} style={[styles.iconButton, styles.deleteButton]}>
          <Trash2 size={17} color="#DC2626" />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.inputColumn}>
          <Field
            label="Stock debut"
            unit={item.unit}
            value={String(item.quantiteOuverture || '')}
            onChangeText={(value) => patch({ quantiteOuverture: parseNumber(value) })}
          />
          <Field
            label="Stock fin"
            unit={item.unit}
            value={item.finalStockCounted ? String(item.quantiteFermeture) : ''}
            onChangeText={(value) => patch({ quantiteFermeture: parseNumber(value), finalStockCounted: true })}
          />
        </View>
        <View style={styles.entriesColumn}>
          <Text style={styles.entriesTitle}>Entrees pendant la periode</Text>
          {item.entrees?.length ? (
            item.entrees.map((entry) => (
              <View key={entry.id} style={styles.entryLine}>
                <Text style={styles.entryText}>+ {entry.quantite} {item.unit}</Text>
                <Text style={styles.entryDate}>{entry.date}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyEntry}>Aucune entree ajoutee</Text>
          )}
          <Pressable onPress={() => setEntryOpen(true)} style={styles.addEntryButton}>
            <Plus size={14} color="#047857" />
            <Text style={styles.addEntryText}>Ajouter entree</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.resultBox}>
        {item.finalStockCounted ? (
          <>
        <Text style={styles.resultText}>✅ Vendus theoriques: {rowCalc.venduTheorique} {item.unit}</Text>
        <Text style={styles.resultAmount}>💰 Montant theorique: {formatFCFA(rowCalc.montantTheorique)} FCFA</Text>
          </>
        ) : (
          <Text style={styles.pendingText}>Stock final non saisi. Enregistrez le brouillon et completez plus tard.</Text>
        )}
      </View>

      <Modal visible={entryOpen} transparent animationType="fade" onRequestClose={() => setEntryOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setEntryOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetIcon}><PackagePlus size={20} color="#047857" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Ajouter une entree</Text>
                <Text style={styles.sheetSubtitle}>{item.productName}</Text>
              </View>
              <Pressable onPress={() => setEntryOpen(false)} style={styles.iconButton}>
                <X size={18} color="#64748B" />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
              <ModalField label="Quantite recue" value={entryQuantity} onChangeText={setEntryQuantity} keyboardType="numeric" />
              <ModalField label="Date de reception" value={entryDate} onChangeText={setEntryDate} />
              <ModalField label="Prix d'achat (optionnel)" value={entryPrice} onChangeText={setEntryPrice} keyboardType="numeric" />
              <ModalField label="Fournisseur (optionnel)" value={entrySupplier} onChangeText={setEntrySupplier} />
              <View style={styles.sheetActions}>
                <Pressable onPress={() => setEntryOpen(false)} style={styles.secondaryButton}>
                  <Text style={styles.secondaryText}>Annuler</Text>
                </Pressable>
                <Pressable onPress={addEntry} style={styles.primaryButton}>
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.primaryText}>Confirmer</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function Field({
  label,
  value,
  unit,
  onChangeText,
}: {
  label: string;
  value: string;
  unit: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>📦 {label}</Text>
      <View style={styles.inputBox}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#94A3B8"
          style={styles.input}
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

function ModalField({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View>
      <Text style={styles.modalFieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor="#94A3B8"
        style={styles.modalInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 14,
  },
  title: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  price: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  body: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  inputColumn: {
    flex: 0.88,
    gap: 12,
  },
  entriesColumn: {
    flex: 1,
    gap: 8,
  },
  fieldLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  inputBox: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 46,
    paddingHorizontal: 10,
  },
  input: {
    color: '#0F172A',
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    paddingVertical: 8,
  },
  unit: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  entriesTitle: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '900',
  },
  entryLine: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  entryText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '900',
  },
  entryDate: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  emptyEntry: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
  },
  addEntryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addEntryText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '900',
  },
  resultBox: {
    backgroundColor: '#F8FAFC',
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    gap: 4,
    padding: 14,
  },
  resultText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '900',
  },
  resultAmount: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  pendingText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
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
    maxHeight: '82%',
    padding: 18,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  sheetIcon: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  sheetTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  sheetSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  modalFieldLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  secondaryText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '900',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
