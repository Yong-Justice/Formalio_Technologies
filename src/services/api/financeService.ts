import { financialRequest, request } from "@/services/api/client";
  import { endpoints } from "@/services/api/endpoints";
  import { enqueueRequest, QueuePriority } from "@/services/sync/offlineQueue";
  import { useNetworkStore } from "@/services/sync/network";
  import { Transaction, Report, CreditScore, WalletBalance, ExchangeRate } from "@/types/domain";

  export const financeService = {
    /** 30s TTL */
    getWalletBalance: (businessId: string) =>
      financialRequest<WalletBalance>({ method: "GET", url: endpoints.wallet.balance(businessId) }),

    /** 5 min TTL */
    listTransactions: (businessId: string) =>
      financialRequest<Transaction[]>({ method: "GET", url: endpoints.businesses.transactions(businessId) }),

    async createTransaction(transaction: Transaction) {
      const isOnline = useNetworkStore.getState().isOnline;
      const url = endpoints.businesses.transactions(transaction.businessId);
      if (!isOnline) {
        enqueueRequest({ id: transaction.id, method: "POST", url, body: transaction, optimisticData: transaction, priority: QueuePriority.CRITICAL, conflictResolution: "server-authoritative" });
        return { ...transaction, syncStatus: "pending" as const };
      }
      return financialRequest<Transaction>({ method: "POST", url, data: transaction as unknown as Record<string,unknown> });
    },

    /** 24h TTL */
    getCreditScore: (businessId: string) =>
      financialRequest<CreditScore>({ method: "GET", url: endpoints.businesses.creditScore(businessId) }),

    /** Indefinite TTL — pinned until regenerated */
    generateReport: (businessId: string, payload: { type: string; periodStart: string; periodEnd: string }) =>
      financialRequest<Report>({ method: "POST", url: endpoints.businesses.generateReport(businessId), data: payload }),

    /** 1h TTL — not pinned, no auth required */
    getExchangeRates: () =>
      request<ExchangeRate[]>({ method: "GET", url: endpoints.exchange.rates }),
  };
  