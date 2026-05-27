import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react-native';
import FicheTypeSelector from './components/FicheTypeSelector';
import { FICHE_TEMPLATES, PERIOD_OPTIONS } from '../../constants/ficheTemplates';
import type { BusinessFicheType, FicheData, PeriodType, ServiceEntry, StockEntry } from '../../types/fiche.types';
import { createUuid } from '../../utils/uuid';

type Props = {
  data: Partial<FicheData>;
  onUpdate: (updates: Partial<FicheData>) => void;
  onNext: () => void;
  onCancel?: () => void;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function labelDate(isoDate: string) {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function createStockItem(item: Partial<StockEntry>): StockEntry {
  return {
    id: createUuid(),
    productName: item.productName || 'Produit',
    unit: item.unit || 'unite',
    quantiteOuverture: item.quantiteOuverture || 0,
    entrees: item.entrees || [],
    quantiteFermeture: item.quantiteFermeture || 0,
    finalStockCounted: item.finalStockCounted || false,
    prixUnitaire: item.prixUnitaire || 0,
    quantiteVendueTheorique: 0,
    montantTheorique: 0,
  };
}

function createServiceItem(item: Partial<ServiceEntry>): ServiceEntry {
  return {
    id: createUuid(),
    serviceName: item.serviceName || 'Service',
    nombreRealise: item.nombreRealise || 0,
    prixUnitaire: item.prixUnitaire || 0,
    montantTotal: 0,
  };
}

export default function FicheStep1Period({ data, onUpdate, onNext, onCancel }: Props) {
  const [ficheType, setFicheType] = useState<BusinessFicheType | undefined>(data.ficheType);
  const [periodType, setPeriodType] = useState<PeriodType | undefined>(data.periodType);
  const [dateDebut, setDateDebut] = useState(data.dateDebut || todayIso());
  const [dateFin, setDateFin] = useState(data.dateFin || todayIso());

  const selectedPeriod = useMemo(
    () => PERIOD_OPTIONS.find((period) => period.value === periodType),
    [periodType],
  );
  const selectedTemplate = useMemo(
    () => FICHE_TEMPLATES.find((template) => template.type === ficheType),
    [ficheType],
  );

  useEffect(() => {
    if (!selectedPeriod || selectedPeriod.value === 'personnalise') return;
    setDateFin(addDays(dateDebut, selectedPeriod.days - 1));
  }, [dateDebut, selectedPeriod]);

  const canContinue = Boolean(ficheType && periodType);

  const handleNext = () => {
    if (!canContinue || !selectedTemplate || !ficheType || !periodType) return;
    const now = data.createdAt || Date.now();
    onUpdate({
      id: data.id || createUuid(),
      ficheType,
      periodType,
      dateDebut,
      dateFin,
      stockItems: selectedTemplate.defaultStockItems.map(createStockItem),
      serviceItems: selectedTemplate.defaultServiceItems.map(createServiceItem),
      expenses: data.expenses || [],
      status: 'in_progress',
      createdAt: now,
      updatedAt: Date.now(),
      isSynced: false,
    });
    onNext();
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        {onCancel ? (
          <Pressable onPress={onCancel} style={styles.backButton}>
            <ArrowLeft size={20} color="#475569" />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>📋 Nouvelle Fiche</Text>
          <Text style={styles.subtitle}>Etape 1 sur 5 - Choisissez la periode</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Type de commerce</Text>
        <FicheTypeSelector value={ficheType} onChange={setFicheType} />
        {selectedTemplate ? <Text style={styles.hint}>{selectedTemplate.hint}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Periode de reconciliation</Text>
        <View style={styles.periodGrid}>
          {PERIOD_OPTIONS.map((period) => {
            const selected = periodType === period.value;
            return (
              <Pressable
                key={period.value}
                onPress={() => setPeriodType(period.value)}
                style={[styles.periodPill, selected && styles.periodPillActive]}
              >
                <View style={[styles.radio, selected && styles.radioActive]} />
                <Text style={[styles.periodText, selected && styles.periodTextActive]}>{period.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date de debut</Text>
        <DateInput value={dateDebut} onChangeText={setDateDebut} />
        <Text style={styles.datePreview}>{labelDate(dateDebut)}</Text>

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Date de fin</Text>
        <DateInput
          value={dateFin}
          onChangeText={setDateFin}
          editable={periodType === 'personnalise'}
        />
        <Text style={styles.datePreview}>
          {periodType === 'personnalise' ? labelDate(dateFin) : `${labelDate(dateFin)} (calculee automatiquement)`}
        </Text>
      </View>

      <Pressable
        onPress={handleNext}
        disabled={!canContinue}
        style={[styles.primaryButton, !canContinue && styles.disabledButton]}
      >
        <Text style={styles.primaryText}>Suivant</Text>
        <ArrowRight size={18} color="#FFFFFF" />
      </Pressable>
    </ScrollView>
  );
}

function DateInput({
  value,
  onChangeText,
  editable = true,
}: {
  value: string;
  onChangeText: (value: string) => void;
  editable?: boolean;
}) {
  return (
    <View style={[styles.dateInput, !editable && styles.dateInputDisabled]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#94A3B8"
        style={styles.dateTextInput}
      />
      <CalendarDays size={18} color="#64748B" />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  title: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  hint: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderRadius: 12,
    borderWidth: 1,
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    padding: 12,
  },
  periodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodPill: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  periodPillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  radio: {
    borderColor: '#CBD5E1',
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    width: 12,
  },
  radioActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  periodText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
  },
  periodTextActive: {
    color: '#047857',
  },
  dateInput: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: 12,
  },
  dateInputDisabled: {
    backgroundColor: '#F1F5F9',
  },
  dateTextInput: {
    color: '#0F172A',
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
  },
  datePreview: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 54,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
