import React, { useEffect, useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Check,
  ChevronRight,
  CreditCard,
  FileText,
  Lock,
  Mic,
  Package,
  Receipt,
  RefreshCw,
  ScanLine,
  Search,
  Smartphone,
  Wallet,
} from 'lucide-react-native';

import { MobileMoneyIcon, getMobileMoneyProvider } from '@/components/momo/MobileMoneyIcon';
import { formalioBackend } from '@/services/api/formalioBackend';
import { getStockUnitEstimate, useStockStore } from '@/store/stockStore';
import type { FicheDraftPayload } from '@/screens/fiche/FicheScreen';
import { styles } from '../styles';
import { c, inputTextMaxScale } from '../theme';
import { formatFCFA } from '../domain/formatters';
import { normalizeSearchText, parseNumberInput } from '../domain/transactions';
import { formatStockPrice, sortStockItems } from '../domain/stock';
import type { Transaction } from '../demoData';
import type { ScannedTicketData, Screen, ShellProps, TransactionSavedHandler, TransactionSaver } from '../contracts';
import {
  Card,
  Field,
  Grid,
  Icon,
  Pill,
  PrimaryButton,
  Row,
  ScreenWrapper,
  Segment,
  Tap,
  Txt,
  useToast,
} from '../shared';

export function AddTransactionScreen({
  shellProps,
  cloudCompanyId,
  transactions,
  setTransactions,
  navigate,
  openVoice,
  openScanner,
  setShowConfetti,
  scannedDraft,
  onScanConsumed,
  pendingFicheDraft,
  onTransactionSaved,
  saveTransaction,
}: {
  shellProps: ShellProps;
  cloudCompanyId: string | null;
  transactions: Transaction[];
  setTransactions: (v: Transaction[]) => void;
  navigate: (s: Screen) => void;
  openVoice: () => void;
  openScanner: () => void;
  setShowConfetti: (v: boolean) => void;
  scannedDraft: ScannedTicketData | null;
  onScanConsumed: () => void;
  pendingFicheDraft: FicheDraftPayload | null;
  onTransactionSaved?: TransactionSavedHandler;
  saveTransaction: TransactionSaver;
}) {
  const { showToast } = useToast();
  const [type, setType] = useState<'income' | 'expense' | 'retrait' | 'fiche'>('income');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [scanPreview, setScanPreview] = useState<ScannedTicketData | null>(null);
  const [method, setMethod] = useState('Espèces');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [revenueSource, setRevenueSource] = useState<'stock' | 'other'>('other');
  const [selectedStockId, setSelectedStockId] = useState('');
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [quantitySold, setQuantitySold] = useState('');
  const [rangeSaleUnitPrice, setRangeSaleUnitPrice] = useState('');
  const [stockError, setStockError] = useState('');
  const stockItems = useStockStore((state) => state.items);
  const decreaseStock = useStockStore((state) => state.decreaseStock);
  const replaceItems = useStockStore((state) => state.replaceItems);
  const isExpense = type === 'expense';
  const isFiche = type === 'fiche';
  const isRetrait = type === 'retrait';
  const stockSaleActive = type === 'income' && revenueSource === 'stock' && stockItems.length > 0;
  const selectedStockItem = useMemo(() => stockItems.find((item) => item.id === selectedStockId), [selectedStockId, stockItems]);
  const stockSearchResults = useMemo(() => {
    const query = normalizeSearchText(stockSearchQuery);
    if (!query) return stockItems;
    return stockItems.filter((item) => normalizeSearchText(item.name).includes(query));
  }, [stockItems, stockSearchQuery]);
  const quantitySoldNumber = parseNumberInput(quantitySold);
  const stockSaleUnitPrice = selectedStockItem?.priceType === 'fixed'
    ? getStockUnitEstimate(selectedStockItem)
    : parseNumberInput(rangeSaleUnitPrice);
  const stockSaleAmount = selectedStockItem && quantitySoldNumber > 0 && stockSaleUnitPrice > 0
    ? quantitySoldNumber * stockSaleUnitPrice
    : 0;
  const stockQuantityError = selectedStockItem && quantitySoldNumber > selectedStockItem.quantity
    ? `Stock insuffisant. Maximum disponible: ${selectedStockItem.quantity}`
    : '';
  const flowAccent = isExpense ? c.danger600 : c.formalio700;
  const flowSoft = isExpense ? c.danger50 : c.formalio50;
  const signedAmount = Number(amount || 0);
  const categories = isExpense ? ['Achats', 'Transport', 'Loyer', 'Salaires', 'Taxes', 'Autres'] : ['Ventes', 'Services', 'Locations', 'Apports', 'Autres'];
  const paymentMethods = [
    { label: 'Espèces', icon: Wallet },
    { label: 'MTN MoMo', icon: Smartphone },
    { label: 'Orange Money', icon: CreditCard },
  ];
  useEffect(() => {
    if (type !== 'income' || stockItems.length === 0) {
      setRevenueSource('other');
    }
  }, [stockItems.length, type]);
  useEffect(() => {
    if (!stockSaleActive) return;
    setAmount(stockSaleAmount > 0 ? String(Math.round(stockSaleAmount)) : '');
  }, [stockSaleActive, stockSaleAmount]);
  useEffect(() => {
    if (!stockSaleActive || !selectedStockItem) return;
    setDesc(`Vente de ${selectedStockItem.name}`);
  }, [selectedStockItem, stockSaleActive]);
  useEffect(() => {
    setStockError('');
  }, [quantitySold, rangeSaleUnitPrice, revenueSource, selectedStockId, type]);
  useEffect(() => {
    if (scanPreview?.type === type) return;
    setCategory('');
  }, [scanPreview, type]);
  useEffect(() => {
    if (!scannedDraft) return;
    setType(scannedDraft.type);
    setRevenueSource('other');
    setAmount(String(scannedDraft.amount));
    setDesc(scannedDraft.description);
    setCategory(scannedDraft.category);
    setMethod(scannedDraft.method);
    setTransactionDate(scannedDraft.date || new Date().toISOString().split('T')[0]);
    setScanPreview(scannedDraft);
    onScanConsumed();
  }, [onScanConsumed, scannedDraft]);
  const handleSave = async () => {
    if (stockSaleActive) {
      if (!selectedStockItem) {
        setStockError('Sélectionnez un article.');
        return showToast({ type: 'error', title: 'Article requis', message: 'Sélectionnez un article en stock.' });
      }
      if (selectedStockItem.quantity <= 0) {
        setStockError('Article en rupture de stock.');
        return showToast({ type: 'error', title: 'Rupture de stock', message: 'Cet article ne peut pas être vendu.' });
      }
      if (quantitySoldNumber < 1) {
        setStockError('Quantité vendue ≥ 1 requise.');
        return showToast({ type: 'error', title: 'Quantité invalide', message: 'Entrez au moins 1 unité vendue.' });
      }
      if (quantitySoldNumber > selectedStockItem.quantity) {
        setStockError(`Stock insuffisant. Maximum disponible: ${selectedStockItem.quantity}`);
        return;
      }
      if (selectedStockItem.priceType === 'range' && stockSaleUnitPrice <= 0) {
        setStockError('Prix de vente unitaire requis.');
        return showToast({ type: 'error', title: 'Prix requis', message: 'Entrez le prix de vente unitaire.' });
      }
      if (stockSaleAmount <= 0) {
        setStockError('Montant calculé invalide.');
        return;
      }
    }

    const finalAmount = stockSaleActive ? Math.round(stockSaleAmount) : Number(amount);
    const finalDescription = stockSaleActive && selectedStockItem ? (desc.trim() || `Vente de ${selectedStockItem.name}`) : desc;
    const finalCategory = stockSaleActive ? 'Ventes' : (category || 'Autres');

    if (!finalAmount || !finalDescription) return showToast({ type: 'error', title: 'Champs manquants', message: 'Montant et description requis' });
    const transactionDraft = {
      date: transactionDate || new Date().toISOString().split('T')[0],
      description: finalDescription,
      category: finalCategory,
      type: isExpense ? 'expense' as const : 'income' as const,
      amount: finalAmount,
      method,
      status: 'completed',
    };
    let savedTransaction: Transaction;
    try {
      savedTransaction = await saveTransaction(transactionDraft);
    } catch (error) {
      return showToast({
        type: 'error',
        title: 'Sauvegarde transaction',
        message: error instanceof Error ? error.message : 'Impossible d enregistrer la transaction.',
      });
    }
    setTransactions([savedTransaction, ...transactions]);
    onTransactionSaved?.(savedTransaction);
    if (stockSaleActive && selectedStockItem) {
      const result = decreaseStock(selectedStockItem.id, quantitySoldNumber);
      if (!result.ok) {
        setStockError(result.error ?? 'Impossible de mettre à jour le stock.');
        return showToast({ type: 'error', title: 'Stock non mis à jour', message: result.error ?? 'Vérifiez la quantité disponible.' });
      }
      if (cloudCompanyId && result.item) {
        try {
          const cloudSaved = await formalioBackend.upsertStockItem(cloudCompanyId, result.item);
          if (cloudSaved) {
            const nextItems = useStockStore.getState().items.map((item) => (item.id === cloudSaved.id ? cloudSaved : item));
            replaceItems(sortStockItems(nextItems));
          }
        } catch (error) {
          showToast({ type: 'error', title: 'Sync cloud stock', message: error instanceof Error ? error.message : 'Stock mis à jour localement.' });
        }
      }
    }
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2500);
    showToast({ type: 'success', title: stockSaleActive ? 'Transaction enregistrée. Stock mis à jour.' : 'Transaction enregistrée !', message: `${isExpense ? '-' : '+'}${finalAmount.toLocaleString('fr-FR')} FCFA` });
    navigate('dashboard');
  };
  return (
    <ScreenWrapper {...shellProps} title="Nouvelle Transaction">
      <View style={{ gap: 16 }}>
        <Segment value={type} onChange={setType} options={[{ key: 'income', label: '+ Revenu' }, { key: 'expense', label: '- Dépense' }, { key: 'retrait', label: '💸 Retrait' }, { key: 'fiche', label: '📋 Fiche' }]} />
        {false ? (
        <Segment value={type} onChange={setType} options={[{ key: 'income', label: '+ Revenu' }, { key: 'expense', label: '- Dépense' }, { key: 'fiche', label: '📋 Fiche' }]} />
        ) : null}
        {isFiche ? (
          <FicheIntroCard pendingDraft={pendingFicheDraft} onStart={() => navigate('fiche')} />
        ) : isRetrait ? (
          <RetraitIntroCard onStart={() => navigate('retrait')} />
        ) : (
          <>
        {!isExpense && stockItems.length > 0 ? (
          <View>
            <Txt weight="medium" style={styles.fieldLabel}>Revenue Source</Txt>
            <Segment value={revenueSource} onChange={setRevenueSource} options={[{ key: 'stock', label: 'Stock', icon: Package }, { key: 'other', label: 'Service', icon: Receipt }]} />
          </View>
        ) : null}
        <View style={[styles.transactionPreview, { borderColor: isExpense ? c.danger200 : c.formalio200, backgroundColor: flowSoft }]}>
          <View style={[styles.transactionPreviewIcon, { backgroundColor: isExpense ? c.danger100 : c.formalio100 }]}>
            <Icon icon={isExpense ? ArrowDownRight : ArrowUpRight} size={18} color={flowAccent} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt weight="semibold" style={{ color: flowAccent, fontSize: 12 }}>{isExpense ? 'Sortie de trésorerie' : 'Entrée de trésorerie'}</Txt>
            <Txt numberOfLines={1} style={{ color: c.surface600, fontSize: 11, marginTop: 2 }}>{isExpense ? 'Les montants seront affichés en négatif avec un accent rouge contrôlé.' : 'Les montants seront affichés en positif avec un accent vert.'}</Txt>
          </View>
          <Txt weight="black" style={{ color: flowAccent, fontSize: 18 }}>
            {isExpense ? '-' : '+'}{signedAmount > 0 ? signedAmount.toLocaleString('fr-FR') : '0'}
          </Txt>
        </View>
        {scanPreview ? (
          <Animated.View entering={FadeIn.duration(180)} style={styles.ocrAutofillCard}>
            <Row style={{ justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <Row style={{ gap: 8 }}>
                <View style={[styles.metricIcon, { backgroundColor: c.info50 }]}><Icon icon={ScanLine} size={16} color={c.info700} /></View>
                <View>
                  <Txt weight="black" style={{ fontSize: 12 }}>Ticket Scanner auto-fill</Txt>
                  <Txt style={{ color: c.surface500, fontSize: 10 }}>{scanPreview.merchant} · {scanPreview.ticketNumber}</Txt>
                </View>
              </Row>
              <Pill tone="blue">OCR 98%</Pill>
            </Row>
            <Grid columns={2} gap={8}>
              <View style={styles.ocrAutofillCell}><Txt style={{ color: c.surface400, fontSize: 10 }}>Reference</Txt><Txt weight="bold" numberOfLines={1} style={{ fontSize: 11 }}>{scanPreview.referenceNumber}</Txt></View>
              <View style={styles.ocrAutofillCell}><Txt style={{ color: c.surface400, fontSize: 10 }}>Date</Txt><Txt weight="bold" numberOfLines={1} style={{ fontSize: 11 }}>{scanPreview.date}</Txt></View>
            </Grid>
            <Txt style={{ color: c.surface600, fontSize: 11, lineHeight: 16, marginTop: 9 }}>{scanPreview.details}</Txt>
            <Row style={{ gap: 8, marginTop: 10 }}>
              <Tap onPress={openScanner} style={styles.ocrRetryButton}><Icon icon={RefreshCw} size={13} color={c.info700} /><Txt weight="bold" style={{ color: c.info700, fontSize: 10 }}>Relancer le scan</Txt></Tap>
              <Tap onPress={() => setScanPreview(null)} style={styles.ocrRetryButton}><Icon icon={FileText} size={13} color={c.surface600} /><Txt weight="bold" style={{ color: c.surface600, fontSize: 10 }}>Saisie manuelle</Txt></Tap>
            </Row>
          </Animated.View>
        ) : null}
        {stockSaleActive ? (
          <>
            <View style={styles.stockSalePanel}>
              <Txt weight="medium" style={styles.fieldLabel}>Article vendu</Txt>
              <View style={styles.inputBox}>
                <Icon icon={Search} size={16} color={c.surface400} />
                <TextInput
                  value={stockSearchQuery}
                  onChangeText={setStockSearchQuery}
                  placeholder="Sélectionner un article..."
                  placeholderTextColor={c.surface400}
                  autoCapitalize="none"
                  maxFontSizeMultiplier={inputTextMaxScale}
                  style={styles.textInput}
                />
              </View>
              <View style={styles.stockSaleList}>
                {stockSearchResults.map((item) => {
                  const selected = item.id === selectedStockId;
                  const outOfStock = item.quantity <= 0;
                  return (
                    <Tap
                      key={item.id}
                      disabled={outOfStock}
                      onPress={() => setSelectedStockId(item.id)}
                      style={[styles.stockSaleOption, selected && styles.stockSaleOptionSelected, outOfStock && styles.stockSaleOptionDisabled]}
                    >
                      <Row style={{ justifyContent: 'space-between', gap: 10 }}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Txt weight="bold" numberOfLines={1} style={{ color: outOfStock ? c.surface400 : c.surface800, fontSize: 12 }}>{item.name}</Txt>
                          <Txt style={{ color: outOfStock ? c.surface400 : c.surface500, fontSize: 11, marginTop: 2 }}>Stock: {item.quantity} unités</Txt>
                        </View>
                        <Pill tone={outOfStock ? 'surface' : selected ? 'green' : 'blue'}>{outOfStock ? 'Rupture de stock' : formatStockPrice(item)}</Pill>
                      </Row>
                    </Tap>
                  );
                })}
                {stockSearchResults.length === 0 ? (
                  <View style={styles.stockSaleOptionDisabled}>
                    <Txt style={{ color: c.surface500, fontSize: 12, textAlign: 'center' }}>Aucun article trouvé.</Txt>
                  </View>
                ) : null}
              </View>
              {stockError && !stockQuantityError ? <Txt style={{ color: c.danger600, fontSize: 10, marginTop: 5 }}>{stockError}</Txt> : null}
            </View>
            <Field label="Quantité vendue" value={quantitySold} onChangeText={setQuantitySold} placeholder="1" keyboardType="numeric" error={stockQuantityError || undefined} />
            {selectedStockItem?.priceType === 'range' ? (
              <View style={{ gap: 6 }}>
                <Field
                  label="Prix de vente unitaire (FCFA)"
                  value={rangeSaleUnitPrice}
                  onChangeText={setRangeSaleUnitPrice}
                  placeholder={`Ex: 1800 FCFA (estimé entre ${formatFCFA(selectedStockItem.minPrice ?? 0).replace(' FCFA', '')} et ${formatFCFA(selectedStockItem.maxPrice ?? 0)})`}
                  keyboardType="numeric"
                />
                <Txt style={{ color: c.surface500, fontSize: 11 }}>Fourchette enregistrée: {formatFCFA(selectedStockItem.minPrice ?? 0).replace(' FCFA', '')} - {formatFCFA(selectedStockItem.maxPrice ?? 0)}</Txt>
              </View>
            ) : null}
            {selectedStockItem?.priceType === 'fixed' ? (
              <Row style={styles.autoCalcHint}>
                <Icon icon={Lock} size={13} color={c.info700} />
                <Txt weight="bold" style={{ color: c.info700, fontSize: 11 }}>Calculé automatiquement: {formatFCFA(getStockUnitEstimate(selectedStockItem))} × quantité</Txt>
              </Row>
            ) : null}
            <Field
              label="Montant (FCFA)"
              value={amount}
              onChangeText={() => undefined}
              placeholder="0"
              keyboardType="numeric"
              large
              editable={false}
              right={<Row style={styles.lockedFieldBadge}><Icon icon={Lock} size={12} color={c.info700} /><Txt weight="black" style={{ color: c.info700, fontSize: 9 }}>Calculé automatiquement</Txt></Row>}
            />
            <Field label="Description" value={desc} onChangeText={setDesc} placeholder="Vente de ..." />
            <Field label="Date" value={transactionDate} onChangeText={setTransactionDate} placeholder="YYYY-MM-DD" />
          </>
        ) : (
          <>
            <Field label="Montant (FCFA)" value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" large />
            <Field label="Description" value={desc} onChangeText={setDesc} placeholder="Ex: Vente de tissus" />
            <Field label="Date" value={transactionDate} onChangeText={setTransactionDate} placeholder="YYYY-MM-DD" />
            <View>
              <Txt weight="medium" style={styles.fieldLabel}>Catégorie</Txt>
              <View style={styles.chipWrapLeft}>
                {categories.map((cat) => (
                  <Tap key={cat} onPress={() => setCategory(cat)} style={[styles.selectChip, category === cat && (isExpense ? styles.selectChipExpenseActive : styles.selectChipActive)]}>
                    <Row style={{ gap: 6 }}>
                      {category === cat ? <View style={[styles.tinyDot, { backgroundColor: flowAccent }]} /> : null}
                      <Txt weight="medium" style={{ color: category === cat ? flowAccent : c.surface600, fontSize: 12 }}>{cat}</Txt>
                    </Row>
                  </Tap>
                ))}
              </View>
            </View>
          </>
        )}
        <View>
          <Txt weight="medium" style={styles.fieldLabel}>Mode de paiement</Txt>
          <Grid columns={3} gap={8}>
            {paymentMethods.map((m) => (
              <Tap key={m.label} onPress={() => setMethod(m.label)} style={[styles.choiceCard, method === m.label && (isExpense ? styles.choiceSelectedExpense : styles.choiceSelected)]}>
                {getMobileMoneyProvider(m.label) ? (
                  <MobileMoneyIcon method={m.label} size={32} containerStyle={[styles.choiceIcon, styles.mobileMoneyChoiceIcon, method === m.label && { borderColor: flowAccent }]} />
                ) : (
                  <View style={[styles.choiceIcon, { backgroundColor: method === m.label ? flowSoft : c.surface50 }]}>
                    <Icon icon={m.icon} size={16} color={method === m.label ? flowAccent : c.surface500} />
                  </View>
                )}
                <Txt weight="medium" style={{ color: method === m.label ? flowAccent : c.surface600, fontSize: 11, textAlign: 'center' }}>{m.label}</Txt>
              </Tap>
            ))}
          </Grid>
        </View>
        <View style={styles.addTransactionActions}>
          <PrimaryButton label="Saisie vocale Mosika AI" icon={Mic} onPress={openVoice} style={styles.formActionButton} />
          <PrimaryButton label="Scanner ticket, document ou reçu" tone="outline" icon={ScanLine} onPress={openScanner} style={styles.formActionButton} />
          <PrimaryButton label={isExpense ? 'Enregistrer la dépense' : 'Enregistrer le revenu'} tone={isExpense ? 'danger' : 'green'} icon={Check} onPress={handleSave} style={styles.formActionButton} />
        </View>
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}

function RetraitIntroCard({ onStart }: { onStart: () => void }) {
  return (
    <Card style={styles.ficheIntroCard}>
      <View style={[styles.ficheIntroIcon, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
        <Icon icon={Banknote} size={26} color="#F97316" />
      </View>
      <Txt weight="black" style={styles.ficheIntroTitle}>💸 Retrait de caisse</Txt>
      <Txt style={styles.ficheIntroCopy}>
        Notez immédiatement l'argent qui sort de la caisse pour garder le solde juste.
      </Txt>
      <View style={styles.ficheIntroMeta}>
        <Txt weight="bold" style={styles.ficheIntroMetaText}>🏠 Domicile, banque, stock, fournisseur</Txt>
        <Txt weight="bold" style={styles.ficheIntroMetaText}>📊 Le solde de caisse se met à jour automatiquement</Txt>
      </View>
      <PrimaryButton label="Commencer le retrait" icon={ChevronRight} tone="green" onPress={onStart} style={{ marginTop: 4 }} />
    </Card>
  );
}

function FicheIntroCard({ pendingDraft, onStart }: { pendingDraft: FicheDraftPayload | null; onStart: () => void }) {
  return (
    <Card style={styles.ficheIntroCard}>
      <View style={styles.ficheIntroIcon}>
        <Icon icon={FileText} size={26} color={c.formalio700} />
      </View>
      <Txt weight="black" style={styles.ficheIntroTitle}>📋 Fiche de Réconciliation</Txt>
      <Txt style={styles.ficheIntroCopy}>
        Réconciliez votre caisse en 5 minutes. Idéal pour les bars, restaurants, boutiques et prestataires.
      </Txt>
      <View style={styles.ficheIntroMeta}>
        <Txt weight="bold" style={styles.ficheIntroMetaText}>⏱️ Durée: 3-5 minutes</Txt>
        <Txt weight="bold" style={styles.ficheIntroMetaText}>📊 Résultat: écart caisse + rapport</Txt>
      </View>
      {pendingDraft ? (
        <View style={styles.fichePendingCard}>
          <Txt weight="black" style={{ color: c.amber700, fontSize: 12 }}>Fiche en cours</Txt>
          <Txt style={{ color: c.surface700, fontSize: 11, marginTop: 3 }}>
            Du {pendingDraft.data.dateDebut || 'debut'} au {pendingDraft.data.dateFin || 'fin'} - en attente du stock final
          </Txt>
        </View>
      ) : null}
      <PrimaryButton label={pendingDraft ? 'Continuer la fiche' : 'Commencer la fiche'} icon={ChevronRight} tone="green" onPress={onStart} style={{ marginTop: 4 }} />
    </Card>
  );
}
