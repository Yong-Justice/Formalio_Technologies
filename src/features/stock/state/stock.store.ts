import { create } from 'zustand';
import { queryStorage, getJson, setJson } from '@/services/storage/mmkv';
import { createUuid } from '@/utils/uuid';

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
  upsertItem: (draft: StockItemDraft) => StockItem;
  deleteItem: (id: string) => void;
  decreaseStock: (id: string, quantity: number) => { ok: boolean; item?: StockItem; error?: string };
};

export const useStockStore = create<StockState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate() {
    const items = getJson<StockItem[]>(queryStorage, STOCK_ITEMS_KEY, []);
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
    return saved;
  },

  deleteItem(id) {
    const next = get().items.filter((item) => item.id !== id);
    persist(next);
    set({ items: next, hydrated: true });
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
    return { ok: true, item: updated };
  },
}));
