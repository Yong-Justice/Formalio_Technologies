import { create } from "zustand";
  import { Business, Transaction, WalletBalance } from "@/types/domain";
  import { queryStorage, getJson, setJson, storageKeys } from "@/services/storage/mmkv";

  const Q = storageKeys.query;

  interface FinanceState {
    businesses: Business[]; selectedBusinessId?: string;
    transactions: Transaction[]; walletBalance?: WalletBalance;
    hydrate: () => void;
    selectBusiness: (id: string) => void;
    setWalletBalance: (balance: WalletBalance) => void;
    upsertTransaction: (t: Transaction) => void;
    rollbackTransaction: (id: string) => void;
    softDeleteTransaction: (id: string) => void;
  }

  export const useFinanceStore = create<FinanceState>((set, get) => ({
    businesses: [], selectedBusinessId: undefined, transactions: [], walletBalance: undefined,

    hydrate() {
      set({
        businesses:         getJson<Business[]>(queryStorage, Q.businesses, []),
        transactions:       getJson<Transaction[]>(queryStorage, Q.transactions, []),
        selectedBusinessId: getJson<string|undefined>(queryStorage, Q.selectedBusinessId, undefined),
        walletBalance:      getJson<WalletBalance|undefined>(queryStorage, Q.walletBalance, undefined),
      });
    },
    selectBusiness(id) { setJson(queryStorage, Q.selectedBusinessId, id); set({ selectedBusinessId: id }); },
    setWalletBalance(balance) {
      setJson(queryStorage, Q.walletBalance, balance);
      setJson(queryStorage, Q.walletLastUpdated, new Date().toISOString());
      set({ walletBalance: balance });
    },
    upsertTransaction(t) {
      const next = [t, ...get().transactions.filter(x => x.id !== t.id)];
      setJson(queryStorage, Q.transactions, next); set({ transactions: next });
    },
    rollbackTransaction(id) {
      const next = get().transactions.map(t => t.id === id ? { ...t, syncStatus: "failed" as const } : t);
      setJson(queryStorage, Q.transactions, next); set({ transactions: next });
    },
    softDeleteTransaction(id) {
      const next = get().transactions.map(t =>
        t.id === id ? { ...t, deletedAt: new Date().toISOString(), syncStatus: "pending" as const } : t);
      setJson(queryStorage, Q.transactions, next); set({ transactions: next });
    },
  }));
  