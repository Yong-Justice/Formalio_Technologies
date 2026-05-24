import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryStorage, setJson } from '@/services/storage/mmkv';
import { createUuid } from '@/utils/uuid';
import { repositories } from '@/database/repositories';
import { useAuthStore } from '@/store/authStore';

export type StockPriceType = 'fixed' | 'range';

export type StockItem = {
  id: string;
  name: string;
  quantity: number;
  priceType: StockPriceType;
  unitPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  createdAt: string;
  updatedAt: string;
};

export type StockItemDraft = {
  id?: string;
  name: string;
  quantity: number;
  priceType: StockPriceType;
  unitPrice?: number;
  minPrice?: number;
  maxPrice?: number;
};

const STOCK_ITEMS_KEY = 'query.stockItems';

function parseStockItems(raw: string | undefined | null): StockItem[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as StockItem[] : null;
  } catch {
    return null;
  }
}

function readSyncStockItems() {
  const raw = queryStorage.getString(STOCK_ITEMS_KEY);
  if (raw === undefined) return null;
  return parseStockItems(raw) ?? [];
}

async function readAsyncStockItems() {
  const raw = await AsyncStorage.getItem(STOCK_ITEMS_KEY);
  return parseStockItems(raw);
}

function normalizeDraft(draft: StockItemDraft, existing?: StockItem): StockItem {
  const now = new Date().toISOString();
  const base = {
    id: draft.id ?? existing?.id ?? createUuid(),
    name: draft.name.trim(),
    quantity: Math.max(0, Number(draft.quantity) || 0),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  if (draft.priceType === 'range' && Number(draft.minPrice) === Number(draft.maxPrice)) {
    return {
      ...base,
      priceType: 'fixed',
      unitPrice: Number(draft.minPrice) || 0,
      minPrice: undefined,
      maxPrice: undefined,
    };
  }

  if (draft.priceType === 'fixed') {
    return {
      ...base,
      priceType: 'fixed',
      unitPrice: Number(draft.unitPrice) || 0,
      minPrice: undefined,
      maxPrice: undefined,
    };
  }

  return {
    ...base,
    priceType: 'range',
    unitPrice: undefined,
    minPrice: Number(draft.minPrice) || 0,
    maxPrice: Number(draft.maxPrice) || 0,
  };
}

function persist(items: StockItem[]) {
  setJson(queryStorage, STOCK_ITEMS_KEY, items);
  void AsyncStorage.setItem(STOCK_ITEMS_KEY, JSON.stringify(items)).catch(() => {
    // MMKV remains the primary sync cache; AsyncStorage is a relaunch fallback.
  });
}

function parseItemTime(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function getDatabaseOwner() {
  const user = useAuthStore.getState().user as (ReturnType<typeof useAuthStore.getState>['user'] & { businessId?: string }) | null;
  if (!user) return null;
  return { userId: user.id, companyId: user.businessId ?? null };
}

async function upsertStockItemInDatabase(item: StockItem) {
  const owner = getDatabaseOwner();
  if (!owner) return;

  const price = getStockUnitEstimate(item);
  const payload = {
    company_id: owner.companyId,
    name: item.name,
    current_quantity: item.quantity,
    selling_price_per_unit: price,
    purchase_price_per_unit: price,
    total_stock_value: item.quantity * price,
    is_active: true,
    is_dead_stock: false,
    created_at: parseItemTime(item.createdAt),
    updated_at: parseItemTime(item.updatedAt),
  };

  try {
    await repositories.stock_items.updateRecord(item.id, owner.userId, payload);
  } catch {
    await repositories.stock_items.createRecord({
      id: item.id,
      user_id: owner.userId,
      ...payload,
    });
  }
}

async function deleteStockItemFromDatabase(itemId: string) {
  const owner = getDatabaseOwner();
  if (!owner) return;
  try {
    await repositories.stock_items.deleteRecord(itemId, owner.userId);
  } catch {
    // The MMKV cache remains the source currently shown by screens; SQLite will catch up on next import if needed.
  }
}

export function getStockUnitEstimate(item: StockItem) {
  if (item.priceType === 'fixed') return Number(item.unitPrice) || 0;
  return ((Number(item.minPrice) || 0) + (Number(item.maxPrice) || 0)) / 2;
}

export function getStockItemValue(item: StockItem) {
  return item.quantity * getStockUnitEstimate(item);
}

export function getTotalStockValue(items: StockItem[]) {
  return items.reduce((total, item) => total + getStockItemValue(item), 0);
}

type StockState = {
  items: StockItem[];
  hydrated: boolean;
  hydrate: () => void;
  replaceItems: (items: StockItem[]) => void;
  upsertItem: (draft: StockItemDraft) => StockItem;
  deleteItem: (id: string) => void;
  decreaseStock: (id: string, quantity: number) => { ok: boolean; item?: StockItem; error?: string };
};

export const useStockStore = create<StockState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate() {
    const syncItems = readSyncStockItems();
    if (syncItems) {
      set({ items: syncItems, hydrated: true });
      void AsyncStorage.setItem(STOCK_ITEMS_KEY, JSON.stringify(syncItems)).catch(() => {});
      return;
    }

    set({ hydrated: true });
    void readAsyncStockItems()
      .then((items) => {
        if (!items) return;
        if (get().items.length > 0) return;
        setJson(queryStorage, STOCK_ITEMS_KEY, items);
        set({ items, hydrated: true });
      })
      .catch(() => {});
  },

  replaceItems(items) {
    persist(items);
    set({ items, hydrated: true });
  },

  upsertItem(draft) {
    const current = get().items;
    const existing = draft.id ? current.find((item) => item.id === draft.id) : undefined;
    const saved = normalizeDraft(draft, existing);
    const next = existing
      ? current.map((item) => (item.id === saved.id ? saved : item))
      : [saved, ...current];
    persist(next);
    set({ items: next, hydrated: true });
    void upsertStockItemInDatabase(saved).catch(() => {});
    return saved;
  },

  deleteItem(id) {
    const next = get().items.filter((item) => item.id !== id);
    persist(next);
    set({ items: next, hydrated: true });
    void deleteStockItemFromDatabase(id).catch(() => {});
  },

  decreaseStock(id, quantity) {
    const requested = Number(quantity) || 0;
    if (requested <= 0) return { ok: false, error: 'Quantite vendue invalide.' };

    const current = get().items;
    const target = current.find((item) => item.id === id);
    if (!target) return { ok: false, error: 'Article introuvable.' };
    if (requested > target.quantity) return { ok: false, item: target, error: `Stock insuffisant. Maximum disponible: ${target.quantity}` };

    const updated = { ...target, quantity: target.quantity - requested, updatedAt: new Date().toISOString() };
    const next = current.map((item) => (item.id === id ? updated : item));
    persist(next);
    set({ items: next, hydrated: true });
    void upsertStockItemInDatabase(updated).catch(() => {});
    return { ok: true, item: updated };
  },
}));
