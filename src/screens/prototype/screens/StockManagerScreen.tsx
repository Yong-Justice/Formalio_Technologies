import React, { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Check, Package, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react-native';

import { formalioBackend } from '@/services/api/formalioBackend';
import { getStockItemValue, getTotalStockValue, useStockStore, type StockItem, type StockPriceType } from '@/store/stockStore';
import { styles } from '../styles';
import { c, inputTextMaxScale, isAndroidNative } from '../theme';
import { formatFCFA } from '../domain/formatters';
import { normalizeSearchText, parseNumberInput } from '../domain/transactions';
import { formatStockCompactValue, formatStockPrice, getStockMarketFlags, sortStockItems } from '../domain/stock';
import type { ShellProps } from '../contracts';
import {
  Card,
  Field,
  Grid,
  Icon,
  ModalShell,
  Pill,
  PrimaryButton,
  Row,
  ScreenWrapper,
  Segment,
  Tap,
  Txt,
  useToast,
} from '../shared';

export function StockManagerScreen({ shellProps, cloudCompanyId }: { shellProps: ShellProps; cloudCompanyId: string | null }) {
  return (
    <ScreenWrapper {...shellProps} title="Gestionnaire de Stock">
      <StockManagerPanel cloudCompanyId={cloudCompanyId} />
    </ScreenWrapper>
  );
}

export function StockManagerPanel({ embedded = false, cloudCompanyId = null }: { embedded?: boolean; cloudCompanyId?: string | null }) {
  const { showToast } = useToast();
  const items = useStockStore((state) => state.items);
  const upsertItem = useStockStore((state) => state.upsertItem);
  const deleteItem = useStockStore((state) => state.deleteItem);
  const replaceItems = useStockStore((state) => state.replaceItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [priceType, setPriceType] = useState<StockPriceType>('fixed');
  const [unitPrice, setUnitPrice] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [stockSyncing, setStockSyncing] = useState(false);
  const filteredItems = useMemo(() => {
    const query = normalizeSearchText(searchQuery);
    if (!query) return items;
    return items.filter((item) => normalizeSearchText(item.name).includes(query));
  }, [items, searchQuery]);
  const totalValue = useMemo(() => getTotalStockValue(items), [items]);

  const resetForm = () => {
    setEditingItem(null);
    setItemName('');
    setQuantity('');
    setPriceType('fixed');
    setUnitPrice('');
    setMinPrice('');
    setMaxPrice('');
    setFormErrors({});
  };

  const openCreateForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEditForm = (item: StockItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setQuantity(String(item.quantity));
    setPriceType(item.priceType);
    setUnitPrice(item.unitPrice ? String(item.unitPrice) : '');
    setMinPrice(item.minPrice ? String(item.minPrice) : '');
    setMaxPrice(item.maxPrice ? String(item.maxPrice) : '');
    setFormErrors({});
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    resetForm();
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const parsedQuantity = parseNumberInput(quantity);
    const parsedUnitPrice = parseNumberInput(unitPrice);
    const parsedMinPrice = parseNumberInput(minPrice);
    const parsedMaxPrice = parseNumberInput(maxPrice);

    if (!itemName.trim()) nextErrors.name = 'Nom requis';
    if (!quantity.trim() || parsedQuantity < 0) nextErrors.quantity = 'Quantité ≥ 0 requise';
    if (priceType === 'fixed' && parsedUnitPrice <= 0) nextErrors.unitPrice = 'Prix unitaire > 0 requis';
    if (priceType === 'range') {
      if (parsedMinPrice <= 0) nextErrors.minPrice = 'Prix min > 0 requis';
      if (parsedMaxPrice < parsedMinPrice) nextErrors.maxPrice = 'Prix max ≥ prix min requis';
    }

    setFormErrors(nextErrors);
    return { ok: Object.keys(nextErrors).length === 0, parsedQuantity, parsedUnitPrice, parsedMinPrice, parsedMaxPrice };
  };

  const saveItem = async () => {
    const validation = validateForm();
    if (!validation.ok) return;

    const saved = upsertItem({
      id: editingItem?.id,
      name: itemName,
      quantity: validation.parsedQuantity,
      priceType,
      unitPrice: validation.parsedUnitPrice,
      minPrice: validation.parsedMinPrice,
      maxPrice: validation.parsedMaxPrice,
    });
    if (cloudCompanyId) {
      setStockSyncing(true);
      try {
        const cloudSaved = await formalioBackend.upsertStockItem(cloudCompanyId, saved);
        if (cloudSaved) {
          const nextItems = useStockStore.getState().items.map((item) => (item.id === cloudSaved.id ? cloudSaved : item));
          replaceItems(sortStockItems(nextItems));
        }
      } catch (error) {
        showToast({ type: 'error', title: 'Sync cloud stock', message: error instanceof Error ? error.message : 'Stock gardé localement.' });
      } finally {
        setStockSyncing(false);
      }
    }
    showToast({ type: 'success', title: editingItem ? 'Stock modifié' : 'Article ajouté', message: 'Gestionnaire de stock mis à jour.' });
    closeForm();
  };

  const removeItem = async (item: StockItem) => {
    deleteItem(item.id);
    if (cloudCompanyId) {
      try {
        await formalioBackend.deleteStockItem(cloudCompanyId, item.id);
      } catch (error) {
        showToast({ type: 'error', title: 'Sync cloud stock', message: error instanceof Error ? error.message : 'Suppression gardée localement.' });
      }
    }
    showToast({ type: 'info', title: 'Article supprimé', message: 'Les anciennes transactions restent conservées.' });
  };

  return (
    <View style={{ gap: 14 }}>
      <Card style={embedded ? styles.stockEmbeddedHeader : styles.stockHeaderCard}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Row style={{ gap: 8, marginBottom: 4 }}>
              <View style={[styles.metricIcon, { backgroundColor: c.formalio50 }]}><Icon icon={Package} size={16} color={c.formalio700} /></View>
              <Txt weight="black" style={{ fontSize: 15 }}>Gestionnaire de Stock</Txt>
            </Row>
            <Txt style={{ color: c.surface500, fontSize: 12 }}>{items.length} article{items.length > 1 ? 's' : ''} · {isAndroidNative ? formatStockCompactValue(totalValue) : formatFCFA(totalValue)}</Txt>
          </View>
          <PrimaryButton label="Ajouter" icon={Plus} onPress={openCreateForm} style={styles.stockAddButton} />
        </Row>
      </Card>

      <View style={styles.inputBox}>
        <Icon icon={Search} size={16} color={c.surface400} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher un article..."
          placeholderTextColor={c.surface400}
          autoCapitalize="none"
          maxFontSizeMultiplier={inputTextMaxScale}
          style={styles.textInput}
        />
        {searchQuery ? (
          <Tap onPress={() => setSearchQuery('')} accessibilityLabel="Effacer la recherche stock">
            <Icon icon={X} size={15} color={c.surface400} />
          </Tap>
        ) : null}
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.stockEmptyState}>
          <Icon icon={Package} size={26} color={c.surface400} />
          <Txt weight="semibold" style={{ color: c.surface700, marginTop: 10 }}>{items.length === 0 ? 'Aucun article en stock' : 'Aucun article trouvé'}</Txt>
          <Txt style={{ color: c.surface500, fontSize: 12, marginTop: 4, textAlign: 'center' }}>{items.length === 0 ? 'Ajoutez un article pour activer la valorisation et les ventes automatiques.' : 'Essayez un autre nom.'}</Txt>
          {items.length === 0 ? (
            <Tap onPress={openCreateForm} style={styles.stockEmptyButton}>
              <Txt weight="black" style={{ color: c.white, fontSize: 12 }}>Ajouter le premier article</Txt>
            </Tap>
          ) : null}
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {filteredItems.map((item) => {
            const outOfStock = item.quantity <= 0;
            const stockFlags = getStockMarketFlags(item);
            return (
              <Card key={item.id} style={[styles.stockItemCard, outOfStock && styles.stockItemCardMuted]}>
                <Row style={{ justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <Row style={{ gap: 10, flex: 1, minWidth: 0 }}>
                    <View style={[styles.stockItemIcon, outOfStock && { backgroundColor: c.surface100 }]}>
                      <Icon icon={Package} size={17} color={outOfStock ? c.surface400 : c.formalio700} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt weight="black" numberOfLines={1} style={{ color: outOfStock ? c.surface500 : c.surface900, fontSize: 14 }}>{item.name}</Txt>
                      <Row style={{ gap: 6, marginTop: 5 }}>
                        <Pill tone={outOfStock ? 'surface' : 'green'}>{outOfStock ? 'Rupture' : `${item.quantity} unités`}</Pill>
                        <Pill tone={item.priceType === 'fixed' ? 'blue' : 'gold'}>{item.priceType === 'fixed' ? 'fixed' : 'range'}</Pill>
                      </Row>
                    </View>
                  </Row>
                  <Row style={{ gap: 6 }}>
                    <Tap onPress={() => openEditForm(item)} style={styles.stockIconButton} accessibilityLabel={`Modifier ${item.name}`}>
                      <Icon icon={Pencil} size={15} color={c.info700} />
                    </Tap>
                    <Tap onPress={() => { void removeItem(item); }} style={[styles.stockIconButton, styles.stockDeleteButton]} accessibilityLabel={`Supprimer ${item.name}`}>
                      <Icon icon={Trash2} size={15} color={c.danger600} />
                    </Tap>
                  </Row>
                </Row>
                <Grid columns={isAndroidNative ? 2 : 3} gap={8}>
                  <View style={styles.stockMetaCell}>
                    <Txt style={styles.stockMetaLabel}>Prix</Txt>
                    <Txt weight="black" numberOfLines={1} style={styles.stockMetaValue}>{formatStockPrice(item)}</Txt>
                  </View>
                  <View style={styles.stockMetaCell}>
                    <Txt style={styles.stockMetaLabel}>Qté</Txt>
                    <Txt weight="black" style={styles.stockMetaValue}>{item.quantity}</Txt>
                  </View>
                  <View style={styles.stockMetaCell}>
                    <Txt style={styles.stockMetaLabel}>Valeur</Txt>
                    <Txt weight="black" numberOfLines={1} style={styles.stockMetaValue}>{isAndroidNative ? formatStockCompactValue(getStockItemValue(item)) : formatFCFA(getStockItemValue(item))}</Txt>
                  </View>
                </Grid>
                {stockFlags.length > 0 ? (
                  <View style={styles.stockFlagRow}>
                    {stockFlags.map((flag) => (
                      <Pill key={flag.label} tone={flag.tone}>{flag.label}</Pill>
                    ))}
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
      )}

      <ModalShell visible={formOpen} onClose={closeForm}>
        <View style={{ gap: 14 }}>
          <Row style={{ justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Txt weight="black" style={{ fontSize: 18 }}>{editingItem ? 'Modifier article' : 'Ajouter article'}</Txt>
              <Txt style={{ color: c.surface500, fontSize: 12, marginTop: 3 }}>Prix et quantité en FCFA.</Txt>
            </View>
            <Tap onPress={closeForm} style={styles.iconButton}>
              <Icon icon={X} size={18} color={c.surface500} />
            </Tap>
          </Row>
          <Field label="Item Name" value={itemName} onChangeText={setItemName} placeholder="Ex: Riz 25kg" error={formErrors.name} />
          <Field label="Quantity" value={quantity} onChangeText={setQuantity} placeholder="0" keyboardType="numeric" error={formErrors.quantity} />
          <View>
            <Txt weight="medium" style={styles.fieldLabel}>Price Type</Txt>
            <Segment value={priceType} onChange={setPriceType} options={[{ key: 'fixed', label: 'Fixed Price' }, { key: 'range', label: 'Price Range' }]} />
          </View>
          {priceType === 'fixed' ? (
            <Field label="Unit Price (FCFA)" value={unitPrice} onChangeText={setUnitPrice} placeholder="Ex: 1500" keyboardType="numeric" error={formErrors.unitPrice} />
          ) : (
            <Grid columns={2} gap={8}>
              <Field label="Min Price (FCFA)" value={minPrice} onChangeText={setMinPrice} placeholder="1500" keyboardType="numeric" error={formErrors.minPrice} />
              <Field label="Max Price (FCFA)" value={maxPrice} onChangeText={setMaxPrice} placeholder="2000" keyboardType="numeric" error={formErrors.maxPrice} />
            </Grid>
          )}
          <PrimaryButton label={stockSyncing ? 'Synchronisation...' : 'Save'} icon={stockSyncing ? RefreshCw : Check} disabled={stockSyncing} onPress={() => { void saveItem(); }} style={{ marginTop: 2 }} />
        </View>
      </ModalShell>
    </View>
  );
}
