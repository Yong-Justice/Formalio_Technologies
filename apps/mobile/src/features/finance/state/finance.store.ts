import { create } from 'zustand';
import { Business, Transaction } from '@/types/domain';
import { getJson, setJson, storageKeys } from '@/services/storage/mmkv';

interface FinanceState {
  businesses: Business[];
  selectedBusinessId?: string;
  transactions: Transaction[];
  hydrate: () => void;
  selectBusiness: (businessId: string) => void;
  upsertTransaction: (transaction: Transaction) => void;
  softDeleteTransaction: (transactionId: string) => void;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  businesses: [],
  selectedBusinessId: undefined,
  transactions: [],
  hydrate() {
    set({
      businesses: getJson<Business[]>(storageKeys.businesses, []),
      transactions: getJson<Transaction[]>(storageKeys.transactions, []),
      selectedBusinessId: getJson<string | undefined>(storageKeys.selectedBusinessId, undefined)
    });
  },
  selectBusiness(businessId) {
    setJson(storageKeys.selectedBusinessId, businessId);
    set({ selectedBusinessId: businessId });
  },
  upsertTransaction(transaction) {
    const existing = get().transactions;
    const next = [transaction, ...existing.filter((t) => t.id !== transaction.id)];
    setJson(storageKeys.transactions, next);
    set({ transactions: next });
  },
  softDeleteTransaction(transactionId) {
    const next = get().transactions.map((t) => t.id === transactionId ? { ...t, deletedAt: new Date().toISOString(), syncStatus: 'pending' as const } : t);
    setJson(storageKeys.transactions, next);
    set({ transactions: next });
  }
}));