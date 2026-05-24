import { create } from "zustand";
  import { Business, Transaction, WalletBalance } from "@/types/domain";
  import { queryStorage, getJson, setJson, storageKeys } from "@/services/storage/mmkv";
  import { repositories } from "@/database/repositories";
  import { useAuthStore } from "@/store/authStore";

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

  function parseTransactionTime(value?: string | null) {
    if (!value) return Date.now();
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }

  async function upsertTransactionInDatabase(transaction: Transaction) {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const recordedAt = parseTransactionTime(transaction.date);
    const deletedAt = transaction.deletedAt ? parseTransactionTime(transaction.deletedAt) : null;
    const payload = {
      company_id: transaction.businessId,
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description ?? null,
      payment_method: transaction.paymentMethod ?? null,
      entry_method: "manual",
      recorded_at: recordedAt,
      is_deleted: Boolean(deletedAt),
      deleted_at: deletedAt,
      created_at: recordedAt,
      updated_at: recordedAt,
    };

    try {
      await repositories.transactions.updateRecord(transaction.id, user.id, payload);
    } catch {
      await repositories.transactions.createRecord({
        id: transaction.id,
        user_id: user.id,
        ...payload,
      });
    }
  }

  async function deleteTransactionFromDatabase(transactionId: string) {
    const user = useAuthStore.getState().user;
    if (!user) return;
    try {
      await repositories.transactions.deleteRecord(transactionId, user.id);
    } catch {
      // Keep current optimistic UI behavior even if SQLite has not booted yet.
    }
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
      void upsertTransactionInDatabase(t).catch(() => {});
    },
    rollbackTransaction(id) {
      const next = get().transactions.map(t => t.id === id ? { ...t, syncStatus: "failed" as const } : t);
      setJson(queryStorage, Q.transactions, next); set({ transactions: next });
    },
    softDeleteTransaction(id) {
      const next = get().transactions.map(t =>
        t.id === id ? { ...t, deletedAt: new Date().toISOString(), syncStatus: "pending" as const } : t);
      setJson(queryStorage, Q.transactions, next); set({ transactions: next });
      void deleteTransactionFromDatabase(id).catch(() => {});
    },
  }));
