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
import { ArrowLeft, ArrowRight, Check, Plus, Scissors, X } from 'lucide-react-native';
import StockRowInput from './components/StockRowInput';
import { FICHE_TEMPLATES } from '../../constants/ficheTemplates';
import type { FicheData, ServiceEntry, StockEntry } from '../../types/fiche.types';
import { calculateFiche, calculateServiceRow, calculateStockRow, formatFCFA } from '../../utils/ficheCalculator';
import { createUuid } from '../../utils/uuid';

type Props = {
  data: Partial<FicheData>;
  onUpdate: (updates: Partial<FicheData>) => void;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft?: () => void;
};

function parseNumber(value: string) {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function completeStockItem(item: Partial<StockEntry>): StockEntry {
  const base: StockEntry = {
    id: item.id || createUuid(),
    productName: item.productName || 'Produit',
    unit: item.unit || 'unite',
    quantiteOuverture: item.quantiteOuverture || 0,
    entrees: item.entrees || [],
    quantiteFermeture: item.quantiteFermeture || 0,
    finalStockCounted: item.finalStockCounted || false,
    prixUnitaire: item.prixUnitaire || 0,
    quantiteVendueTheorique: item.quantiteVendueTheorique || 0,
    montantTheorique: item.montantTheorique || 0,
  };
  const calc = calculateStockRow(base);
  return { ...base, quantiteVendueTheorique: calc.venduTheorique, montantTheorique: calc.montantTheorique };
}

function completeServiceItem(item: Partial<ServiceEntry>): ServiceEntry {
  const base: ServiceEntry = {
    id: item.id || createUuid(),
    serviceName: item.serviceName || 'Service',
    nombreRealise: item.nombreRealise || 0,
    prixUnitaire: item.prixUnitaire || 0,
    montantTotal: item.montantTotal || 0,
  };
  return { ...base, montantTotal: calculateServiceRow(base) };
}

export default function FicheStep2Stock({ data, onUpdate, onNext, onBack, onSaveDraft }: Props) {
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StockEntry | null>(null);
  const [editingService, setEditingService] = useState<ServiceEntry | null>(null);
  const [productName, setProductName] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');

  const stockItems = data.stockItems || [];
  const serviceItems = data.serviceItems || [];
  const template = FICHE_TEMPLATES.find((candidate) => candidate.type === data.ficheType);
  const hasStock = Boolean(template?.hasStock || stockItems.length);
  const hasServices = Boolean(template?.hasServices || serviceItems.length);
  const result = useMemo(() => calculateFiche(data), [data]);
  const missingFinalStockCount = hasStock && stockItems.some((item) => !item.finalStockCounted);
  const canContinue = !missingFinalStockCount;
  const productSuggestions = (template?.defaultStockItems || []).filter((suggestion) => {
    return !stockItems.some((item) => item.productName.toLowerCase() === (suggestion.productName || '').toLowerCase());
  });

  const updateStockItems = (items: StockEntry[]) => {
    onUpdate({ stockItems: items.map(completeStockItem) });
  };

  const updateServiceItems = (items: ServiceEntry[]) => {
    onUpdate({ serviceItems: items.map(completeServiceItem) });
  };

  const openProductModal = (item?: StockEntry) => {
    setEditingProduct(item || null);
    setProductName(item?.productName || '');
    setUnit(item?.unit || '');
    setPrice(item?.prixUnitaire ? String(item.prixUnitaire) : '');
    setProductModalOpen(true);
  };

  const saveProduct = () => {
    if (!productName.trim()) return;
    const nextItem = completeStockItem({
      ...(editingProduct || {}),
      productName: productName.trim(),
      unit: unit.trim() || 'unite',
      prixUnitaire: parseNumber(price),
    });
    updateStockItems(
      editingProduct
        ? stockItems.map((item) => (item.id === editingProduct.id ? nextItem : item))
        : [...stockItems, nextItem],
    );
    setProductModalOpen(false);
  };

  const openServiceModal = (item?: ServiceEntry) => {
    setEditingService(item || null);
    setServiceName(item?.serviceName || '');
    setServicePrice(item?.prixUnitaire ? String(item.prixUnitaire) : '');
    setServiceModalOpen(true);
  };

  const saveService = () => {
    if (!serviceName.trim()) return;
    const nextItem = completeServiceItem({
      ...(editingService || {}),
      serviceName: serviceName.trim(),
      prixUnitaire: parseNumber(servicePrice),
    });
    updateServiceItems(
      editingService
        ? serviceItems.map((item) => (item.id === editingService.id ? nextItem : item))
        : [...serviceItems, nextItem],
    );
    setServiceModalOpen(false);
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Articles et services</Text>
            <Text style={styles.subtitle}>Etape 2 sur 5 - Entrez les ventes theoriques</Text>
          </View>
        </View>

        {template ? (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>{template.emoji} {template.hint}</Text>
          </View>
        ) : null}

        {hasStock ? (
          <View style={styles.section}>
            <SectionHeader title="Stock / produits" actionLabel="Ajouter" onPress={() => openProductModal()} />
            {stockItems.length ? (
              stockItems.map((item) => (
                <StockRowInput
                  key={item.id}
                  item={item}
                  onChange={(next) => updateStockItems(stockItems.map((current) => (current.id === item.id ? next : current)))}
                  onDelete={() => updateStockItems(stockItems.filter((current) => current.id !== item.id))}
                  onEdit={() => openProductModal(item)}
                />
              ))
            ) : (
              <EmptyBox text="Ajoutez votre premier produit pour calculer les ventes theoriques." />
            )}
          </View>
        ) : null}

        {hasStock && hasServices ? <View style={styles.separator} /> : null}

        {hasServices ? (
          <View style={styles.section}>
            <SectionHeader title="Services realises" actionLabel="Ajouter" onPress={() => openServiceModal()} />
            {serviceItems.length ? (
              serviceItems.map((item) => (
                <ServiceRow
                  key={item.id}
                  item={item}
                  onChange={(next) => updateServiceItems(serviceItems.map((current) => (current.id === item.id ? next : current)))}
                  onDelete={() => updateServiceItems(serviceItems.filter((current) => current.id !== item.id))}
                  onEdit={() => openServiceModal(item)}
                />
              ))
            ) : (
              <EmptyBox text="Ajoutez un service pour suivre les clients servis." />
            )}
          </View>
        ) : null}

        {missingFinalStockCount ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>Stock final requis avant validation</Text>
            <Text style={styles.warningText}>
              Vous pouvez enregistrer ce brouillon maintenant. Revenez plus tard pour saisir le stock de fin et continuer.
            </Text>
          </View>
        ) : null}

        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>Total revenus theoriques</Text>
            <Text style={styles.totalAmount}>{formatFCFA(result.totalRevenusTheoriques)} FCFA</Text>
          </View>
          <Pressable onPress={onSaveDraft} style={styles.draftButton}>
            <Text style={styles.draftText}>Save Draft</Text>
          </Pressable>
          <Pressable disabled={!canContinue} onPress={onNext} style={[styles.nextButton, !canContinue && styles.nextButtonDisabled]}>
            <Text style={styles.nextText}>{canContinue ? 'Suivant' : 'Stock final requis'}</Text>
            {canContinue ? <ArrowRight size={17} color="#FFFFFF" /> : null}
          </Pressable>
        </View>

        <Pressable onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={17} color="#475569" />
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={productModalOpen} transparent animationType="fade" onRequestClose={() => setProductModalOpen(false)}>
        <Sheet onClose={() => setProductModalOpen(false)} title={editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}>
          {productSuggestions.length > 0 && !editingProduct ? (
            <View style={styles.suggestions}>
              <Text style={styles.modalLabel}>Suggestions</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {productSuggestions.map((suggestion) => (
                  <Pressable
                    key={suggestion.productName}
                    onPress={() => {
                      setProductName(suggestion.productName || '');
                      setUnit(suggestion.unit || '');
                      setPrice(String(suggestion.prixUnitaire || ''));
                    }}
                    style={styles.suggestionPill}
                  >
                    <Text style={styles.suggestionText}>{suggestion.productName}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
          <ModalField label="Nom du produit" value={productName} onChangeText={setProductName} placeholder="Ex: Primus 65cl" />
          <ModalField label="Unite" value={unit} onChangeText={setUnit} placeholder="Ex: bouteille, kg, piece" />
          <ModalField label="Prix unitaire (FCFA)" value={price} onChangeText={setPrice} placeholder="600" keyboardType="numeric" />
          <Pressable onPress={saveProduct} style={styles.saveButton}>
            <Check size={17} color="#FFFFFF" />
            <Text style={styles.saveText}>{editingProduct ? 'Enregistrer' : 'Ajouter le produit'}</Text>
          </Pressable>
        </Sheet>
      </Modal>

      <Modal visible={serviceModalOpen} transparent animationType="fade" onRequestClose={() => setServiceModalOpen(false)}>
        <Sheet onClose={() => setServiceModalOpen(false)} title={editingService ? 'Modifier le service' : 'Ajouter un service'}>
          <ModalField label="Nom du service" value={serviceName} onChangeText={setServiceName} placeholder="Ex: Coupe homme" />
          <ModalField label="Prix unitaire (FCFA)" value={servicePrice} onChangeText={setServicePrice} placeholder="500" keyboardType="numeric" />
          <Pressable onPress={saveService} style={styles.saveButton}>
            <Check size={17} color="#FFFFFF" />
            <Text style={styles.saveText}>{editingService ? 'Enregistrer' : 'Ajouter le service'}</Text>
          </Pressable>
        </Sheet>
      </Modal>
    </>
  );
}

function SectionHeader({ title, actionLabel, onPress }: { title: string; actionLabel: string; onPress: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onPress} style={styles.addButton}>
        <Plus size={15} color="#047857" />
        <Text style={styles.addButtonText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function ServiceRow({
  item,
  onChange,
  onDelete,
  onEdit,
}: {
  item: ServiceEntry;
  onChange: (item: ServiceEntry) => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const montant = calculateServiceRow(item);
  const patchQuantity = (value: string) => {
    const next = completeServiceItem({ ...item, nombreRealise: parseNumber(value) });
    onChange(next);
  };

  return (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceIcon}><Scissors size={17} color="#047857" /></View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={styles.serviceTitle}>{item.serviceName}</Text>
          <Text style={styles.servicePrice}>Prix: {formatFCFA(item.prixUnitaire)} FCFA</Text>
        </View>
        <Pressable onPress={onEdit} style={styles.smallIconButton}><Text style={styles.smallIconText}>✏️</Text></Pressable>
        <Pressable onPress={onDelete} style={styles.smallIconButton}><Text style={styles.smallIconText}>🗑️</Text></Pressable>
      </View>
      <View style={styles.serviceInputRow}>
        <Text style={styles.serviceLabel}>Nombre de clients</Text>
        <TextInput
          value={item.nombreRealise ? String(item.nombreRealise) : ''}
          onChangeText={patchQuantity}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#94A3B8"
          style={styles.serviceInput}
        />
      </View>
      <Text style={styles.serviceTotal}>Montant: {formatFCFA(montant)} FCFA ✅</Text>
    </View>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function Sheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
      <Pressable onPress={onClose} style={styles.modalBackdrop} />
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <X size={18} color="#64748B" />
          </Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
          {children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        style={styles.modalInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  hintBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  hintText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  addButtonText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '900',
  },
  separator: {
    backgroundColor: '#CBD5E1',
    height: 1,
    marginVertical: 2,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  warningTitle: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '900',
  },
  warningText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 1,
    padding: 18,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  serviceHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  serviceIcon: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 11,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  serviceTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  servicePrice: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  smallIconButton: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  smallIconText: {
    fontSize: 16,
  },
  serviceInputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  serviceLabel: {
    color: '#334155',
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  serviceInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    minHeight: 48,
    paddingHorizontal: 12,
    textAlign: 'center',
    width: 100,
  },
  serviceTotal: {
    color: '#047857',
    fontSize: 14,
    fontWeight: '900',
  },
  totalCard: {
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
  },
  totalLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '800',
  },
  totalAmount: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  nextButton: {
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 13,
    flexDirection: 'row',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  nextButtonDisabled: {
    backgroundColor: '#64748B',
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  draftButton: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  draftText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '900',
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 8,
  },
  backText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '900',
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
  suggestions: {
    gap: 8,
  },
  suggestionPill: {
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '900',
  },
  modalLabel: {
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
    fontWeight: '800',
    minHeight: 50,
    paddingHorizontal: 12,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 52,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
